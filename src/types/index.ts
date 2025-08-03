// 文件夹类型
export interface Folder {
  id: string
  name: string
  parentId: string | null
  isParent: boolean
  createdAt: string
  updatedAt: string
  children?: Folder[]
}

// 文件类型
export interface File {
  id: string
  name: string
  originalName: string
  size: number
  type: string
  mimeType: string
  folderId: string
  uploadedAt: string
  updatedAt: string
  url: string
  thumbnailUrl?: string
  tags: string[]
}

// 上传文件状态
export interface UploadFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
  folderId?: string
}

// 用户类型
export interface User {
  id: string
  username: string
  email: string
  userCode: string
  avatar?: string
  role: 'admin' | 'user'
  createdAt: string
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 分页类型
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// 搜索参数
export interface SearchParams {
  query?: string
  type?: string
  fileType?: string
  folderId?: string
  sortBy?: 'name' | 'size' | 'uploadedAt' | 'relevance'
  sortOrder?: 'asc' | 'desc'
  dateRange?: string
  sizeRange?: string
  page?: number
  limit?: number
}

// 文件预览类型
export interface FilePreview {
  id: string
  name: string
  type: string
  url: string
  canPreview: boolean
}

// 主题类型
export type Theme = 'light' | 'dark' | 'system'

// 视图模式
export type ViewMode = 'grid' | 'list'

// 文件操作类型
export type FileAction = 'download' | 'delete' | 'rename' | 'move' | 'share' | 'preview'

// 文件夹操作类型
export type FolderAction = 'create' | 'rename' | 'delete' | 'move'

// 通知类型
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  timestamp: string
}

// 统计数据类型
export interface Statistics {
  totalFiles: number
  totalSize: number
  totalFolders: number
  recentUploads: number
  storageUsed: number
  storageLimit: number
}

// 文件分享类型
export interface FileShare {
  id: string
  fileId: string
  shareUrl: string
  expiresAt?: string
  password?: string
  downloadCount: number
  maxDownloads?: number
  createdAt: string
}

// 系统设置类型
export interface SystemSettings {
  maxFileSize: number
  allowedFileTypes: string[]
  storageLimit: number
  enableFileSharing: boolean
  enableFileVersioning: boolean
  autoDeleteExpiredShares: boolean
}