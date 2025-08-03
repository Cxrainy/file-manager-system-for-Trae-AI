import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  ArrowLeft,
  User,
  Clock,
  Check,
  CheckCheck,
  Paperclip,
  Image,
  File as FileIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

import { useNotificationStore } from '@/store';
import { chatAPI, userAPI, friendsAPI } from '@/services/api';
import { User as UserType } from '@/types';

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: 'text' | 'file' | 'image';
  fileId?: string;
  isRead: boolean;
  createdAt: string;
  sender: UserType;
}

function Chat() {
  const { friendId } = useParams<{ friendId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [friend, setFriend] = useState<UserType | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addNotification } = useNotificationStore();

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays}天前 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleString('zh-CN');
    }
  };

  // 加载当前用户信息
  const loadCurrentUser = async () => {
    try {
      const response = await userAPI.getCurrentUser();
      if (response.success && response.data) {
        setCurrentUser(response.data);
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
      // 通过好友列表获取好友信息
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

  // 加载聊天记录
  const loadMessages = async () => {
    if (!friendId) return;
    
    try {
      const response = await chatAPI.getChatMessages(friendId);
      if (response.success && response.data) {
        setMessages(response.data.messages || []);
        // 标记消息为已读
        await chatAPI.markAsRead(friendId);
      }
    } catch (error: any) {
      console.error('加载聊天记录失败:', error);
      addNotification({
        type: 'error',
        title: '加载失败',
        message: '无法加载聊天记录',
      });
    }
  };

  // 发送消息
  const sendMessage = async () => {
    if (!newMessage.trim() || !friendId || loading) return;
    
    setLoading(true);
    try {
      const response = await chatAPI.sendMessage(friendId, newMessage.trim());
      if (response.success) {
        setNewMessage('');
        await loadMessages(); // 重新加载消息
        scrollToBottom();
      } else {
        addNotification({
          type: 'error',
          title: '发送失败',
          message: response.error || '消息发送失败',
        });
      }
    } catch (error: any) {
      console.error('发送消息失败:', error);
      addNotification({
        type: 'error',
        title: '发送失败',
        message: error.response?.data?.error || '消息发送失败',
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理回车发送
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
        await loadMessages();
      } catch (error) {
        console.error('初始化数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeData();
  }, [friendId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      <div className="flex flex-col h-[calc(100vh-200px)]">
        {/* 聊天头部 */}
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/friends')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {friend.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold">{friend.username}</h2>
              <p className="text-sm text-muted-foreground">{friend.email}</p>
            </div>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <User className="h-12 w-12 mb-4" />
              <p>还没有聊天记录</p>
              <p className="text-sm">发送第一条消息开始聊天吧！</p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((message) => {
                const isOwn = message.senderId === currentUser?.id;
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                      <Card className={`${isOwn ? 'bg-blue-500 text-white' : 'bg-muted'}`}>
                        <CardContent className="p-3">
                          <p className="text-sm">{message.content}</p>
                          <div className={`flex items-center justify-end mt-2 space-x-1 text-xs ${
                            isOwn ? 'text-blue-100' : 'text-muted-foreground'
                          }`}>
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(message.createdAt)}</span>
                            {isOwn && (
                              message.isRead ? (
                                <CheckCheck className="h-3 w-3" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 消息输入 */}
        <div className="p-4 border-t bg-background">
          <div className="flex items-center space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入消息..."
              className="flex-1"
              disabled={loading}
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !newMessage.trim()}
              className="shrink-0"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
  );
}

export default Chat;