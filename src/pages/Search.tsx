import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search as SearchIcon,
  Filter,
  Grid,
  List,
  Download,
  Share2,
  Eye,
  MoreHorizontal,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  Clock,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PageWrapper } from '@/components/layout/Layout'
import { FilePreview } from '@/components/file/FilePreview'
import { cn, formatFileSize, formatDate, getFileIcon, getFileType } from '@/lib/utils'
import { useNotificationStore, usePreviewStore } from '@/store'
import { fileAPI } from '@/services/api'
import type { File, ViewMode, SearchParams } from '@/types'
import ShareDialog from '@/components/file/ShareDialog'

type FilterType = 'all' | 'document' | 'image' | 'video' | 'audio' | 'code' | 'archive'
type SortBy = 'name' | 'size' | 'uploadedAt' | 'relevance'

interface FileItemProps {
  file: File
  viewMode: ViewMode
  onPreview: (file: File) => void
  onDownload: (file: File) => void
  onShare: (file: File) => void
}

function FileItem({ file, viewMode, onPreview, onDownload, onShare }: FileItemProps) {
  const fileIcon = getFileIcon(file.name)

  const handleDoubleClick = () => {
    onPreview(file)
  }

  if (viewMode === 'grid') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ scale: 1.02 }}
        className="group relative cursor-pointer"
        onDoubleClick={handleDoubleClick}
      >
        <Card className="h-full transition-all duration-200 hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                {file.thumbnailUrl ? (
                  <img
                    src={file.thumbnailUrl}
                    alt={file.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                ) : (
                  <div className="flex justify-center mb-3">
                    <div className="text-4xl">{fileIcon}</div>
                  </div>
                )}
                <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-background shadow-sm">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onPreview(file)}>
                        <Eye className="mr-2 h-4 w-4" />
                        预览
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDownload(file)}>
                        <Download className="mr-2 h-4 w-4" />
                        下载
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onShare(file)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        分享
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="text-center space-y-1 w-full">
                <p className="text-sm font-medium truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(file.uploadedAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // List view
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="group flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 cursor-pointer"
      onDoubleClick={handleDoubleClick}
    >
      <div className="flex-shrink-0">
        {file.thumbnailUrl ? (
          <img
            src={file.thumbnailUrl}
            alt={file.name}
            className="w-10 h-10 object-cover rounded"
          />
        ) : (
          <span className="text-2xl">{fileIcon}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
        </p>
      </div>
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onPreview(file)}>
              <Eye className="mr-2 h-4 w-4" />
              预览
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload(file)}>
              <Download className="mr-2 h-4 w-4" />
              下载
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onShare(file)}>
              <Share2 className="mr-2 h-4 w-4" />
              分享
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  )
}

export function Search() {
  const { addNotification } = useNotificationStore()
  const { canPreviewFile } = usePreviewStore()
  
  const [query, setQuery] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortBy>('relevance')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [isLoading, setIsLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [totalResults, setTotalResults] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [fileToShare, setFileToShare] = useState<File | null>(null)

  // 加载搜索历史
  useEffect(() => {
    const saved = localStorage.getItem('searchHistory')
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to parse search history:', error)
      }
    }
  }, [])

  // 保存搜索历史
  const saveSearchHistory = (searchQuery: string) => {
    const newHistory = [searchQuery, ...searchHistory.filter(item => item !== searchQuery)].slice(0, 10)
    setSearchHistory(newHistory)
    localStorage.setItem('searchHistory', JSON.stringify(newHistory))
  }

  // 执行搜索
  const performSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) {
      setFiles([])
      setTotalResults(0)
      return
    }

    setIsLoading(true)
    try {
      const searchParams: SearchParams = {
        query: searchQuery,
        fileType: filterType !== 'all' ? filterType : undefined,
        sortBy: sortBy,
        sortOrder: 'desc',
        page: 1,
        limit: 100
      }
      
      const response = await fileAPI.searchFiles(searchParams)
      
      if (response.success && response.data) {
        setFiles(response.data.files)
        setTotalResults(response.data.total)
        
        // 保存搜索历史
        if (searchQuery.trim()) {
          saveSearchHistory(searchQuery.trim())
        }
      } else {
        setFiles([])
        setTotalResults(0)
        addNotification({
          type: 'error',
          title: '搜索失败',
          message: '搜索失败，请重试',
        })
      }
    } catch (error) {
      console.error('Search failed:', error)
      setFiles([])
      setTotalResults(0)
      addNotification({
        type: 'error',
        title: '搜索失败',
        message: '搜索失败，请重试',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 当搜索条件变化时执行搜索
  useEffect(() => {
    if (query.trim()) {
      const timeoutId = setTimeout(() => performSearch(), 300)
      return () => clearTimeout(timeoutId)
    } else {
      setFiles([])
      setTotalResults(0)
    }
  }, [query, filterType, sortBy])

  // 处理文件预览
  const handleFilePreview = (file: File) => {
    if (!canPreviewFile(file.name, file.size)) {
      addNotification({
        type: 'warning',
        title: '无法预览',
        message: '该文件类型不支持预览或文件过大',
      })
      return
    }
    setSelectedFile(file)
    setIsPreviewOpen(true)
  }

  // 处理文件下载
  const handleFileDownload = async (file: File) => {
    try {
      const blob = await fileAPI.downloadFile(file.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      addNotification({
        type: 'success',
        title: '下载成功',
        message: `文件 ${file.name} 已开始下载`,
      })
    } catch (error) {
      console.error('Download failed:', error)
      addNotification({
        type: 'error',
        title: '下载失败',
        message: '文件下载失败，请重试',
      })
    }
  }

  // 处理文件分享
  const handleFileShare = (file: File) => {
    setFileToShare(file)
    setIsShareDialogOpen(true)
  }

  // 清除搜索历史
  const clearSearchHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('searchHistory')
  }

  // 获取文件类型图标
  const getTypeIcon = (type: FilterType) => {
    switch (type) {
      case 'document':
        return <FileText className="h-4 w-4" />
      case 'image':
        return <Image className="h-4 w-4" />
      case 'video':
        return <Video className="h-4 w-4" />
      case 'audio':
        return <Music className="h-4 w-4" />
      case 'code':
        return <Code className="h-4 w-4" />
      case 'archive':
        return <Archive className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* 搜索头部 */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="搜索文件..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    performSearch()
                  }
                }}
              />
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setQuery('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Button onClick={() => performSearch()} disabled={!query.trim() || isLoading}>
              {isLoading ? '搜索中...' : '搜索'}
            </Button>
          </div>

          {/* 过滤器和视图控制 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="文件类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有类型</SelectItem>
                  <SelectItem value="document">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon('document')}
                      <span>文档</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="image">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon('image')}
                      <span>图片</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="video">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon('video')}
                      <span>视频</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="audio">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon('audio')}
                      <span>音频</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="code">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon('code')}
                      <span>代码</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="archive">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon('archive')}
                      <span>压缩包</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="排序" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">相关性</SelectItem>
                  <SelectItem value="name">名称</SelectItem>
                  <SelectItem value="size">大小</SelectItem>
                  <SelectItem value="uploadedAt">上传时间</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 搜索历史 */}
        {!query && searchHistory.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  搜索历史
                </h3>
                <Button variant="ghost" size="sm" onClick={clearSearchHistory}>
                  清除
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((item, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery(item)}
                    className="text-xs"
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 搜索结果 */}
        {query && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                搜索结果 {totalResults > 0 && `(${totalResults})`}
              </h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground">搜索中...</p>
                </div>
              </div>
            ) : files.length > 0 ? (
              <div className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'
                  : 'space-y-2'
              )}>
                <AnimatePresence>
                  {files.map((file) => (
                    <FileItem
                      key={file.id}
                      file={file}
                      viewMode={viewMode}
                      onPreview={handleFilePreview}
                      onDownload={handleFileDownload}
                      onShare={handleFileShare}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-12">
                <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">未找到相关文件</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  尝试使用不同的关键词或调整筛选条件
                </p>
              </div>
            )}
          </div>
        )}

        {/* 空状态 */}
        {!query && (
          <div className="text-center py-12">
            <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">开始搜索文件</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              输入关键词来搜索您的文件
            </p>
          </div>
        )}
      </div>

      {/* 文件预览 */}
      {selectedFile && (
        <FilePreview
          file={selectedFile}
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false)
            setSelectedFile(null)
          }}
        />
      )}

      {/* 分享对话框 */}
       <ShareDialog
         file={fileToShare}
         open={isShareDialogOpen}
         onOpenChange={(open) => {
           setIsShareDialogOpen(open)
           if (!open) {
             setFileToShare(null)
           }
         }}
       />
    </PageWrapper>
  )
}