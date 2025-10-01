// lib/services/youtubeResourceService.ts
import { createClient } from "@/utils/supabase/server";
import { ChatService } from "./chatService";

export interface YouTubeResource {
    videoId: string;
    title: string;
    hasTranscript: boolean;
}

export class YouTubeResourceService {
    private chatService;

    constructor() {
        this.chatService = new ChatService();
    }

    private async getSupabase() {
        return await createClient();
    }

    async getVideoTitle(videoId: string): Promise<string> {
        try {
            const supabase = await this.getSupabase();
            const { data: transcriptData } = await supabase
                .from("transcript")
                .select("title")
                .eq("video_id", videoId)
                .single();

            return transcriptData?.title || "Unknown Video";
        } catch (error) {
            console.error("Error fetching video title:", error);
            return "Unknown Video";
        }
    }

    async getVideoResource(videoId: string): Promise<YouTubeResource> {
        const supabase = await this.getSupabase();
        const title = await this.getVideoTitle(videoId);

        // Check if transcript exists
        const { data: transcriptData } = await supabase
            .from("transcript")
            .select("video_id")
            .eq("video_id", videoId)
            .single();

        return {
            videoId,
            title,
            hasTranscript: !!transcriptData
        };
    }

    async createYouTubeSession(videoId: string, userId: string): Promise<string> {
        const videoResource = await this.getVideoResource(videoId);
        const sessionTitle = `Chat: ${videoResource.title}`;
        const agentId = 'bb15768a-f4fa-4c95-a0e3-2c7d327a1439';

        return await this.chatService.createSession(
            videoId,
            'youtube',
            userId,
            sessionTitle,
            agentId
        );
    }

    async getYouTubeSessionHistory(videoId: string) {
        return await this.chatService.getSessionHistory(videoId, 'youtube');
    }

    generateSystemMessage(videoId: string, videoTitle: string): string {
        return `You are an AI agent ready to accept questions from the 
    user about ONE specific YouTube video. The video ID in question is ${videoId} but you'll 
    refer to this as ${videoTitle}. Use emojis to 
    make the conversation more engaging. If an error occurs, explain it to the 
    user and ask them to try again later. If the error suggest the user upgrade, 
    explain that they must upgrade to use the feature, tell them to go to 'Manage Plan'
     in the header and upgrade. If any tool is used, analyse the response and if 
     it contains a cache, explain that the transcript is cached because they 
     previously transcribed the video saving the user a token - use words like database
      instead of cache to make it more easy to understand. Format for notion.`;
    }
}