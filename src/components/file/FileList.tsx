import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Grid,
  List,
  Search,
  Filter,
  Download,
  Share2,
  Trash2,
  Edit3,
  Eye,
  MoreHorizontal,
  SortAsc,
  SortDesc,
  Calendar,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  Move,
  CheckSquare,
  Square,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EnhancedInput, SearchInput } from '@/components/ui/enhanced-input'
import { EnhancedCard, FileCard } from '@/components/ui/enhanced-card'
import { animations } from '@/lib/animations'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn, formatFileSize, formatDate, getFileIcon, getFileType } from '@/lib/utils'
import { useFileStore, useNotificationStore } from '@/store'
import { fileAPI } from '@/services/api'
import { FolderSelector } from '@/components/folder/FolderSelector'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { File, ViewMode } from '@/types'

interface FileListProps {
  folderId?: string
  className?: string
  onFileSelect?: (file: File) => void
  onFilePreview?: (file: File) => void
  onShare?: (file: File) => void
}

interface FileItemProps {
  file: File
  viewMode: ViewMode
  isSelected: boolean
  onSelect: (file: File) => void
  onPreview: (file: File) => void
  onDownload: (file: File) => void
  onShare: (file: File) => void
  onRename: (file: File) => void
  onDelete: (file: File) => void
}

type SortField = 'name' | 'size' | 'type' | 'createdAt' | 'updatedAt'
type SortOrder = 'asc' | 'desc'
type FilterType = 'all' | 'image' | 'video' | 'audio' | 'document' | 'archive' | 'code'

function FileItem({
  file,
  viewMode,
  isSelected,
  onSelect,
  onPreview,
  onDownload,
  onShare,
  onRename,
  onDelete,
}: FileItemProps) {
  const fileType = getFileType(file.name)
  const fileIcon = getFileIcon(file.name)

  const handleClick = () => {
    onSelect(file)
  }

  const handleDoubleClick = () => {
    onPreview(file)
  }

  if (viewMode === 'grid') {
    return (
      <FileCard
        className={cn(
          'group relative h-full',
          isSelected && 'ring-2 ring-primary ring-offset-2'
        )}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {/* 文件图标 */}
        <div className="flex justify-center mb-3">
          <div className="text-4xl">{fileIcon}</div>
        </div>

        {/* 文件名 */}
        <motion.h3 
          className="text-sm font-medium text-center truncate mb-2"
          {...animations.fadeIn}
        >
          {file.name}
        </motion.h3>

        {/* 文件信息 */}
        <motion.div 
          className="text-xs text-muted-foreground text-center space-y-1"
          {...animations.slideIn}
        >
          <p>{formatFileSize(file.size)}</p>
          <p>{formatDate(file.updatedAt)}</p>
        </motion.div>

        {/* 操作按钮 */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 bg-background/80 backdrop-blur-sm" ripple>
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
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onRename(file)}>
                <Edit3 className="mr-2 h-4 w-4" />
                重命名
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(file)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </FileCard>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'group flex items-center space-x-4 p-3 rounded-lg hover:bg-accent cursor-pointer',
        isSelected && 'bg-accent ring-2 ring-primary'
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* 文件图标 */}
      <div className="flex-shrink-0">
        <span className="text-2xl">{fileIcon}</span>
      </div>

      {/* 文件信息 */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium truncate">{file.name}</h3>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.size)} • {formatDate(file.updatedAt)}
        </p>
      </div>

      {/* 文件类型 */}
      <div className="hidden sm:block">
        <span className="text-xs text-muted-foreground capitalize">
          {fileType}
        </span>
      </div>

      {/* 操作按钮 */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
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
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onRename(file)}>
              <Edit3 className="mr-2 h-4 w-4" />
              重命名
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(file)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  )
}

export function FileList({
  folderId,
  className,
  onFileSelect,
  onFilePreview,
  onShare,
}: FileListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [selectedTargetFolderId, setSelectedTargetFolderId] = useState<string | null>(null)

  const { files, selectedFiles, viewMode, setSelectedFiles, setViewMode, setFiles, deleteFile } = useFileStore()
  const { addNotification } = useNotificationStore()

  // 过滤和排序文件
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = files

    // 按搜索查询过滤
    if (searchQuery) {
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // 按文件类型过滤
    if (filterType !== 'all') {
      filtered = filtered.filter(file => {
        const fileType = getFileType(file.name)
        return fileType === filterType
      })
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'size':
          aValue = a.size
          bValue = b.size
          break
        case 'type':
          aValue = getFileType(a.name)
          bValue = getFileType(b.name)
          break
        case 'createdAt':
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        case 'updatedAt':
          aValue = new Date(a.updatedAt)
          bValue = new Date(b.updatedAt)
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [files, searchQuery, filterType, sortField, sortOrder])

  const handleFileSelect = (file: File) => {
    if (selectedFiles.includes(file.id)) {
      setSelectedFiles(selectedFiles.filter(id => id !== file.id))
    } else {
      setSelectedFiles([...selectedFiles, file.id])
    }
    onFileSelect?.(file)
  }

  const handleFilePreview = (file: File) => {
    onFilePreview?.(file)
  }

  const handleFileDownload = (file: File) => {
    // 模拟下载
    addNotification({
      type: 'success',
      title: '下载开始',
      message: `正在下载文件 ${file.name}`,
    })
  }

  const handleFileShare = (file: File) => {
    onShare?.(file)
  }

  const handleFileRename = async (file: File) => {
    const newName = prompt('请输入新的文件名:', file.name)
    if (!newName || newName === file.name) return
    
    try {
      await fileAPI.renameFile(file.id, newName)
      // 更新本地状态
      const updatedFile = { ...file, name: newName }
      const updatedFiles = files.map(f => f.id === file.id ? updatedFile : f)
      setFiles(updatedFiles)
      
      addNotification({
        type: 'success',
        title: '重命名成功',
        message: `文件已重命名为 "${newName}"`,
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: '重命名失败',
        message: '文件重命名失败，请重试',
      })
    }
  }

  const handleFileDelete = async (file: File) => {
    try {
      const response = await fileAPI.deleteFile(file.id)
      if (response.success) {
        deleteFile(file.id)
        addNotification({
          type: 'success',
          title: '删除成功',
          message: `文件 ${file.name} 已删除`,
        })
      } else {
        throw new Error(response.error || '删除失败')
      }
    } catch (error: any) {
      console.error('Delete file failed:', error)
      addNotification({
        type: 'error',
        title: '删除失败',
        message: `删除文件 ${file.name} 失败: ${error.message || '未知错误'}`,
      })
    }
  }

  // 批量操作函数
  const handleBatchMove = () => {
    if (selectedFiles.length === 0) {
      addNotification({
        type: 'warning',
        title: '请选择文件',
        message: '请先选择要移动的文件',
      })
      return
    }
    setShowMoveDialog(true)
  }

  const handleConfirmMove = async () => {
    if (!selectedTargetFolderId) {
      addNotification({
        type: 'warning',
        title: '请选择目标文件夹',
        message: '请选择要移动到的文件夹',
      })
      return
    }

    try {
      const selectedFileObjects = files.filter(file => selectedFiles.includes(file.id))
      
      for (const file of selectedFileObjects) {
        await fileAPI.moveFile(file.id, selectedTargetFolderId)
      }

      // 更新本地状态 - 从当前列表中移除已移动的文件
      const remainingFiles = files.filter(file => !selectedFiles.includes(file.id))
      setFiles(remainingFiles)
      setSelectedFiles([])
      
      addNotification({
        type: 'success',
        title: '移动成功',
        message: `成功移动 ${selectedFiles.length} 个文件`,
      })
      
      setShowMoveDialog(false)
      setSelectedTargetFolderId(null)
    } catch (error: any) {
      console.error('Move files failed:', error)
      addNotification({
        type: 'error',
        title: '移动失败',
        message: `移动文件失败: ${error.message || '未知错误'}`,
      })
    }
  }

  const handleBatchDownload = async () => {
    if (selectedFiles.length === 0) {
      addNotification({
        type: 'warning',
        title: '请选择文件',
        message: '请先选择要下载的文件',
      })
      return
    }

    try {
      const selectedFileObjects = files.filter(file => selectedFiles.includes(file.id))
      
      // 模拟批量下载
      for (const file of selectedFileObjects) {
        // 这里应该调用实际的下载API
        console.log(`Downloading file: ${file.name}`)
      }
      
      addNotification({
        type: 'success',
        title: '下载开始',
        message: `正在下载 ${selectedFiles.length} 个文件`,
      })
      
      setSelectedFiles([])
    } catch (error: any) {
      console.error('Download files failed:', error)
      addNotification({
        type: 'error',
        title: '下载失败',
        message: `下载文件失败: ${error.message || '未知错误'}`,
      })
    }
  }

  const handleBatchDelete = async () => {
    if (selectedFiles.length === 0) {
      addNotification({
        type: 'warning',
        title: '请选择文件',
        message: '请先选择要删除的文件',
      })
      return
    }

    if (!confirm(`确定要删除选中的 ${selectedFiles.length} 个文件吗？此操作不可撤销。`)) {
      return
    }

    try {
      const selectedFileObjects = files.filter(file => selectedFiles.includes(file.id))
      
      for (const file of selectedFileObjects) {
        const response = await fileAPI.deleteFile(file.id)
        if (response.success) {
          deleteFile(file.id)
        } else {
          throw new Error(`删除文件 ${file.name} 失败: ${response.error || '未知错误'}`)
        }
      }
      
      addNotification({
        type: 'success',
        title: '删除成功',
        message: `成功删除 ${selectedFiles.length} 个文件`,
      })
      
      setSelectedFiles([])
    } catch (error: any) {
      console.error('Delete files failed:', error)
      addNotification({
        type: 'error',
        title: '删除失败',
        message: `删除文件失败: ${error.message || '未知错误'}`,
      })
    }
  }

  const handleSelectAll = () => {
    if (selectedFiles.length === filteredAndSortedFiles.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(filteredAndSortedFiles.map(file => file.id))
    }
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? (
      <SortAsc className="ml-1 h-3 w-3" />
    ) : (
      <SortDesc className="ml-1 h-3 w-3" />
    )
  }

  const getFilterIcon = (type: FilterType) => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />
      case 'video':
        return <Video className="h-4 w-4" />
      case 'audio':
        return <Music className="h-4 w-4" />
      case 'document':
        return <FileText className="h-4 w-4" />
      case 'archive':
        return <Archive className="h-4 w-4" />
      case 'code':
        return <Code className="h-4 w-4" />
      default:
        return <Filter className="h-4 w-4" />
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 工具栏 */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 搜索框 */}
        <div className="flex-1">
          <SearchInput
            placeholder="搜索文件..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="outlined"
            size="md"
          />
        </div>

        {/* 批量操作按钮 */}
        {selectedFiles.length > 0 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="flex items-center"
            >
              {selectedFiles.length === filteredAndSortedFiles.length ? (
                <CheckSquare className="mr-2 h-4 w-4" />
              ) : (
                <Square className="mr-2 h-4 w-4" />
              )}
              全选
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBatchMove}
              className="flex items-center"
            >
              <Move className="mr-2 h-4 w-4" />
              移动
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBatchDownload}
              className="flex items-center"
            >
              <Download className="mr-2 h-4 w-4" />
              下载
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBatchDelete}
              className="flex items-center text-red-600 hover:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </Button>
          </div>
        )}

        {/* 过滤器 */}
        <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
          <SelectTrigger className="w-full sm:w-40">
            <div className="flex items-center space-x-2">
              {getFilterIcon(filterType)}
              <span>
                {filterType === 'all' && '全部文件'}
                {filterType === 'image' && '图片'}
                {filterType === 'video' && '视频'}
                {filterType === 'audio' && '音频'}
                {filterType === 'document' && '文档'}
                {filterType === 'archive' && '压缩包'}
                {filterType === 'code' && '代码'}
              </span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center space-x-2">
                {getFilterIcon('all')}
                <span>全部文件</span>
              </div>
            </SelectItem>
            <SelectItem value="image">
              <div className="flex items-center space-x-2">
                {getFilterIcon('image')}
                <span>图片</span>
              </div>
            </SelectItem>
            <SelectItem value="video">
              <div className="flex items-center space-x-2">
                {getFilterIcon('video')}
                <span>视频</span>
              </div>
            </SelectItem>
            <SelectItem value="audio">
              <div className="flex items-center space-x-2">
                {getFilterIcon('audio')}
                <span>音频</span>
              </div>
            </SelectItem>
            <SelectItem value="document">
              <div className="flex items-center space-x-2">
                {getFilterIcon('document')}
                <span>文档</span>
              </div>
            </SelectItem>
            <SelectItem value="archive">
              <div className="flex items-center space-x-2">
                {getFilterIcon('archive')}
                <span>压缩包</span>
              </div>
            </SelectItem>
            <SelectItem value="code">
              <div className="flex items-center space-x-2">
                {getFilterIcon('code')}
                <span>代码</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* 视图切换 */}
        <div className="flex">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className="ml-1"
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 排序按钮 (仅在列表视图中显示) */}
      {viewMode === 'list' && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSort('name')}
            className="flex items-center"
          >
            名称
            {getSortIcon('name')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSort('size')}
            className="flex items-center"
          >
            大小
            {getSortIcon('size')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSort('type')}
            className="flex items-center"
          >
            类型
            {getSortIcon('type')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSort('updatedAt')}
            className="flex items-center"
          >
            修改时间
            {getSortIcon('updatedAt')}
          </Button>
        </div>
      )}

      {/* 文件列表 */}
      {filteredAndSortedFiles.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">暂无文件</h3>
          <p className="text-muted-foreground">
            {searchQuery || filterType !== 'all'
              ? '没有找到符合条件的文件'
              : '此文件夹为空，请上传文件'}
          </p>
        </div>
      ) : (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'
              : 'space-y-1'
          )}
        >
          <AnimatePresence>
            {filteredAndSortedFiles.map((file) => (
              <FileItem
                key={file.id}
                file={file}
                viewMode={viewMode}
                isSelected={selectedFiles.includes(file.id)}
                onSelect={handleFileSelect}
                onPreview={handleFilePreview}
                onDownload={handleFileDownload}
                onShare={handleFileShare}
                onRename={handleFileRename}
                onDelete={handleFileDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* 选中文件统计 */}
      {selectedFiles.length > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg">
          已选中 {selectedFiles.length} 个文件
        </div>
      )}

      {/* 移动文件对话框 */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>移动文件</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              将 {selectedFiles.length} 个文件移动到：
            </p>
            <FolderSelector
              selectedFolderId={selectedTargetFolderId}
              onFolderSelect={setSelectedTargetFolderId}
              title="选择目标文件夹"
              allowRoot={true}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowMoveDialog(false)
                  setSelectedTargetFolderId(null)
                }}
              >
                取消
              </Button>
              <Button
                onClick={handleConfirmMove}
                disabled={!selectedTargetFolderId}
              >
                移动
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}