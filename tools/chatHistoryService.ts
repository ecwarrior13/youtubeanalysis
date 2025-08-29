import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface ChatSession {
    id: string;
    video_id: string;
    title?: string;
    created_at: string;
    updated_at: string;
    user_id?: string;
    agent_id: string | 'bb15768a-f4fa-4c95-a0e3-2c7d327a1439';
}

export interface ChatMessage {
    id: string;
    session_id: string;
    message_id: string;
    role: 'user' | 'assistant' | 'system' | 'data';
    content: string;
    parts?: any[];
    tool_invocations?: any[];
    created_at: string;
    message_order: number;
}

export interface SaveMessageData {
    message_id: string;
    role: 'user' | 'assistant' | 'system' | 'data';
    content: string;
    parts?: any[];
    tool_invocations?: any[];
}

class ChatHistoryService {
    // Create a new chat session
    async createChatSession(videoId: string, title?: string): Promise<ChatSession | null> {
        try {

            // Get current user if authenticated
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("User not authenticated");
            }

            const { data, error } = await supabase
                .from('chat_sessions')
                .insert({
                    video_id: videoId,
                    title: title || `Chat about Video ${videoId}`,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating chat session:', error);
            return null;
        }
    }

    // Get all chat sessions for a video
    async getChatSessionsForVideo(videoId: string): Promise<ChatSession[]> {
        try {
            const { data, error } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('video_id', videoId)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching chat sessions:', error);
            return [];
        }
    }

    // Get a specific chat session
    async getChatSession(sessionId: string): Promise<ChatSession | null> {
        try {
            const { data, error } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('id', sessionId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching chat session:', error);
            return null;
        }
    }

    // Save a message to a chat session
    async saveMessage(sessionId: string, messageData: SaveMessageData, order: number): Promise<ChatMessage | null> {
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .insert({
                    session_id: sessionId,
                    message_id: messageData.message_id,
                    role: messageData.role,
                    content: messageData.content,
                    parts: messageData.parts,
                    tool_invocations: messageData.tool_invocations,
                    message_order: order,
                })
                .select()
                .single();

            if (error) throw error;

            // Update the session's updated_at timestamp
            await this.updateSessionTimestamp(sessionId);

            return data;
        } catch (error) {
            console.error('Error saving message:', error);
            return null;
        }
    }

    // Get messages for a chat session
    async getMessagesForSession(sessionId: string): Promise<ChatMessage[]> {
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('session_id', sessionId)
                .order('message_order', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
    }

    // Update session title
    async updateSessionTitle(sessionId: string, title: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('chat_sessions')
                .update({ title })
                .eq('id', sessionId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating session title:', error);
            return false;
        }
    }

    // Delete a chat session and its messages
    async deleteChatSession(sessionId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('chat_sessions')
                .delete()
                .eq('id', sessionId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting chat session:', error);
            return false;
        }
    }

    // Private method to update session timestamp
    private async updateSessionTimestamp(sessionId: string): Promise<void> {
        await supabase
            .from('chat_sessions')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', sessionId);
    }

    // Generate a title based on the first user message
    generateSessionTitle(firstUserMessage: string): string {
        const maxLength = 50;
        const words = firstUserMessage.split(' ');

        if (firstUserMessage.length <= maxLength) {
            return firstUserMessage;
        }

        let title = '';
        for (const word of words) {
            if ((title + word).length > maxLength - 3) {
                return title.trim() + '...';
            }
            title += word + ' ';
        }

        return title.trim();
    }
}

export const chatHistoryService = new ChatHistoryService();