"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, Database, AlertCircle, RefreshCw, Trash2, Send, Paperclip, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import ReactMarkdown from 'react-markdown'
import { UserActivity } from '@/lib/user-activity'
import { useAuth } from '@/contexts/auth-context'

interface FileInfo {
  id: string
  name: string
  type: string
  size: number
  page_count: number
  created_at: number
  active: boolean
}

interface KnowledgeBase {
  id: string
  name: string
  description: string
  document_count: number
  connected: boolean
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
  type: "text"
  sources?: Source[]
}

const API_BASE_URL = "http://localhost:8000/api/v1"

export default function StudioChatPanel() {
  const [activeFiles, setActiveFiles] = useState<FileInfo[]>([])
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [studioError, setStudioError] = useState<string | null>(null)
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I can help you analyze documents. Please upload a file to start asking questions.",
      timestamp: new Date(),
      type: "text",
    },
  ])
  const [input, setInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isProcessingFiles, setIsProcessingFiles] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [expandedSources, setExpandedSources] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [recommendedVideos, setRecommendedVideos] = useState<{ title: string; url: string }[]>([])
  const [isFetchingVideos, setIsFetchingVideos] = useState(false)
  const { token } = useAuth()

  const debugLog = (message: string, data?: any) => {
    console.log(`[StudioChatPanel] ${message}`, data || '')
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "Unknown size"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const fetchActiveFiles = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/document-context/active-files`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (!response.ok) throw new Error(`Failed to fetch active files: ${response.statusText}`)
      const data = await response.json()
      setActiveFiles(data || [])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error loading active files"
      setStudioError(errorMessage)
      debugLog("Error fetching active files", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchKnowledgeBases = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/document-context/knowledge-bases`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (!response.ok) throw new Error(`Failed to fetch knowledge bases: ${response.statusText}`)
      const data = await response.json()
      setKnowledgeBases(data || [])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error loading knowledge bases"
      setStudioError(errorMessage)
      debugLog("Error fetching knowledge bases", error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([fetchActiveFiles(), fetchKnowledgeBases()])
      // Force sync with backend to ensure latest state
      await fetch(`${API_BASE_URL}/document-context/sync-from-chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      toast({ title: "Synced", description: "Active files and knowledge bases synced with the latest data." })
    } catch (error) {
      toast({ title: "Error", description: "Failed to sync data.", variant: "destructive" })
    } finally {
      setIsRefreshing(false)
    }
  }

  const clearChat = async () => {
    setIsClearing(true)
    try {
      const response = await fetch(`${API_BASE_URL}/chatbot/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (!response.ok) throw new Error(`Failed to clear chat: ${response.statusText}`)
      const data = await response.json()
      if (!data.success) throw new Error(data.message || "Failed to clear chat")

      // Delete documents and sync with backend
      await fetch(`${API_BASE_URL}/document-context/clear`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      setMessages([{ id: "1", role: "assistant", content: "Chat cleared! Upload a file to start asking questions.", timestamp: new Date(), type: "text" }])
      setActiveFiles([])
      setKnowledgeBases([])
      setRecommendedVideos([])
      await fetchActiveFiles() // Re-fetch to ensure state is updated
      await fetchKnowledgeBases()
      toast({ title: "Chat Cleared", description: "Conversation history, documents, and context have been reset." })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to clear chat"
      setChatError(errorMessage)
      debugLog("Error clearing chat", error)
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
    } finally {
      setIsClearing(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) {
      toast({ title: "Error", description: "No files selected.", variant: "destructive" })
      return
    }

    setIsProcessingFiles(true)
    const formData = new FormData()
    Array.from(files).forEach((file) => formData.append("files", file))

    try {
      const response = await fetch(`${API_BASE_URL}/chatbot/upload-files`, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.detail || `Failed to upload files: ${response.statusText}`)
      }
      const data = await response.json()
      if (!data.success) {
        throw new Error(data.message || "Failed to upload files")
      }
      await fetchActiveFiles()
      if (token && data.data.uploaded_files) {
        data.data.uploaded_files.forEach((file: FileInfo) =>
          UserActivity.uploadDocument(file.name, file.page_count || 1, token)
        )
      }
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Successfully uploaded ${data.data.file_count} file(s). You can now ask questions about the documents.`,
          timestamp: new Date(),
          type: "text",
        },
      ])
      toast({ title: "Success", description: `${data.data.file_count} file(s) uploaded successfully.` })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error uploading files"
      setStudioError(errorMessage)
      debugLog("Error uploading files", error)
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
    } finally {
      setIsProcessingFiles(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim()) {
      toast({ title: "Error", description: "Please enter a question.", variant: "destructive" })
      return
    }

    if (activeFiles.length === 0) {
      setChatError("Please upload a file before asking a question.")
      toast({ title: "Error", description: "Please upload a file before asking a question.", variant: "destructive" })
      return
    }

    const newMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: new Date(),
      type: "text",
    }
    setMessages((prev) => [...prev, newMessage])
    setInput("")
    setIsChatLoading(true)
    setChatError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/chatbot/ask-question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ question: input, file_ids: activeFiles.filter(f => f.active).map(f => f.id) }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.detail || `Failed to get response: ${response.statusText}`)
      }
      const data = await response.json()
      if (!data.success) {
        throw new Error(data.message || "Failed to get response")
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.data.answer,
        timestamp: new Date(),
        type: "text",
        sources: data.data.sources?.map((source: any) => ({
          title: source.title || `${source.source} (Page ${source.page_number})`,
          content: source.content,
          relevance: source.relevance || 0.9,
        })),
      }
      setMessages((prev) => [...prev, assistantMessage])
      if (token) {
        debugLog('Sending chat message with token:', { token })
        UserActivity.chatMessageSent(input.length, token)
      } else {
        debugLog('No token available for chat message')
      }

      // Fetch recommended videos if indicated
      if (data.data.recommendations) {
        setIsFetchingVideos(true)
        try {
          const videoResponse = await fetch(`${API_BASE_URL}/chatbot/recommendations?query=${encodeURIComponent(input)}`, {
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          })
          if (!videoResponse.ok) {
            const errorData = await videoResponse.json()
            throw new Error(errorData.message || `Failed to fetch recommendations: ${videoResponse.statusText}`)
          }
          const videoData = await videoResponse.json()
          if (videoData.success) {
            setRecommendedVideos(videoData.data.videos || [])
          } else {
            debugLog("No videos returned", videoData.message)
          }
        } catch (videoError) {
          const errorMessage = videoError instanceof Error ? videoError.message : "Error fetching recommended videos"
          debugLog("Error fetching recommended videos", videoError)
          toast({ title: "Warning", description: errorMessage })
        } finally {
          setIsFetchingVideos(false)
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error processing your question"
      setChatError(errorMessage)
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Error: ${errorMessage}. Please try again or upload a different file.`,
          timestamp: new Date(),
          type: "text",
        },
      ])
      debugLog("Error sending message", error)
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
    } finally {
      setIsChatLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex flex-col h-full w-full">
      <Card className="flex-1 flex flex-col overflow-hidden bg-card dark:bg-card">
        <div className="p-4 border-b border-border dark:border-border flex justify-between items-center">
          <h2 className="text-xl font-semibold text-foreground dark:text-foreground">Studio Chat</h2>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={refreshData} disabled={isRefreshing} className="dark:text-foreground">
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={clearChat} disabled={isClearing} className="dark:text-foreground">
              {isClearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          {studioError && (
            <div className="flex items-center p-2 bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive rounded mb-2">
              <AlertCircle className="h-5 w-5 mr-2" />
              {studioError}
            </div>
          )}
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full bg-muted dark:bg-muted" />
              <Skeleton className="h-12 w-full bg-muted dark:bg-muted" />
              <Skeleton className="h-12 w-full bg-muted dark:bg-muted" />
            </div>
          ) : (
            <>
              {activeFiles.length === 0 && (
                <div className="text-sm text-muted-foreground dark:text-muted-foreground mb-2">No files uploaded. Please upload a file to start.</div>
              )}
              {activeFiles.map((file) => (
                <div key={file.id} className="flex items-center p-2 bg-muted/50 dark:bg-muted/30 rounded mb-2">
                  <FileText className="h-5 w-5 mr-2 text-primary dark:text-primary" />
                  <span className="flex-1 text-foreground dark:text-foreground">{file.name} ({formatFileSize(file.size)})</span>
                  <Button variant="ghost" size="sm" className="dark:text-foreground">
                    {file.active ? "Active" : "Inactive"}
                  </Button>
                </div>
              ))}
              {knowledgeBases.map((kb) => (
                <div key={kb.id} className="flex items-center p-2 bg-muted/50 dark:bg-muted/30 rounded mb-2">
                  <Database className="h-5 w-5 mr-2 text-secondary dark:text-secondary" />
                  <span className="flex-1 text-foreground dark:text-foreground">{kb.name} ({kb.document_count} docs)</span>
                  <Button variant="ghost" size="sm" className="dark:text-foreground">
                    {kb.connected ? "Connected" : "Disconnected"}
                  </Button>
                </div>
              ))}
            </>
          )}
          {chatError && (
            <div className="flex items-center p-2 bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive rounded mt-2">
              <AlertCircle className="h-5 w-5 mr-2" />
              {chatError}
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg mb-2 ${
                message.role === "user"
                  ? "bg-primary/10 ml-auto max-w-[80%] text-foreground dark:text-foreground"
                  : "bg-muted/50 max-w-[80%] text-foreground dark:text-foreground"
              }`}
            >
              <div className="prose max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setExpandedSources(expandedSources === message.id ? null : message.id)}
                    className="text-primary dark:text-primary"
                  >
                    {expandedSources === message.id ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" /> Hide Sources
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" /> Show Sources ({message.sources.length})
                      </>
                    )}
                  </Button>
                  {expandedSources === message.id && (
                    <div className="mt-2 space-y-2">
                      {message.sources.map((source, index) => (
                        <div key={index} className="p-2 bg-card dark:bg-card rounded shadow text-foreground dark:text-foreground">
                          <h4 className="font-medium">{source.title}</h4>
                          <p className="text-sm text-muted-foreground dark:text-muted-foreground">{source.content}</p>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground">Relevance: {(source.relevance * 100).toFixed(0)}%</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {isChatLoading && (
            <div className="p-3 bg-muted/50 rounded-lg mb-2 max-w-[80%] flex items-center text-foreground dark:text-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span>Thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>

        <div className="p-4 border-t border-border dark:border-border">
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.txt,.docx"
              multiple
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingFiles}
              className="dark:text-foreground"
            >
              <Paperclip className="h-4 w-4 mr-2" />
              Attach Files
            </Button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeFiles.length === 0 ? "Upload a file to start asking questions" : "Type your question..."}
              className="flex-1 resize-none bg-background text-foreground dark:bg-background dark:text-foreground border-border dark:border-border"
              disabled={isChatLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isChatLoading || activeFiles.length === 0}
              size="sm"
              className="dark:text-foreground dark:bg-secondary dark:hover:bg-secondary/90"
            >
              {isChatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          {isProcessingFiles && (
            <div className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">Processing files...</div>
          )}
        </div>
      </Card>

      {recommendedVideos.length > 0 && !isFetchingVideos && (
        <Card className="mt-4 p-4 bg-card dark:bg-card">
          <h3 className="text-lg font-semibold text-foreground dark:text-foreground mb-2">Recommended Videos</h3>
          <ul className="list-disc pl-5 space-y-2">
            {recommendedVideos.map((video, index) => (
              <li key={index}>
                <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-primary dark:text-primary hover:underline">
                  {video.title}
                </a>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {isFetchingVideos && (
        <Card className="mt-4 p-4 bg-card dark:bg-card">
          <div className="flex items-center gap-2 text-foreground dark:text-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Fetching recommended videos...</span>
          </div>
        </Card>
      )}
    </div>
  )
}