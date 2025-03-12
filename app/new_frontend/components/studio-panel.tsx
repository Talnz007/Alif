"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, Database, AlertCircle, RefreshCw, Trash2, RotateCw, Bug } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"

// Define types for our API responses
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

// API endpoint constants - make sure this matches your actual API URL
const API_BASE_URL = "http://localhost:8000/api/v1"

export default function StudioPanel() {
  const [activeFiles, setActiveFiles] = useState<FileInfo[]>([])
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Debug log function
  const debugLog = (message: string, data?: any) => {
    console.log(`[StudioPanel] ${message}`, data || '')
  }

  // Function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "Unknown size"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Get file icon based on type
  const getFileIcon = (fileType: string) => {
    return <FileText className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
  }

  // Function to clear document context
  const resetContext = async () => {
    setIsClearing(true)
    try {
      debugLog('Clearing document context')

      const response = await fetch(`${API_BASE_URL}/document-context/clear`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`Failed to clear document context: ${response.status}`);
      }

      await fetchDocumentContext();

      toast({
        title: "Document context cleared",
        description: "All documents have been removed from context"
      });
    } catch (err) {
      console.error("Error clearing document context:", err);
      toast({
        title: "Error",
        description: "Failed to clear document context",
        variant: "destructive"
      });
    } finally {
      setIsClearing(false)
    }
  };

  // Function to force refresh from vector DB
  const forceRefresh = async () => {
    try {
      setIsRefreshing(true);

      // First check what's in the vector DB
      debugLog('Checking vector DB contents');
      const debugResponse = await fetch(`${API_BASE_URL}/document-context/debug-vector-db`);
      if (!debugResponse.ok) {
        throw new Error('Failed to debug vector DB');
      }

      const debugData = await debugResponse.json();
      debugLog("Vector DB debug data:", debugData);

      if (debugData.files_found && debugData.files_found.length > 0) {
        // If we have files, clear context and then sync
        await resetContext();
        await refreshContext();

        toast({
          title: "Force refresh completed",
          description: `Found ${debugData.files_found.length} files in vector DB: ${debugData.files_found.join(', ')}`
        });
      } else {
        toast({
          title: "No files in vector DB",
          description: "The vector database does not contain any documents"
        });
      }
    } catch (err) {
      console.error("Force refresh failed:", err);
      toast({
        title: "Refresh failed",
        description: "Could not force refresh document context",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Function to create test data (for debugging)
  const createTestData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/document-context/create-test-data`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error(`Error creating test data: ${response.statusText}`)
      }

      const result = await response.json()
      debugLog('Test data created', result)

      // Fetch the data to update the UI
      await fetchDocumentContext()

      toast({
        title: "Test data created",
        description: `Created ${result.files_created} files and ${result.knowledge_bases_created} knowledge bases`,
      })
    } catch (err) {
      console.error("Error creating test data:", err)
      toast({
        title: "Error",
        description: `Failed to create test data: ${err instanceof Error ? err.message : 'Unknown error'}`,
        variant: "destructive",
      })
    }
  }

  // Function to refresh data
  const refreshContext = async () => {
    setIsRefreshing(true)
    try {
      debugLog('Triggering context refresh')

      // Trigger a sync from chatbot
      const syncResponse = await fetch(`${API_BASE_URL}/document-context/sync-from-chatbot`, {
        method: 'POST'
      })

      if (!syncResponse.ok) {
        throw new Error(`Sync failed with status: ${syncResponse.status} ${syncResponse.statusText}`)
      }

      const syncResult = await syncResponse.json()
      debugLog('Sync result', syncResult)

      // Then fetch the updated data
      await fetchDocumentContext()

      toast({
        title: "Context refreshed",
        description: `Updated with ${syncResult.files_synced} files and ${syncResult.knowledge_bases_synced} knowledge bases`,
      })
    } catch (err) {
      console.error("Error refreshing context:", err)
      toast({
        title: "Refresh failed",
        description: "Could not refresh document context. See console for details.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Load document context data
  async function fetchDocumentContext() {
    setIsLoading(true)
    setError(null)

    try {
      debugLog('Fetching document context data')

      // Fetch active files
      const filesUrl = `${API_BASE_URL}/document-context/active-files`
      debugLog('Fetching from URL', filesUrl)

      const filesResponse = await fetch(filesUrl)
      if (!filesResponse.ok) {
        throw new Error(`Failed to fetch active files: ${filesResponse.status} ${filesResponse.statusText}`)
      }

      const filesData = await filesResponse.json()
      debugLog('Files data received', filesData)

      // Fetch knowledge bases
      const kbUrl = `${API_BASE_URL}/document-context/knowledge-bases`
      debugLog('Fetching from URL', kbUrl)

      const kbResponse = await fetch(kbUrl)
      if (!kbResponse.ok) {
        throw new Error(`Failed to fetch knowledge bases: ${kbResponse.status} ${kbResponse.statusText}`)
      }

      const kbData = await kbResponse.json()
      debugLog('KB data received', kbData)

      setActiveFiles(filesData)
      setKnowledgeBases(kbData)
    } catch (err) {
      console.error("Error fetching document context:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    debugLog('Component mounted')
    fetchDocumentContext()

    // Set up an interval to refresh context data
    const intervalId = setInterval(() => {
      debugLog('Auto refresh triggered')
      fetchDocumentContext()
    }, 10000) // every 10 seconds

    return () => {
      debugLog('Component unmounting')
      clearInterval(intervalId)
    }
  }, [])

  return (
    <div className="h-full p-4 content-layer-darker border-l border-white/20 dark:border-gray-700/20">
      <Card className="card-gradient p-4">
        {/* FIXED HEADER WITH IMPROVED BUTTON ALIGNMENT */}
        <div className="flex flex-col mb-4">
          <h3 className="text-lg font-medium mb-3">Document Context</h3>

          {/* Button group with consistent styling */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={forceRefresh}
              disabled={isRefreshing}
              className="h-8 flex items-center"
              title="Force refresh from vector DB"
            >
              <RotateCw className="h-4 w-4 mr-1.5" />
              <span className="text-xs">Force Refresh</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={createTestData}
              className="h-8 flex items-center"
              title="Create test data (debug only)"
            >
              <Bug className="h-4 w-4 mr-1.5" />
              <span className="text-xs">Debug</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={resetContext}
              disabled={isClearing}
              className="h-8 flex items-center"
              title="Clear document context"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              <span className="text-xs">Clear</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={refreshContext}
              disabled={isRefreshing}
              className="h-8 w-8 p-0 flex items-center justify-center ml-auto"
              title="Refresh context"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh</span>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="p-2 rounded bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm flex items-start">
              <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
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
                  <div
                    key={file.id}
                    className="flex items-start p-2 bg-white/20 dark:bg-gray-800/40 rounded text-sm"
                  >
                    {getFileIcon(file.type)}
                    <div className="overflow-hidden">
                      <p className="truncate font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.page_count} page{file.page_count !== 1 ? 's' : ''} • {formatFileSize(file.size)}
                      </p>
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
                  <div
                    key={kb.id}
                    className="flex items-start p-2 bg-white/20 dark:bg-gray-800/40 rounded text-sm"
                  >
                    <Database className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{kb.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {kb.document_count} document{kb.document_count !== 1 ? 's' : ''}
                      </p>
                      {kb.description && (
                        <p className="text-xs mt-1">{kb.description}</p>
                      )}
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
  )
}