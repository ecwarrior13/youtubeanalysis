import { useState, useEffect, useCallback } from 'react';
import { chatHistoryService, ChatSession, ChatMessage } from "@/tools/chatHistoryService";

interface UseChatHistoryProps {
    videoId: string;
}

interface UseChatHistoryReturn {
    sessions: ChatSession[];
    currentSession: ChatSession | null;
    isLoading: boolean;
    error: string | null;
    createSession: (title?: string) => Promise<ChatSession | null>;
    loadSession: (sessionId: string) => Promise<ChatMessage[]>;
    deleteSession: (sessionId: string) => Promise<boolean>;
    updateSessionTitle: (sessionId: string, title: string) => Promise<boolean>;
    saveMessage: (sessionId: string, messageData: any, order: number) => Promise<boolean>;
    refreshSessions: () => Promise<void>;
}

export function useChatHistory({ videoId }: UseChatHistoryProps): UseChatHistoryReturn {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load sessions for the video
    const refreshSessions = useCallback(async () => {
        if (!videoId) return;

        setIsLoading(true);
        setError(null);

        try {
            const sessionList = await chatHistoryService.getChatSessionsForVideo(videoId);
            setSessions(sessionList);
        } catch (err) {
            setError('Failed to load chat sessions');
            console.error('Error loading sessions:', err);
        } finally {
            setIsLoading(false);
        }
    }, [videoId]);

    // Load sessions on mount and when videoId changes
    useEffect(() => {
        refreshSessions();
    }, [refreshSessions]);

    // Create a new chat session
    const createSession = useCallback(async (title?: string): Promise<ChatSession | null> => {
        setError(null);

        try {
            const session = await chatHistoryService.createChatSession(
                videoId,
                title || `Chat about Video ${videoId}`
            );

            if (session) {
                setCurrentSession(session);
                await refreshSessions();
                return session;
            }

            setError('Failed to create chat session');
            return null;
        } catch (err) {
            setError('Failed to create chat session');
            console.error('Error creating session:', err);
            return null;
        }
    }, [videoId, refreshSessions]);

    // Load a specific chat session and return its messages
    const loadSession = useCallback(async (sessionId: string): Promise<ChatMessage[]> => {
        setIsLoading(true);
        setError(null);

        try {
            const [session, messages] = await Promise.all([
                chatHistoryService.getChatSession(sessionId),
                chatHistoryService.getMessagesForSession(sessionId)
            ]);

            if (session) {
                setCurrentSession(session);
            }

            return messages;
        } catch (err) {
            setError('Failed to load chat session');
            console.error('Error loading session:', err);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Delete a chat session
    const deleteSession = useCallback(async (sessionId: string): Promise<boolean> => {
        setError(null);

        try {
            const success = await chatHistoryService.deleteChatSession(sessionId);

            if (success) {
                if (currentSession?.id === sessionId) {
                    setCurrentSession(null);
                }
                await refreshSessions();
                return true;
            }

            setError('Failed to delete chat session');
            return false;
        } catch (err) {
            setError('Failed to delete chat session');
            console.error('Error deleting session:', err);
            return false;
        }
    }, [currentSession, refreshSessions]);

    // Update session title
    const updateSessionTitle = useCallback(async (sessionId: string, title: string): Promise<boolean> => {
        setError(null);

        try {
            const success = await chatHistoryService.updateSessionTitle(sessionId, title);

            if (success) {
                await refreshSessions();
                if (currentSession?.id === sessionId) {
                    setCurrentSession({ ...currentSession, title });
                }
                return true;
            }

            setError('Failed to update session title');
            return false;
        } catch (err) {
            setError('Failed to update session title');
            console.error('Error updating session title:', err);
            return false;
        }
    }, [currentSession, refreshSessions]);

    // Save a message to the current session
    const saveMessage = useCallback(async (
        sessionId: string,
        messageData: any,
        order: number
    ): Promise<boolean> => {
        setError(null);

        try {
            const message = await chatHistoryService.saveMessage(sessionId, messageData, order);
            return message !== null;
        } catch (err) {
            setError('Failed to save message');
            console.error('Error saving message:', err);
            return false;
        }
    }, []);

    return {
        sessions,
        currentSession,
        isLoading,
        error,
        createSession,
        loadSession,
        deleteSession,
        updateSessionTitle,
        saveMessage,
        refreshSessions,
    };
}