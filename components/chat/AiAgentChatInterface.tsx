import { useChat } from "@ai-sdk/react";
import { BotIcon, ImageIcon, LetterText, PenIcon, Send } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatHistoryDropdown from "./ChatHistoryDropdown";
import { createClient } from "@/utils/supabase/client";

function AiAgentChatInterface({ agentInfo }: { agentInfo: string }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

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
      sessionId: sessionId,
    },
  });

  // Load messages from a selected chat session
  const loadChatSession = async (selectedSessionId: string) => {
    try {
      const supabase = createClient();
      const { data: chatMessages, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", selectedSessionId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading chat messages:", error);
        toast.error("Failed to load chat history");
        return;
      }

      // Convert to the format expected by useChat
      const formattedMessages =
        chatMessages?.map((msg) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant",
          content: msg.content,
          createdAt: new Date(msg.created_at),
        })) || [];

      setMessages(formattedMessages);
      setSessionId(selectedSessionId);
      toast.success("Chat history loaded");
    } catch (error) {
      console.error("Error loading chat session:", error);
      toast.error("Failed to load chat history");
    }
  };

  // Create session on first message
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // If this is the first message and no session exists, create one
    if (!sessionId && messages.length === 0) {
      try {
        const response = await fetch("/api/chat-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: agentInfo }),
        });
        if (!response.ok) {
          throw new Error("Failed to create session");
        }
        const { sessionId: newSessionId } = await response.json();
        setSessionId(newSessionId);
        // Wait a bit to ensure sessionId is set before submitting
        setTimeout(() => {
          handleSubmit(e);
        }, 100);
      } catch (error) {
        console.error("Error creating session:", error);
        // Still allow the chat to proceed even if session creation fails
        handleSubmit(e);
      }
    } else {
      // Normal submission for subsequent messages
      handleSubmit(e);
    }
  };

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
      <div className="hidden lg:block px-4 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">AI Agent</h2>
          <ChatHistoryDropdown
            videoId={agentInfo}
            onSelectSession={loadChatSession}
            currentSessionId={sessionId}
          />
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        ref={messagesContainerRef}
      >
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
      </div>

      {/* Input form */}
      <div className="border-t border-gray-100 p-4 bg-white">
        <div className="space-y-3">
          <form onSubmit={handleFormSubmit} className="flex gap-2">
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
