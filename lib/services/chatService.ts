// lib/services/chatService.ts
import { createClient } from "@/utils/supabase/server";

export type ResourceType = 'youtube' | 'document' | 'url' | 'text' | 'pdf';

export interface ChatSession {
    id: string;
    resource_id: string;
    resource_type: ResourceType;
    title: string;
    created_at: string;
    user_id: string;
}

export interface ChatMessage {
    id: string;
    session_id: string;
    role: 'user' | 'assistant';
    content: string;
    tokens_used?: number;
    prompt_tokens?: number;
    content_tokens?: number;
    tool_invocations?: any;
    created_at: string;
}

export class ChatService {
    private async getSupabase() {
        return await createClient();
    }

    async createSession(
        resourceId: string,
        resourceType: ResourceType,
        userId: string,
        title: string,
        agentId?: string
    ): Promise<string> {
        const supabase = await this.getSupabase();
        const { data: session, error } = await supabase
            .from('chat_sessions')
            .insert([{
                resource_id: resourceId,
                resource_type: resourceType,
                user_id: userId,
                title: title,
                agent_id: agentId,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating session:', error);
            throw new Error(`Failed to create session: ${error.message}`);
        }

        return session.id;
    }

    async saveUserMessage(sessionId: string, content: string): Promise<void> {
        const supabase = await this.getSupabase();
        const { error } = await supabase
            .from('chat_messages')
            .insert([{
                session_id: sessionId,
                role: 'user',
                content: content,
                created_at: new Date().toISOString()
            }]);

        if (error) {
            console.error("Error saving user message:", error);
            throw error;
        }
    }

    async saveAssistantMessage(
        sessionId: string,
        content: string,
        usage?: any,
        toolCalls?: any[]
    ): Promise<void> {
        const supabase = await this.getSupabase();
        const { error } = await supabase
            .from('chat_messages')
            .insert([{
                session_id: sessionId,
                role: 'assistant',
                content: content,
                tokens_used: usage?.totalTokens || null,
                prompt_tokens: usage?.promptTokens || null,
                content_tokens: usage?.completionTokens || null,
                tool_invocations: toolCalls && toolCalls.length > 0 ? toolCalls : null,
                created_at: new Date().toISOString()
            }]);

        if (error) {
            console.error("Error saving assistant message:", error);
            throw error;
        }
    }

    async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
        const supabase = await this.getSupabase();
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching session messages:", error);
            throw error;
        }

        return data || [];
    }

    async getSessionHistory(
        resourceId: string,
        resourceType: ResourceType
    ): Promise<Array<ChatSession & { message_count: number }>> {
        const supabase = await this.getSupabase();
        const { data, error } = await supabase
            .from('chat_sessions')
            .select(`
        id,
        resource_id,
        resource_type,
        title,
        created_at,
        user_id,
        chat_message(count)
      `)
            .eq('resource_id', resourceId)
            .eq('resource_type', resourceType)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching session history:", error);
            throw error;
        }

        return data?.map(session => ({
            id: session.id,
            resource_id: session.resource_id,
            resource_type: session.resource_type as ResourceType,
            title: session.title,
            created_at: session.created_at,
            user_id: session.user_id,
            message_count: session.chat_message?.[0]?.count || 0
        })) || [];
    }

    async getSession(sessionId: string): Promise<ChatSession | null> {
        const supabase = await this.getSupabase();
        const { data, error } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (error) {
            console.error("Error fetching session:", error);
            return null;
        }

        return data as ChatSession;
    }

    async deleteSession(sessionId: string): Promise<void> {
        // Delete messages first (due to foreign key constraint)
        const supabase = await this.getSupabase();
        await supabase
            .from('chat_messages')
            .delete()
            .eq('session_id', sessionId);

        // Then delete session
        const { error } = await supabase
            .from('chat_sessions')
            .delete()
            .eq('id', sessionId);

        if (error) {
            console.error("Error deleting session:", error);
            throw error;
        }
    }
}