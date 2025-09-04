"use client";

import { useState } from "react";
import AiAgentChatInterface from "./AiAgentChatInterface3";

interface ChatSession {
  id: string;
  title: string;
  videoId: string;
  createdAt: Date;
  lastMessage?: string;
}

export default function ChatLayout({ agentInfo }: { agentInfo: string }) {
  const [currentVideoId, setCurrentVideoId] = useState<string>(agentInfo);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    {
      id: "1",
      title: "Video Analysis Chat",
      videoId: agentInfo,
      createdAt: new Date(),
      lastMessage: "What are the main topics discussed?",
    },
  ]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("1");

  const handleNewChat = async () => {
    console.log("[v0] Creating new chat session...");

    try {
      const response = await fetch("/api/chat-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          video_id: currentVideoId,
          title: `Chat ${new Date().toLocaleTimeString()}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create chat session");
      }

      const newSession = await response.json();
      console.log("[v0] New session created:", newSession);

      // Add the new session to the list and select it
      const sessionToAdd: ChatSession = {
        id: newSession.id,
        title: newSession.title,
        videoId: newSession.video_id,
        createdAt: newSession.created_at
          ? new Date(newSession.created_at)
          : new Date(),
      };

      setChatSessions((prev) => [sessionToAdd, ...prev]);
      setSelectedSessionId(newSession.id);
    } catch (error) {
      console.error("[v0] Error creating new chat session:", error);
    }
  };

  const handleSessionSelect = (sessionId: string) => {
    const session = chatSessions.find((s) => s.id === sessionId);
    if (session) {
      setSelectedSessionId(sessionId);
      setCurrentVideoId(session.videoId);
    }
  };

  return (
    <div className="h-full bg-background">
      <AiAgentChatInterface
        agentInfo={currentVideoId}
        chatSessions={chatSessions}
        onNewChat={handleNewChat}
        onSessionSelect={handleSessionSelect}
        selectedSessionId={selectedSessionId}
      />
    </div>
  );
}
