import axios from 'axios'
import type { ApiResponse, Folder, File, User, SearchParams, Statistics } from '@/types'

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 调试日志
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      data: config.data,
      headers: config.headers,
      hasToken: !!token
    })
    
    return config
  },
  (error) => {
    console.error('[API Request Error]', error)
    return Promise.reject(error)
  }
)

// 防止重复重定向的标志
let isRedirecting = false

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: response.data
    })
    return response.data
  },
  (error) => {
    // 对于认证验证请求，静默处理401错误
    if (error.response?.status === 401 && error.config?.url?.includes('/auth/verify')) {
      return Promise.reject({ silent: true, ...error.response?.data })
    }
    
    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      // 检查当前是否已经在登录页面，避免无限重定向
      if (window.location.pathname !== '/login' && !isRedirecting) {
        isRedirecting = true
        // 使用setTimeout避免与组件内的错误处理冲突
        setTimeout(() => {
          window.location.href = '/login'
        }, 100)
        // 重置重定向标志
        setTimeout(() => {
          isRedirecting = false
        }, 1000)
      }
    }
    // 保持错误对象的完整结构，以便前端组件能够正确处理
    return Promise.reject(error)
  }
)

// 用户相关API
export const userAPI = {
  // 登录
  login: (credentials: { email: string; password: string }): Promise<ApiResponse<{ user: User; token: string }>> => {
    return api.post('/auth/login', credentials)
  },
  
  // 注册
  register: (userData: { username: string; email: string; password: string }): Promise<ApiResponse<{ user: User; token: string }>> => {
    return api.post('/auth/register', userData)
  },
  
  // 获取当前用户信息
  getCurrentUser: (): Promise<ApiResponse<{ user: User }>> => {
    return api.get('/auth/me')
  },
  
  // 更新用户信息
  updateProfile: (userData: Partial<User>): Promise<ApiResponse<User>> => {
    return api.put('/auth/profile', userData)
  },
  
  // 修改密码
  changePassword: (data: { oldPassword: string; newPassword: string }): Promise<ApiResponse> => {
    return api.put('/auth/password', data)
  },
  
  // 验证token
  verifyToken: (): Promise<ApiResponse<{ user: User }>> => {
    return api.get('/auth/verify')
  },
  
  // 通过用户代码搜索用户
  searchUserByCode: (userCode: string): Promise<ApiResponse<{ user: User; friendshipStatus?: string }>> => {
    return api.post('/friends/search', { userCode })
  },
}

// 文件夹相关API
export const folderAPI = {
  // 获取所有文件夹
  getFolders: (): Promise<ApiResponse<Folder[]>> => {
    return api.get('/folders')
  },
  
  // 获取文件夹详情
  getFolder: (id: string): Promise<ApiResponse<Folder>> => {
    return api.get(`/folders/${id}`)
  },
  
  // 创建文件夹
  createFolder: (folderData: { name: string; parentId?: string }): Promise<ApiResponse<Folder>> => {
    return api.post('/folders', folderData)
  },
  
  // 更新文件夹
  updateFolder: (id: string, folderData: { name: string }): Promise<ApiResponse<Folder>> => {
    return api.put(`/folders/${id}`, folderData)
  },
  
  // 删除文件夹
  deleteFolder: (id: string): Promise<ApiResponse> => {
    return api.delete(`/folders/${id}`)
  },
  
  // 移动文件夹
  moveFolder: (id: string, parentId: string): Promise<ApiResponse<Folder>> => {
    return api.put(`/folders/${id}/move`, { parentId })
  },
}

// 文件相关API
export const fileAPI = {
  // 获取文件列表
  getFiles: (folderId?: string): Promise<ApiResponse<File[]>> => {
    const params = folderId ? { folderId } : {}
    return api.get('/files', { params })
  },
  
  // 获取文件详情
  getFile: (id: string): Promise<ApiResponse<File>> => {
    return api.get(`/files/${id}`)
  },
  
  // 上传文件
  uploadFile: (formData: FormData, onProgress?: (progress: number) => void): Promise<ApiResponse<File>> => {
    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
  },
  
  // 批量上传文件
  uploadFiles: (files: FormData[], onProgress?: (fileIndex: number, progress: number) => void): Promise<ApiResponse<File[]>> => {
    const uploadPromises = files.map((formData, index) => 
      fileAPI.uploadFile(formData, (progress) => onProgress?.(index, progress))
    )
    return Promise.all(uploadPromises).then(results => ({
      success: true,
      data: results.map(result => result.data!)
    }))
  },
  
  // 删除文件
  deleteFile: (id: string): Promise<ApiResponse> => {
    return api.delete(`/files/${id}`)
  },
  
  // 批量删除文件
  deleteFiles: (ids: string[]): Promise<ApiResponse> => {
    return api.delete('/files/batch', { data: { ids } })
  },
  
  // 重命名文件
  renameFile: (id: string, name: string): Promise<ApiResponse<File>> => {
    return api.put(`/files/${id}/rename`, { name })
  },
  
  // 移动文件
  moveFile: (id: string, folderId: string): Promise<ApiResponse<File>> => {
    return api.put(`/files/${id}/move`, { folderId })
  },
  
  // 批量移动文件
  moveFiles: (ids: string[], folderId: string): Promise<ApiResponse> => {
    return api.put('/files/batch/move', { ids, folderId })
  },
  
  // 下载文件
  downloadFile: (id: string): Promise<Blob> => {
    return api.get(`/files/${id}/download`, {
      responseType: 'blob',
    })
  },
  
  // 获取文件预览URL（带认证token）
  getPreviewUrl: (id: string): string => {
    const token = localStorage.getItem('token')
    const baseUrl = `${api.defaults.baseURL}/files/${id}/preview`
    return token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl
  },

  // 获取文件预览内容
  getPreviewContent: (id: string): Promise<string> => {
    return api.get(`/files/${id}/preview`, {
      responseType: 'text',
      transformResponse: [(data) => data] // 防止axios自动解析JSON
    })
  },
  
  // 搜索文件
  searchFiles: (params: SearchParams): Promise<ApiResponse<{ files: File[]; total: number }>> => {
    return api.get('/files/search', { params })
  },
}

// 统计相关API
export const statisticsAPI = {
  // 获取统计数据
  getStatistics: (): Promise<ApiResponse<Statistics>> => {
    return api.get('/statistics')
  },
  
  // 获取存储使用情况
  getStorageUsage: (): Promise<ApiResponse<{ used: number; total: number; percentage: number }>> => {
    return api.get('/statistics/storage')
  },
  
  // 获取文件类型分布
  getFileTypeDistribution: (): Promise<ApiResponse<{ type: string; count: number; size: number }[]>> => {
    return api.get('/statistics/file-types')
  },
  
  // 获取上传趋势
  getUploadTrend: (days: number = 30): Promise<ApiResponse<{ date: string; count: number; size: number }[]>> => {
    return api.get('/statistics/upload-trend', { params: { days } })
  },
  
  // 获取最近文件
  getRecentFiles: (limit: number = 10): Promise<ApiResponse<File[]>> => {
    return api.get('/statistics/recent-files', { params: { limit } })
  },
  
  // 获取热门文件类型
  getPopularTypes: (limit: number = 5): Promise<ApiResponse<{ type: string; count: number }[]>> => {
    return api.get('/statistics/popular-types', { params: { limit } })
  },
  
  // 获取文件夹统计
  getFolderStats: (): Promise<ApiResponse<{ id: string; name: string; isParent: boolean; fileCount: number; totalSize: number; parentId?: string }[]>> => {
    return api.get('/statistics/folder-stats')
  },
  
  // 获取活动统计
  getActivityStats: (days: number = 7): Promise<ApiResponse<{ uploads: number; foldersCreated: number; hourlyActivity: { hour: number; uploads: number }[] }>> => {
    return api.get('/statistics/activity', { params: { days } })
  },
  
  // 获取统计摘要
  getSummary: (): Promise<ApiResponse<{ totalFiles: number; totalFolders: number; totalSize: number; averageFileSize: number; largestFile?: File; latestFile?: File }>> => {
    return api.get('/statistics/summary')
  },
}

// 系统相关API
export const systemAPI = {
  // 获取系统信息
  getSystemInfo: (): Promise<ApiResponse<{ version: string; uptime: number; storage: { used: number; total: number } }>> => {
    return api.get('/system/info')
  },

  // 健康检查
  healthCheck: (): Promise<ApiResponse<{ status: string; timestamp: string }>> => {
    return api.get('/system/health')
  },

  // 获取系统统计（管理员）
  getSystemStats: (): Promise<ApiResponse<any>> => {
    return api.get('/system/stats')
  },

  // 获取性能统计
  getPerformanceStats: (): Promise<ApiResponse<any>> => {
    return api.get('/system/performance')
  },

  // 获取系统配置
  getSystemConfig: (): Promise<ApiResponse<any>> => {
    return api.get('/system/config')
  },

  // 更新系统配置
  updateSystemConfig: (config: any): Promise<ApiResponse<any>> => {
    return api.put('/system/config', config)
  },

  // 创建备份
  createBackup: (): Promise<ApiResponse<any>> => {
    return api.post('/system/backup')
  },

  // 系统清理
  cleanupSystem: (type: string): Promise<ApiResponse<any>> => {
    return api.post('/system/cleanup', { type })
  },

  // 获取系统日志
  getSystemLogs: (): Promise<ApiResponse<any[]>> => {
    return api.get('/system/logs')
  },
}

// 回收站相关API
export const trashAPI = {
  // 获取回收站项目
  getTrashItems: async (): Promise<ApiResponse<any[]>> => {
    try {
      console.log('调用回收站API: GET /trash/')
      const response = await api.get('/trash/')
      console.log('回收站API响应:', response)
      return response
    } catch (error) {
      console.error('回收站API调用失败:', error)
      throw error
    }
  },
  
  // 恢复项目
  restoreItems: async (ids: string[]): Promise<ApiResponse> => {
    try {
      console.log('调用恢复API:', ids)
      const response = await api.post('/trash/restore', { ids })
      console.log('恢复API响应:', response)
      return response
    } catch (error) {
      console.error('恢复API调用失败:', error)
      throw error
    }
  },
  
  // 永久删除
  permanentDelete: async (ids: string[]): Promise<ApiResponse> => {
    try {
      console.log('调用永久删除API:', ids)
      const response = await api.delete('/trash/delete', { data: { ids } })
      console.log('永久删除API响应:', response)
      return response
    } catch (error) {
      console.error('永久删除API调用失败:', error)
      throw error
    }
  },
  
  // 清空回收站
  emptyTrash: async (): Promise<ApiResponse> => {
    try {
      console.log('调用清空回收站API')
      const response = await api.delete('/trash/empty')
      console.log('清空回收站API响应:', response)
      return response
    } catch (error) {
      console.error('清空回收站API调用失败:', error)
      throw error
    }
  },
}

// 好友功能API
export const friendsAPI = {
  // 搜索用户
  searchUser: (userCode: string): Promise<ApiResponse<User>> => {
    return api.get(`/friends/search/${userCode}`)
  },

  // 发送好友请求
  sendFriendRequest: (friendId: string): Promise<ApiResponse> => {
    return api.post('/friends/request', { friendId })
  },

  // 获取好友请求列表
  getFriendRequests: (): Promise<ApiResponse<any[]>> => {
    return api.get('/friends/requests')
  },

  // 处理好友请求
  handleFriendRequest: (requestId: string, action: 'accept' | 'reject'): Promise<ApiResponse> => {
    return api.post(`/friends/request/${requestId}/${action}`)
  },

  // 获取好友列表
  getFriends: (): Promise<ApiResponse<any[]>> => {
    return api.get('/friends')
  },

  // 删除好友
  deleteFriend: (friendshipId: string): Promise<ApiResponse> => {
    return api.delete(`/friends/${friendshipId}`)
  },
}

// 聊天功能API
export const chatAPI = {
  // 获取聊天会话列表
  getChatSessions: (): Promise<ApiResponse<any[]>> => {
    return api.get('/chat/sessions')
  },

  // 获取聊天记录
  getChatMessages: (friendId: string, page?: number, limit?: number): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams()
    if (page) params.append('page', page.toString())
    if (limit) params.append('limit', limit.toString())
    return api.get(`/chat/messages/${friendId}?${params.toString()}`)
  },

  // 发送消息
  sendMessage: (friendId: string, content: string, messageType?: string): Promise<ApiResponse<any>> => {
    return api.post('/chat/send', {
      friend_id: friendId,
      content,
      message_type: messageType || 'text'
    })
  },

  // 标记消息为已读
  markAsRead: (friendId: string): Promise<ApiResponse> => {
    return api.post(`/chat/read/${friendId}`)
  },

  // 获取未读消息数
  getUnreadCount: (): Promise<ApiResponse<{ count: number }>> => {
    return api.get('/chat/unread-count')
  },
}

// 好友文件分享API
export const friendShareAPI = {
  // 发送文件分享
  sendFileShare: (friendId: string, fileId: string, message?: string): Promise<ApiResponse> => {
    return api.post('/friend-shares/send', {
      receiverId: friendId,
      fileId: fileId,
      message
    })
  },

  // 获取接收到的文件分享
  getReceivedShares: (): Promise<ApiResponse<any[]>> => {
    return api.get('/friend-shares/received')
  },

  // 获取发送的文件分享
  getSentShares: (): Promise<ApiResponse<any[]>> => {
    return api.get('/friend-shares/sent')
  },

  // 接受文件分享
  acceptShare: (shareId: string): Promise<ApiResponse> => {
    return api.post(`/friend-shares/${shareId}/accept`)
  },

  // 拒绝文件分享
  rejectShare: (shareId: string): Promise<ApiResponse> => {
    return api.post(`/friend-shares/${shareId}/reject`)
  },

  // 保存分享文件到文件夹
  saveToFolder: (shareId: string, folderId: string): Promise<ApiResponse> => {
    return api.post(`/friend-shares/${shareId}/save`, { folderId: folderId })
  },

  // 下载分享文件
  downloadShare: (shareId: string): Promise<Blob> => {
    return api.get(`/friend-shares/${shareId}/download`, { responseType: 'blob' })
  },
}

// 设置API
export const settingsAPI = {
  // 获取用户设置
  getSettings: (): Promise<ApiResponse<any>> => {
    return api.get('/settings')
  },

  // 更新设置
  updateSettings: (category: string, settings: any): Promise<ApiResponse<any>> => {
    return api.put('/settings', { category, settings })
  },

  // 批量更新设置
  updateAllSettings: (settings: any): Promise<ApiResponse<any>> => {
    return api.put('/settings', settings)
  },

  // 重置设置
  resetSettings: (category?: string): Promise<ApiResponse<any>> => {
    return api.post('/settings/reset', category ? { category } : {})
  },

  // 导出设置
  exportSettings: (): Promise<ApiResponse<any>> => {
    return api.get('/settings/export')
  },

  // 导入设置
  importSettings: (settings: any): Promise<ApiResponse<any>> => {
    return api.post('/settings/import', { settings })
  },
}

// 公共分享API
export const shareAPI = {
  // 创建分享链接
  createShare: (shareData: {
    fileId: string
    allowDownload: boolean
    allowPreview: boolean
    password?: string
    expiresAt?: string
    maxDownloads?: number
    description?: string
  }): Promise<ApiResponse<any>> => {
    return api.post('/shares', shareData)
  },

  // 获取文件的分享链接
  getFileShares: (fileId: string): Promise<ApiResponse<any[]>> => {
    return api.get(`/shares/file/${fileId}`)
  },

  // 获取用户的所有分享
  getUserShares: (page?: number, limit?: number): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams()
    if (page) params.append('page', page.toString())
    if (limit) params.append('limit', limit.toString())
    return api.get(`/shares?${params.toString()}`)
  },

  // 获取分享详情
  getShare: (shareId: string): Promise<ApiResponse<any>> => {
    return api.get(`/shares/${shareId}`)
  },

  // 更新分享设置
  updateShare: (shareId: string, updates: any): Promise<ApiResponse<any>> => {
    return api.put(`/shares/${shareId}`, updates)
  },

  // 删除分享
  deleteShare: (shareId: string): Promise<ApiResponse> => {
    return api.delete(`/shares/${shareId}`)
  },

  // 通过token访问分享（公开访问）
  accessShare: (token: string, password?: string): Promise<ApiResponse<any>> => {
    return api.post(`/shares/access/${token}`, { password })
  },

  // 下载分享文件（公开访问）
  downloadSharedFile: (token: string, password?: string): Promise<Blob> => {
    return api.post(`/shares/download/${token}`, { password }, { responseType: 'blob' })
  },

  // 预览分享文件（公开访问）
  previewSharedFile: (token: string, password?: string): Promise<Blob> => {
    return api.post(`/shares/preview/${token}`, { password }, { responseType: 'blob' })
  },

  // 保存公共分享文件到用户文件夹
  saveToFolder: (token: string, folderId: string, password?: string): Promise<ApiResponse<any>> => {
    return api.post(`/shares/${token}/save`, { folderId, password })
  },

  // 获取分享文件预览URL（用于媒体文件直接访问）
  getSharedFilePreviewUrl: (shareToken: string, password?: string) => {
    const baseUrl = `${api.defaults.baseURL}/shares/${shareToken}/preview`
    const params = new URLSearchParams()
    if (password) {
      params.append('password', password)
    }
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl
  },

  // 获取分享文件预览内容
  getSharedFilePreviewContent: async (shareToken: string, password?: string) => {
    const response = await api.post(`/shares/preview/${shareToken}`, {
      password: password || undefined
    }, {
      responseType: 'text'
    })
    return response.data
  },
}

export default api