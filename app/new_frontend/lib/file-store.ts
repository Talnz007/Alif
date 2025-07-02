import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface FileInfo {
  id: string
  name: string
  type: string
  size: number
  created_at: string
  updated_at: string
  content?: string
  url?: string
}

interface FileState {
  files: FileInfo[]
  selectedFile: FileInfo | null
  isLoading: boolean
  error: string | null

  // Methods
  setFiles: (files: FileInfo[]) => void
  addFile: (file: FileInfo) => void
  removeFile: (fileId: string) => void
  selectFile: (fileId: string | null) => void
  clearSelectedFile: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  fetchFiles: () => Promise<void>
  uploadFile: (file: File) => Promise<void>
  deleteFile: (fileId: string) => Promise<void>
  getFileContent: (fileId: string) => Promise<string>
}

// Add this to fix SSR issues
const isBrowser = typeof window !== 'undefined';

// Create a custom storage object for sessionStorage with SSR check
const sessionStorage = {
  getItem: (name: string) => {
    try {
      if (!isBrowser) return null;
      const str = window.sessionStorage.getItem(name);
      if (!str) return null;
      return JSON.parse(str);
    } catch (e) {
      console.error('Error reading from sessionStorage', e);
      return null;
    }
  },
  setItem: (name: string, value: any) => {
    try {
      if (!isBrowser) return;
      window.sessionStorage.setItem(name, JSON.stringify(value));
    } catch (e) {
      console.error('Error writing to sessionStorage', e);
    }
  },
  removeItem: (name: string) => {
    try {
      if (!isBrowser) return;
      window.sessionStorage.removeItem(name);
    } catch (e) {
      console.error('Error removing from sessionStorage', e);
    }
  },
};

export const useFileStore = create<FileState>()(
  persist(
    (set, get) => ({
      files: [],
      selectedFile: null,
      isLoading: false,
      error: null,

      // Rest of the implementation remains unchanged...
      setFiles: (files) => set({ files }),
      addFile: (file) => set((state) => ({ files: [...state.files, file] })),
      removeFile: (fileId) => set((state) => ({
        files: state.files.filter(f => f.id !== fileId),
        selectedFile: state.selectedFile?.id === fileId ? null : state.selectedFile
      })),
      selectFile: (fileId) => {
        if (!fileId) {
          set({ selectedFile: null })
          return
        }

        const file = get().files.find(f => f.id === fileId)
        if (file) {
          set({ selectedFile: file })
        }
      },
      clearSelectedFile: () => set({ selectedFile: null }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      fetchFiles: async () => {
        const { setLoading, setFiles, setError } = get()
        setLoading(true)
        setError(null)

        try {
          const response = await fetch("http://localhost:8000/files/list")

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
          }

          const data = await response.json()
          setFiles(data.files || [])
        } catch (error) {
          console.error("Error loading files:", error)
          setError(`Failed to load files: ${error instanceof Error ? error.message : String(error)}`)
        } finally {
          setLoading(false)
        }
      },

      uploadFile: async (file: File) => {
        const { setLoading, fetchFiles, setError } = get()
        setLoading(true)
        setError(null)

        try {
          const formData = new FormData()
          formData.append("file", file)

          const response = await fetch("http://localhost:8000/files/upload", {
            method: "POST",
            body: formData
          })

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
          }

          await fetchFiles()
          return await response.json()
        } catch (error) {
          console.error("Error uploading file:", error)
          setError(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`)
          throw error
        } finally {
          setLoading(false)
        }
      },

      deleteFile: async (fileId: string) => {
        const { setLoading, fetchFiles, setError } = get()
        setLoading(true)
        setError(null)

        try {
          const response = await fetch(`http://localhost:8000/files/${fileId}`, {
            method: "DELETE"
          })

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
          }

          await fetchFiles()
        } catch (error) {
          console.error("Error deleting file:", error)
          setError(`Failed to delete file: ${error instanceof Error ? error.message : String(error)}`)
          throw error
        } finally {
          setLoading(false)
        }
      },

      getFileContent: async (fileId: string) => {
        const { files, setLoading, setError } = get()
        const file = files.find(f => f.id === fileId)

        if (!file) {
          throw new Error(`File not found: ${fileId}`)
        }

        if (file.content) {
          return file.content
        }

        setLoading(true)
        setError(null)

        try {
          const response = await fetch(`http://localhost:8000/files/${fileId}/content`)

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
          }

          const data = await response.json()
          const content = data.content

          set({
            files: files.map(f =>
              f.id === fileId ? { ...f, content } : f
            ),
            selectedFile: file.id === get().selectedFile?.id
              ? { ...file, content }
              : get().selectedFile
          })

          return content
        } catch (error) {
          console.error("Error getting file content:", error)
          setError(`Failed to get file content: ${error instanceof Error ? error.message : String(error)}`)
          throw error
        } finally {
          setLoading(false)
        }
      }
    }),
    {
      name: 'file-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ files: state.files }),
    }
  )
)