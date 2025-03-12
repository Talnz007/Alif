"use client"
import { Book, FileText, Trophy, User, Settings, LogOut, MessageSquare, FileIcon as FilePdf, FileAudio, Medal, ChevronLeft, ChevronRight } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useFileStore, FileInfo } from "@/lib/file-store"
import { useEffect, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from 'date-fns'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AlifLogo } from "@/components/ui/logo"
import Image from "next/image"
import { useAuth } from '@/contexts/auth-context';



export default function Sidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { files, fetchFiles, selectFile } = useFileStore()
  const [isExpanded, setIsExpanded] = useState(true)

  const isActive = (path: string) => pathname === path

  // Load files when component mounts
  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  // Sort files by most recent first
  const recentFiles = [...files].sort((a, b) => {
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  }).slice(0, 5)  // Show only the 5 most recent files


  const { signOut } = useAuth();

  const getFileIcon = (file: FileInfo) => {
    switch (file.type) {
      case "pdf":
        return <FilePdf className="h-4 w-4" />
      case "doc":
        return <FileText className="h-4 w-4" />
      case "audio":
        return <FileAudio className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getGradientByType = (type: string) => {
    switch (type) {
      case "pdf":
        return "from-red-400 to-red-600"
      case "doc":
        return "from-blue-400 to-blue-600"
      case "audio":
        return "from-green-400 to-green-600"
      default:
        return "from-gray-400 to-gray-600"
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getTimeSince = (dateString: string): string => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Unknown'
    }
  }

  const menuItems = [
    {
      name: "Study Assistant",
      icon: Book,
      path: "/study-assistant",
      tooltip: "Generate quizzes, flashcards, and summaries",
    },
    { name: "Assignments", icon: FileText, path: "/assignments", tooltip: "AI-assisted writing & feedback" },
    { name: "Progress", icon: Trophy, path: "/progress", tooltip: "View leaderboard, study streaks, and achievements" },
    { name: "Profile", icon: User, path: "/profile", tooltip: "Manage your profile" },
  ]

  return (
    <div className="relative flex h-full">
      <aside
          className={cn(
              "h-screen content-layer-darker p-4 flex flex-col border-r border-white/20 dark:border-gray-700/20 transition-all duration-300",
              isExpanded ? "w-64" : "w-20"
          )}
      >
        <div className={cn(
            "flex mb-8",
            isExpanded ? "items-center justify-between" : "flex-col items-center"
        )}>
          {isExpanded ? (
              <div className="flex items-center">
                {/* Larger logo that replaces the text, fixed width class */}
                <AlifLogo className="h-20 w-auto"/>
              </div>
          ) : (
              <AlifLogo className="h-20 w-auto"/>
          )}

          <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 rounded-full", isExpanded ? "ml-2" : "mt-4")}
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isExpanded ? (
                <ChevronLeft className="h-4 w-4"/>
            ) : (
                <ChevronRight className="h-4 w-4"/>
            )}
          </Button>
        </div>
        <nav className="flex-grow">
          <div className="mb-6">
            {isExpanded && (
                <div className="px-2 mb-4">
                  <h2 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Main</h2>
                </div>
            )}
            <ul className="space-y-1">
              <li>
                <Link
                    href="/chat"
                    className={cn(
                        "flex items-center p-2 text-gray-700 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-800/50 rounded-lg transition-all duration-200 group",
                        pathname === "/chat" ? "bg-blue-600/20 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400" : "",
                        isExpanded ? "" : "justify-center"
                    )}
                    title="Alif Chat"
                >
                  <div
                      className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg transition-transform group-hover:scale-110">
                    <MessageSquare className="h-4 w-4"/>
                  </div>
                  {isExpanded && (
                      <span className="font-medium ml-3">Alif Chat</span>
                  )}
                  {isExpanded && pathname === "/chat" && (
                      <span
                          className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                      <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"/>
                    </span>
                  )}
                </Link>
              </li>
            </ul>
          </div>

          <div className="mb-6">
            {isExpanded && (
                <div className="px-2 mb-4">
                  <h2 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Tools</h2>
                </div>
            )}
            <ul className="space-y-1">
              <li>
                <Link
                    href="/study-assistant"
                    className={cn(
                        "flex items-center p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200 group",
                        pathname === "/study-assistant" ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" : "",
                        isExpanded ? "" : "justify-center"
                    )}
                    title="Study Assistant"
                >
                  <div className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-lg transition-transform group-hover:scale-110",
                      isExpanded ? "mr-3" : ""
                  )}>
                    <Book className="h-4 w-4"/>
                  </div>
                  {isExpanded && <span className="font-medium">Study Assistant</span>}
                </Link>
              </li>
              <li>
                <Link
                    href="/assignments"
                    className={cn(
                        "flex items-center p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200 group",
                        pathname === "/assignments" ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" : "",
                        isExpanded ? "" : "justify-center"
                    )}
                    title="Assignments"
                >
                  <div className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg transition-transform group-hover:scale-110",
                      isExpanded ? "mr-3" : ""
                  )}>
                    <FileText className="h-4 w-4"/>
                  </div>
                  {isExpanded && <span className="font-medium">Assignments</span>}
                </Link>
              </li>
              <li>
                <Link
                    href="/progress"
                    className={cn(
                        "flex items-center p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200 group",
                        pathname === "/progress" ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" : "",
                        isExpanded ? "" : "justify-center"
                    )}
                    title="Progress"
                >
                  <div className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg transition-transform group-hover:scale-110",
                      isExpanded ? "mr-3" : ""
                  )}>
                    <Trophy className="h-4 w-4"/>
                  </div>
                  {isExpanded && <span className="font-medium">Progress</span>}
                </Link>
              </li>
              {/* NEW: Badges Link */}
              <li>
                <Link
                    href="/badges"
                    className={cn(
                        "flex items-center p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200 group",
                        pathname === "/badges" ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" : "",
                        isExpanded ? "" : "justify-center"
                    )}
                    title="Badges"
                >
                  <div className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg transition-transform group-hover:scale-110",
                      isExpanded ? "mr-3" : ""
                  )}>
                    <Medal className="h-4 w-4"/>
                  </div>
                  {isExpanded && <span className="font-medium">Badges</span>}
                </Link>
              </li>
            </ul>
          </div>

          {isExpanded && (
              <div>
                <div className="flex items-center justify-between px-2 mb-4">
                  <h2 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Recent Files
                  </h2>
                  <Link href="/assignments" className="text-xs text-blue-500 hover:underline">
                    View All
                  </Link>
                </div>

                <ScrollArea className="h-48">
                  <ul className="space-y-1">
                    {recentFiles.length === 0 ? (
                        <li className="px-2 py-4 text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">No files yet</p>
                          <Link
                              href="/files"
                              className="text-xs text-blue-500 hover:underline mt-1 inline-block"
                          >
                            Upload files
                          </Link>
                        </li>
                    ) : (
                        recentFiles.map((file) => (
                            <li key={file.id}>
                              <button
                                  className="w-full flex items-center p-2 text-gray-700 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-800/50 rounded-lg transition-all duration-200 group"
                                  onClick={() => {
                                    selectFile(file.id)
                                    // Could navigate to the file details page if you have one
                                  }}
                              >
                                <div
                                    className={`mr-3 flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br ${getGradientByType(file.type)} text-white shadow-lg transition-transform group-hover:scale-110`}>
                                  {getFileIcon(file)}
                                </div>
                                <div className="flex-1 truncate text-left">
                                  <span className="font-medium block truncate">{file.name}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(file.size)} • {getTimeSince(file.updated_at)}
                            </span>
                                </div>
                              </button>
                            </li>
                        ))
                    )}
                  </ul>
                </ScrollArea>
              </div>
          )}
        </nav>

        <div className="mt-auto">
          {isExpanded ? (
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">Dark Mode</span>
                <Switch checked={theme === "dark"}
                        onCheckedChange={() => setTheme(theme === "dark" ? "light" : "dark")}/>
              </div>
          ) : (
              <div className="flex justify-center mb-4">
                <Switch checked={theme === "dark"}
                        onCheckedChange={() => setTheme(theme === "dark" ? "light" : "dark")}/>
              </div>
          )}

          <Link
              href="/settings"
              className={cn(
                  "flex items-center p-2 text-gray-700 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-800/50 rounded-lg transition-all duration-200",
                  isActive("/settings") ? "bg-white/20 dark:bg-gray-800/50" : "",
                  isExpanded ? "" : "justify-center"
              )}
              title="Settings"
          >
            <Settings className={cn("w-5 h-5", isExpanded ? "mr-3" : "")}/>
            {isExpanded && "Settings"}
          </Link>

          <button
              className={cn(
                  "flex items-center p-2 text-red-600 hover:bg-white/10 dark:hover:bg-gray-800/50 rounded-lg mt-2 w-full transition-all duration-200",
                  isExpanded ? "" : "justify-center"
              )}
              onClick={signOut} // Use the real signOut function from context
              title="Sign Out"
          >
            <LogOut className={cn("w-5 h-5", isExpanded ? "mr-3" : "")}/>
            {isExpanded && "Sign Out"}
          </button>
        </div>
      </aside>
    </div>
  )
}