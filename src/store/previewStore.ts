import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PreviewSettings {
  // 预览模式
  previewMode: 'auto' | 'inline' | 'modal' | 'tab'
  
  // 缩略图设置
  enableThumbnails: boolean
  thumbnailSize: 'small' | 'medium' | 'large'
  thumbnailQuality: 'low' | 'medium' | 'high'
  
  // 支持的文件类型
  enabledFileTypes: {
    images: boolean
    videos: boolean
    audios: boolean
    documents: boolean
    spreadsheets: boolean
    presentations: boolean
    archives: boolean
    code: boolean
  }
  
  // 高级设置
  maxPreviewSize: number // MB
  enableLazyLoading: boolean
  showMetadata: boolean
  enableFullscreen: boolean
  autoPlayVideos: boolean
  enableZoom: boolean
  enableRotation: boolean
}

interface PreviewStore {
  settings: PreviewSettings
  updateSettings: (newSettings: Partial<PreviewSettings>) => void
  resetSettings: () => void
  canPreviewFile: (filename: string, fileSize?: number) => boolean
  getPreviewMode: (fileType: string) => 'inline' | 'modal' | 'tab'
}

const defaultSettings: PreviewSettings = {
  previewMode: 'auto',
  enableThumbnails: true,
  thumbnailSize: 'medium',
  thumbnailQuality: 'medium',
  enabledFileTypes: {
    images: true,
    videos: true,
    audios: true,
    documents: true,
    spreadsheets: true,
    presentations: true,
    archives: false,
    code: true,
  },
  maxPreviewSize: 50, // 50MB
  enableLazyLoading: true,
  showMetadata: true,
  enableFullscreen: true,
  autoPlayVideos: false,
  enableZoom: true,
  enableRotation: true,
}

// 获取文件类型映射
function getFileTypeCategory(filename: string): keyof PreviewSettings['enabledFileTypes'] | null {
  const ext = filename.toLowerCase().split('.').pop()
  
  const typeMap: Record<string, keyof PreviewSettings['enabledFileTypes']> = {
    // 图片
    jpg: 'images', jpeg: 'images', png: 'images', gif: 'images', bmp: 'images', 
    webp: 'images', svg: 'images', ico: 'images', tiff: 'images',
    
    // 视频
    mp4: 'videos', avi: 'videos', mov: 'videos', wmv: 'videos', flv: 'videos',
    webm: 'videos', mkv: 'videos', m4v: 'videos', '3gp': 'videos',
    
    // 音频
    mp3: 'audios', wav: 'audios', flac: 'audios', aac: 'audios', ogg: 'audios',
    wma: 'audios', m4a: 'audios',
    
    // 文档
    pdf: 'documents', doc: 'documents', docx: 'documents', txt: 'documents',
    md: 'documents', markdown: 'documents', rtf: 'documents',
    
    // 表格
    xls: 'spreadsheets', xlsx: 'spreadsheets', csv: 'spreadsheets',
    
    // 演示文稿
    ppt: 'presentations', pptx: 'presentations',
    
    // 压缩包
    zip: 'archives', rar: 'archives', '7z': 'archives', tar: 'archives',
    gz: 'archives', bz2: 'archives',
    
    // 代码
    js: 'code', ts: 'code', jsx: 'code', tsx: 'code', html: 'code',
    css: 'code', scss: 'code', sass: 'code', less: 'code', json: 'code',
    xml: 'code', yaml: 'code', yml: 'code', py: 'code', java: 'code',
    cpp: 'code', c: 'code', h: 'code', php: 'code', rb: 'code',
    go: 'code', rs: 'code', swift: 'code', kt: 'code', dart: 'code',
    vue: 'code', svelte: 'code', sql: 'code', sh: 'code', bat: 'code',
  }
  
  return ext ? typeMap[ext] || null : null
}

export const usePreviewStore = create<PreviewStore>()(persist(
  (set, get) => ({
    settings: defaultSettings,
    
    updateSettings: (newSettings) => {
      set((state) => ({
        settings: { ...state.settings, ...newSettings }
      }))
    },
    
    resetSettings: () => {
      set({ settings: defaultSettings })
    },
    
    canPreviewFile: (filename, fileSize) => {
      const { settings } = get()
      const category = getFileTypeCategory(filename)
      
      if (!category || !settings.enabledFileTypes[category]) {
        return false
      }
      
      // 检查文件大小限制
      if (fileSize && fileSize > settings.maxPreviewSize * 1024 * 1024) {
        return false
      }
      
      return true
    },
    
    getPreviewMode: (fileType) => {
      const { settings } = get()
      
      if (settings.previewMode !== 'auto') {
        return settings.previewMode
      }
      
      // 自动模式下的默认行为
      switch (fileType) {
        case 'image':
        case 'video':
        case 'audio':
          return 'modal'
        case 'document':
        case 'code':
        case 'spreadsheet':
          return 'modal'
        default:
          return 'modal'
      }
    },
  }),
  {
    name: 'preview-settings',
    version: 1,
  }
))