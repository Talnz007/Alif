"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Send, Paperclip, Loader2, ChevronDown, ChevronUp, BookOpen, Trash2 } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import { UserActivity } from '@/lib/user-activity';





// Types for our messages and sources
interface Attachment {
  type: "image" | "document"
  url: string
  name: string
  size?: number
}

interface Source {
  title: string
  content: string
  relevance: number
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  type: "text" | "image" | "document"
  attachments?: Attachment[]
  sources?: Source[]
}

// API endpoint constants
const API_BASE_URL = "http://127.0.0.1:8000" // Match your FastAPI port

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I can help you analyze documents and images. Upload files or ask questions about your content.",
      timestamp: new Date(),
      type: "text",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessingFiles, setIsProcessingFiles] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSources, setExpandedSources] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Reset the chat and vector store
  const resetChat = async () => {
    try {
      await fetch(`${API_BASE_URL}/reset/`, {
        method: "POST",
      })

      // Reset local state
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: "Chat has been reset. I'm ready to help with new documents!",
          timestamp: new Date(),
          type: "text",
        },
      ])
      setError(null)
    } catch (err) {
      console.error("Error resetting chat:", err)
      setError(err instanceof Error ? err.message : "Failed to reset chat")
    }
  }

  // Upload and process files
  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return

    setIsProcessingFiles(true)
    setError(null)

    // Display upload messages in UI
    const newMessages: Message[] = []
    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith("image/")
      const attachment: Attachment = {
        type: isImage ? "image" : "document",
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
      }

      newMessages.push({
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        role: "user",
        content: `Uploaded ${file.name}`,
        timestamp: new Date(),
        type: isImage ? "image" : "document",
        attachments: [attachment],
      })
    })

    setMessages((prev) => [...prev, ...newMessages])

    // Prepare form data for file upload
    const formData = new FormData()
    Array.from(files).forEach((file) => {
      formData.append("files", file)
    })

    try {
      const response = await fetch(`${API_BASE_URL}/upload-files/`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to upload files")
      }

      const result = await response.json()

      // Add system message confirming successful upload
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `I've processed ${files.length} file(s). What would you like to know about them?`,
          timestamp: new Date(),
          type: "text",
        },
      ])
    } catch (err) {
      console.error("Error uploading files:", err)
      setError(err instanceof Error ? err.message : "Failed to upload files")

      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `Error processing files: ${err instanceof Error ? err.message : "Unknown error"}. Please try again.`,
          timestamp: new Date(),
          type: "text",
        },
      ])
    } finally {
      setIsProcessingFiles(false)
    }
  }

  // Send a question and get response
  const sendQuestion = async (question: string) => {
  if (!question.trim() || isLoading) return;

  setIsLoading(true);
  setError(null);

  // Add user message to chat
  const userMessage: Message = {
    id: Date.now().toString(),
    role: "user",
    content: question,
    timestamp: new Date(),
    type: "text",
  };

  setMessages((prev) => [...prev, userMessage]);

  // Log question for Curious Learner badge
  await UserActivity.askQuestion(question);

    try {
      const response = await fetch(`${API_BASE_URL}/ask-question/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      })

     if (!response.ok) {
  const errorData = await response.json();
  throw new Error(
    typeof errorData.detail === "object"
      ? JSON.stringify(errorData.detail)
      : errorData.detail || "Failed to get answer"
  );
}

      const data = await response.json()

      // Format sources from API response
      const sources: Source[] = data.sources?.map((source: any) => ({
        title: `${source.source} (Page ${source.page_number})`,
        content: source.content,
        relevance: 0.9, // API doesn't provide relevance score, so using a default
      })) || []

      // Add assistant response to chat
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.answer,
        timestamp: new Date(),
        type: "text",
        sources: sources.length > 0 ? sources : undefined,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      console.error("Error getting answer:", err)
      setError(err instanceof Error ? err.message : "Failed to get answer")

      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Unknown error"}. Please try again.`,
          timestamp: new Date(),
          type: "text",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const question = input
    setInput("")
    await sendQuestion(question)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    uploadFiles(event.target.files)

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <div className="flex flex-col h-full content-layer rounded-lg shadow-lg">
      <div className="flex justify-between items-center p-2 border-b border-white/10 dark:border-gray-700/10">
        <h2 className="text-lg font-semibold">Alif Chat</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={resetChat}
          title="Reset chat"
          className="bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70"
        >
          <Trash2 className="h-4 w-4 mr-1" /> Reset
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {error && (
            <Card className="p-2 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200">
              <p className="text-sm">{error}</p>
            </Card>
          )}

          {messages.map((message) => (
              <Card
                  key={message.id}
                  className={`p-4 ${
                      message.role === "user"
                          ? "ml-12 bg-blue-600/90 dark:bg-blue-600/90 text-white backdrop-blur-sm"
                          : "mr-12 card-gradient"
                  }`}
              >
                <div
                    className={`prose ${
                        message.role === "user"
                            ? "prose-invert" // Always use inverted prose for user messages since they have dark background
                            : "dark:prose-invert" // Only invert assistant message text in dark mode
                    } max-w-none`}
                >
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>

                {message.sources && message.sources.length > 0 && (
                    <div className="mt-4">
                      <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedSources(expandedSources === message.id ? null : message.id)}
                          className={`text-xs flex items-center ${
                              message.role === "user"
                                  ? "text-white hover:bg-blue-700"
                                  : "dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                          }`}
                      >
                        <BookOpen className="h-4 w-4 mr-1"/>
                        {expandedSources === message.id ? (
                            <ChevronUp className="h-4 w-4 mr-1"/>
                        ) : (
                            <ChevronDown className="h-4 w-4 mr-1"/>
                        )}
                        Sources ({message.sources.length})
                      </Button>

                      {expandedSources === message.id && (
                          <div className="mt-2 space-y-2">
                            {message.sources.map((source, index) => (
                                <div
                                    key={index}
                                    className={`text-sm p-2 rounded ${
                                        message.role === "user"
                                            ? "bg-blue-700 text-white"
                                            : "bg-gray-200 dark:bg-gray-700 text-foreground"
                                    }`}
                                >
                                  <div className="font-medium">{source.title}</div>
                                  <div className="mt-1 opacity-70">{source.content}</div>
                                  <div className="mt-1 text-xs">Relevance: {(source.relevance * 100).toFixed(0)}%</div>
                                </div>
                            ))}
                          </div>
                      )}
                    </div>
                )}

                <div
                    className={`text-xs mt-2 ${
                        message.role === "user" ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                    }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </div>

                {message.attachments?.map((attachment, index) => (
                    <div key={index} className="mt-2">
                      {attachment.type === "image" ? (
                          <div className="relative">
                            <img
                                src={attachment.url || "/placeholder.svg"}
                                alt={attachment.name}
                                className="max-h-64 rounded object-contain"
                            />
                            <div
                                className={`mt-1 text-sm ${
                                    message.role === "user" ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                                }`}
                            >
                              {attachment.name} ({formatFileSize(attachment.size || 0)})
                            </div>
                          </div>
                      ) : (
                          <div
                              className={`flex items-center gap-2 text-sm ${
                                  message.role === "user" ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                              }`}
                          >
                            <FileText className="h-4 w-4"/>
                            <span>{attachment.name}</span>
                            {attachment.size && <span className="opacity-70">({formatFileSize(attachment.size)})</span>}
                          </div>
                      )}
                    </div>
                ))}
              </Card>
          ))}

          {/* This empty div helps with scrolling to the bottom */}
          <div ref={messagesEndRef}/>

          {(isLoading || isProcessingFiles) && (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin"/>
              </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-white/10 dark:border-gray-700/10">
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.txt,.pptx"
            multiple
          />

          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            title="Upload files"
            disabled={isProcessingFiles || isLoading}
            className="bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your documents..."
            className="flex-1 min-h-[44px] max-h-32 input-gradient"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />

          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isProcessingFiles}
            className="bg-blue-600/90 hover:bg-blue-600 transition-colors duration-200"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}