import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Download,
  Lock,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File as FileIcon,
  AlertCircle,
  CheckCircle,
  Calendar,
  User,
  Share2,
  Save,
  LogIn,
  FolderOpen
} from 'lucide-react'
import { motion } from 'framer-motion'
import { shareAPI, folderAPI, userAPI } from '@/services/api'
import { formatFileSize } from '@/lib/utils'
import { useUserStore, useNotificationStore } from '@/store'
import { FolderSelector } from '@/components/folder/FolderSelector'

import type { File } from '@/types'

interface ShareInfo {
  id: string
  token: string
  file: {
    id: string
    name: string
    size: number
    type: string
    mimeType: string
    createdAt: string
  }
  user: {
    username: string
  }
  description?: string
  allowDownload: boolean
  allowPreview: boolean
  expiresAt?: string
  maxDownloads?: number
  downloadCount: number
  viewCount: number
  createdAt: string
  isActive: boolean
}

export const PublicShare: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useUserStore()
  const { addNotification } = useNotificationStore()
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [needsPassword, setNeedsPassword] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedFolderId, setSelectedFolderId] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)


  // 格式化过期时间
  const formatExpiration = (expiresAt?: string) => {
    if (!expiresAt) return '永不过期'
    const date = new Date(expiresAt)
    const now = new Date()
    if (date < now) return '已过期'
    return date.toLocaleString('zh-CN')
  }

  // 格式化创建时间
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minute = 60 * 1000
    const hour = minute * 60
    const day = hour * 24
    const week = day * 7
    
    if (diff < minute) {
      return '刚刚'
    } else if (diff < hour) {
      return `${Math.floor(diff / minute)}分钟前`
    } else if (diff < day) {
      return `${Math.floor(diff / hour)}小时前`
    } else if (diff < week) {
      return `${Math.floor(diff / day)}天前`
    } else {
      return date.toLocaleDateString('zh-CN')
    }
  }

  // 获取分享信息
  const fetchShareInfo = async (passwordInput?: string) => {
    if (!shareId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`http://localhost:5000/api/shares/${shareId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(passwordInput && { 'X-Share-Password': passwordInput })
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setShareInfo(data.data)
          setNeedsPassword(false)
        } else {
          setError(data.error || '获取分享信息失败')
        }
      } else if (response.status === 401) {
        setNeedsPassword(true)
        setError('需要密码访问此分享')
      } else if (response.status === 404) {
        setError('分享链接不存在或已过期')
      } else if (response.status === 403) {
        setError('分享链接已被禁用')
      } else {
        setError('加载分享信息失败')
      }
    } catch (error: any) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 处理密码提交
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password.trim()) {
      fetchShareInfo(password)
    }
  }

  // 下载文件
  const handleDownload = async () => {
    if (!shareInfo || !shareInfo.allowDownload) return
    
    setDownloading(true)
    try {
      const response = await fetch(`http://localhost:5000/api/shares/${shareId}/download`, {
        method: 'GET',
        headers: {
          ...(password && { 'X-Share-Password': password })
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = shareInfo.file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        // 更新下载计数
        setShareInfo(prev => prev ? {
          ...prev,
          downloadCount: prev.downloadCount + 1
        } : null)
      } else {
        setError('下载失败')
      }
    } catch (error: any) {
      setError('下载失败')
    } finally {
      setDownloading(false)
    }
  }



  // 获取文件图标
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-8 w-8" />
    if (mimeType.startsWith('video/')) return <Video className="h-8 w-8" />
    if (mimeType.startsWith('audio/')) return <Music className="h-8 w-8" />
    if (mimeType.includes('text') || mimeType.includes('json')) return <FileText className="h-8 w-8" />
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="h-8 w-8" />
    return <FileIcon className="h-8 w-8" />
  }



  // 处理保存文件按钮点击
  const handleSaveFile = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true)
      return
    }
    
    setShowSaveDialog(true)
  }

  // 保存文件到文件夹
  const saveToFolder = async () => {
    if (!shareId || !selectedFolderId || !isAuthenticated) return
    
    setSaving(true)
    try {
      const response = await shareAPI.saveToFolder(shareId, selectedFolderId, password || undefined)
      if (response.success) {
        addNotification({
          type: 'success',
          title: '保存成功',
          message: '文件已成功保存到您的文件夹'
        })
        setShowSaveDialog(false)
        setSelectedFolderId('')
      } else {
        throw new Error(response.error || '保存失败')
      }
    } catch (error: any) {
      console.error('保存文件失败:', error)
      addNotification({
        type: 'error',
        title: '保存失败',
        message: error.response?.data?.error || error.message || '保存文件失败'
      })
    } finally {
      setSaving(false)
    }
  }

  // 处理登录
  const handleLogin = () => {
    // 保存当前页面URL到localStorage，登录后可以返回
    localStorage.setItem('returnUrl', window.location.pathname)
    navigate('/login')
  }

  useEffect(() => {
    fetchShareInfo()
  }, [shareId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (error && !needsPassword) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">访问失败</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => navigate('/')} variant="outline">
                返回首页
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (needsPassword) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>需要密码</CardTitle>
            <p className="text-muted-foreground">此分享链接需要密码才能访问</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">访问密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入访问密码"
                  autoFocus
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={!password.trim() || loading}>
                {loading ? '验证中...' : '访问'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!shareInfo) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 头部 */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Share2 className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">文件分享</h1>
            </div>
            <Button variant="outline" onClick={() => navigate('/')}>
              返回首页
            </Button>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* 文件信息卡片 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    {getFileIcon(shareInfo.file.mimeType)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <h2 className="text-2xl font-semibold">{shareInfo.file.name}</h2>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{formatFileSize(shareInfo.file.size)}</span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{shareInfo.user.username}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(shareInfo.createdAt)}</span>
                      </span>
                    </div>
                    {shareInfo.description && (
                      <p className="text-muted-foreground">{shareInfo.description}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 操作按钮 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center space-x-4 flex-wrap gap-2">

                  {shareInfo.allowDownload && (
                    <Button
                      onClick={handleDownload}
                      disabled={downloading}
                      size="lg"
                    >
                      {downloading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          下载中...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          下载文件
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    onClick={handleSaveFile}
                    disabled={saving}
                    variant="secondary"
                    size="lg"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        保存到我的文件夹
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 分享信息 */}
            <Card>
              <CardHeader>
                <CardTitle>分享信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{shareInfo.viewCount}</div>
                    <div className="text-sm text-muted-foreground">查看次数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{shareInfo.downloadCount}</div>
                    <div className="text-sm text-muted-foreground">下载次数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {shareInfo.maxDownloads || '∞'}
                    </div>
                    <div className="text-sm text-muted-foreground">下载限制</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {formatExpiration(shareInfo.expiresAt)}
                    </div>
                    <div className="text-sm text-muted-foreground">过期时间</div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex items-center justify-center space-x-2">
                  <Badge variant={shareInfo.isActive ? 'default' : 'secondary'}>
                    {shareInfo.isActive ? '活跃' : '已禁用'}
                  </Badge>

                  {shareInfo.allowDownload && (
                    <Badge variant="outline">
                      <Download className="h-3 w-3 mr-1" />
                      可下载
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* 登录提示对话框 */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <LogIn className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>需要登录</CardTitle>
              <p className="text-muted-foreground">请先登录后再保存文件到您的文件夹</p>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setShowLoginPrompt(false)}
                  variant="outline"
                  className="flex-1"
                >
                  取消
                </Button>
                <Button
                  onClick={handleLogin}
                  className="flex-1"
                >
                  去登录
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 文件夹选择对话框 */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <FolderOpen className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>选择保存位置</CardTitle>
              <p className="text-muted-foreground">选择要保存文件的文件夹</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>目标文件夹</Label>
                   <FolderSelector
                     selectedFolderId={selectedFolderId}
                     onFolderSelect={setSelectedFolderId}
                     title="选择目标文件夹"
                     allowRoot={false}
                     trigger={
                       <Button variant="outline" className="w-full justify-start">
                         <FolderOpen className="h-4 w-4 mr-2" />
                         {selectedFolderId ? '已选择文件夹' : '请选择文件夹'}
                       </Button>
                     }
                   />
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => {
                      setShowSaveDialog(false)
                      setSelectedFolderId('')
                    }}
                    variant="outline"
                    className="flex-1"
                    disabled={saving}
                  >
                    取消
                  </Button>
                  <Button
                    onClick={saveToFolder}
                    className="flex-1"
                    disabled={!selectedFolderId || saving}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        保存中...
                      </>
                    ) : (
                      '保存'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}


    </div>
  )
}