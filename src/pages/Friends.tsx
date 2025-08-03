import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Check,
  X,
  MessageCircle,
  UserMinus,
  Mail,
  Calendar,
  Clock,
  Copy,
  Share
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { useNotificationStore } from '../store';
import { friendsAPI, userAPI } from '../services/api';
import { User } from '../types';

interface FriendRequest {
  id: string;
  userId: string;
  friendId: string;
  user: User;
  friend: User;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

interface Friend {
  friendshipId: string;
  friend: User;
  createdAt: string;
}

function Friends() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchCode, setSearchCode] = useState('');
  const [searchResult, setSearchResult] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { addNotification } = useNotificationStore();

  // 格式化日期
  const formatDate = (dateString: string) => {
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
        // 后端返回的是 {success: true, data: {user: User}}
        setCurrentUser(response.data.user);
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  };

  // 加载好友列表
  const loadFriends = async () => {
    try {
      const response = await friendsAPI.getFriends();
      if (response.success && response.data) {
        setFriends(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('加载好友列表失败:', error);
      setFriends([]);
    }
  };

  // 加载好友请求
  const loadFriendRequests = async () => {
    try {
      const response = await friendsAPI.getFriendRequests();
      if (response.success && response.data) {
        // 后端返回 {received: [], sent: []} 格式，我们只显示收到的请求
        const receivedRequests = response.data.received || [];
        setFriendRequests(Array.isArray(receivedRequests) ? receivedRequests : []);
      }
    } catch (error) {
      console.error('加载好友请求失败:', error);
      setFriendRequests([]);
    }
  };

  // 搜索用户
  const searchUser = async () => {
    if (!searchCode.trim()) {
      addNotification({
        type: 'error',
        title: '搜索失败',
        message: '请输入用户代码',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await userAPI.searchUserByCode(searchCode.trim());
      if (response.success && response.data) {
        setSearchResult(response.data.user);
      } else {
        setSearchResult(null);
        addNotification({
          type: 'error',
          title: '搜索失败',
          message: '未找到该用户',
        });
      }
    } catch (error: any) {
      setSearchResult(null);
      addNotification({
        type: 'error',
        title: '搜索失败',
        message: error.response?.data?.error || '搜索用户失败',
      });
    } finally {
      setLoading(false);
    }
  };

  // 发送好友请求
  const sendFriendRequest = async (userId: string) => {
    try {
      const response = await friendsAPI.sendFriendRequest(userId);
      if (response.success) {
        addNotification({
          type: 'success',
          title: '发送成功',
          message: '好友请求已发送',
        });
        setSearchResult(null);
        setSearchCode('');
        // 刷新好友请求列表
        loadFriendRequests();
      }
    } catch (error: any) {
      console.error('发送好友请求失败:', error);
      
      let errorMessage = '发送好友请求失败';
      let errorTitle = '发送失败';
      
      if (error.response?.status === 409) {
        // 409冲突错误，表示好友关系已存在
        const backendError = error.response?.data?.error || '';
        if (backendError.includes('好友关系已存在')) {
          if (backendError.includes('pending')) {
            errorTitle = '请求已发送';
            errorMessage = '您已经向该用户发送过好友请求，请等待对方回应';
          } else if (backendError.includes('accepted')) {
            errorTitle = '已是好友';
            errorMessage = '该用户已经是您的好友了';
          } else {
            errorTitle = '好友关系已存在';
            errorMessage = '您与该用户已有好友关系';
          }
        } else {
          errorMessage = backendError;
        }
      } else {
        errorMessage = error.response?.data?.error || '发送好友请求失败';
      }
      
      addNotification({
        type: 'error',
        title: errorTitle,
        message: errorMessage,
      });
    }
  };

  // 处理好友请求
  const handleFriendRequest = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      const response = await friendsAPI.handleFriendRequest(requestId, action);
      if (response.success) {
        addNotification({
          type: 'success',
          title: '操作成功',
          message: action === 'accept' ? '已接受好友请求' : '已拒绝好友请求',
        });
        await loadFriendRequests();
        if (action === 'accept') {
          await loadFriends();
        }
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: '操作失败',
        message: error.response?.data?.error || '处理好友请求失败',
      });
    }
  };

  // 删除好友
  const deleteFriend = async (friendshipId: string) => {
    if (!confirm('确定要删除这个好友吗？')) {
      return;
    }

    try {
      const response = await friendsAPI.deleteFriend(friendshipId);
      if (response.success) {
        addNotification({
          type: 'success',
          title: '删除成功',
          message: '已删除好友',
        });
        await loadFriends();
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: '删除失败',
        message: error.response?.data?.error || '删除失败',
      });
    }
  };

  // 复制用户代码
  const copyUserCode = () => {
    if (currentUser?.userCode) {
      navigator.clipboard.writeText(currentUser.userCode);
      addNotification({
        type: 'success',
        title: '复制成功',
        message: '用户代码已复制到剪贴板',
      });
    }
  };

  // 打开聊天
  const openChat = (friendId: string) => {
    navigate(`/chat/${friendId}`);
  };

  // 分享文件
  const shareFile = (friendId: string) => {
    navigate(`/share-file/${friendId}`);
  };

  // 初始化数据
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          loadCurrentUser(),
          loadFriends(),
          loadFriendRequests()
        ]);
      } catch (error) {
        console.error('初始化数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeData();
  }, []);

  // 调试日志
  useEffect(() => {
    console.log('[Friends Debug] currentUser:', currentUser);
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">好友管理</h1>
        <p className="text-muted-foreground mt-2">
          管理您的好友关系和好友请求
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{friends.length}</p>
                <p className="text-sm text-muted-foreground">我的好友</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Mail className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{friendRequests.length}</p>
                <p className="text-sm text-muted-foreground">待处理请求</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Copy className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium">我的用户代码</p>
                <p className="text-lg font-mono">{currentUser?.userCode || '加载中...'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容 */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>我的好友</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>好友请求</span>
            {friendRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {friendRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center space-x-2">
            <UserPlus className="h-4 w-4" />
            <span>添加好友</span>
          </TabsTrigger>
        </TabsList>

        {/* 好友列表 */}
        <TabsContent value="friends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>我的好友 ({friends.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {friends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>还没有好友</p>
                  <p className="text-sm">去添加一些好友吧！</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {friends.map((friendship) => (
                    <motion.div
                      key={friendship.friendshipId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {friendship.friend.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{friendship.friend.username}</p>
                          <p className="text-sm text-muted-foreground">{friendship.friend.email}</p>
                          <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(friendship.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openChat(friendship.friend.id)}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          聊天
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => shareFile(friendship.friend.id)}
                        >
                          <Share className="h-4 w-4 mr-2" />
                          分享文件
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteFriend(friendship.friendshipId)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          删除
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 好友请求 */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>好友请求 ({friendRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {friendRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>没有待处理的好友请求</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {friendRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center text-white font-semibold">
                          {request.user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{request.user.username}</p>
                          <p className="text-sm text-muted-foreground">{request.user.email}</p>
                          <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(request.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleFriendRequest(request.id, 'accept')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          接受
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFriendRequest(request.id, 'reject')}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-2" />
                          拒绝
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 添加好友 */}
        <TabsContent value="search" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 我的用户代码 */}
            <Card>
              <CardHeader>
                <CardTitle>我的用户代码</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">分享此代码给朋友，让他们添加您为好友：</p>
                  <div className="flex items-center justify-between">
                    <code className="text-lg font-mono bg-background px-3 py-2 rounded border">
                      {currentUser?.userCode || '加载中...'}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyUserCode}
                      disabled={!currentUser?.userCode}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      复制
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 搜索用户 */}
            <Card>
              <CardHeader>
                <CardTitle>通过用户代码添加好友</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="输入用户代码"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchUser()}
                  />
                  <Button onClick={searchUser} disabled={loading}>
                    <Search className="h-4 w-4 mr-2" />
                    搜索
                  </Button>
                </div>

                <AnimatePresence>
                  {searchResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                                {searchResult.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium">{searchResult.username}</p>
                                <p className="text-sm text-muted-foreground">{searchResult.email}</p>
                              </div>
                            </div>
                            <Button
                              onClick={() => sendFriendRequest(searchResult.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              添加好友
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Friends;