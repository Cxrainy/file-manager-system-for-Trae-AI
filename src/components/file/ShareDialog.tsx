import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Button,
} from '@/components/ui/button'
import {
  Input,
} from '@/components/ui/input'
import {
  Label,
} from '@/components/ui/label'
import {
  Switch,
} from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Textarea,
} from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Badge,
} from '@/components/ui/badge'
import {
  Separator,
} from '@/components/ui/separator'
import {
  Copy,
  Share2,
  Eye,
  Download,
  Lock,
  Calendar,
  Users,
  Link,
  Settings,
  Check,
  X,
  ExternalLink,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotificationStore } from '@/stores/notificationStore'
import { shareAPI } from '@/services/api'
import { File } from '@/types'

interface ShareDialogProps {
  file: File | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ShareLink {
  id: string
  token: string
  url: string
  password?: string
  expiresAt?: string
  allowDownload: boolean
  allowPreview: boolean
  maxDownloads?: number
  downloadCount: number
  viewCount: number
  createdAt: string
  isActive: boolean
}

interface ShareSettings {
  allowDownload: boolean
  allowPreview: boolean
  requirePassword: boolean
  password: string
  expiresAt: string
  maxDownloads: string
  description: string
}

const ShareDialog: React.FC<ShareDialogProps> = ({ file, open, onOpenChange }) => {
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [settings, setSettings] = useState<ShareSettings>({
    allowDownload: true,
    allowPreview: true,
    requirePassword: false,
    password: '',
    expiresAt: '7days',
    maxDownloads: '',
    description: '',
  })
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const { addNotification } = useNotificationStore()

  // 加载分享链接
  const loadShareLinks = async () => {
    if (!file) return
    
    setLoading(true)
    try {
      const response = await shareAPI.getFileShares(file.id)
      if (response.success && response.data) {
        setShareLinks(response.data)
      }
    } catch (error: any) {
      console.error('加载分享链接失败:', error)
      addNotification({
        type: 'error',
        title: '加载失败',
        message: '无法加载分享链接',
      })
    } finally {
      setLoading(false)
    }
  }

  // 创建分享链接
  const createShareLink = async () => {
    if (!file) return
    
    setCreating(true)
    try {
      const shareData = {
        fileId: file.id,
        allowDownload: settings.allowDownload,
        allowPreview: settings.allowPreview,
        password: settings.requirePassword ? settings.password : undefined,
        expiresAt: settings.expiresAt === 'never' ? undefined : settings.expiresAt,
        maxDownloads: settings.maxDownloads ? parseInt(settings.maxDownloads) : undefined,
        description: settings.description || undefined,
      }
      
      const response = await shareAPI.createShare(shareData)
      if (response.success && response.data) {
        await loadShareLinks()
        addNotification({
          type: 'success',
          title: '分享链接已创建',
          message: '分享链接创建成功',
        })
        // 重置设置
        setSettings({
          allowDownload: true,
          allowPreview: true,
          requirePassword: false,
          password: '',
          expiresAt: '7days',
          maxDownloads: '',
          description: '',
        })
      }
    } catch (error: any) {
      console.error('创建分享链接失败:', error)
      addNotification({
        type: 'error',
        title: '创建失败',
        message: error.response?.data?.error || '创建分享链接失败',
      })
    } finally {
      setCreating(false)
    }
  }

  // 复制链接
  const copyLink = async (url: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedLink(linkId)
      setTimeout(() => setCopiedLink(null), 2000)
      addNotification({
        type: 'success',
        title: '复制成功',
        message: '分享链接已复制到剪贴板',
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: '复制失败',
        message: '无法复制链接到剪贴板',
      })
    }
  }

  // 删除分享链接
  const deleteShareLink = async (shareId: string) => {
    try {
      await shareAPI.deleteShare(shareId)
      await loadShareLinks()
      addNotification({
        type: 'success',
        title: '删除成功',
        message: '分享链接已删除',
      })
    } catch (error: any) {
      console.error('删除分享链接失败:', error)
      addNotification({
        type: 'error',
        title: '删除失败',
        message: error.response?.data?.error || '删除分享链接失败',
      })
    }
  }

  // 切换分享链接状态
  const toggleShareLink = async (shareId: string, isActive: boolean) => {
    try {
      await shareAPI.updateShare(shareId, { isActive: !isActive })
      await loadShareLinks()
      addNotification({
        type: 'success',
        title: '更新成功',
        message: `分享链接已${!isActive ? '启用' : '禁用'}`,
      })
    } catch (error: any) {
      console.error('更新分享链接失败:', error)
      addNotification({
        type: 'error',
        title: '更新失败',
        message: error.response?.data?.error || '更新分享链接失败',
      })
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  // 格式化过期时间
  const formatExpiration = (expiresAt?: string) => {
    if (!expiresAt) return '永不过期'
    const date = new Date(expiresAt)
    const now = new Date()
    if (date < now) return '已过期'
    return `${formatDate(expiresAt)} 过期`
  }

  useEffect(() => {
    if (open && file) {
      loadShareLinks()
    }
  }, [open, file])

  if (!file) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="h-5 w-5" />
            <span>分享文件: {file.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 创建新分享 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Link className="h-4 w-4" />
                <span>创建分享链接</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 基本设置 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowPreview">允许预览</Label>
                  <Switch
                    id="allowPreview"
                    checked={settings.allowPreview}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowPreview: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowDownload">允许下载</Label>
                  <Switch
                    id="allowDownload"
                    checked={settings.allowDownload}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowDownload: checked }))}
                  />
                </div>
              </div>

              {/* 安全设置 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="requirePassword">需要密码</Label>
                  <Switch
                    id="requirePassword"
                    checked={settings.requirePassword}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requirePassword: checked }))}
                  />
                </div>
                {settings.requirePassword && (
                  <div>
                    <Label htmlFor="password">访问密码</Label>
                    <Input
                      id="password"
                      type="password"
                      value={settings.password}
                      onChange={(e) => setSettings(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="设置访问密码"
                    />
                  </div>
                )}
              </div>

              {/* 过期设置 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiresAt">有效期</Label>
                  <Select
                    value={settings.expiresAt}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, expiresAt: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1hour">1小时</SelectItem>
                      <SelectItem value="1day">1天</SelectItem>
                      <SelectItem value="7days">7天</SelectItem>
                      <SelectItem value="30days">30天</SelectItem>
                      <SelectItem value="never">永不过期</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="maxDownloads">最大下载次数</Label>
                  <Input
                    id="maxDownloads"
                    type="number"
                    value={settings.maxDownloads}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxDownloads: e.target.value }))}
                    placeholder="不限制"
                    min="1"
                  />
                </div>
              </div>

              {/* 描述 */}
              <div>
                <Label htmlFor="description">分享描述（可选）</Label>
                <Textarea
                  id="description"
                  value={settings.description}
                  onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="添加分享说明..."
                  rows={3}
                />
              </div>

              {/* 创建按钮 */}
              <Button
                onClick={createShareLink}
                disabled={creating || (settings.requirePassword && !settings.password)}
                className="w-full"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    创建中...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    创建分享链接
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 现有分享链接 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>现有分享链接</span>
                </span>
                <Badge variant="secondary">{shareLinks.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : shareLinks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Share2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>还没有创建任何分享链接</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {shareLinks.map((link) => (
                    <motion.div
                      key={link.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      {/* 链接信息 */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <Input
                              value={link.url}
                              readOnly
                              className="font-mono text-sm"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyLink(link.url, link.id)}
                            >
                              {copiedLink === link.id ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(link.url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {/* 状态和统计 */}
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Eye className="h-3 w-3" />
                              <span>{link.viewCount} 次查看</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Download className="h-3 w-3" />
                              <span>{link.downloadCount} 次下载</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(link.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Switch
                            checked={link.isActive}
                            onCheckedChange={() => toggleShareLink(link.id, link.isActive)}
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteShareLink(link.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* 详细信息 */}
                      <div className="flex items-center space-x-4 text-xs">
                        <Badge variant={link.isActive ? 'default' : 'secondary'}>
                          {link.isActive ? '活跃' : '已禁用'}
                        </Badge>
                        {link.password && (
                          <Badge variant="outline">
                            <Lock className="h-3 w-3 mr-1" />
                            需要密码
                          </Badge>
                        )}
                        {link.allowPreview && (
                          <Badge variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            可预览
                          </Badge>
                        )}
                        {link.allowDownload && (
                          <Badge variant="outline">
                            <Download className="h-3 w-3 mr-1" />
                            可下载
                          </Badge>
                        )}
                        <span className="text-muted-foreground">
                          {formatExpiration(link.expiresAt)}
                        </span>
                        {link.maxDownloads && (
                          <span className="text-muted-foreground">
                            限制 {link.maxDownloads} 次下载
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ShareDialog