import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Upload,
  FolderPlus,
  Search,
  Filter,
  MoreHorizontal,
  ArrowLeft,
  Home,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PageWrapper } from '@/components/layout/Layout'
import { FolderTree } from '@/components/folder/FolderTree'
import { FileList } from '@/components/file/FileList'
import { FilePreview } from '@/components/file/FilePreview'
import { FileUpload } from '@/components/upload/FileUpload'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DialogInput } from '@/components/ui/dialog-input'
import { cn } from '@/lib/utils'
import { useFolderStore, useFileStore, useNotificationStore, usePreviewStore } from '@/store'
import { folderAPI, fileAPI } from '@/services/api'
import type { Folder, File } from '@/types'
import ShareDialog from '@/components/file/ShareDialog'

interface BreadcrumbItem {
  id: string
  name: string
  href?: string
}

export function FileManager() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSidebar, setShowSidebar] = useState(true)
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [isEditFolderOpen, setIsEditFolderOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)
  const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [shareFile, setShareFile] = useState<File | null>(null)

  const { folders, setFolders, addFolder } = useFolderStore()
  const { files, setFiles } = useFileStore()
  const { addNotification } = useNotificationStore()
  const { canPreviewFile } = usePreviewStore()

  // 加载指定文件夹的文件
  const loadFilesForFolder = useCallback(async (folderId: string | null) => {
    try {
      const response = await fileAPI.getFiles(folderId || undefined)
      if (response.success && response.data) {
        setFiles(response.data)
      }
    } catch (error) {
      console.error('Failed to load files for folder:', error)
      addNotification({
        type: 'error',
        title: '加载失败',
        message: '无法加载文件列表',
      })
    }
  }, [setFiles, addNotification])

  // 加载文件夹和文件
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // 加载文件夹
        const foldersResponse = await folderAPI.getFolders()
        if (foldersResponse.success && foldersResponse.data) {
          setFolders(foldersResponse.data)
        }

        // 加载当前文件夹的文件
        await loadFilesForFolder(currentFolderId)
      } catch (error) {
        console.error('Failed to load data:', error)
        addNotification({
          type: 'error',
          title: '加载失败',
          message: '无法加载文件夹和文件列表',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [loadFilesForFolder, currentFolderId])

  // 获取当前文件夹
  const currentFolder = currentFolderId
    ? folders.find(f => f.id === currentFolderId)
    : null

  // 生成面包屑导航
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [
      { id: 'root', name: '根目录', href: '/' }
    ]

    if (currentFolder) {
      // 在实际应用中，这里需要递归获取父文件夹路径
      breadcrumbs.push({
        id: currentFolder.id,
        name: currentFolder.name
      })
    }

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  // 处理文件夹选择
  const handleFolderSelect = (folder: Folder) => {
    setCurrentFolderId(folder.id)
    // 立即加载该文件夹下的文件
    loadFilesForFolder(folder.id)
  }



  // 处理文件选择
  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
  }

  // 处理文件预览
  const handleFilePreview = (file: File) => {
    if (!canPreviewFile(file.name, file.size)) {
      addNotification({
        type: 'warning',
        title: '无法预览',
        message: '此文件类型不支持预览或文件过大'
      })
      return
    }
    setSelectedFile(file)
    setIsPreviewOpen(true)
  }

  // 处理文件下载
  const handleFileDownload = (file: File) => {
    addNotification({
      type: 'success',
      title: '下载开始',
      message: `正在下载文件 ${file.name}`,
    })
  }

  // 处理文件分享
  const handleFileShare = (file: File) => {
    setShareFile(file)
    setIsShareDialogOpen(true)
  }

  // 创建新文件夹
  const handleCreateFolder = (parentId: string | null = null) => {
    setCreateFolderParentId(parentId || currentFolderId)
    setIsCreateFolderOpen(true)
  }

  // 确认创建文件夹
  const handleConfirmCreateFolder = async (folderName: string) => {
    try {
      const response = await folderAPI.createFolder({
        name: folderName,
        parentId: createFolderParentId,
      })
      if (response.success && response.data) {
        // 重新加载文件夹列表以确保数据同步
        const foldersResponse = await folderAPI.getFolders()
        if (foldersResponse.success && foldersResponse.data) {
          setFolders(foldersResponse.data)
        }
        
        addNotification({
          type: 'success',
          title: '文件夹创建成功',
          message: `文件夹 "${folderName}" 已创建`,
        })
        
        setIsCreateFolderOpen(false)
      }
    } catch (error: any) {
      console.error('Failed to create folder:', error)
      
      let errorMessage = '无法创建文件夹'
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      addNotification({
        type: 'error',
        title: '创建失败',
        message: errorMessage,
      })
    }
  }

  // 编辑文件夹
  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder)
    setIsEditFolderOpen(true)
  }

  // 确认编辑文件夹
  const handleConfirmEditFolder = async (newName: string) => {
    if (!editingFolder || newName === editingFolder.name) return

    try {
      const response = await folderAPI.updateFolder(editingFolder.id, {
        name: newName,
      })
      if (response.success) {
        // 重新加载文件夹列表
        const foldersResponse = await folderAPI.getFolders()
        if (foldersResponse.success && foldersResponse.data) {
          setFolders(foldersResponse.data)
        }
        addNotification({
          type: 'success',
          title: '重命名成功',
          message: `文件夹已重命名为 "${newName}"`,
        })
      }
    } catch (error) {
      console.error('Failed to update folder:', error)
      addNotification({
        type: 'error',
        title: '重命名失败',
        message: '无法重命名文件夹',
      })
    }
  }

  // 删除文件夹
  const handleDeleteFolder = async (folder: Folder) => {
    if (confirm(`确定要删除文件夹 "${folder.name}" 吗？此操作不可撤销。`)) {
      try {
        const response = await folderAPI.deleteFolder(folder.id)
        if (response.success) {
          // 重新加载文件夹列表
          const foldersResponse = await folderAPI.getFolders()
          if (foldersResponse.success && foldersResponse.data) {
            setFolders(foldersResponse.data)
          }
          // 如果删除的是当前文件夹，返回上级
          if (currentFolderId === folder.id) {
            setCurrentFolderId(folder.parentId || null)
          }
          addNotification({
            type: 'success',
            title: '删除成功',
            message: `文件夹 "${folder.name}" 已删除`,
          })
        }
      } catch (error) {
        console.error('Failed to delete folder:', error)
        addNotification({
          type: 'error',
          title: '删除失败',
          message: '无法删除文件夹',
        })
      }
    }
  }

  // 移动文件夹
  const handleMoveFolder = async (folder: Folder, targetFolderId: string | null) => {
    try {
      const response = await folderAPI.updateFolder(folder.id, {
        parentId: targetFolderId,
      })
      if (response.success) {
        // 重新加载文件夹列表
        const foldersResponse = await folderAPI.getFolders()
        if (foldersResponse.success && foldersResponse.data) {
          setFolders(foldersResponse.data)
        }
        addNotification({
          type: 'success',
          title: '移动成功',
          message: `文件夹 "${folder.name}" 已移动`,
        })
      }
    } catch (error) {
      console.error('Failed to move folder:', error)
      addNotification({
        type: 'error',
        title: '移动失败',
        message: '无法移动文件夹',
      })
    }
  }

  // 导航到上级目录
  const handleGoBack = () => {
    const parentId = currentFolder?.parentId || null
    setCurrentFolderId(parentId)
    loadFilesForFolder(parentId)
  }

  // 导航到根目录
  const handleGoHome = () => {
    setCurrentFolderId(null)
    loadFilesForFolder(null)
  }

  // 面包屑点击处理
  const handleBreadcrumbClick = (item: BreadcrumbItem) => {
    const folderId = item.id === 'root' ? null : item.id
    setCurrentFolderId(folderId)
    loadFilesForFolder(folderId)
  }

  return (
    <PageWrapper
      title="文件管理"
      breadcrumbs={[
        { label: '首页', href: '/' },
        { label: '文件管理', href: '/files' },
      ]}
    >
      <div className="h-full flex flex-col">
        {/* 工具栏 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* 导航按钮 */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoBack}
              disabled={!currentFolderId}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoHome}
              disabled={!currentFolderId}
            >
              <Home className="h-4 w-4" />
            </Button>
          </div>

          {/* 面包屑导航 */}
          <div className="flex items-center space-x-1 flex-1 min-w-0">
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <button
                  onClick={() => handleBreadcrumbClick(item)}
                  className={cn(
                    'text-sm px-2 py-1 rounded hover:bg-accent truncate',
                    index === breadcrumbs.length - 1
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {item.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* 搜索框 */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索文件和文件夹..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center space-x-2">
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              上传
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  新建
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleCreateFolder()}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  新建文件夹
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsUploadDialogOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  上传文件
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSidebar(!showSidebar)}
              className="sm:hidden"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="flex-1 flex gap-6 min-h-0">
          {/* 侧边栏 - 文件夹树 */}
          <motion.div
            initial={false}
            animate={{
              width: showSidebar ? 280 : 0,
              opacity: showSidebar ? 1 : 0,
            }}
            className={cn(
              'flex-shrink-0 overflow-hidden',
              !showSidebar && 'hidden sm:block'
            )}
          >
            <div className="w-70 h-full">
              <div className="bg-card border rounded-lg p-4 h-full overflow-auto">
                <h3 className="font-medium mb-4 flex items-center">
                  <FolderPlus className="mr-2 h-4 w-4" />
                  文件夹
                </h3>
                <FolderTree
                  folders={folders}
                  selectedFolderId={currentFolderId}
                  onFolderSelect={handleFolderSelect}
                  onCreateFolder={handleCreateFolder}
                  onEditFolder={handleEditFolder}
                  onDeleteFolder={handleDeleteFolder}
                  onMoveFolder={handleMoveFolder}
                />
              </div>
            </div>
          </motion.div>

          {/* 主内容区 - 文件列表 */}
          <div className="flex-1 min-w-0">
            <div className="bg-card border rounded-lg p-4 h-full">
              <FileList
                folderId={currentFolderId}
                onFileSelect={handleFileSelect}
                onFilePreview={handleFilePreview}
                onShare={handleFileShare}
              />
            </div>
          </div>
        </div>

        {/* 文件预览对话框 */}
        <FilePreview
          file={selectedFile}
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false)
            setSelectedFile(null)
          }}
          onDownload={handleFileDownload}
          onShare={handleFileShare}
        />

        {/* 文件上传对话框 */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>上传文件</DialogTitle>
            </DialogHeader>
            <FileUpload
              onUploadComplete={(files) => {
                addNotification({
                  type: 'success',
                  title: '上传完成',
                  message: `成功上传 ${files.length} 个文件`,
                })
                setIsUploadDialogOpen(false)
              }}
            />
          </DialogContent>
        </Dialog>

        {/* 创建文件夹对话框 */}
         <DialogInput
           open={isCreateFolderOpen}
           onOpenChange={setIsCreateFolderOpen}
           title="创建文件夹"
           label="文件夹名称"
           placeholder="请输入文件夹名称"
           onConfirm={handleConfirmCreateFolder}
         />

         {/* 编辑文件夹对话框 */}
         <DialogInput
           open={isEditFolderOpen}
           onOpenChange={setIsEditFolderOpen}
           title="重命名文件夹"
           label="文件夹名称"
           placeholder="请输入新的文件夹名称"
           defaultValue={editingFolder?.name}
           onConfirm={handleConfirmEditFolder}
         />

         {/* 文件分享对话框 */}
          <ShareDialog
            file={shareFile}
            open={isShareDialogOpen}
            onOpenChange={(open) => {
              setIsShareDialogOpen(open)
              if (!open) {
                setShareFile(null)
              }
            }}
          />
      </div>
    </PageWrapper>
  )
}