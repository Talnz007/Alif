"use client"

import ChatInterface from "@/components/chat/chat-interface"
import StudioPanel from "@/components/studio-panel"

export default function ChatPage() {
  return (
    <div className="flex h-screen bg-transparent p-4">
      <div className="flex-1 max-w-[calc(100%-20rem)] mr-4">
        <ChatInterface />
      </div>
      <div className="w-80">
        <StudioPanel />
      </div>
    </div>
  )
}

