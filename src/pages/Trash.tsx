import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trash2,
  RotateCcw,
  X,
  AlertTriangle,
  FileText,
  Folder,
  Calendar,
  Clock,
  Search,
  Filter,
  CheckSquare,
  Square,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageWrapper } from '@/components/layout/Layout'
import { cn, formatFileSize, formatDate, getFileIcon } from '@/lib/utils'
import { useNotificationStore } from '@/store'
import { trashAPI } from '@/services/api'

interface TrashItem {
  id: string
  name: string
  type: 'file' | 'folder'
  size?: number
  originalPath: string
  deletedAt: string
  deletedBy: string
  autoDeleteAt?: string
}

interface TrashItemProps {
  item: TrashItem
  isSelected: boolean
  onSelect: (id: string) => void
  onRestore: (item: TrashItem) => void
  onPermanentDelete: (item: TrashItem) => void
}

type SortBy = 'name' | 'deletedAt' | 'size' | 'type'
type FilterBy = 'all' | 'files' | 'folders'

function TrashItemComponent({
  item,
  isSelected,
  onSelect,
  onRestore,
  onPermanentDelete,
}: TrashItemProps) {
  const getIcon = () => {
    if (item.type === 'folder') {
      return <Folder className="h-8 w-8 text-blue-500" />
    }
    return <span className="text-2xl">{getFileIcon(item.name)}</span>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'flex items-center space-x-4 p-4 border rounded-lg hover:bg-accent',
        isSelected && 'bg-accent ring-2 ring-primary'
      )}
    >
      {/* 选择框 */}
      <button
        onClick={() => onSelect(item.id)}
        className="flex-shrink-0"
      >
        {isSelected ? (
          <CheckSquare className="h-5 w-5 text-primary" />
        ) : (
          <Square className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* 图标 */}
      <div className="flex-shrink-0">{getIcon()}</div>

      {/* 文件信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium text-foreground truncate">{item.name}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            {item.type === 'file' ? '文件' : '文件夹'}
          </span>
        </div>
        <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
          <span className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>删除于 {formatDate(item.deletedAt)}</span>
          </span>
          <span className="truncate">原路径: {item.originalPath}</span>
          {item.size && (
            <span>{formatFileSize(item.size)}</span>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRestore(item)}
          className="text-green-600 hover:text-green-700"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          恢复
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPermanentDelete(item)}
          className="text-red-600 hover:text-red-700"
        >
          <X className="h-4 w-4 mr-1" />
          永久删除
        </Button>
      </div>
    </motion.div>
  )
}

export function Trash() {
  const [trashItems, setTrashItems] = useState<TrashItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('deletedAt')
  const [filterBy, setFilterBy] = useState<FilterBy>('all')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'restore' | 'delete' | 'empty'
    items: TrashItem[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  const { addNotification } = useNotificationStore()

  // 加载回收站数据
  const loadTrashItems = async () => {
    try {
      setLoading(true)
      console.log('开始加载回收站数据')
      const response = await trashAPI.getTrashItems()
      console.log('回收站数据加载完成:', response)
      
      if (response.success && response.data) {
        setTrashItems(response.data)
        addNotification({
          type: 'success',
          title: '加载成功',
          message: `找到 ${response.data.length} 个回收站项目`,
        })
      } else {
        throw new Error(response.error || '获取回收站数据失败')
      }
    } catch (error: any) {
      console.error('加载回收站数据失败:', error)
      
      // 如果是认证错误，不显示错误通知
      if (error.response?.status === 401) {
        return
      }
      
      addNotification({
        type: 'error',
        title: '加载失败',
        message: error.message || '无法加载回收站数据',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTrashItems()
  }, [])

  // 过滤和排序
  const filteredAndSortedItems = React.useMemo(() => {
    let filtered = trashItems

    // 搜索过滤
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.originalPath.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // 类型过滤
    if (filterBy === 'files') {
      filtered = filtered.filter(item => item.type === 'file')
    } else if (filterBy === 'folders') {
      filtered = filtered.filter(item => item.type === 'folder')
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'size':
          return (b.size || 0) - (a.size || 0)
        case 'type':
          return a.type.localeCompare(b.type)
        case 'deletedAt':
        default:
          return new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
      }
    })

    return filtered
  }, [trashItems, searchQuery, sortBy, filterBy])

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedItems.size === filteredAndSortedItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredAndSortedItems.map(item => item.id)))
    }
  }

  const handleRestore = (item: TrashItem) => {
    setConfirmAction({ type: 'restore', items: [item] })
    setShowConfirmDialog(true)
  }

  const handlePermanentDelete = (item: TrashItem) => {
    setConfirmAction({ type: 'delete', items: [item] })
    setShowConfirmDialog(true)
  }

  const handleBatchRestore = () => {
    const items = trashItems.filter(item => selectedItems.has(item.id))
    setConfirmAction({ type: 'restore', items })
    setShowConfirmDialog(true)
  }

  const handleBatchDelete = () => {
    const items = trashItems.filter(item => selectedItems.has(item.id))
    setConfirmAction({ type: 'delete', items })
    setShowConfirmDialog(true)
  }

  const handleEmptyTrash = () => {
    setConfirmAction({ type: 'empty', items: trashItems })
    setShowConfirmDialog(true)
  }

  const executeAction = async () => {
    if (!confirmAction) return

    const { type, items } = confirmAction
    const itemIds = items.map(item => item.id)

    try {
      let response
      let successMessage = ''

      switch (type) {
        case 'restore':
          response = await trashAPI.restoreItems(itemIds)
          successMessage = `已恢复 ${items.length} 个项目`
          break
        case 'delete':
          response = await trashAPI.permanentDelete(itemIds)
          successMessage = `已永久删除 ${items.length} 个项目`
          break
        case 'empty':
          response = await trashAPI.emptyTrash()
          successMessage = '回收站已清空'
          break
      }

      if (response?.success) {
        addNotification({
          type: 'success',
          title: '操作成功',
          message: response.message || successMessage,
        })
        
        // 重新加载数据
        await loadTrashItems()
        setSelectedItems(new Set())
      } else {
        throw new Error(response?.error || '操作失败')
      }
    } catch (error: any) {
      console.error('操作失败:', error)
      addNotification({
        type: 'error',
        title: '操作失败',
        message: error.message || '操作失败，请重试',
      })
    } finally {
      setShowConfirmDialog(false)
      setConfirmAction(null)
    }
  }

  const getConfirmDialogContent = () => {
    if (!confirmAction) return { title: '', description: '' }

    const { type, items } = confirmAction
    const count = items.length

    switch (type) {
      case 'restore':
        return {
          title: '确认恢复',
          description: `确定要恢复 ${count} 个项目吗？这些项目将被恢复到原来的位置。`,
        }
      case 'delete':
        return {
          title: '确认永久删除',
          description: `确定要永久删除 ${count} 个项目吗？此操作无法撤销。`,
        }
      case 'empty':
        return {
          title: '确认清空回收站',
          description: `确定要清空整个回收站吗？这将永久删除所有 ${count} 个项目，此操作无法撤销。`,
        }
      default:
        return { title: '', description: '' }
    }
  }

  const { title: dialogTitle, description: dialogDescription } = getConfirmDialogContent()

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">加载回收站数据中...</p>
          </div>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Trash2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">回收站</h1>
              <p className="text-muted-foreground">
                管理已删除的文件和文件夹，共 {trashItems.length} 个项目
              </p>
            </div>
          </div>
        </div>

        {/* 工具栏 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* 搜索 */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索文件名或路径..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* 过滤器 */}
              <div className="flex gap-2">
                <Select value={filterBy} onValueChange={(value: FilterBy) => setFilterBy(value)}>
                  <SelectTrigger className="w-32">
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4" />
                      <span>
                        {filterBy === 'all' && '全部'}
                        {filterBy === 'files' && '文件'}
                        {filterBy === 'folders' && '文件夹'}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="files">文件</SelectItem>
                    <SelectItem value="folders">文件夹</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deletedAt">删除时间</SelectItem>
                    <SelectItem value="name">名称</SelectItem>
                    <SelectItem value="type">类型</SelectItem>
                    <SelectItem value="size">大小</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 批量操作 */}
            {filteredAndSortedItems.length > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedItems.size === filteredAndSortedItems.length ? (
                      <CheckSquare className="h-4 w-4 mr-2" />
                    ) : (
                      <Square className="h-4 w-4 mr-2" />
                    )}
                    {selectedItems.size === filteredAndSortedItems.length ? '取消全选' : '全选'}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    已选择 {selectedItems.size} / {filteredAndSortedItems.length} 个项目
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {selectedItems.size > 0 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBatchRestore}
                        className="text-green-600 hover:text-green-700"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        批量恢复
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBatchDelete}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4 mr-2" />
                        批量删除
                      </Button>
                    </>
                  )}
                  {trashItems.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleEmptyTrash}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      清空回收站
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 回收站内容 */}
        <Card>
          <CardContent className="p-6">
            {filteredAndSortedItems.length === 0 ? (
              <div className="text-center py-12">
                <Trash2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {trashItems.length === 0 ? '回收站为空' : '没有找到匹配的项目'}
                </h3>
                <p className="text-muted-foreground">
                  {trashItems.length === 0
                    ? '删除的文件和文件夹将出现在这里'
                    : '尝试调整搜索条件或过滤器'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {filteredAndSortedItems.map((item) => (
                    <TrashItemComponent
                      key={item.id}
                      item={item}
                      isSelected={selectedItems.has(item.id)}
                      onSelect={handleSelectItem}
                      onRestore={handleRestore}
                      onPermanentDelete={handlePermanentDelete}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 确认对话框 */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>{dialogTitle}</span>
            </DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              取消
            </Button>
            <Button
              variant={confirmAction?.type === 'restore' ? 'default' : 'destructive'}
              onClick={executeAction}
            >
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  )
}