import { createClient } from "@/utils/supabase/server";
import { YouTubeResourceService } from "@/lib/services/youtubeResourceService";

export async function POST(req: Request) {
    try {
        const { videoId } = await req.json();

        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Use the new YouTube resource service
        const youtubeService = new YouTubeResourceService();
        const sessionId = await youtubeService.createYouTubeSession(videoId, user.id);

        return Response.json({ sessionId });

    } catch (error) {
        console.error("Error in create-session:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}