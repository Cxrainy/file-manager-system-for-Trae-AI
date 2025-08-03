import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  FolderPlus,
  Move,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { FolderSelector } from '@/components/folder/FolderSelector'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Folder as FolderType } from '@/types'

interface FolderTreeProps {
  folders: FolderType[]
  selectedFolderId?: string | null
  onFolderSelect: (folder: FolderType) => void
  onCreateFolder: (parentId: string | null) => void
  onEditFolder: (folder: FolderType) => void
  onDeleteFolder: (folder: FolderType) => void
  onMoveFolder?: (folder: FolderType, targetFolderId: string | null) => void
  className?: string
}

interface FolderNodeProps {
  folder: FolderType
  level: number
  isSelected: boolean
  onSelect: (folder: FolderType) => void
  onCreateFolder: (parentId: string) => void
  onEditFolder: (folder: FolderType) => void
  onDeleteFolder: (folder: FolderType) => void
  onMoveFolder?: (folder: FolderType, targetFolderId: string | null) => void
  allFolders: FolderType[]
}

function FolderNode({
  folder,
  level,
  isSelected,
  onSelect,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onMoveFolder,
  allFolders,
}: FolderNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [selectedTargetFolderId, setSelectedTargetFolderId] = useState<string | null>(null)
  const hasChildren = folder.children && folder.children.length > 0

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasChildren) {
      setIsExpanded(!isExpanded)
    }
  }

  // 处理移动文件夹
  const handleMoveFolder = () => {
    setShowMoveDialog(true)
  }

  // 确认移动文件夹
  const handleConfirmMove = () => {
    if (onMoveFolder && selectedTargetFolderId !== folder.id) {
      onMoveFolder(folder, selectedTargetFolderId)
    }
    setShowMoveDialog(false)
    setSelectedTargetFolderId(null)
  }

  // 获取可移动的目标文件夹（排除自身和子文件夹）
  const getAvailableFolders = () => {
    const getDescendantIds = (folderId: string): string[] => {
      const descendants: string[] = []
      const findDescendants = (folders: FolderType[], parentId: string | null) => {
        folders.forEach(f => {
          if (f.parentId === parentId) {
            descendants.push(f.id)
            findDescendants(folders, f.id)
          }
        })
      }
      findDescendants(allFolders, folderId)
      return descendants
    }

    const excludeIds = [folder.id, ...getDescendantIds(folder.id)]
    return allFolders.filter(f => !excludeIds.includes(f.id))
  }

  // 检查是否可以移动（根目录下的一级文件夹不能移动）
  const canMoveFolder = folder.parentId !== null

  const handleSelect = () => {
    onSelect(folder)
  }

  const handleCreateSubfolder = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCreateFolder(folder.id)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEditFolder(folder)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDeleteFolder(folder)
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: level * 0.05 }}
        className={cn(
          'group flex items-center rounded-lg px-2 py-1.5 text-sm cursor-pointer transition-colors',
          isSelected
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-accent hover:text-accent-foreground',
          level > 0 && 'ml-4'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleSelect}
      >
        {/* 展开/折叠按钮 */}
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 p-0 mr-1"
          onClick={handleToggle}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )
          ) : (
            <div className="h-3 w-3" />
          )}
        </Button>

        {/* 文件夹图标 */}
        {isExpanded && hasChildren ? (
          <FolderOpen className="h-4 w-4 mr-2 flex-shrink-0" />
        ) : (
          <Folder className="h-4 w-4 mr-2 flex-shrink-0" />
        )}

        {/* 文件夹名称 */}
        <span className="flex-1 truncate">{folder.name}</span>

        {/* 操作菜单 */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCreateSubfolder}>
                <FolderPlus className="mr-2 h-4 w-4" />
                创建子文件夹
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                重命名
              </DropdownMenuItem>
              {onMoveFolder && canMoveFolder && (
                <DropdownMenuItem onClick={handleMoveFolder}>
                  <Move className="mr-2 h-4 w-4" />
                  移动
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* 子文件夹 */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {folder.children!.map((child) => (
              <FolderNode
                key={child.id}
                folder={child}
                level={level + 1}
                isSelected={child.id === folder.id}
                onSelect={onSelect}
                onCreateFolder={onCreateFolder}
                onEditFolder={onEditFolder}
                onDeleteFolder={onDeleteFolder}
                onMoveFolder={onMoveFolder}
                allFolders={allFolders}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 移动文件夹对话框 */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>移动文件夹</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              选择要移动到的目标文件夹：
            </p>
            <FolderSelector
              folders={getAvailableFolders()}
              selectedFolderId={selectedTargetFolderId}
              onFolderSelect={setSelectedTargetFolderId}
              allowRoot
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowMoveDialog(false)}
              >
                取消
              </Button>
              <Button onClick={handleConfirmMove}>
                确认移动
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function FolderTree({
  folders,
  selectedFolderId,
  onFolderSelect,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onMoveFolder,
  className,
}: FolderTreeProps) {
  // 构建文件夹树结构
  const buildFolderTree = (folders: FolderType[]): FolderType[] => {
    // 添加空值检查
    if (!folders || !Array.isArray(folders)) {
      return []
    }

    const folderMap = new Map<string, FolderType>()
    const rootFolders: FolderType[] = []

    // 创建文件夹映射
    folders.forEach((folder) => {
      folderMap.set(folder.id, { ...folder, children: [] })
    })

    // 构建树结构
    folders.forEach((folder) => {
      const folderNode = folderMap.get(folder.id)!
      if (folder.parentId && folderMap.has(folder.parentId)) {
        const parent = folderMap.get(folder.parentId)!
        parent.children!.push(folderNode)
      } else {
        rootFolders.push(folderNode)
      }
    })

    return rootFolders
  }

  const folderTree = buildFolderTree(folders)

  return (
    <div className={cn('space-y-1', className)}>
      {/* 创建根文件夹按钮 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">文件夹</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onCreateFolder(null)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* 文件夹树 */}
      {folderTree.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">暂无文件夹</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => onCreateFolder(null)}
          >
            <Plus className="h-4 w-4 mr-1" />
            创建文件夹
          </Button>
        </div>
      ) : (
        <div className="space-y-1">
          {folderTree.map((folder) => (
            <FolderNode
              key={folder.id}
              folder={folder}
              level={0}
              isSelected={folder.id === selectedFolderId}
              onSelect={onFolderSelect}
              onCreateFolder={onCreateFolder}
              onEditFolder={onEditFolder}
              onDeleteFolder={onDeleteFolder}
              onMoveFolder={onMoveFolder}
              allFolders={folders}
            />
          ))}
        </div>
      )}
    </div>
  )
}