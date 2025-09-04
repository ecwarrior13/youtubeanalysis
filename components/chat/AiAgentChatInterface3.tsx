"use client";

import { useChat } from "@ai-sdk/react";
import {
  BotIcon,
  ImageIcon,
  FileText as LetterText,
  PenIcon,
  Send,
  Video,
  Plus,
  History,
  MessageSquare,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import ChatMessage from "@/components/chat/ChatMessage";

interface ChatSession {
  id: string;
  title: string;
  videoId: string;
  createdAt: Date;
  lastMessage?: string;
}

interface AiAgentChatInterfaceProps {
  agentInfo: string;
  chatSessions: ChatSession[];
  onNewChat: () => void;
  onSessionSelect: (sessionId: string) => void;
  selectedSessionId: string;
}

function AiAgentChatInterface({
  agentInfo,
  chatSessions,
  onNewChat,
  onSessionSelect,
  selectedSessionId,
}: AiAgentChatInterfaceProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showHistory, setShowHistory] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting form");
    // If no session is selected, create one first
    if (!selectedSessionId && input.trim()) {
      console.log(
        "[v0] No session selected, creating new session before sending message"
      );
      await onNewChat();
      // The onNewChat should set a new selectedSessionId, but we need to wait for it
      // For now, let the normal submit proceed - the parent should handle session creation
    }

    console.log("[v0] Submitting with sessionId:", selectedSessionId);
    handleSubmit(e);
  };

  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    api: "/api/youtube/chat",
    maxSteps: 5,
    body: () => ({
      videoId: agentInfo,
      sessionId: selectedSessionId,
    }),
  });

  //flow with messages
  useEffect(() => {
    if (bottomRef.current && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

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

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border bg-card relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Video className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">
                AI Agent Chat
              </h2>
              <p className="text-sm text-muted-foreground">
                Video ID: {agentInfo}
              </p>
            </div>
          </div>

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
              onClick={onNewChat}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>
        </div>

        {showHistory && (
          <div className="absolute top-full left-0 right-0 bg-card border border-border shadow-lg z-10 max-h-80 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
            <div className="p-4">
              <h3 className="text-sm font-medium text-card-foreground mb-3">
                Chat History
              </h3>
              <div className="space-y-2">
                {chatSessions.length === 0 ? (
                  <div className="text-center py-4">
                    <MessageSquare className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No chat sessions yet
                    </p>
                  </div>
                ) : (
                  chatSessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => {
                        onSessionSelect(session.id);
                        setShowHistory(false);
                      }}
                      className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                        selectedSessionId === session.id
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-muted/50 hover:bg-muted border-border text-card-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Video className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {session.title}
                          </h4>
                          {session.lastMessage && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {session.lastMessage}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {session.createdAt instanceof Date &&
                            !isNaN(session.createdAt.getTime())
                              ? session.createdAt.toLocaleDateString()
                              : "Recent"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-6 py-4 bg-white"
        ref={messagesContainerRef}
      >
        <div className="space-y-6">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <BotIcon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-foreground">
                  Welcome to AI Agent Chat
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Ask any question about your video content. I can help analyze,
                  summarize, or answer specific questions.
                </p>
              </div>
            </div>
          )}
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-border p-6 bg-card">
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              className="flex-1 px-4 py-3 text-sm bg-white border border-border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
              placeholder:text-muted-foreground"
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask anything about your video..."
            />
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              disabled={status === "streaming" || status === "submitted"}
            >
              {status === "streaming" ? (
                "Replying..."
              ) : status === "submitted" ? (
                "Thinking..."
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
              Summarize
            </button>
            <button
              className="text-xs xl:text-sm w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              <PenIcon className="w-4 h-4" />
              Key Points
            </button>
            <button
              className="text-xs xl:text-sm w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              <ImageIcon className="w-4 h-4" />
              Analyze
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AiAgentChatInterface;
