import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  FolderOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FolderSelector } from '@/components/folder/FolderSelector'
import { Progress } from '@/components/ui/progress'
import { cn, formatFileSize, getFileIcon, generateId } from '@/lib/utils'
import { useUploadStore, useNotificationStore, useFileStore } from '@/store'
import { fileAPI } from '@/services/api'
import type { UploadFile } from '@/types'

interface FileUploadProps {
  className?: string
  maxFiles?: number
  maxSize?: number
  acceptedFileTypes?: string[]
  onUploadComplete?: (files: File[]) => void
}

interface UploadFileItemProps {
  file: UploadFile
  onRemove: (id: string) => void
  onRetry: (id: string) => void
}

function UploadFileItem({ file, onRemove, onRetry }: UploadFileItemProps) {
  const getStatusIcon = () => {
    switch (file.status) {
      case 'pending':
        return <File className="h-4 w-4 text-muted-foreground" />
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      default:
        return <File className="h-4 w-4" />
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex items-center space-x-3 p-3 border rounded-lg bg-card"
    >
      {/* 文件图标 */}
      <div className="flex-shrink-0">
        <span className="text-2xl">{getFileIcon(file.name)}</span>
      </div>

      {/* 文件信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium truncate max-w-[200px]" title={file.name}>{file.name}</p>
          <div className="flex items-center space-x-2 flex-shrink-0">
            {getStatusIcon()}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onRemove(file.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}
          </p>
          <p className="text-xs text-muted-foreground">
            {getStatusText()}
          </p>
        </div>

        {/* 进度条 */}
        {file.status === 'uploading' && (
          <Progress value={file.progress} className="mt-2 h-1" />
        )}

        {/* 错误信息和重试按钮 */}
        {file.status === 'error' && (
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-destructive">{file.error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRetry(file.id)}
            >
              重试
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function FileUpload({
  className,
  maxFiles = 10,
  maxSize = 100 * 1024 * 1024, // 100MB
  acceptedFileTypes,
  onUploadComplete,
}: FileUploadProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const { uploadFiles, addUploadFile, updateUploadFile, removeUploadFile, clearUploadFiles } = useUploadStore()
  const { addNotification } = useNotificationStore()
  const { addFile } = useFileStore()

  // 处理文件夹选择
  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId)
  }

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // 处理被拒绝的文件
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach((error: any) => {
          let message = '文件上传失败'
          if (error.code === 'file-too-large') {
            message = `文件 ${file.name} 超过大小限制 ${formatFileSize(maxSize)}`
          } else if (error.code === 'file-invalid-type') {
            message = `文件 ${file.name} 类型不支持`
          } else if (error.code === 'too-many-files') {
            message = `最多只能上传 ${maxFiles} 个文件`
          }
          
          addNotification({
            type: 'error',
            title: '上传失败',
            message,
          })
        })
      })

      // 处理接受的文件
      acceptedFiles.forEach((file) => {
        const uploadFile: UploadFile = {
          id: generateId(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          progress: 0,
          status: 'pending',
        }
        addUploadFile(uploadFile)
      })
    },
    [maxFiles, maxSize, addUploadFile, addNotification]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept: acceptedFileTypes ? {
      'application/*': acceptedFileTypes,
    } : undefined,
    multiple: true,
  })

  const handleRemoveFile = (id: string) => {
    removeUploadFile(id)
  }

  const handleRetryFile = (id: string) => {
    updateUploadFile(id, { status: 'pending', progress: 0, error: undefined })
  }

  const handleUploadAll = async () => {
    if (!selectedFolderId) {
      addNotification({
        type: 'error',
        title: '请选择文件夹',
        message: '请先选择要上传到的文件夹',
      })
      return
    }

    const pendingFiles = uploadFiles.filter(f => f.status === 'pending' || f.status === 'error')
    
    if (pendingFiles.length === 0) {
      addNotification({
        type: 'warning',
        title: '没有待上传的文件',
      })
      return
    }

    // 实际上传过程
    const uploadedFiles: File[] = []
    for (const uploadFile of pendingFiles) {
      updateUploadFile(uploadFile.id, { status: 'uploading', folderId: selectedFolderId })
      
      try {
        // 创建FormData
        const formData = new FormData()
        formData.append('file', uploadFile.file)
        formData.append('folderId', selectedFolderId)
        
        // 调用上传API
        const response = await fileAPI.uploadFile(formData, (progress) => {
          updateUploadFile(uploadFile.id, { progress })
        })
        
        if (response.success && response.data) {
          updateUploadFile(uploadFile.id, { status: 'completed', progress: 100 })
          
          // 添加文件到文件列表
          addFile(response.data)
          uploadedFiles.push(uploadFile.file)
          
          addNotification({
            type: 'success',
            title: '上传成功',
            message: `文件 ${uploadFile.name} 上传完成`,
          })
        } else {
          throw new Error(response.error || '上传失败')
        }
      } catch (error: any) {
        console.error('Upload failed:', error)
        const errorMessage = error.response?.data?.error || error.message || '上传失败'
        const isConflict = error.response?.status === 409
        
        updateUploadFile(uploadFile.id, {
          status: 'error',
          error: isConflict ? '文件已存在' : errorMessage,
        })
        
        addNotification({
          type: 'error',
          title: isConflict ? '文件重复' : '上传失败',
          message: isConflict 
            ? `文件 ${uploadFile.name} 已存在，请重命名后重试`
            : `文件 ${uploadFile.name} 上传失败: ${errorMessage}`,
        })
      }
    }
    
    // 如果有文件上传成功，调用回调函数
    if (uploadedFiles.length > 0 && onUploadComplete) {
      onUploadComplete(uploadedFiles)
    }
  }

  const handleClearAll = () => {
    clearUploadFiles()
  }

  const completedFiles = uploadFiles.filter(f => f.status === 'completed')
  const pendingFiles = uploadFiles.filter(f => f.status === 'pending' || f.status === 'error')
  const uploadingFiles = uploadFiles.filter(f => f.status === 'uploading')

  return (
    <div className={cn('space-y-6', className)}>
      {/* 文件拖拽区域 */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            )}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg font-medium">释放文件以开始上传</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">拖拽文件到此处或点击选择文件</p>
                <p className="text-sm text-muted-foreground">
                  支持最多 {maxFiles} 个文件，单个文件最大 {formatFileSize(maxSize)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 文件夹选择 */}
      {uploadFiles.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-medium">选择目标文件夹</h3>
              </div>
              
              <FolderSelector
                selectedFolderId={selectedFolderId}
                onFolderSelect={handleFolderSelect}
                title="选择上传目标文件夹"
                allowRoot={false}
                trigger={
                  <Button variant="outline" className="w-full justify-start">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    {selectedFolderId ? '已选择文件夹' : '请选择要上传到的文件夹'}
                  </Button>
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 上传文件列表 */}
      {uploadFiles.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">上传列表</h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    disabled={uploadingFiles.length > 0}
                  >
                    清空列表
                  </Button>
                  <Button
                    onClick={handleUploadAll}
                    disabled={pendingFiles.length === 0 || !selectedFolderId || uploadingFiles.length > 0}
                  >
                    {uploadingFiles.length > 0 ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        上传中...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        开始上传
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {uploadFiles.map((file) => (
                    <UploadFileItem
                      key={file.id}
                      file={file}
                      onRemove={handleRemoveFile}
                      onRetry={handleRetryFile}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {/* 上传统计 */}
              <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
                <span>
                  总计: {uploadFiles.length} 个文件 ({formatFileSize(uploadFiles.reduce((sum, f) => sum + f.size, 0))})
                </span>
                <span>
                  已完成: {completedFiles.length} | 待上传: {pendingFiles.length} | 上传中: {uploadingFiles.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}