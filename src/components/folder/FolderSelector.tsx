import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Check,
  Home,
  Plus,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { folderAPI } from '@/services/api';
import type { Folder as FolderType } from '@/types';

interface FolderSelectorProps {
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  trigger?: React.ReactNode;
  title?: string;
  allowRoot?: boolean;
  className?: string;
}

interface FolderNodeProps {
  folder: FolderType;
  level: number;
  isExpanded: boolean;
  onToggle: (folderId: string) => void;
  onSelect: (folderId: string | null) => void;
  selectedFolderId: string | null;
  expandedFolders: Set<string>;
}

function FolderNode({ folder, level, isExpanded, onToggle, onSelect, selectedFolderId, expandedFolders }: FolderNodeProps) {
  const hasChildren = folder.children && folder.children.length > 0;
  const isSelected = selectedFolderId === folder.id;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          'flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors',
          isSelected ? 'bg-blue-50 border border-blue-200 dark:bg-blue-900/50 dark:border-blue-700' : 'hover:bg-blue-100/70 hover:border-blue-200 dark:hover:bg-blue-800/30 dark:hover:border-blue-600',
          level > 0 && 'ml-4'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(folder.id)}
      >
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(folder.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        )}
        {!hasChildren && <div className="w-6" />}
        
        {isExpanded ? (
          <FolderOpen className="h-4 w-4 text-blue-600" />
        ) : (
          <Folder className="h-4 w-4 text-blue-600" />
        )}
        
        <span className="text-sm font-medium flex-1">{folder.name}</span>
        
        {isSelected && (
          <Check className="h-4 w-4 text-blue-600" />
        )}
      </motion.div>
      
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {folder.children?.map((child) => (
              <FolderNode
                key={child.id}
                folder={child}
                level={level + 1}
                isExpanded={expandedFolders.has(child.id)}
                onToggle={onToggle}
                onSelect={onSelect}
                selectedFolderId={selectedFolderId}
                expandedFolders={expandedFolders}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FolderSelector({
  selectedFolderId,
  onFolderSelect,
  trigger,
  title = "选择文件夹",
  allowRoot = true,
  className
}: FolderSelectorProps) {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelectedFolderId, setTempSelectedFolderId] = useState<string | null>(selectedFolderId);

  // 加载文件夹列表
  const loadFolders = async () => {
    setLoading(true);
    try {
      const response = await folderAPI.getFolders();
      if (response.success && response.data) {
        setFolders(response.data);
        // 默认展开根文件夹
        const rootFolders = response.data.filter(f => !f.parentId);
        setExpandedFolders(new Set(rootFolders.map(f => f.id)));
      }
    } catch (error) {
      console.error('加载文件夹失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 切换文件夹展开状态
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  // 选择文件夹
  const selectFolder = (folderId: string | null) => {
    setTempSelectedFolderId(folderId);
  };

  // 确认选择
  const handleConfirm = () => {
    onFolderSelect(tempSelectedFolderId);
    setIsOpen(false);
  };

  // 取消选择
  const handleCancel = () => {
    setTempSelectedFolderId(selectedFolderId);
    setIsOpen(false);
  };

  // 构建文件夹树结构
  const buildFolderTree = (folders: FolderType[]): FolderType[] => {
    if (!folders || !Array.isArray(folders)) {
      return [];
    }

    const folderMap = new Map<string, FolderType>();
    const rootFolders: FolderType[] = [];

    // 创建文件夹映射
    folders.forEach((folder) => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    // 构建树结构
    folders.forEach((folder) => {
      const folderNode = folderMap.get(folder.id)!;
      if (folder.parentId && folderMap.has(folder.parentId)) {
        const parent = folderMap.get(folder.parentId)!;
        parent.children!.push(folderNode);
      } else {
        rootFolders.push(folderNode);
      }
    });

    return rootFolders;
  };

  // 过滤文件夹
  const filterFolders = (folders: FolderType[], query: string): FolderType[] => {
    if (!query) return folders;
    
    return folders.filter(folder => {
      const matchesName = folder.name.toLowerCase().includes(query.toLowerCase());
      const hasMatchingChildren = folder.children && filterFolders(folder.children, query).length > 0;
      return matchesName || hasMatchingChildren;
    }).map(folder => ({
      ...folder,
      children: folder.children ? filterFolders(folder.children, query) : undefined
    }));
  };

  const folderTree = buildFolderTree(folders);
  const filteredFolders = filterFolders(folderTree, searchQuery);

  // 获取选中文件夹的名称
  const getSelectedFolderName = () => {
    if (!selectedFolderId) return allowRoot ? '根目录' : '未选择';
    
    const findFolder = (folders: FolderType[], id: string): FolderType | null => {
      for (const folder of folders) {
        if (folder.id === id) return folder;
        if (folder.children) {
          const found = findFolder(folder.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    
    const folder = findFolder(folders, selectedFolderId);
    return folder ? folder.name : '未知文件夹';
  };

  useEffect(() => {
    if (isOpen) {
      loadFolders();
      setTempSelectedFolderId(selectedFolderId);
    }
  }, [isOpen, selectedFolderId]);

  const defaultTrigger = (
    <Button variant="outline" className={className}>
      <Folder className="h-4 w-4 mr-2" />
      {getSelectedFolderName()}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 搜索 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索文件夹..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 文件夹列表 */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="text-sm text-gray-500">加载中...</div>
                  </div>
                ) : (
                  <>
                    {/* 根目录选项 */}
                    {allowRoot && (
                      <motion.div
                        className={cn(
                          'flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors',
                          tempSelectedFolderId === null ? 'bg-blue-50 border border-blue-200 dark:bg-blue-900/50 dark:border-blue-700' : 'hover:bg-blue-100/70 dark:hover:bg-blue-800/30'
                        )}
                        onClick={() => selectFolder(null)}
                      >
                        <Home className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium flex-1">根目录</span>
                        {tempSelectedFolderId === null && (
                          <Check className="h-4 w-4 text-blue-600" />
                        )}
                      </motion.div>
                    )}
                    
                    {/* 文件夹树 */}
                    {filteredFolders.map((folder) => (
                      <FolderNode
                        key={folder.id}
                        folder={folder}
                        level={0}
                        isExpanded={expandedFolders.has(folder.id)}
                        onToggle={toggleFolder}
                        onSelect={selectFolder}
                        selectedFolderId={tempSelectedFolderId}
                        expandedFolders={expandedFolders}
                      />
                    ))}
                    
                    {filteredFolders.length === 0 && !loading && (
                      <div className="text-center py-4 text-gray-500">
                        <Folder className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">没有找到文件夹</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              取消
            </Button>
            <Button onClick={handleConfirm}>
              确认选择
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}