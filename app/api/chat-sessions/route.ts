import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
    try {
        const { videoId, title, agent_id } = await req.json()

        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get video title for session name
        const { data: transcriptData } = await supabase
            .from("transcript")
            .select("title")
            .eq("video_id", videoId)
            .single();

        const videoTitle = transcriptData?.title || "Unknown Video";

        // Create new chat session
        const { data: session, error: sessionError } = await supabase
            .from('chat_sessions')
            .insert([
                {
                    video_id: videoId,
                    user_id: user.id,
                    title: `Chat: ${videoTitle}`,
                    agent_id: agent_id || 'bb15768a-f4fa-4c95-a0e3-2c7d327a1439',
                    is_active: true,
                    last_message_at: new Date().toISOString(),
                    created_at: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (sessionError) {
            console.error("Error creating session:", sessionError);
            return Response.json({ error: "Failed to create session" }, { status: 500 });
        }

        return Response.json({ sessionId: session.id });

    } catch (error) {
        console.error("Error in create-session:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}