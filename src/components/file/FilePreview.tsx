import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  X,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  FileText,
  Code,
  Archive,
  AlertCircle,
  Table,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { animations } from '@/lib/animations'
import { cn, formatFileSize, formatDate, getFileType } from '@/lib/utils'
import { useNotificationStore, usePreviewStore } from '@/store'
import { fileAPI } from '@/services/api'
import type { File } from '@/types'

interface FilePreviewProps {
  file: File | null
  isOpen: boolean
  onClose: () => void
  onDownload?: (file: File) => void
  onShare?: (file: File) => void
}

interface ImagePreviewProps {
  file: File
  src: string
}

interface VideoPreviewProps {
  file: File
  src: string
}

interface AudioPreviewProps {
  file: File
  src: string
}

interface TextPreviewProps {
  file: File
  content: string
}

interface SpreadsheetPreviewProps {
  file: File
  content: string
}

function ImagePreview({ file, src }: ImagePreviewProps) {
  const { settings } = usePreviewStore()
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null)
  const [isDragMode, setIsDragMode] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 })

  const handleZoomIn = () => settings.enableZoom && setZoom(prev => Math.min(prev + 25, 500))
  const handleZoomOut = () => settings.enableZoom && setZoom(prev => Math.max(prev - 25, 25))
  const handleRotate = () => settings.enableRotation && setRotation(prev => (prev + 90) % 360)
  const handleReset = () => {
    setZoom(100)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
    setIsDragMode(false)
    setIsDragging(false)
  }

  // 滚轮缩放处理
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    
    if (!imageRef) return
    
    const rect = imageRef.getBoundingClientRect()
    const mouseX = e.clientX - rect.left - rect.width / 2
    const mouseY = e.clientY - rect.top - rect.height / 2
    
    const zoomDelta = e.deltaY > 0 ? -25 : 25
    const newZoom = Math.max(25, Math.min(500, zoom + zoomDelta))
    
    if (newZoom !== zoom) {
      const zoomFactor = newZoom / zoom
      
      setPosition(prev => ({
        x: prev.x + mouseX * (1 - zoomFactor),
        y: prev.y + mouseY * (1 - zoomFactor)
      }))
      
      setZoom(newZoom)
    }
  }

  // 鼠标点击处理 - 切换拖动模式
  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.button === 0) { // 左键点击
      setIsDragMode(!isDragMode)
      setIsDragging(false)
    }
  }

  // 鼠标按下处理 - 开始拖动
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDragMode || e.button !== 0) return
    
    e.preventDefault()
    e.stopPropagation()
    
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setStartPosition(position)
  }

  // 鼠标移动处理 - 拖动图片
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    
    e.preventDefault()
    
    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y
    
    setPosition({
      x: startPosition.x + deltaX,
      y: startPosition.y + deltaY
    })
  }

  // 鼠标释放处理 - 结束拖动
  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault()
      setIsDragging(false)
    }
  }

  // 鼠标离开处理
  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  // 全局鼠标事件处理（用于处理在图片外部释放鼠标的情况）
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      
      setPosition({
        x: startPosition.x + deltaX,
        y: startPosition.y + deltaY
      })
    }

    const handleGlobalMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDragging, dragStart, startPosition])

  return (
    <div className="h-full flex flex-col">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center space-x-2">
          {settings.enableZoom && (
            <>
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-mono min-w-[60px] text-center">{zoom}%</span>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </>
          )}
          {settings.enableRotation && (
            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
          )}
          {(settings.enableZoom || settings.enableRotation) && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              重置
            </Button>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {isDragMode ? (
            <span className="text-blue-600">🖱️ 拖动模式已启用 | 滚轮缩放 | 点击图片退出拖动</span>
          ) : (
            <span>🖱️ 滚轮缩放，自动定位到鼠标位置 | 点击图片启用拖动</span>
          )}
        </div>
      </div>

      {/* 图片显示区域 */}
      <div 
        className="flex-1 overflow-hidden bg-muted/10 flex items-center justify-center p-4 relative"
        onWheel={handleWheel}
        onMouseLeave={handleMouseLeave}
        style={{
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      >
        <motion.img
          ref={setImageRef}
          src={src}
          alt={file.name}
          className="max-w-none object-contain select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom / 100}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-in-out',
            cursor: isDragging ? 'grabbing' : (isDragMode ? 'grab' : 'pointer'),
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
          onClick={handleImageClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDragStart={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
          {...animations.fadeIn}
        />
      </div>
    </div>
  )
}

function VideoPreview({ file, src }: VideoPreviewProps) {
  const { settings } = usePreviewStore()
  const [isPlaying, setIsPlaying] = useState(settings.autoPlayVideos)
  const [isMuted, setIsMuted] = useState(false)
  const videoRef = React.useRef<HTMLVideoElement>(null)

  // 根据设置自动播放视频
  useEffect(() => {
    if (settings.autoPlayVideos && videoRef.current) {
      videoRef.current.play().catch(() => {
        // 自动播放失败时静默处理
        setIsPlaying(false)
      })
    }
  }, [settings.autoPlayVideos])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* 控制栏 */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={togglePlay}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={toggleMute}>
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* 视频显示区域 */}
      <div className="flex-1 bg-black flex items-center justify-center">
        <motion.video
          ref={videoRef}
          src={src}
          className="max-w-full max-h-full"
          controls
          {...animations.fadeIn}
        />
      </div>
    </div>
  )
}

function AudioPreview({ file, src }: AudioPreviewProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <motion.div
        className="text-center space-y-6"
        {...animations.fadeIn}
      >
        <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <Volume2 className="h-12 w-12 text-primary" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold">{file.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {formatFileSize(file.size)}
          </p>
        </div>

        <audio
          src={src}
          controls
          className="w-full max-w-md"
        />
      </motion.div>
    </div>
  )
}

function TextPreview({ file, content }: TextPreviewProps) {
  const fileType = getFileType(file.name)
  const isMarkdown = file.name.toLowerCase().endsWith('.md')
  const isCode = ['javascript', 'typescript', 'python', 'css', 'html', 'json'].includes(fileType)

  return (
    <div className="h-full flex flex-col">
      {/* 文件信息 */}
      <div className="flex items-center space-x-2 p-3 border-b bg-muted/30">
        {isCode ? <Code className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
        <span className="text-sm font-medium">
          {isMarkdown ? 'Markdown 文档' : isCode ? '代码文件' : '文本文件'}
        </span>
      </div>

      {/* 文本内容 */}
      <div className="flex-1 overflow-auto p-4">
        {isMarkdown ? (
          <motion.div
            className="prose prose-sm max-w-none dark:prose-invert"
            {...animations.fadeIn}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </motion.div>
        ) : (
          <motion.pre
            className="text-sm font-mono whitespace-pre-wrap break-words"
            {...animations.fadeIn}
          >
            {content}
          </motion.pre>
        )}
      </div>
    </div>
  )
}

function SpreadsheetPreview({ file, content }: SpreadsheetPreviewProps) {
  const [data, setData] = useState<string[][]>([])
  const [headers, setHeaders] = useState<string[]>([])

  useEffect(() => {
    try {
      const lines = content.split('\n').filter(line => line.trim())
      if (lines.length > 0) {
        const parsedHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        const parsedData = lines.slice(1).map(line => 
          line.split(',').map(cell => cell.trim().replace(/"/g, ''))
        )
        setHeaders(parsedHeaders)
        setData(parsedData)
      }
    } catch (error) {
      console.error('解析CSV文件失败:', error)
    }
  }, [content])

  return (
    <div className="h-full flex flex-col">
      {/* 文件信息 */}
      <div className="flex items-center space-x-2 p-3 border-b bg-muted/30">
        <Table className="h-4 w-4" />
        <span className="text-sm font-medium">电子表格</span>
        <span className="text-xs text-muted-foreground">
          {data.length} 行 × {headers.length} 列
        </span>
      </div>

      {/* 表格内容 */}
      <div className="flex-1 overflow-auto">
        <motion.div className="h-full" {...animations.fadeIn}>
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-muted">
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className="border border-border p-2 text-left text-sm font-medium"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-muted/50">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="border border-border p-2 text-sm"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  )
}

function UnsupportedPreview({ file }: { file: File }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <motion.div
        className="space-y-4"
        {...animations.fadeIn}
      >
        <div className="w-16 h-16 mx-auto bg-muted rounded-lg flex items-center justify-center">
          <Archive className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold">无法预览此文件</h3>
          <p className="text-sm text-muted-foreground mt-1">
            不支持预览 {file.name.split('.').pop()?.toUpperCase()} 格式的文件
          </p>
        </div>

        <Button variant="outline" className="mt-4">
          <Download className="h-4 w-4 mr-2" />
          下载文件
        </Button>
      </motion.div>
    </div>
  )
}

export function FilePreview({
  file,
  isOpen,
  onClose,
  onDownload,
  onShare,
}: FilePreviewProps) {
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { addNotification } = useNotificationStore()
  const { settings, canPreviewFile } = usePreviewStore()

  useEffect(() => {
    if (!file || !isOpen) {
      setPreviewContent(null)
      return
    }

    const loadPreview = async () => {
      if (!canPreviewFile(file.name, file.size)) return

      setIsLoading(true)
      try {
        const content = await fileAPI.getPreviewContent(file.id)
        setPreviewContent(content)
      } catch (error) {
        console.error('加载预览失败:', error)
        addNotification({
          type: 'error',
          title: '预览失败',
          message: '无法加载文件预览'
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadPreview()
  }, [file, isOpen, addNotification])

  const handleDownload = () => {
    if (file && onDownload) {
      onDownload(file)
    }
  }

  const handleShare = () => {
    if (file && onShare) {
      onShare(file)
    }
  }

  const renderPreviewContent = () => {
    if (!file) return null

    if (isLoading) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">加载预览中...</p>
          </div>
        </div>
      )
    }

    const fileType = getFileType(file.name)
    
    // 对于媒体文件，我们需要使用带认证的URL
    if (['image', 'video', 'audio'].includes(fileType)) {
      const fileUrl = fileAPI.getPreviewUrl(file.id)
      
      if (fileType === 'image') {
        return <ImagePreview file={file} src={fileUrl} />
      }
      
      if (fileType === 'video') {
        return <VideoPreview file={file} src={fileUrl} />
      }
      
      if (fileType === 'audio') {
        return <AudioPreview file={file} src={fileUrl} />
      }
    }

    if (['text', 'document', 'code'].includes(fileType) && previewContent) {
      return <TextPreview file={file} content={previewContent} />
    }

    if (fileType === 'spreadsheet' && previewContent) {
      return <SpreadsheetPreview file={file} content={previewContent} />
    }

    return <UnsupportedPreview file={file} />
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* 背景遮罩 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* 对话框 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-6xl h-[85vh] mx-4 bg-background rounded-lg shadow-xl border overflow-hidden"
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b bg-muted/30">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold truncate">
                {file?.name || '未知文件'}
              </h2>
              {file && settings.showMetadata && (
                <p className="text-sm text-muted-foreground mt-1">
                  {formatFileSize(file.size)} • {formatDate(file.updatedAt)}
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                下载
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                分享
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 预览内容 */}
          <div className="h-[calc(100%-80px)]">
            {renderPreviewContent()}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}