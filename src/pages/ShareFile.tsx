import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  User,
  File as FileIcon,
  Folder,
  Share,
  Download,
  Save,
  Check,
  X,
  MessageSquare,
  Clock,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileSelector } from '@/components/file/FileSelector';
import { FolderSelector } from '@/components/folder/FolderSelector';

import { useNotificationStore } from '../store';
import { friendShareAPI, fileAPI, folderAPI, userAPI, friendsAPI } from '../services/api';
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

function ShareFile() {
  const { friendId } = useParams<{ friendId: string }>();
  const navigate = useNavigate();
  const [friend, setFriend] = useState<UserType | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [shareMessage, setShareMessage] = useState('');
  const [receivedShares, setReceivedShares] = useState<FileShare[]>([]);
  const [sentShares, setSentShares] = useState<FileShare[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'send' | 'received' | 'sent'>('send');
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
  const [saveFolderIds, setSaveFolderIds] = useState<{[shareId: string]: string | null}>({});
  const [showFolderSelector, setShowFolderSelector] = useState<string | null>(null);
  const { addNotification } = useNotificationStore();

  // 获取文件类型图标
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (mimeType.startsWith('audio/')) return <Music className="h-4 w-4" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="h-4 w-4" />;
    if (mimeType.includes('text') || mimeType.includes('document')) return <FileText className="h-4 w-4" />;
    return <FileIcon className="h-4 w-4" />;
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  // 加载当前用户信息
  const loadCurrentUser = async () => {
    try {
      const response = await userAPI.getCurrentUser();
      if (response.success && response.data) {
        setCurrentUser(response.data.user);
      }
    } catch (error: any) {
      console.error('加载用户信息失败:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  // 加载好友信息
  const loadFriend = async () => {
    if (!friendId) return;
    
    try {
      const response = await friendsAPI.getFriends();
      if (response.success && response.data) {
        const friendship = response.data.find((f: any) => f.friend.id === friendId);
        if (friendship) {
          setFriend(friendship.friend);
        } else {
          addNotification({
            type: 'error',
            title: '错误',
            message: '好友不存在或非好友关系',
          });
          navigate('/friends');
        }
      }
    } catch (error: any) {
      console.error('加载好友信息失败:', error);
      addNotification({
        type: 'error',
        title: '加载失败',
        message: '无法加载好友信息',
      });
    }
  };

  // 加载文件列表
  const loadFiles = async () => {
    try {
      const response = await fileAPI.getFiles();
      if (response.success && response.data) {
        setFiles(response.data);
      }
    } catch (error: any) {
      console.error('加载文件列表失败:', error);
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

  // 加载收到的分享
  const loadReceivedShares = async () => {
    try {
      const response = await friendShareAPI.getReceivedShares();
      if (response.success && response.data) {
        const shares = response.data.shares || response.data;
        setReceivedShares(Array.isArray(shares) ? shares : []);
      } else {
        setReceivedShares([]);
      }
    } catch (error: any) {
      console.error('加载收到的分享失败:', error);
      setReceivedShares([]);
    }
  };

  // 加载发送的分享
  const loadSentShares = async () => {
    try {
      const response = await friendShareAPI.getSentShares();
      if (response.success && response.data) {
        const shares = response.data.shares || response.data;
        setSentShares(Array.isArray(shares) ? shares : []);
      } else {
        setSentShares([]);
      }
    } catch (error: any) {
      console.error('加载发送的分享失败:', error);
      setSentShares([]);
    }
  };

  // 选择/取消选择文件
  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  // 分享文件
  const shareFiles = async () => {
    if (selectedFiles.length === 0 || !friendId) {
      addNotification({
        type: 'error',
        title: '分享失败',
        message: '请选择要分享的文件',
      });
      return;
    }

    setLoading(true);
    try {
      for (const fileId of selectedFiles) {
        await friendShareAPI.sendFileShare(friendId, fileId, shareMessage);
      }
      
      addNotification({
        type: 'success',
        title: '分享成功',
        message: `已向 ${friend?.username} 分享 ${selectedFiles.length} 个文件`,
      });
      
      setSelectedFiles([]);
      setShareMessage('');
      await loadSentShares();
    } catch (error: any) {
      console.error('分享文件失败:', error);
      addNotification({
        type: 'error',
        title: '分享失败',
        message: error.response?.data?.error || '文件分享失败',
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理分享请求
  const handleShare = async (shareId: string, action: 'accept' | 'reject') => {
    try {
      if (action === 'accept') {
        // 直接弹出文件夹选择器
        setShowFolderSelector(shareId);
        return;
      } else {
        await friendShareAPI.rejectShare(shareId);
        addNotification({
          type: 'success',
          title: '操作成功',
          message: '已拒绝文件分享',
        });
      }
      
      await loadReceivedShares();
    } catch (error: any) {
      console.error('处理分享失败:', error);
      addNotification({
        type: 'error',
        title: '操作失败',
        message: error.response?.data?.error || '操作失败',
      });
    }
  };

  // 处理文件夹选择
  const handleFolderSelect = async (folderId: string | null) => {
    if (!showFolderSelector) return;
    
    try {
      // 先接受分享
      await friendShareAPI.acceptShare(showFolderSelector);
      
      // 然后保存到指定文件夹
      await friendShareAPI.saveToFolder(showFolderSelector, folderId || '');
      
      addNotification({
        type: 'success',
        title: '操作成功',
        message: '文件已接受并保存到指定位置',
      });
      
      setShowFolderSelector(null);
      await loadReceivedShares();
    } catch (error: any) {
      console.error('处理分享失败:', error);
      addNotification({
        type: 'error',
        title: '操作失败',
        message: error.response?.data?.error || '操作失败',
      });
      setShowFolderSelector(null);
    }
  };

  // 处理文件上传
  const handleFileUpload = async (fileList: FileList) => {
    if (!fileList || fileList.length === 0) return;
    
    setUploadingFiles(true);
    try {
      const uploadPromises = Array.from(fileList).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fileAPI.uploadFile(formData);
        if (response.success) {
          return response.data.id;
        }
        throw new Error(`上传 ${file.name} 失败`);
      });
      
      const uploadedFileIds = await Promise.all(uploadPromises);
      
      setSelectedFiles(prev => [...prev, ...uploadedFileIds]);
      
      addNotification({
        type: 'success',
        title: '上传成功',
        message: `成功上传 ${fileList.length} 个文件`,
      });
      
      await loadFiles();
    } catch (error: any) {
      console.error('文件上传失败:', error);
      addNotification({
        type: 'error',
        title: '上传失败',
        message: error.message || '文件上传失败',
      });
    } finally {
      setUploadingFiles(false);
    }
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

  // 设置保存文件夹
  const setSaveFolder = (shareId: string, folderId: string | null) => {
    setSaveFolderIds(prev => ({
      ...prev,
      [shareId]: folderId
    }));
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

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      try {
        await loadCurrentUser();
        await loadFriend();
        await Promise.all([
          loadFiles(),
          loadFolders(),
          loadReceivedShares(),
          loadSentShares()
        ]);
      } catch (error) {
        console.error('初始化数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeData();
  }, [friendId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (!friend) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">好友不存在</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* 页面头部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold">
              {friend.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">与 {friend.username} 分享文件</h1>
              <p className="text-muted-foreground">{friend.email}</p>
            </div>
          </div>
        </div>

        {/* 标签页 */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="send" className="flex items-center space-x-2">
              <Share className="h-4 w-4" />
              <span>发送文件</span>
            </TabsTrigger>
            <TabsTrigger value="received" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>收到的分享</span>
              {receivedShares.filter(s => s.status === 'pending').length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {receivedShares.filter(s => s.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>已发送</span>
            </TabsTrigger>
          </TabsList>

          {/* 发送文件 */}
          <TabsContent value="send" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>选择要分享的文件</span>
                  {uploadingFiles && (
                    <Badge variant="secondary" className="animate-pulse">
                      <Upload className="h-3 w-3 mr-1" />
                      上传中...
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 分享留言 */}
                <div>
                  <label className="text-sm font-medium mb-2 block">分享留言（可选）</label>
                  <Textarea
                    value={shareMessage}
                    onChange={(e) => setShareMessage(e.target.value)}
                    placeholder="添加一些说明..."
                    rows={3}
                  />
                </div>

                {/* 文件选择器 */}
                <div>
                  <FileSelector
                    selectedFiles={selectedFiles}
                    onFileSelectionChange={setSelectedFiles}
                    allowMultiple={true}
                    showUpload={true}
                    onUpload={handleFileUpload}
                  />
                </div>

                {/* 分享按钮 */}
                <div className="flex justify-end">
                  <Button
                    onClick={shareFiles}
                    disabled={loading || selectedFiles.length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        分享中
                      </>
                    ) : (
                      <>
                        <Share className="h-4 w-4 mr-2" />
                        分享文件 ({selectedFiles.length})
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 收到的分享 */}
          <TabsContent value="received" className="space-y-4">
            {receivedShares.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Download className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">没有收到的分享</h3>
                  <p className="text-muted-foreground text-center">
                    当好友向您分享文件时，会在这里显示
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {receivedShares.map((share) => (
                  <Card key={share.id} className={share.status === 'pending' ? 'border-orange-200' : ''}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="flex-shrink-0">
                            {getFileIcon(share.file.mimeType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold">{share.file.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              来自 {share.sender.username} • {formatFileSize(share.file.size)} • {formatTime(share.createdAt)}
                            </p>
                            {share.message && (
                              <div className="mt-2 p-2 bg-muted rounded text-sm">
                                <MessageSquare className="h-3 w-3 inline mr-1" />
                                {share.message}
                              </div>
                            )}
                            <Badge 
                              variant={share.status === 'pending' ? 'destructive' : 'secondary'} 
                              className="mt-2"
                            >
                              {share.status === 'pending' && '待处理'}
                              {share.status === 'accepted' && '已接受'}
                              {share.status === 'rejected' && '已拒绝'}
                              {share.status === 'saved' && '已保存'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {share.status === 'pending' && (
                            <>
                              <Button
                                onClick={() => handleShare(share.id, 'accept')}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
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
                            </>
                          )}
                          
                          {share.status === 'accepted' && (
                            <>
                              <Button
                                onClick={() => downloadShare(share.id, share.file.name)}
                                variant="outline"
                                size="sm"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                下载
                              </Button>
                              <FolderSelector
                                selectedFolderId={saveFolderIds[share.id] || null}
                                onFolderSelect={(folderId) => setSaveFolder(share.id, folderId)}
                                trigger={
                                  <Button variant="outline" size="sm">
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
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <Save className="h-4 w-4 mr-1" />
                                  保存
                                </Button>
                              )}
                            </>
                          )}
                          
                          {share.status === 'saved' && (
                            <Button
                              onClick={() => downloadShare(share.id, share.file.name)}
                              variant="outline"
                              size="sm"
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
            )}
          </TabsContent>

          {/* 已发送 */}
          <TabsContent value="sent" className="space-y-4">
            {sentShares.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">没有发送的分享</h3>
                  <p className="text-muted-foreground text-center">
                    您发送的文件分享会在这里显示
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {sentShares.map((share) => (
                  <Card key={share.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {getFileIcon(share.file.mimeType)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{share.file.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            发送给 {share.receiver.username} • {formatFileSize(share.file.size)} • {formatTime(share.createdAt)}
                          </p>
                          {share.message && (
                            <div className="mt-2 p-2 bg-muted rounded text-sm">
                              <MessageSquare className="h-3 w-3 inline mr-1" />
                              {share.message}
                            </div>
                          )}
                          <Badge 
                            variant={share.status === 'pending' ? 'secondary' : 
                                   share.status === 'accepted' ? 'default' : 
                                   share.status === 'saved' ? 'default' : 'destructive'} 
                            className="mt-2"
                          >
                            {share.status === 'pending' && '等待处理'}
                            {share.status === 'accepted' && '已接受'}
                            {share.status === 'rejected' && '已拒绝'}
                            {share.status === 'saved' && '已保存'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* 文件夹选择器弹窗 */}
      <Dialog open={!!showFolderSelector} onOpenChange={() => setShowFolderSelector(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>选择保存位置</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <FolderSelector
              selectedFolderId={null}
              onFolderSelect={handleFolderSelect}
              allowRoot={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ShareFile;