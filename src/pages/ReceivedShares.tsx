import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  Check,
  X,
  MessageSquare,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File as FileIcon,
  User,
  Clock,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FolderSelector } from '../components/folder/FolderSelector';
import { useNotificationStore } from '../store';
import { friendShareAPI, folderAPI } from '../services/api';
import { User as UserType, File, Folder as FolderType } from '../types';

interface FileShare {
  id: string;
  file: File;
  sender: UserType;
  receiver: UserType;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'saved';
  savedFolderId?: string;
  createdAt: string;
}

function ReceivedShares() {
  const navigate = useNavigate();
  const [receivedShares, setReceivedShares] = useState<FileShare[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveFolderIds, setSaveFolderIds] = useState<Record<string, string | null>>({});
  const [showFolderSelector, setShowFolderSelector] = useState<string | null>(null);
  const { addNotification } = useNotificationStore();

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化时间
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return '刚刚';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}小时前`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  // 获取文件图标
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-8 w-8 text-green-500" />;
    } else if (mimeType.startsWith('video/')) {
      return <Video className="h-8 w-8 text-red-500" />;
    } else if (mimeType.startsWith('audio/')) {
      return <Music className="h-8 w-8 text-purple-500" />;
    } else if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) {
      return <FileText className="h-8 w-8 text-blue-500" />;
    } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) {
      return <Archive className="h-8 w-8 text-orange-500" />;
    } else {
      return <FileIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  // 加载收到的分享
  const loadReceivedShares = async () => {
    try {
      const response = await friendShareAPI.getReceivedShares();
      if (response.success && response.data) {
        // 后端返回的数据结构是 {shares: [...], pagination: {...}}
        const shares = response.data.shares || response.data;
        setReceivedShares(Array.isArray(shares) ? shares : []);
      } else {
        setReceivedShares([]);
      }
    } catch (error: any) {
      console.error('加载收到的分享失败:', error);
      setReceivedShares([]);
      addNotification({
        type: 'error',
        title: '加载失败',
        message: '无法加载收到的分享',
      });
    }
  };

  // 加载文件夹列表
  const loadFolders = async () => {
    try {
      const response = await folderAPI.getFolders();
      if (response.success && response.data) {
        setFolders(response.data);
      }
    } catch (error: any) {
      console.error('加载文件夹列表失败:', error);
    }
  };

  // 处理分享请求
  const handleShare = async (shareId: string, action: 'accept' | 'reject') => {
    try {
      if (action === 'accept') {
        // 直接显示文件夹选择器
        setShowFolderSelector(shareId);
      } else {
        await friendShareAPI.rejectShare(shareId);
        addNotification({
          type: 'success',
          title: '操作成功',
          message: '已拒绝文件分享',
        });
        await loadReceivedShares();
      }
    } catch (error: any) {
      console.error('处理分享失败:', error);
      addNotification({
        type: 'error',
        title: '操作失败',
        message: error.response?.data?.error || '操作失败',
      });
    }
  };

  // 处理文件夹选择并保存
  const handleFolderSelect = async (shareId: string, folderId: string | null) => {
    try {
      // 先接受分享
      await friendShareAPI.acceptShare(shareId);
      // 然后保存到指定文件夹
      await friendShareAPI.saveToFolder(shareId, folderId || '');
      
      addNotification({
        type: 'success',
        title: '保存成功',
        message: '文件已保存到指定文件夹',
      });
      
      setShowFolderSelector(null);
      await loadReceivedShares();
    } catch (error: any) {
      console.error('保存文件失败:', error);
      addNotification({
        type: 'error',
        title: '保存失败',
        message: error.response?.data?.error || '保存失败',
      });
      setShowFolderSelector(null);
    }
  };

  // 下载分享的文件
  const downloadShare = async (shareId: string, fileName: string) => {
    try {
      const blob = await friendShareAPI.downloadShare(shareId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      addNotification({
        type: 'success',
        title: '下载成功',
        message: '文件下载已开始',
      });
    } catch (error: any) {
      console.error('下载文件失败:', error);
      addNotification({
        type: 'error',
        title: '下载失败',
        message: error.response?.data?.error || '下载失败',
      });
    }
  };

  // 设置保存文件夹
  const setSaveFolder = (shareId: string, folderId: string | null) => {
    setSaveFolderIds(prev => ({
      ...prev,
      [shareId]: folderId
    }));
  };

  // 保存到文件夹
  const saveToFolder = async (shareId: string, folderId: string | null) => {
    try {
      await friendShareAPI.saveToFolder(shareId, folderId || '');
      
      addNotification({
        type: 'success',
        title: '保存成功',
        message: '文件已保存到指定文件夹',
      });
      
      await loadReceivedShares();
    } catch (error: any) {
      console.error('保存文件失败:', error);
      addNotification({
        type: 'error',
        title: '保存失败',
        message: error.response?.data?.error || '保存失败',
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadReceivedShares(),
        loadFolders()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pendingShares = receivedShares.filter(s => s.status === 'pending');
  const processedShares = receivedShares.filter(s => s.status !== 'pending');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">收到的分享</h1>
          <p className="text-muted-foreground mt-2">
            管理好友分享给您的文件
          </p>
        </div>
        {pendingShares.length > 0 && (
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {pendingShares.length} 个待处理
          </Badge>
        )}
      </div>

      {/* 待处理的分享 */}
      {pendingShares.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            待处理的分享
          </h2>
          <div className="grid gap-4">
            {pendingShares.map((share) => (
              <Card key={share.id} className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        {getFileIcon(share.file.mimeType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-lg">{share.file.name}</h4>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                          <User className="h-4 w-4" />
                          <span>来自 {share.sender.username}</span>
                          <span>•</span>
                          <span>{formatFileSize(share.file.size)}</span>
                          <span>•</span>
                          <span>{formatTime(share.createdAt)}</span>
                        </div>
                        {share.message && (
                          <div className="mt-3 p-3 bg-white rounded-lg border dark:bg-gray-800 dark:border-gray-700">
                            <div className="flex items-start space-x-2">
                              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <p className="text-sm">{share.message}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        onClick={() => handleShare(share.id, 'accept')}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        接受
                      </Button>
                      <Button
                        onClick={() => handleShare(share.id, 'reject')}
                        variant="destructive"
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-1" />
                        拒绝
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 已处理的分享 */}
      {processedShares.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">历史分享</h2>
          <div className="grid gap-4">
            {processedShares.map((share) => (
              <Card key={share.id} className="dark:bg-gray-800/50 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        {getFileIcon(share.file.mimeType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold">{share.file.name}</h4>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                          <User className="h-4 w-4" />
                          <span>来自 {share.sender.username}</span>
                          <span>•</span>
                          <span>{formatFileSize(share.file.size)}</span>
                          <span>•</span>
                          <span>{formatTime(share.createdAt)}</span>
                        </div>
                        {share.message && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm dark:bg-gray-700">
                            <MessageSquare className="h-3 w-3 inline mr-1" />
                            {share.message}
                          </div>
                        )}
                        <Badge 
                          variant={share.status === 'accepted' ? 'default' : 
                                 share.status === 'saved' ? 'default' : 'destructive'} 
                          className="mt-2"
                        >
                          {share.status === 'accepted' && '已接受'}
                          {share.status === 'rejected' && '已拒绝'}
                          {share.status === 'saved' && '已保存'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {share.status === 'accepted' && (
                        <>
                          <Button
                            onClick={() => downloadShare(share.id, share.file.name)}
                            variant="outline"
                            size="sm"
                            className="dark:border-gray-600 dark:hover:bg-gray-700"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            下载
                          </Button>
                          <FolderSelector
                            selectedFolderId={saveFolderIds[share.id] || null}
                            onFolderSelect={(folderId) => setSaveFolder(share.id, folderId)}
                            trigger={
                              <Button variant="outline" size="sm" className="dark:border-gray-600 dark:hover:bg-gray-700">
                                <Save className="h-4 w-4 mr-1" />
                                选择保存位置
                              </Button>
                            }
                            title="选择保存位置"
                            allowRoot={true}
                          />
                          {saveFolderIds[share.id] !== undefined && (
                            <Button
                              onClick={() => saveToFolder(share.id, saveFolderIds[share.id])}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                            >
                              <Save className="h-4 w-4 mr-1" />
                              保存文件
                            </Button>
                          )}
                        </>
                      )}
                      
                      {share.status === 'saved' && (
                        <Button
                          onClick={() => downloadShare(share.id, share.file.name)}
                          variant="outline"
                          size="sm"
                          className="dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          下载
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {receivedShares.length === 0 && (
        <Card className="dark:bg-gray-800/50 dark:border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Download className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">没有收到的分享</h3>
            <p className="text-muted-foreground text-center">
              当好友向您分享文件时，会在这里显示
            </p>
          </CardContent>
        </Card>
      )}

      {/* 文件夹选择器弹窗 */}
      <Dialog open={!!showFolderSelector} onOpenChange={(open) => !open && setShowFolderSelector(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>选择保存位置</DialogTitle>
          </DialogHeader>
          <FolderSelector
            selectedFolderId={null}
            onFolderSelect={(folderId) => handleFolderSelect(showFolderSelector!, folderId)}
            title="选择保存位置"
            allowRoot={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ReceivedShares;