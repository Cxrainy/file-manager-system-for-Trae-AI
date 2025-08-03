import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 文件大小格式化
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 文件类型检测
export function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
  const documentTypes = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'md', 'markdown']
  const spreadsheetTypes = ['xls', 'xlsx', 'csv']
  const presentationTypes = ['ppt', 'pptx']
  const videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm']
  const audioTypes = ['mp3', 'wav', 'flac', 'aac', 'ogg']
  const archiveTypes = ['zip', 'rar', '7z', 'tar', 'gz']
  const codeTypes = ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'json', 'xml', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'dart', 'vue', 'yml', 'yaml', 'toml', 'ini', 'cfg', 'conf']
  
  if (imageTypes.includes(ext)) return 'image'
  if (documentTypes.includes(ext)) return 'document'
  if (spreadsheetTypes.includes(ext)) return 'spreadsheet'
  if (presentationTypes.includes(ext)) return 'presentation'
  if (videoTypes.includes(ext)) return 'video'
  if (audioTypes.includes(ext)) return 'audio'
  if (archiveTypes.includes(ext)) return 'archive'
  if (codeTypes.includes(ext)) return 'code'
  
  return 'other'
}

// 获取文件图标
export function getFileIcon(filename: string): string {
  const type = getFileType(filename)
  
  const iconMap: Record<string, string> = {
    image: '🖼️',
    document: '📄',
    spreadsheet: '📊',
    presentation: '📽️',
    video: '🎥',
    audio: '🎵',
    archive: '📦',
    code: '💻',
    other: '📁'
  }
  
  return iconMap[type] || iconMap.other
}

// 时间格式化
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  const minute = 60 * 1000
  const hour = minute * 60
  const day = hour * 24
  const week = day * 7
  
  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  } else if (diff < week) {
    return `${Math.floor(diff / day)}天前`
  } else {
    return d.toLocaleDateString('zh-CN')
  }
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// 生成唯一ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}