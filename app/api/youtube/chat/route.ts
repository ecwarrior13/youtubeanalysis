import { createClient } from "@/utils/supabase/server";
import fetchTranscript from "@/tools/fetchTranscript";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

const openaiModel = openai("gpt-4o-mini");

async function getVideoTitle(videoId: string): Promise<string> {
    try {
        const supabase = await createClient();
        const { data: transcriptData } = await supabase
            .from("transcript")
            .select("title")
            .eq("video_id", videoId)
            .single();

        return transcriptData?.title || "Selected Video";
    } catch (error) {
        console.error("Error fetching video title from database:", error);
        return "Selected Video";
    }
}

async function saveUserMessage(sessionId: string, content: string) {
    try {
        const supabase = await createClient();
        await supabase
            .from('chat_messages')
            .insert([{
                session_id: sessionId,
                role: 'user',
                content: content,
                created_at: new Date().toISOString()
            }]);
    } catch (error) {
        console.error("Error saving user message:", error);
    }
}

async function saveAssistantMessage(sessionId: string, content: string, usage?: any, toolCalls?: any) {
    try {
        const supabase = await createClient();
        await supabase
            .from('chat_messages')
            .insert([{
                session_id: sessionId,
                role: 'assistant',
                content: content,
                tokens_used: usage?.totalTokens,
                prompt_tokens: usage?.promptTokens,
                content_tokens: usage?.completionTokens,
                tool_invocations: toolCalls,
                created_at: new Date().toISOString()
            }]);
    } catch (error) {
        console.error("Error saving assistant message:", error);
    }
}

export async function POST(req: Request) {
    const { messages, videoId, sessionId } = await req.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new Response("Unauthorized", { status: 401 });
    }

    const videoTitle = await getVideoTitle(videoId);

    // Get the latest user message and save it
    const latestMessage = messages[messages.length - 1];
    if (sessionId && latestMessage.role === 'user') {
        await saveUserMessage(sessionId, latestMessage.content);
    }

    const systemMessage = `You are an AI agent ready to accept questions from the 
    user about ONE specific video. The video ID in question is ${videoId} but you'll 
    refer to this as ${videoTitle}. Use emojis to 
    make the conversation more engaging. If an error occurs, explain it to the 
    user and ask them to try again later. If the error suggest the user upgrade, 
    explain that they must upgrade to use the feature, tell them to go to 'Manage Plan'
     in the header and upgrade. If any tool is used, analyse the response and if 
     it contains a cache, explain that the transcript is cached because they 
     previously transcribed the video saving the user a token - use words like database
      instead of cache to make it more easy to understand. Format for notion.`;

    const result = streamText({
        model: openaiModel,
        messages: [{ role: "system", content: systemMessage }, ...messages],
        tools: {
            fetchTranscript: fetchTranscript,
        },
        onFinish: async ({ text, usage, toolCalls }) => {
            // Save the assistant's response when streaming is complete
            if (sessionId) {
                try {
                    await saveAssistantMessage(sessionId, text, usage, toolCalls);
                } catch (error) {
                    console.error("Error saving assistant message:", error);
                }
            }
            // Log token usage for debugging
            console.log('Token usage:', {
                totalTokens: usage?.totalTokens,
                promptTokens: usage?.promptTokens,
                completionTokens: usage?.completionTokens
            });
            console.log("sessionId", sessionId);
            console.log('Tool invocations:', toolCalls);
        }
    });

    return result.toDataStreamResponse({
        getErrorMessage: (error) => {
            console.error("Server-side error:", error);
            if (error instanceof Error) {
                return `${error.name}: ${error.message}`;
            }
            return String(error);
        },
    });
}