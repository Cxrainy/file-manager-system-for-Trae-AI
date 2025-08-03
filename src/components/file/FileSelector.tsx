import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  FolderOpen,
  File as FileIcon,
  ChevronRight,
  ChevronDown,
  Check,
  Upload,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Search,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { fileAPI, folderAPI } from '@/services/api';
import type { File, Folder as FolderType } from '@/types';

interface FileSelectorProps {
  selectedFiles: string[];
  onFileSelectionChange: (fileIds: string[]) => void;
  allowMultiple?: boolean;
  showUpload?: boolean;
  onUpload?: (files: FileList) => void;
  className?: string;
}

interface FolderNodeProps {
  folder: FolderType;
  level: number;
  isExpanded: boolean;
  onToggle: (folderId: string) => void;
  onSelect: (folderId: string) => void;
  selectedFolderId: string | null;
  expandedFolders: Set<string>;
}

interface FileItemProps {
  file: File;
  isSelected: boolean;
  onToggle: (fileId: string) => void;
  allowMultiple: boolean;
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
        
        <span className="text-sm font-medium">{folder.name}</span>
        
        {folder.children && folder.children.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {folder.children.length}
          </Badge>
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

function FileItem({ file, isSelected, onToggle, allowMultiple }: FileItemProps) {
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4 text-green-600" />;
    if (mimeType.startsWith('video/')) return <Video className="h-4 w-4 text-purple-600" />;
    if (mimeType.startsWith('audio/')) return <Music className="h-4 w-4 text-pink-600" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="h-4 w-4 text-orange-600" />;
    if (mimeType.includes('text') || mimeType.includes('document')) return <FileText className="h-4 w-4 text-blue-600" />;
    return <FileIcon className="h-4 w-4 text-gray-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all',
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-sm dark:border-blue-400 dark:bg-blue-900/50'
          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-100/70 dark:border-gray-700 dark:hover:border-blue-500 dark:hover:bg-blue-800/30'
      )}
      onClick={() => onToggle(file.id)}
    >
      {allowMultiple && (
        <Checkbox
          checked={isSelected}
          onChange={() => onToggle(file.id)}
          className="mr-2"
        />
      )}
      
      {getFileIcon(file.mimeType)}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-gray-500">
          {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString('zh-CN')}
        </p>
      </div>
      
      {isSelected && (
        <Check className="h-4 w-4 text-blue-600" />
      )}
    </motion.div>
  );
}

export function FileSelector({
  selectedFiles,
  onFileSelectionChange,
  allowMultiple = true,
  showUpload = true,
  onUpload,
  className
}: FileSelectorProps) {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // 加载文件夹列表
  const loadFolders = async () => {
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
    }
  };

  // 加载指定文件夹的文件
  const loadFiles = async (folderId: string | null = null) => {
    setLoading(true);
    try {
      const response = await fileAPI.getFiles(folderId || undefined);
      if (response.success && response.data) {
        setFiles(response.data);
      }
    } catch (error) {
      console.error('加载文件失败:', error);
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
  const selectFolder = (folderId: string) => {
    setSelectedFolderId(folderId);
    loadFiles(folderId);
  };

  // 切换文件选择
  const toggleFileSelection = (fileId: string) => {
    if (allowMultiple) {
      const newSelection = selectedFiles.includes(fileId)
        ? selectedFiles.filter(id => id !== fileId)
        : [...selectedFiles, fileId];
      onFileSelectionChange(newSelection);
    } else {
      onFileSelectionChange(selectedFiles.includes(fileId) ? [] : [fileId]);
    }
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

  const folderTree = buildFolderTree(folders);

  // 过滤文件
  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && onUpload) {
      onUpload(files);
    }
    // 重置input值以允许重复选择同一文件
    event.target.value = '';
  };

  useEffect(() => {
    loadFolders();
    loadFiles(); // 加载根目录文件
  }, []);

  return (
    <div className={cn('space-y-4', className)}>
      {/* 搜索和上传 */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索文件..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {showUpload && (
          <div className="relative">
            <input
              type="file"
              multiple={allowMultiple}
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline" className="relative">
              <Upload className="h-4 w-4 mr-2" />
              上传文件
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 文件夹树 */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">文件夹</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {/* 根目录选项 */}
              <motion.div
                className={cn(
                  'flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors',
                  selectedFolderId === null ? 'bg-blue-50 border border-blue-200 dark:bg-blue-900/50 dark:border-blue-700' : 'hover:bg-blue-100/70 dark:hover:bg-blue-800/30'
                )}
                onClick={() => selectFolder('')}
              >
                <Folder className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">根目录</span>
              </motion.div>
              
              {folderTree.map((folder) => (
                <FolderNode
                  key={folder.id}
                  folder={folder}
                  level={0}
                  isExpanded={expandedFolders.has(folder.id)}
                  onToggle={toggleFolder}
                  onSelect={selectFolder}
                  selectedFolderId={selectedFolderId}
                  expandedFolders={expandedFolders}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 文件列表 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">文件列表</CardTitle>
              <div className="flex items-center space-x-2">
                {selectedFiles.length > 0 && (
                  <Badge variant="secondary">
                    已选择 {selectedFiles.length} 个文件
                  </Badge>
                )}
                {selectedFiles.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFileSelectionChange([])}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">加载中...</div>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">此文件夹中没有文件</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredFiles.map((file) => (
                  <FileItem
                    key={file.id}
                    file={file}
                    isSelected={selectedFiles.includes(file.id)}
                    onToggle={toggleFileSelection}
                    allowMultiple={allowMultiple}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}