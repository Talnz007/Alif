"use client"

import { useState, useEffect, useRef } from "react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import {
  FileText,
  FileAudio,
  FileIcon as FilePdf,
  Book,
  Trash,
  WalletCardsIcon as Cards,
  Upload,
  Loader2,
  FileQuestion,
  AlertTriangle
} from "lucide-react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useFileStore } from "@/lib/file-store"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"

export default function FileManager() {
  const { toast } = useToast()
  const router = useRouter()

  const {
    files,
    isLoading,
    error: storeError,
    fetchFiles,
    uploadFile,
    deleteFile,
    selectFile,
    getFileContent
  } = useFileStore()

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<{id: string, name: string} | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [stats, setStats] = useState({
    total_files: 0,
    pdf_count: 0,
    doc_count: 0,
    audio_count: 0,
    other_count: 0
  })

  // Load files when component mounts
  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  // Calculate stats when files change
  useEffect(() => {
    const newStats = {
      total_files: files.length,
      pdf_count: files.filter(f => f.type === "pdf").length,
      doc_count: files.filter(f => f.type === "doc").length,
      audio_count: files.filter(f => f.type === "audio").length,
      other_count: files.filter(f => !["pdf", "doc", "audio"].includes(f.type)).length
    }
    setStats(newStats)
  }, [files])

  // Set error message from store
  useEffect(() => {
    if (storeError) {
      setErrorMessage(storeError)
    }
  }, [storeError])

  const handleFileSelection = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setIsUploading(true)
      setErrorMessage(null)

      try {
        await uploadFile(file)
        toast({
          title: "File uploaded",
          description: `${file.name} has been uploaded successfully.`,
        })
      } catch (error) {
        setErrorMessage(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`)
        toast({
          title: "Error",
          description: "Failed to upload file. Please try again.",
          variant: "destructive"
        })
      } finally {
        setIsUploading(false)
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    }
  }

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return

    try {
      await deleteFile(fileToDelete.id)
      toast({
        title: "File deleted",
        description: `${fileToDelete.name} has been deleted.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file. Please try again.",
        variant: "destructive"
      })
    } finally {
      setFileToDelete(null)
    }
  }

  const handleAction = async (action: string, file: any) => {
    try {
      // First, fetch and select the file to make content available
      await getFileContent(file.id)
      selectFile(file.id)

      // Navigate based on the action
      switch(action) {
        case "summarize":
          router.push("/study-assistant?tab=summarize")
          break
        case "generate-quiz":
          router.push("/study-assistant?tab=quiz")
          break
        case "create-flashcards":
          router.push("/study-assistant?tab=flashcards")
          break
        case "solve":
          router.push("/assignments?tab=solver")
          break
        default:
          toast({
            title: "Action not implemented",
            description: `The ${action} action is not yet implemented.`,
            variant: "destructive"
          })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} file. Please try again.`,
        variant: "destructive"
      })
    }
  }

  const FileIcon = ({ type }: { type: string }) => {
    switch (type) {
      case "pdf":
        return <FilePdf className="w-8 h-8 text-red-500" />
      case "doc":
        return <FileText className="w-8 h-8 text-blue-500" />
      case "audio":
        return <FileAudio className="w-8 h-8 text-green-500" />
      default:
        return <FileText className="w-8 h-8 text-gray-500" />
    }
  }

  // Format file size to human-readable string
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Format date to local date string
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch (e) {
      return "Unknown date"
    }
  }

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-xl shadow-lg h-full">
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              File Manager
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Manage and organize your study materials</p>
          </div>
          <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </motion.div>

        {/* File upload button */}
        <div className="mb-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.mp3,.wav"
          />
          <Button
            onClick={handleFileSelection}
            disabled={isUploading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" /> Upload File
              </>
            )}
          </Button>
        </div>

        {errorMessage && (
          <div className="p-4 mb-6 bg-red-100 border border-red-300 rounded-md flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-xl p-6 shadow-sm"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total_files}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Files</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/50 dark:to-pink-900/50 rounded-xl p-6 shadow-sm"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.pdf_count}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">PDF Documents</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/50 dark:to-teal-900/50 rounded-xl p-6 shadow-sm"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.doc_count}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Word Documents</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/50 dark:to-amber-900/50 rounded-xl p-6 shadow-sm"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.audio_count}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Audio Files</p>
            </div>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600 dark:text-gray-300">Loading files...</span>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center p-12 border border-dashed rounded-lg">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No files yet</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Upload your study materials to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file) => (
              <ContextMenu key={file.id}>
                <ContextMenuTrigger>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className={`p-6 rounded-xl hover:shadow-md transition-all cursor-pointer
                    ${
                      file.type === "pdf"
                        ? "bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/50 dark:to-pink-900/50"
                        : file.type === "doc"
                          ? "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50"
                          : "bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/50 dark:to-teal-900/50"
                    }
                    `}
                    onClick={() => selectFile(file.id)}
                  >
                    <div className="flex flex-col items-center">
                      <div className="mb-4">
                        <FileIcon type={file.type} />
                      </div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white text-center mb-2">{file.name}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {file.type.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {formatDate(file.created_at)}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                  </motion.div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => handleAction("summarize", file)} className="flex items-center">
                    <Book className="mr-2 h-4 w-4" /> Summarize with AI
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleAction("generate-quiz", file)} className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" /> Generate Quiz
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleAction("create-flashcards", file)} className="flex items-center">
                    <Cards className="mr-2 h-4 w-4" /> Create Flashcards
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleAction("solve", file)} className="flex items-center">
                    <FileQuestion className="mr-2 h-4 w-4" /> Solve Assignment
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    onClick={() => setFileToDelete({ id: file.id, name: file.name })}
                    className="flex items-center text-red-600 dark:text-red-400"
                  >
                    <Trash className="mr-2 h-4 w-4" /> Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        )}

        <AlertDialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete File</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{fileToDelete?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 text-white hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}