"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, Database, AlertCircle, RefreshCw, Trash2, RotateCw, Bug, Send, Paperclip, Loader2, ChevronDown, ChevronUp, BookOpen } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import ReactMarkdown from 'react-markdown'
import { UserActivity } from '@/lib/user-activity';

// Types from both files
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

const API_BASE_URL = "http://localhost:8000/api/v1"
const CHAT_API_BASE_URL = "http://127.0.0.1:8000"

export default function StudioChatPanel() {
  // StudioPanel state
  const [activeFiles, setActiveFiles] = useState<FileInfo[]>([])
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [studioError, setStudioError] = useState<string | null>(null)
  const { toast } = useToast()

  // ChatInterface state
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
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isProcessingFiles, setIsProcessingFiles] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [expandedSources, setExpandedSources] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Debug log function
  const debugLog = (message: string, data?: any) => {
    console.log(`[StudioChatPanel] ${message}`, data || '')
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "Unknown size"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Get file icon
  const getFileIcon = (fileType: string) => {
    return <FileText className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
  }

  // StudioPanel actions
  const resetContext = async () => {
    setIsClearing(true)
    try {
      debugLog('Clearing document context')
      const response = await fetch(`${API_BASE_URL}/document-context/clear`, { method: 'POST' });
      if (!response.ok) throw new Error(`Failed to clear document context: ${response.status}`);
      await fetchDocumentContext();
      toast({ title: "Document context cleared", description: "All documents have been removed from context" });
    } catch (err) {
      console.error("Error clearing document context:", err);
      toast({ title: "Error", description: "Failed to clear document context", variant: "destructive" });
    } finally {
      setIsClearing(false)
    }
  };

  const forceRefresh = async () => {
    try {
      setIsRefreshing(true);
      debugLog('Checking vector DB contents');
      const debugResponse = await fetch(`${API_BASE_URL}/document-context/debug-vector-db`);
      if (!debugResponse.ok) throw new Error('Failed to debug vector DB');
      const debugData = await debugResponse.json();
      debugLog("Vector DB debug data:", debugData);
      if (debugData.files_found && debugData.files_found.length > 0) {
        await resetContext();
        await refreshContext();
        toast({ title: "Force refresh completed", description: `Found ${debugData.files_found.length} files in vector DB: ${debugData.files_found.join(', ')}` });
      } else {
        toast({ title: "No files in vector DB", description: "The vector database does not contain any documents" });
      }
    } catch (err) {
      console.error("Force refresh failed:", err);
      toast({ title: "Refresh failed", description: "Could not force refresh document context", variant: "destructive" });
    } finally {
      setIsRefreshing(false);
    }
  };

  const createTestData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/document-context/create-test-data`, { method: 'POST' })
      if (!response.ok) throw new Error(`Error creating test data: ${response.statusText}`)
      const result = await response.json()
      debugLog('Test data created', result)
      await fetchDocumentContext()
      toast({ title: "Test data created", description: `Created ${result.files_created} files and ${result.knowledge_bases_created} knowledge bases`, })
    } catch (err) {
      console.error("Error creating test data:", err)
      toast({ title: "Error", description: `Failed to create test data: ${err instanceof Error ? err.message : 'Unknown error'}`, variant: "destructive", })
    }
  }

  const refreshContext = async () => {
    setIsRefreshing(true)
    try {
      debugLog('Triggering context refresh')
      const syncResponse = await fetch(`${API_BASE_URL}/document-context/sync-from-chatbot`, { method: 'POST' })
      if (!syncResponse.ok) throw new Error(`Sync failed with status: ${syncResponse.status} ${syncResponse.statusText}`)
      const syncResult = await syncResponse.json()
      debugLog('Sync result', syncResult)
      await fetchDocumentContext()
      toast({ title: "Context refreshed", description: `Updated with ${syncResult.files_synced} files and ${syncResult.knowledge_bases_synced} knowledge bases`, })
    } catch (err) {
      console.error("Error refreshing context:", err)
      toast({ title: "Refresh failed", description: "Could not refresh document context. See console for details.", variant: "destructive", })
    } finally {
      setIsRefreshing(false)
    }
  }

  async function fetchDocumentContext() {
    setIsLoading(true)
    setStudioError(null)
    try {
      debugLog('Fetching document context data')
      const filesUrl = `${API_BASE_URL}/document-context/active-files`
      debugLog('Fetching from URL', filesUrl)
      const filesResponse = await fetch(filesUrl)
      if (!filesResponse.ok) throw new Error(`Failed to fetch active files: ${filesResponse.status} ${filesResponse.statusText}`)
      const filesData = await filesResponse.json()
      debugLog('Files data received', filesData)
      const kbUrl = `${API_BASE_URL}/document-context/knowledge-bases`
      debugLog('Fetching from URL', kbUrl)
      const kbResponse = await fetch(kbUrl)
      if (!kbResponse.ok) throw new Error(`Failed to fetch knowledge bases: ${kbResponse.status} ${kbResponse.statusText}`)
      const kbData = await kbResponse.json()
      debugLog('KB data received', kbData)
      setActiveFiles(filesData)
      setKnowledgeBases(kbData)
    } catch (err) {
      console.error("Error fetching document context:", err)
      setStudioError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    debugLog('Component mounted')
    fetchDocumentContext()
    const intervalId = setInterval(() => {
      debugLog('Auto refresh triggered')
      fetchDocumentContext()
    }, 10000)
    return () => {
      debugLog('Component unmounting')
      clearInterval(intervalId)
    }
  }, [])

  // ChatInterface logic
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const resetChat = async () => {
    try {
      await fetch(`${CHAT_API_BASE_URL}/reset/`, { method: "POST" })
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: "Chat has been reset. I'm ready to help with new documents!",
          timestamp: new Date(),
          type: "text",
        },
      ])
      setChatError(null)
    } catch (err) {
      console.error("Error resetting chat:", err)
      setChatError(err instanceof Error ? err.message : "Failed to reset chat")
    }
  }

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setIsProcessingFiles(true)
    setChatError(null)
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
    const formData = new FormData()
    Array.from(files).forEach((file) => {
      formData.append("files", file)
    })
    try {
      const response = await fetch(`${CHAT_API_BASE_URL}/upload-files/`, { method: "POST", body: formData, })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to upload files")
      }
      const result = await response.json()
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
      setChatError(err instanceof Error ? err.message : "Failed to upload files")
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

  const sendQuestion = async (question: string) => {
    if (!question.trim() || isChatLoading) return;
    setIsChatLoading(true);
    setChatError(null);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
      timestamp: new Date(),
      type: "text",
    };
    setMessages((prev) => [...prev, userMessage]);
    await UserActivity.askQuestion(question);
    try {
      const response = await fetch(`${CHAT_API_BASE_URL}/ask-question/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      const sources: Source[] = data.sources?.map((source: any) => ({
        title: `${source.source} (Page ${source.page_number})`,
        content: source.content,
        relevance: 0.9,
      })) || []
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
      setChatError(err instanceof Error ? err.message : "Failed to get answer")
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
      setIsChatLoading(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isChatLoading) return
    const question = input
    setInput("")
    await sendQuestion(question)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    uploadFiles(event.target.files)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Layout: flex for desktop, stacked for mobile
  return (
    <div className="flex flex-col md:flex-row h-full w-full">
      {/* ChatInterface (now on the left) */}
      <div className="md:w-2/3 w-full flex flex-col h-full">
        <div className="flex flex-col h-full content-layer rounded-lg shadow-lg">
          <div className="flex justify-between items-center p-2 border-b border-white/10 dark:border-gray-700/10">
            <h2 className="text-lg font-semibold">Alif Chat</h2>
            <Button variant="outline" size="sm" onClick={resetChat} title="Reset chat" className="bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70">
              <Trash2 className="h-4 w-4 mr-1" /> Reset
            </Button>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {chatError && (
                <Card className="p-2 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200">
                  <p className="text-sm">{chatError}</p>
                </Card>
              )}
              {messages.map((message) => (
                <Card key={message.id} className={`p-4 ${message.role === "user" ? "ml-12 bg-blue-600/90 dark:bg-blue-600/90 text-white backdrop-blur-sm" : "mr-12 card-gradient"}`}>
                  <div className={`prose ${message.role === "user" ? "prose-invert" : "dark:prose-invert"} max-w-none`}>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-4">
                      <Button variant="ghost" size="sm" onClick={() => setExpandedSources(expandedSources === message.id ? null : message.id)} className={`text-xs flex items-center ${message.role === "user" ? "text-white hover:bg-blue-700" : "dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
                        <BookOpen className="h-4 w-4 mr-1" />
                        {expandedSources === message.id ? (<ChevronUp className="h-4 w-4 mr-1" />) : (<ChevronDown className="h-4 w-4 mr-1" />)}
                        Sources ({message.sources.length})
                      </Button>
                      {expandedSources === message.id && (
                        <div className="mt-2 space-y-2">
                          {message.sources.map((source, index) => (
                            <div key={index} className={`text-sm p-2 rounded ${message.role === "user" ? "bg-blue-700 text-white" : "bg-gray-200 dark:bg-gray-700 text-foreground"}`}>
                              <div className="font-medium">{source.title}</div>
                              <div className="mt-1 opacity-70">{source.content}</div>
                              <div className="mt-1 text-xs">Relevance: {(source.relevance * 100).toFixed(0)}%</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div className={`text-xs mt-2 ${message.role === "user" ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>{message.timestamp.toLocaleTimeString()}</div>
                  {message.attachments?.map((attachment, index) => (
                    <div key={index} className="mt-2">
                      {attachment.type === "image" ? (
                        <div className="relative">
                          <img src={attachment.url || "/placeholder.svg"} alt={attachment.name} className="max-h-64 rounded object-contain" />
                          <div className={`mt-1 text-sm ${message.role === "user" ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>{attachment.name} ({formatFileSize(attachment.size || 0)})</div>
                        </div>
                      ) : (
                        <div className={`flex items-center gap-2 text-sm ${message.role === "user" ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>
                          <FileText className="h-4 w-4" />
                          <span>{attachment.name}</span>
                          {attachment.size && <span className="opacity-70">({formatFileSize(attachment.size)})</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </Card>
              ))}
              <div ref={messagesEndRef}/>
              {(isChatLoading || isProcessingFiles) && (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-4 border-t border-white/10 dark:border-gray-700/10">
            <div className="flex gap-2">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.txt,.pptx" multiple />
              <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} title="Upload files" disabled={isProcessingFiles || isChatLoading} className="bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your documents..." className="flex-1 min-h-[44px] max-h-32 input-gradient" disabled={isChatLoading} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
              <Button onClick={handleSend} disabled={!input.trim() || isChatLoading || isProcessingFiles} className="bg-blue-600/90 hover:bg-blue-600 transition-colors duration-200">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* StudioPanel (Document Context, now on the right) */}
      <div className="md:w-1/3 w-full border-l border-white/20 dark:border-gray-700/20 bg-background md:order-none order-last">
        <Card className="card-gradient p-4 h-full">
          <div className="flex flex-col mb-4">
            <h3 className="text-lg font-medium mb-3">Document Context</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={forceRefresh} disabled={isRefreshing} className="h-8 flex items-center" title="Force refresh from vector DB">
                <RotateCw className="h-4 w-4 mr-1.5" />
                <span className="text-xs">Force Refresh</span>
              </Button>
              <Button variant="outline" size="sm" onClick={createTestData} className="h-8 flex items-center" title="Create test data (debug only)">
                <Bug className="h-4 w-4 mr-1.5" />
                <span className="text-xs">Debug</span>
              </Button>
              <Button variant="outline" size="sm" onClick={resetContext} disabled={isClearing} className="h-8 flex items-center" title="Clear document context">
                <Trash2 className="h-4 w-4 mr-1.5" />
                <span className="text-xs">Clear</span>
              </Button>
              <Button variant="outline" size="sm" onClick={refreshContext} disabled={isRefreshing} className="h-8 w-8 p-0 flex items-center justify-center ml-auto" title="Refresh context">
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="sr-only">Refresh</span>
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            {studioError && (
              <div className="p-2 rounded bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm flex items-start">
                <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <p>{studioError}</p>
              </div>
            )}
            <div>
              <h4 className="font-medium mb-2">Active Files</h4>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : activeFiles.length > 0 ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {activeFiles.map((file) => (
                    <div key={file.id} className="flex items-start p-2 bg-white/20 dark:bg-gray-800/40 rounded text-sm">
                      {getFileIcon(file.type)}
                      <div className="overflow-hidden">
                        <p className="truncate font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{file.page_count} page{file.page_count !== 1 ? 's' : ''} • {formatFileSize(file.size)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No files in context</div>
              )}
            </div>
            <div>
              <h4 className="font-medium mb-2">Knowledge Base</h4>
              {isLoading ? (
                <Skeleton className="h-6 w-full" />
              ) : knowledgeBases.length > 0 ? (
                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                  {knowledgeBases.map((kb) => (
                    <div key={kb.id} className="flex items-start p-2 bg-white/20 dark:bg-gray-800/40 rounded text-sm">
                      <Database className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{kb.name}</p>
                        <p className="text-xs text-muted-foreground">{kb.document_count} document{kb.document_count !== 1 ? 's' : ''}</p>
                        {kb.description && (<p className="text-xs mt-1">{kb.description}</p>)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No knowledge base connected</div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 