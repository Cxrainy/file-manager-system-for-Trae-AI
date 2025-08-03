import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Upload as UploadIcon,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageWrapper } from '@/components/layout/Layout'
import { FileUpload } from '@/components/upload/FileUpload'
import { cn, formatFileSize } from '@/lib/utils'
import { useUploadStore } from '@/store'
import type { UploadFile } from '@/types'

interface UploadStatsProps {
  title: string
  count: number
  icon: React.ReactNode
  color: string
}

interface UploadHistoryItemProps {
  file: UploadFile
  onRetry: (id: string) => void
  onRemove: (id: string) => void
}

function UploadStats({ title, count, icon, color }: UploadStatsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className={cn('p-3 rounded-full', color)}>
              {icon}
            </div>
            <div>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-sm text-muted-foreground">{title}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function UploadHistoryItem({ file, onRetry, onRemove }: UploadHistoryItemProps) {
  const getStatusIcon = () => {
    switch (file.status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'uploading':
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
        )
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusText = () => {
    switch (file.status) {
      case 'pending':
        return '等待上传'
      case 'uploading':
        return `上传中 ${file.progress}%`
      case 'completed':
        return '上传完成'
      case 'error':
        return file.error || '上传失败'
      default:
        return '未知状态'
    }
  }

  const getStatusColor = () => {
    switch (file.status) {
      case 'pending':
        return 'text-yellow-600'
      case 'uploading':
        return 'text-blue-600'
      case 'completed':
        return 'text-green-600'
      case 'error':
        return 'text-destructive'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex items-center justify-between p-4 border rounded-lg bg-card"
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {getStatusIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <span>{formatFileSize(file.size)}</span>
            <span>•</span>
            <span className={cn(getStatusColor(), "truncate")}>{getStatusText()}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {file.status === 'error' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRetry(file.id)}
          >
            重试
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(file.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}

export function Upload() {
  const { uploadFiles, updateUploadFile, removeUploadFile } = useUploadStore()
  const [showHistory, setShowHistory] = useState(false)

  // 计算统计数据
  const totalFiles = uploadFiles.length
  const completedFiles = uploadFiles.filter(f => f.status === 'completed').length
  const pendingFiles = uploadFiles.filter(f => f.status === 'pending').length
  const errorFiles = uploadFiles.filter(f => f.status === 'error').length
  const uploadingFiles = uploadFiles.filter(f => f.status === 'uploading').length

  // 按文件类型分组统计
  const getFileTypeStats = () => {
    const stats = {
      image: 0,
      video: 0,
      audio: 0,
      document: 0,
      archive: 0,
      code: 0,
      other: 0,
    }

    uploadFiles.forEach(file => {
      const extension = file.name.split('.').pop()?.toLowerCase() || ''
      
      if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
        stats.image++
      } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) {
        stats.video++
      } else if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension)) {
        stats.audio++
      } else if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(extension)) {
        stats.document++
      } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
        stats.archive++
      } else if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java', 'cpp'].includes(extension)) {
        stats.code++
      } else {
        stats.other++
      }
    })

    return stats
  }

  const fileTypeStats = getFileTypeStats()

  const handleRetry = (id: string) => {
    updateUploadFile(id, { status: 'pending', progress: 0, error: undefined })
  }

  const handleRemove = (id: string) => {
    removeUploadFile(id)
  }

  const handleUploadComplete = (files: File[]) => {
    // 处理上传完成
    console.log('上传完成:', files)
  }

  return (
    <PageWrapper
      title="文件上传"
      breadcrumbs={[
        { label: '首页', href: '/' },
        { label: '文件上传', href: '/upload' },
      ]}
    >
      <div className="space-y-6">
        {/* 上传统计 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <UploadStats
            title="总文件数"
            count={totalFiles}
            icon={<FileText className="h-6 w-6 text-white" />}
            color="bg-blue-500"
          />
          <UploadStats
            title="已完成"
            count={completedFiles}
            icon={<CheckCircle className="h-6 w-6 text-white" />}
            color="bg-green-500"
          />
          <UploadStats
            title="上传中"
            count={uploadingFiles}
            icon={<UploadIcon className="h-6 w-6 text-white" />}
            color="bg-blue-500"
          />
          <UploadStats
            title="失败"
            count={errorFiles}
            icon={<AlertCircle className="h-6 w-6 text-white" />}
            color="bg-red-500"
          />
        </div>

        {/* 文件类型统计 */}
        {totalFiles > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>文件类型分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="text-center">
                  <Image className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm font-medium">{fileTypeStats.image}</p>
                  <p className="text-xs text-muted-foreground">图片</p>
                </div>
                <div className="text-center">
                  <Video className="h-8 w-8 mx-auto mb-2 text-red-500" />
                  <p className="text-sm font-medium">{fileTypeStats.video}</p>
                  <p className="text-xs text-muted-foreground">视频</p>
                </div>
                <div className="text-center">
                  <Music className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-sm font-medium">{fileTypeStats.audio}</p>
                  <p className="text-xs text-muted-foreground">音频</p>
                </div>
                <div className="text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-sm font-medium">{fileTypeStats.document}</p>
                  <p className="text-xs text-muted-foreground">文档</p>
                </div>
                <div className="text-center">
                  <Archive className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-sm font-medium">{fileTypeStats.archive}</p>
                  <p className="text-xs text-muted-foreground">压缩包</p>
                </div>
                <div className="text-center">
                  <Code className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                  <p className="text-sm font-medium">{fileTypeStats.code}</p>
                  <p className="text-xs text-muted-foreground">代码</p>
                </div>
                <div className="text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                  <p className="text-sm font-medium">{fileTypeStats.other}</p>
                  <p className="text-xs text-muted-foreground">其他</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 文件上传组件 */}
        <FileUpload
          maxFiles={20}
          maxSize={500 * 1024 * 1024} // 500MB
          onUploadComplete={handleUploadComplete}
        />

        {/* 上传历史 */}
        {uploadFiles.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>上传历史</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  {showHistory ? '隐藏' : '显示'} ({uploadFiles.length})
                </Button>
              </div>
            </CardHeader>
            {showHistory && (
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-auto">
                  {uploadFiles.map((file) => (
                    <UploadHistoryItem
                      key={file.id}
                      file={file}
                      onRetry={handleRetry}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* 上传提示 */}
        <Card>
          <CardHeader>
            <CardTitle>上传说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">支持的文件类型</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 图片: JPG, PNG, GIF, SVG, WebP</li>
                  <li>• 视频: MP4, AVI, MOV, WMV, WebM</li>
                  <li>• 音频: MP3, WAV, FLAC, AAC, OGG</li>
                  <li>• 文档: PDF, DOC, DOCX, TXT, RTF</li>
                  <li>• 压缩包: ZIP, RAR, 7Z, TAR, GZ</li>
                  <li>• 代码: JS, TS, HTML, CSS, PY, JAVA</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">上传限制</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 单个文件最大: 500MB</li>
                  <li>• 同时上传最多: 20个文件</li>
                  <li>• 支持拖拽上传</li>
                  <li>• 支持批量选择</li>
                  <li>• 自动重试失败的上传</li>
                  <li>• 实时显示上传进度</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  )
}