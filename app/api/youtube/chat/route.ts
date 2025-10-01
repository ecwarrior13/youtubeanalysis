import { createClient } from "@/utils/supabase/server";
import { ChatService } from "@/lib/services/chatService";
import { YouTubeResourceService } from "@/lib/services/youtubeResourceService";
import fetchTranscript from "@/tools/fetchTranscript";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

const openaiModel = openai("gpt-4o-mini");

export async function POST(req: Request) {
    try {
        const { messages, videoId, sessionId } = await req.json();

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new Response("Unauthorized", { status: 401 });
        }

        // Use the new services
        const chatService = new ChatService();
        const youtubeService = new YouTubeResourceService();

        // Get video title and generate system message
        const videoTitle = await youtubeService.getVideoTitle(videoId);
        const systemMessage = youtubeService.generateSystemMessage(videoId, videoTitle);

        // Save user message if session exists
        const latestMessage = messages[messages.length - 1];
        if (sessionId && latestMessage.role === 'user') {
            await chatService.saveUserMessage(sessionId, latestMessage.content);
        }

        const result = streamText({
            model: openaiModel,
            messages: [{ role: "system", content: systemMessage }, ...messages],
            tools: {
                fetchTranscript: fetchTranscript,
            },
            onFinish: async ({ text, usage, toolCalls }) => {
                // Save the assistant's response when streaming is complete
                if (sessionId) {
                    await chatService.saveAssistantMessage(sessionId, text, usage, toolCalls);
                }

                // Log for debugging
                console.log('Token usage:', {
                    totalTokens: usage?.totalTokens,
                    promptTokens: usage?.promptTokens,
                    completionTokens: usage?.completionTokens
                });

                console.log('Tool calls:', toolCalls);
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

    } catch (error) {
        console.error("Error in chat route:", error);
        return new Response("Internal server error", { status: 500 });
    }
}