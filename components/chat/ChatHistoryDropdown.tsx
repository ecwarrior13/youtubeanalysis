import { useState, useEffect } from "react";
import { ChevronDown, History, MessageCircle, Calendar } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  message_count?: number;
}

interface ChatHistoryDropdownProps {
  videoId: string;
  onSelectSession: (sessionId: string) => void;
  currentSessionId?: string | null;
}

export default function ChatHistoryDropdown({
  videoId,
  onSelectSession,
  currentSessionId,
}: ChatHistoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchChatHistory = async () => {
    if (!videoId || sessions.length > 0) return; // Don't fetch if already loaded

    setLoading(true);
    try {
      const supabase = createClient();

      // Get chat sessions for this video with message counts
      const { data: sessionData, error } = await supabase
        .from("chat_sessions")
        .select(
          `
          id,
          title,
          created_at,
          chat_messages(count)
        `
        )
        .eq("video_id", videoId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching chat history:", error);
        return;
      }

      const sessionsWithCount =
        sessionData?.map((session) => ({
          id: session.id,
          title: session.title,
          created_at: session.created_at,
          message_count: session.chat_messages?.[0]?.count || 0,
        })) || [];

      setSessions(sessionsWithCount);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchChatHistory();
    }
  };

  const handleSelectSession = (sessionId: string) => {
    onSelectSession(sessionId);
    setIsOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggleDropdown}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <History className="w-4 h-4" />
        History
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading history...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No chat history for this video</p>
            </div>
          ) : (
            <div className="py-2">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                Previous Conversations
              </div>
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSelectSession(session.id)}
                  className={`w-full text-left px-3 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-b-0 transition-colors ${
                    currentSessionId === session.id
                      ? "bg-purple-50 border-purple-100"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {session.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {formatDate(session.created_at)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MessageCircle className="w-3 h-3" />
                          {session.message_count} messages
                        </div>
                      </div>
                    </div>
                    {currentSessionId === session.id && (
                      <div className="ml-2 w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
