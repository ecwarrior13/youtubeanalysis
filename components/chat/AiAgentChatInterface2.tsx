import { useChat } from "@ai-sdk/react";
import {
  BotIcon,
  ImageIcon,
  LetterText,
  PenIcon,
  Send,
  History,
  Plus,
  Trash2,
} from "lucide-react";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import ChatMessage from "./ChatMessage";
import {
  chatHistoryService,
  ChatSession,
  ChatMessage as StoredChatMessage,
} from "@/tools/chatHistoryService";

interface AiAgentChatInterfaceProps {
  agentInfo: string; // videoId
}

function AiAgentChatInterface({ agentInfo }: AiAgentChatInterfaceProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    setMessages,
  } = useChat({
    api: "/api/youtube/chat",
    maxSteps: 5,
    body: {
      videoId: agentInfo,
    },
  });

  // Load chat sessions for this video on component mount
  useEffect(() => {
    loadChatSessions();
  }, [agentInfo]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (bottomRef.current && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Save messages to database when messages change
  useEffect(() => {
    saveMessagesToDatabase();
  }, [messages]);

  // Status toast notifications
  useEffect(() => {
    let toastId;

    switch (status) {
      case "submitted":
        toastId = toast("Agent is thinking...", {
          id: toastId,
          icon: <BotIcon className="w-4 h-4" />,
        });
        break;
      case "streaming":
        toastId = toast("Agent is replying...", {
          id: toastId,
          icon: <BotIcon className="w-4 h-4" />,
        });
        break;
      case "error":
        toastId = toast("Whoops! Something went wrong, please try again.", {
          id: toastId,
          icon: <BotIcon className="w-4 h-4" />,
        });
        break;
      case "ready":
        toast.dismiss(toastId);
        break;
    }
  }, [status]);

  const loadChatSessions = useCallback(async () => {
    const sessions = await chatHistoryService.getChatSessionsForVideo(
      agentInfo
    );
    setChatSessions(sessions);
  }, [agentInfo]);

  const saveMessagesToDatabase = useCallback(async () => {
    if (messages.length === 0) return;

    // Create session if it doesn't exist
    if (!currentSessionId && messages.length > 0) {
      const firstUserMessage = messages.find((m) => m.role === "user");
      const title = firstUserMessage
        ? chatHistoryService.generateSessionTitle(firstUserMessage.content)
        : `Chat about Video ${agentInfo}`;

      const session = await chatHistoryService.createChatSession(
        agentInfo,
        title
      );
      if (session) {
        setCurrentSessionId(session.id);
        await loadChatSessions();
      }
      return;
    }

    // Save new messages to database
    if (currentSessionId) {
      const existingMessages = await chatHistoryService.getMessagesForSession(
        currentSessionId
      );
      const existingMessageIds = new Set(
        existingMessages.map((m) => m.message_id)
      );

      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        if (!existingMessageIds.has(message.id)) {
          const messageData = {
            message_id: message.id,
            role: message.role,
            content: message.content,
            parts: message.parts,
            tool_invocations: message.toolInvocations,
          };

          await chatHistoryService.saveMessage(
            currentSessionId,
            messageData,
            i
          );
        }
      }
    }
  }, [messages, currentSessionId, agentInfo, loadChatSessions]);

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
  };

  const loadChatSession = async (sessionId: string) => {
    setIsLoadingHistory(true);
    try {
      const storedMessages = await chatHistoryService.getMessagesForSession(
        sessionId
      );

      // Convert stored messages to chat format
      const chatMessages = storedMessages.map((msg) => ({
        id: msg.message_id,
        role: msg.role,
        content: msg.content,
        parts: msg.parts,
        toolInvocations: msg.tool_invocations,
      }));

      setMessages(chatMessages);
      setCurrentSessionId(sessionId);
      setShowHistory(false);
    } catch (error) {
      console.error("Error loading chat session:", error);
      toast.error("Failed to load chat session");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const deleteChatSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (confirm("Are you sure you want to delete this chat session?")) {
      const success = await chatHistoryService.deleteChatSession(sessionId);
      if (success) {
        await loadChatSessions();
        if (currentSessionId === sessionId) {
          startNewChat();
        }
        toast.success("Chat session deleted");
      } else {
        toast.error("Failed to delete chat session");
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">AI Agent</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowHistory(!showHistory)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            History
          </Button>
          <Button
            onClick={startNewChat}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Chat History Sidebar */}
      {showHistory && (
        <div className="border-b border-gray-100 bg-gray-50 max-h-60 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-medium text-gray-700 mb-3">
              Previous Conversations
            </h3>
            {chatSessions.length === 0 ? (
              <p className="text-sm text-gray-500">No previous conversations</p>
            ) : (
              <div className="space-y-2">
                {chatSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      currentSessionId === session.id
                        ? "bg-primary/10 border border-primary/20"
                        : "bg-white hover:bg-gray-100 border border-gray-200"
                    }`}
                    onClick={() => loadChatSession(session.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {session.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(session.updated_at)}
                      </p>
                    </div>
                    <Button
                      onClick={(e) => deleteChatSession(session.id, e)}
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        ref={messagesContainerRef}
      >
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <BotIcon className="w-8 h-8 animate-spin mx-auto text-gray-500" />
              <p className="text-sm text-gray-500">Loading chat history...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium text-gray-700">
                    Welcome to AI Agent Chat
                  </h3>
                  <p className="text-sm text-gray-500">
                    Ask any question about your video!
                  </p>
                </div>
              </div>
            )}
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input form */}
      <div className="border-t border-gray-100 p-4 bg-white">
        <div className="space-y-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-full
              focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder={"Ask anything about your video..."}
            />
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 rounded-full px-4 py-2 text-sm text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              disabled={status === "streaming" || status === "submitted"}
            >
              {status === "streaming" ? (
                "AI is replying..."
              ) : status === "submitted" ? (
                "AI is thinking..."
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <div className="flex gap-2">
            <button
              className="text-xs xl:text-sm w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              <LetterText className="w-4 h-4" />
              Placeholder
            </button>
            <button
              className="text-xs xl:text-sm w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              <PenIcon className="w-4 h-4" />
              Placeholder 2
            </button>
            <button
              className="text-xs xl:text-sm w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              <ImageIcon className="w-4 h-4" />
              Placeholder 3
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AiAgentChatInterface;
