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

      // Modified to avoid API calls since they're not working
      fetchFiles: async () => {
        console.log("File API is currently disabled");
        // Return empty array instead of making API call
        set({ files: [], isLoading: false, error: null });
        return;
      },

      uploadFile: async (file: File) => {
        console.log("File upload is currently disabled");
        // Mock response instead of making API call
        return ;
      },

      deleteFile: async (fileId: string) => {
        console.log("File deletion is currently disabled");
        // Do nothing instead of making API call
        return;
      },

      getFileContent: async (fileId: string) => {
        console.log("File content fetching is currently disabled");
        // Return empty content
        return "";
      }
    }),
    {
      name: 'file-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ files: state.files }),
    }
  )
)