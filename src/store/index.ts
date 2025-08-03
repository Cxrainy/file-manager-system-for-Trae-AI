import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Folder, File, UploadFile, User, Theme, ViewMode, Notification } from '@/types'

// 导出预览设置store
export { usePreviewStore } from './previewStore'

// 主题状态
interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>()((
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'theme-storage',
    }
  )
))

// 用户状态
interface UserState {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  logout: () => void
}

export const useUserStore = create<UserState>()((
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'user-storage',
    }
  )
))

// 文件夹状态
interface FolderState {
  folders: Folder[]
  currentFolder: Folder | null
  selectedFolderId: string | null
  setFolders: (folders: Folder[]) => void
  setCurrentFolder: (folder: Folder | null) => void
  setSelectedFolderId: (id: string | null) => void
  addFolder: (folder: Folder) => void
  updateFolder: (id: string, updates: Partial<Folder>) => void
  deleteFolder: (id: string) => void
}

export const useFolderStore = create<FolderState>((set, get) => ({
  folders: [],
  currentFolder: null,
  selectedFolderId: null,
  setFolders: (folders) => set({ folders }),
  setCurrentFolder: (folder) => set({ currentFolder: folder }),
  setSelectedFolderId: (id) => set({ selectedFolderId: id }),
  addFolder: (folder) => set((state) => ({ folders: [...state.folders, folder] })),
  updateFolder: (id, updates) => set((state) => ({
    folders: state.folders.map(folder => 
      folder.id === id ? { ...folder, ...updates } : folder
    )
  })),
  deleteFolder: (id) => set((state) => ({
    folders: state.folders.filter(folder => folder.id !== id)
  })),
}))

// 文件状态
interface FileState {
  files: File[]
  selectedFiles: string[]
  viewMode: ViewMode
  setFiles: (files: File[]) => void
  setSelectedFiles: (ids: string[]) => void
  setViewMode: (mode: ViewMode) => void
  addFile: (file: File) => void
  updateFile: (id: string, updates: Partial<File>) => void
  deleteFile: (id: string) => void
  deleteFiles: (ids: string[]) => void
}

export const useFileStore = create<FileState>()((
  persist(
    (set) => ({
      files: [],
      selectedFiles: [],
      viewMode: 'grid',
      setFiles: (files) => set({ files }),
      setSelectedFiles: (ids) => set({ selectedFiles: ids }),
      setViewMode: (mode) => set({ viewMode: mode }),
      addFile: (file) => set((state) => ({ files: [...state.files, file] })),
      updateFile: (id, updates) => set((state) => ({
        files: state.files.map(file => 
          file.id === id ? { ...file, ...updates } : file
        )
      })),
      deleteFile: (id) => set((state) => ({
        files: state.files.filter(file => file.id !== id),
        selectedFiles: state.selectedFiles.filter(fileId => fileId !== id)
      })),
      deleteFiles: (ids) => set((state) => ({
        files: state.files.filter(file => !ids.includes(file.id)),
        selectedFiles: state.selectedFiles.filter(fileId => !ids.includes(fileId))
      })),
    }),
    {
      name: 'file-storage',
      partialize: (state) => ({ viewMode: state.viewMode }),
    }
  )
))

// 上传状态
interface UploadState {
  uploadFiles: UploadFile[]
  isUploading: boolean
  addUploadFile: (file: UploadFile) => void
  updateUploadFile: (id: string, updates: Partial<UploadFile>) => void
  removeUploadFile: (id: string) => void
  clearUploadFiles: () => void
  setIsUploading: (uploading: boolean) => void
}

export const useUploadStore = create<UploadState>((set) => ({
  uploadFiles: [],
  isUploading: false,
  addUploadFile: (file) => set((state) => ({ 
    uploadFiles: [...state.uploadFiles, file] 
  })),
  updateUploadFile: (id, updates) => set((state) => ({
    uploadFiles: state.uploadFiles.map(file => 
      file.id === id ? { ...file, ...updates } : file
    )
  })),
  removeUploadFile: (id) => set((state) => ({
    uploadFiles: state.uploadFiles.filter(file => file.id !== id)
  })),
  clearUploadFiles: () => set({ uploadFiles: [] }),
  setIsUploading: (uploading) => set({ isUploading: uploading }),
}))

// 通知状态
interface NotificationState {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (notification) => {
    const id = Math.random().toString(36).substr(2, 9)
    const timestamp = new Date().toISOString()
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id, timestamp }]
    }))
    
    // 自动移除通知
    if (notification.duration !== 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }))
      }, notification.duration || 5000)
    }
  },
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  clearNotifications: () => set({ notifications: [] }),
}))

// UI状态
interface UIState {
  sidebarCollapsed: boolean
  loading: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  setLoading: (loading: boolean) => void
}

export const useUIStore = create<UIState>()((
  persist(
    (set) => ({
      sidebarCollapsed: false,
      loading: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
))