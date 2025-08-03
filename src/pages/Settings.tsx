import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Bell,
  Shield,
  Palette,
  HardDrive,
  Globe,
  Key,
  Download,
  Upload,
  Trash2,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  FileText,
  Share2,
  Cloud,
  Monitor,
  Smartphone,
  Wifi,
  WifiOff,
  Image,
  Video,
  Music,
  Archive,
  Search,
  Settings as SettingsIcon,
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
import { settingsAPI, systemAPI } from '@/services/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageWrapper } from '@/components/layout/Layout'
import { cn } from '@/lib/utils'
import { useThemeStore, useUserStore, useNotificationStore, usePreviewStore } from '@/store'

type SettingsTab = 'profile' | 'notifications' | 'security' | 'appearance' | 'storage' | 'system' | 'preview' | 'sharing' | 'sync'

interface SettingsTabItem {
  id: SettingsTab
  label: string
  icon: React.ReactNode
}

const settingsTabs: SettingsTabItem[] = [
  {
    id: 'profile',
    label: '个人资料',
    icon: <User className="h-5 w-5" />,
  },
  {
    id: 'preview',
    label: '文件预览',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: 'sharing',
    label: '分享设置',
    icon: <Share2 className="h-5 w-5" />,
  },
  {
    id: 'sync',
    label: '同步设置',
    icon: <Cloud className="h-5 w-5" />,
  },
  {
    id: 'notifications',
    label: '通知设置',
    icon: <Bell className="h-5 w-5" />,
  },
  {
    id: 'security',
    label: '安全设置',
    icon: <Shield className="h-5 w-5" />,
  },
  {
    id: 'appearance',
    label: '外观设置',
    icon: <Palette className="h-5 w-5" />,
  },
  {
    id: 'storage',
    label: '存储设置',
    icon: <HardDrive className="h-5 w-5" />,
  },
  {
    id: 'system',
    label: '系统设置',
    icon: <Globe className="h-5 w-5" />,
  },
]

function ProfileSettings() {
  const { user, updateUser } = useUserStore()
  const { addNotification } = useNotificationStore()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    bio: '',
    location: '',
    website: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      updateUser({
        ...user!,
        name: formData.name,
        email: formData.email,
      })
      
      addNotification({
        type: 'success',
        title: '保存成功',
        message: '个人资料已更新',
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: '保存失败',
        message: '请稍后重试',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">个人资料</h3>
        <p className="text-sm text-muted-foreground">
          管理您的个人信息和公开资料
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">姓名</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入姓名"
            />
          </div>
          <div>
            <label className="text-sm font-medium">邮箱</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="请输入邮箱"
            />
          </div>
          <div>
            <label className="text-sm font-medium">手机号</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="请输入手机号"
            />
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">个人简介</label>
            <textarea
              className="w-full min-h-[100px] px-3 py-2 border border-input bg-background rounded-md text-sm"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="介绍一下自己..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">位置</label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="请输入所在地"
            />
          </div>
          <div>
            <label className="text-sm font-medium">网站</label>
            <Input
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          保存更改
        </Button>
      </div>
    </div>
  )
}

function PreviewSettings() {
  const { settings, updateSettings } = usePreviewStore()
  const { addNotification } = useNotificationStore()

  const handleFileTypeToggle = (type: keyof typeof settings.enabledFileTypes) => {
    updateSettings({
      enabledFileTypes: {
        ...settings.enabledFileTypes,
        [type]: !settings.enabledFileTypes[type]
      }
    })
  }

  const handleSettingChange = (key: string, value: any) => {
    updateSettings({ [key]: value })
    addNotification({
      type: 'success',
      title: '设置已更新',
      message: '预览设置已成功保存'
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">文件预览设置</h3>
        <p className="text-sm text-muted-foreground">
          配置文件预览的行为和支持的文件类型
        </p>
      </div>

      {/* 预览模式 */}
      <Card>
        <CardHeader>
          <CardTitle>预览模式</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">默认预览模式</label>
            <Select value={settings.previewMode} onValueChange={(value) => handleSettingChange('previewMode', value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">自动检测</SelectItem>
                <SelectItem value="inline">内联预览</SelectItem>
                <SelectItem value="modal">弹窗预览</SelectItem>
                <SelectItem value="tab">新标签页</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">显示文件元数据</p>
              <p className="text-sm text-muted-foreground">在预览时显示文件大小、修改时间等信息</p>
            </div>
            <button
              onClick={() => handleSettingChange('showMetadata', !settings.showMetadata)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                settings.showMetadata ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  settings.showMetadata ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 缩略图设置 */}
      <Card>
        <CardHeader>
          <CardTitle>缩略图设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">启用缩略图</p>
              <p className="text-sm text-muted-foreground">为支持的文件类型生成缩略图</p>
            </div>
            <button
              onClick={() => handleSettingChange('enableThumbnails', !settings.enableThumbnails)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                settings.enableThumbnails ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  settings.enableThumbnails ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
          {settings.enableThumbnails && (
            <div>
              <label className="text-sm font-medium">缩略图质量</label>
              <Select value={settings.thumbnailQuality} onValueChange={(value) => handleSettingChange('thumbnailQuality', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">低质量 (快速)</SelectItem>
                  <SelectItem value="medium">中等质量</SelectItem>
                  <SelectItem value="high">高质量 (慢速)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 支持的文件类型 */}
      <Card>
        <CardHeader>
          <CardTitle>支持的文件类型</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Image className="h-4 w-4" />
                <span className="text-sm font-medium">图片文件</span>
              </div>
              <button
                onClick={() => handleFileTypeToggle('images')}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  settings.enabledFileTypes.images ? 'bg-primary' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    settings.enabledFileTypes.images ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Video className="h-4 w-4" />
                <span className="text-sm font-medium">视频文件</span>
              </div>
              <button
                onClick={() => handleFileTypeToggle('videos')}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  settings.enabledFileTypes.videos ? 'bg-primary' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    settings.enabledFileTypes.videos ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">文档文件</span>
              </div>
              <button
                onClick={() => handleFileTypeToggle('documents')}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  settings.enabledFileTypes.documents ? 'bg-primary' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    settings.enabledFileTypes.documents ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Music className="h-4 w-4" />
                <span className="text-sm font-medium">音频文件</span>
              </div>
              <button
                onClick={() => handleFileTypeToggle('audios')}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  settings.enabledFileTypes.audios ? 'bg-primary' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    settings.enabledFileTypes.audios ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <SettingsIcon className="h-4 w-4" />
                <span className="text-sm font-medium">代码文件</span>
              </div>
              <button
                onClick={() => handleFileTypeToggle('code')}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  settings.enabledFileTypes.code ? 'bg-primary' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    settings.enabledFileTypes.code ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Archive className="h-4 w-4" />
                <span className="text-sm font-medium">压缩文件</span>
              </div>
              <button
                onClick={() => handleFileTypeToggle('archives')}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  settings.enabledFileTypes.archives ? 'bg-primary' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    settings.enabledFileTypes.archives ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 高级设置 */}
      <Card>
        <CardHeader>
          <CardTitle>高级设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">最大预览文件大小 (MB)</label>
            <Input
              type="number"
              value={settings.maxPreviewSize.toString()}
              onChange={(e) => handleSettingChange('maxPreviewSize', parseInt(e.target.value) || 10)}
              className="w-full"
              min="1"
              max="100"
            />
            <p className="text-xs text-muted-foreground mt-1">
              超过此大小的文件将不会自动预览
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">自动播放视频</p>
              <p className="text-sm text-muted-foreground">在预览时自动播放视频文件</p>
            </div>
            <button
              onClick={() => handleSettingChange('autoPlayVideos', !settings.autoPlayVideos)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                settings.autoPlayVideos ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  settings.autoPlayVideos ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface SettingsProps {
  settings: any
  updateSettings: (category: string, newSettings: any) => Promise<void>
  resetSettings: (category?: string) => Promise<void>
  isSaving: boolean
}

function NotificationSettings({ settings, updateSettings, isSaving }: SettingsProps) {
  const notificationSettings = settings?.notifications || {}

  const handleToggle = async (key: string) => {
    const newSettings = {
      ...notificationSettings,
      [key]: !notificationSettings[key]
    }
    await updateSettings('notifications', newSettings)
  }

  const NotificationToggle = ({ 
    label, 
    description, 
    checked, 
    onChange 
  }: {
    label: string
    description: string
    checked: boolean
    onChange: () => void
  }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={onChange}
        disabled={isSaving}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-muted',
          isSaving && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">通知设置</h3>
        <p className="text-sm text-muted-foreground">
          选择您希望接收的通知类型
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="font-medium mb-4">通知方式</h4>
          <div className="space-y-1">
            <NotificationToggle
              label="邮件通知"
              description="通过邮件接收重要通知"
              checked={notificationSettings.emailNotifications || false}
              onChange={() => handleToggle('emailNotifications')}
            />
            <NotificationToggle
              label="推送通知"
              description="在浏览器中显示推送通知"
              checked={notificationSettings.pushNotifications || false}
              onChange={() => handleToggle('pushNotifications')}
            />
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-4">文件活动</h4>
          <div className="space-y-1">
            <NotificationToggle
              label="文件上传完成"
              description="文件上传完成时通知我"
              checked={notificationSettings.fileUploaded || false}
              onChange={() => handleToggle('fileUploaded')}
            />
            <NotificationToggle
              label="文件被分享"
              description="有人分享文件给我时通知我"
              checked={notificationSettings.fileShared || false}
              onChange={() => handleToggle('fileShared')}
            />
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-4">系统通知</h4>
          <div className="space-y-1">
            <NotificationToggle
              label="存储空间警告"
              description="存储空间不足时通知我"
              checked={notificationSettings.storageWarning || false}
              onChange={() => handleToggle('storageWarning')}
            />
            <NotificationToggle
              label="安全警报"
              description="检测到异常登录时通知我"
              checked={notificationSettings.securityAlerts || false}
              onChange={() => handleToggle('securityAlerts')}
            />
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-4">营销通知</h4>
          <div className="space-y-1">
            <NotificationToggle
              label="周报"
              description="每周发送使用统计报告"
              checked={notificationSettings.weeklyReport || false}
              onChange={() => handleToggle('weeklyReport')}
            />
            <NotificationToggle
              label="营销邮件"
              description="接收产品更新和优惠信息"
              checked={notificationSettings.marketingEmails || false}
              onChange={() => handleToggle('marketingEmails')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function SharingSettings({ settings, updateSettings, isSaving }: SettingsProps) {
  const sharingSettings = settings?.sharing || {}

  const handleSelectChange = async (key: string, value: string) => {
    const newSettings = {
      ...sharingSettings,
      [key]: value
    }
    await updateSettings('sharing', newSettings)
  }

  const handleToggle = async (key: string) => {
    const newSettings = {
      ...sharingSettings,
      [key]: !sharingSettings[key]
    }
    await updateSettings('sharing', newSettings)
  }

  const handleInputChange = async (key: string, value: string) => {
    const newSettings = {
      ...sharingSettings,
      [key]: value
    }
    await updateSettings('sharing', newSettings)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">分享设置</h3>
        <p className="text-sm text-muted-foreground">
          配置文件分享的默认行为和安全选项
        </p>
      </div>

      {/* 默认分享设置 */}
      <Card>
        <CardHeader>
          <CardTitle>默认分享设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">默认分享权限</label>
            <Select 
              value={sharingSettings.defaultSharePermission || 'view'} 
              onValueChange={(value) => handleSelectChange('defaultSharePermission', value)}
              disabled={isSaving}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">仅查看</SelectItem>
                <SelectItem value="comment">查看和评论</SelectItem>
                <SelectItem value="edit">编辑</SelectItem>
                <SelectItem value="admin">管理员</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">链接有效期</label>
            <Select 
              value={sharingSettings.linkExpiration || '7days'} 
              onValueChange={(value) => handleSelectChange('linkExpiration', value)}
              disabled={isSaving}
            >
              <SelectTrigger className="w-full">
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
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">允许公开分享</p>
              <p className="text-sm text-muted-foreground">允许创建无需登录即可访问的分享链接</p>
            </div>
            <button
              onClick={() => handleToggle('allowPublicSharing')}
              disabled={isSaving}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                (sharingSettings.allowPublicSharing !== false) ? 'bg-primary' : 'bg-muted',
                isSaving && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  (sharingSettings.allowPublicSharing !== false) ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 安全设置 */}
      <Card>
        <CardHeader>
          <CardTitle>安全设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">默认需要密码</p>
              <p className="text-sm text-muted-foreground">新创建的分享链接默认需要密码访问</p>
            </div>
            <button
              onClick={() => handleToggle('requirePassword')}
              disabled={isSaving}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                (sharingSettings.requirePassword === true) ? 'bg-primary' : 'bg-muted',
                isSaving && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  (sharingSettings.requirePassword === true) ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">访问通知</p>
              <p className="text-sm text-muted-foreground">当有人访问您的分享链接时发送通知</p>
            </div>
            <button
              onClick={() => handleToggle('notifyOnAccess')}
              disabled={isSaving}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                (sharingSettings.notifyOnAccess === true) ? 'bg-primary' : 'bg-muted',
                isSaving && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  (sharingSettings.notifyOnAccess === true) ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">跟踪查看次数</p>
              <p className="text-sm text-muted-foreground">记录分享链接的访问统计</p>
            </div>
            <button
              onClick={() => handleToggle('trackViews')}
              disabled={isSaving}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                (sharingSettings.trackViews !== false) ? 'bg-primary' : 'bg-muted',
                isSaving && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  (sharingSettings.trackViews !== false) ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 下载设置 */}
      <Card>
        <CardHeader>
          <CardTitle>下载设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">允许下载</p>
              <p className="text-sm text-muted-foreground">允许通过分享链接下载文件</p>
            </div>
            <button
              onClick={() => handleToggle('allowDownload')}
              disabled={isSaving}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                (sharingSettings.allowDownload !== false) ? 'bg-primary' : 'bg-muted',
                isSaving && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  (sharingSettings.allowDownload !== false) ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
          {(sharingSettings.allowDownload !== false) && (
            <div>
              <label className="text-sm font-medium">最大下载次数</label>
              <Input
                type="number"
                value={sharingSettings.maxDownloads || ''}
                onChange={(e) => handleInputChange('maxDownloads', e.target.value)}
                disabled={isSaving}
                placeholder="留空表示无限制"
                className="w-full"
                min="1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                设置每个分享链接的最大下载次数
              </p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">添加水印</p>
              <p className="text-sm text-muted-foreground">在分享的图片和文档中添加水印</p>
            </div>
            <button
              onClick={() => handleToggle('watermarkEnabled')}
              disabled={isSaving}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                (sharingSettings.watermarkEnabled === true) ? 'bg-primary' : 'bg-muted',
                isSaving && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  (sharingSettings.watermarkEnabled === true) ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SyncSettings({ settings, updateSettings, isSaving }: SettingsProps) {
  const syncSettings = settings?.sync || {}

  const handleSelectChange = async (key: string, value: string) => {
    const newSettings = {
      ...syncSettings,
      [key]: value
    }
    await updateSettings('sync', newSettings)
  }

  const handleToggle = async (key: string) => {
    const newSettings = {
      ...syncSettings,
      [key]: !syncSettings[key]
    }
    await updateSettings('sync', newSettings)
  }

  const handleInputChange = async (key: string, value: string) => {
    const newSettings = {
      ...syncSettings,
      [key]: value
    }
    await updateSettings('sync', newSettings)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">同步设置</h3>
        <p className="text-sm text-muted-foreground">
          配置文件同步的行为和网络选项
        </p>
      </div>

      {/* 基本同步设置 */}
      <Card>
        <CardHeader>
          <CardTitle>基本设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">启用自动同步</p>
              <p className="text-sm text-muted-foreground">自动同步文件更改到云端</p>
            </div>
            <button
              onClick={() => handleToggle('autoSync')}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                syncSettings.autoSync ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  syncSettings.autoSync ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
          {syncSettings.autoSync && (
            <div>
              <label className="text-sm font-medium">同步频率</label>
              <Select value={syncSettings.syncFrequency || 'realtime'} onValueChange={(value) => handleSelectChange('syncFrequency', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">实时同步</SelectItem>
                  <SelectItem value="5min">每5分钟</SelectItem>
                  <SelectItem value="15min">每15分钟</SelectItem>
                  <SelectItem value="1hour">每小时</SelectItem>
                  <SelectItem value="manual">手动同步</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">移动网络同步</p>
              <p className="text-sm text-muted-foreground">在移动网络下也进行同步</p>
            </div>
            <button
              onClick={() => handleToggle('syncOnMobile')}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                syncSettings.syncOnMobile ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  syncSettings.syncOnMobile ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 冲突处理 */}
      <Card>
        <CardHeader>
          <CardTitle>冲突处理</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">冲突解决策略</label>
            <Select value={syncSettings.conflictResolution || 'ask'} onValueChange={(value) => handleSelectChange('conflictResolution', value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ask">询问用户</SelectItem>
                <SelectItem value="local">优先本地版本</SelectItem>
                <SelectItem value="remote">优先云端版本</SelectItem>
                <SelectItem value="newer">优先较新版本</SelectItem>
                <SelectItem value="backup">保留两个版本</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 高级设置 */}
      <Card>
        <CardHeader>
          <CardTitle>高级设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">带宽限制 (KB/s)</label>
            <Input
              type="number"
              value={syncSettings.bandwidthLimit || ''}
              onChange={(e) => handleInputChange('bandwidthLimit', e.target.value)}
              placeholder="留空表示无限制"
              className="w-full"
              min="1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              限制同步时的网络带宽使用
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">同步隐藏文件</p>
              <p className="text-sm text-muted-foreground">同步以点开头的隐藏文件</p>
            </div>
            <button
              onClick={() => handleToggle('syncHiddenFiles')}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                syncSettings.syncHiddenFiles ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  syncSettings.syncHiddenFiles ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">启用压缩</p>
              <p className="text-sm text-muted-foreground">在传输时压缩文件以节省带宽</p>
            </div>
            <button
              onClick={() => handleToggle('compressionEnabled')}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                syncSettings.compressionEnabled ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  syncSettings.compressionEnabled ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">选择性同步</p>
              <p className="text-sm text-muted-foreground">只同步选定的文件夹</p>
            </div>
            <button
              onClick={() => handleToggle('selectiveSync')}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                syncSettings.selectiveSync ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  syncSettings.selectiveSync ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 同步状态 */}
      <Card>
        <CardHeader>
          <CardTitle>同步状态</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">状态</span>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600">已同步</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">上次同步</span>
              <span>2分钟前</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">同步文件数</span>
              <span>1,234 个文件</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">同步大小</span>
              <span>2.5 GB</span>
            </div>
          </div>
          <div className="mt-4">
            <Button className="w-full" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              立即同步
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SecuritySettings() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [loginNotifications, setLoginNotifications] = useState(true)
  const [ipWhitelist, setIpWhitelist] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState('24')
  const [dataEncryption, setDataEncryption] = useState(true)
  const [auditLog, setAuditLog] = useState(true)
  const [showApiKeys, setShowApiKeys] = useState(false)

  const handlePasswordChange = () => {
    // 实现密码修改逻辑
    console.log('Change password:', passwordForm)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">安全设置</h3>
        <p className="text-sm text-muted-foreground">
          管理您的账户安全和隐私设置
        </p>
      </div>

      {/* 修改密码 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            修改密码
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">当前密码</label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="请输入当前密码"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">新密码</label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="请输入新密码"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">确认新密码</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="请再次输入新密码"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
          <Button onClick={handlePasswordChange}>
            更新密码
          </Button>
        </CardContent>
      </Card>

      {/* 两步验证 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            两步验证
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">启用两步验证</p>
              <p className="text-sm text-muted-foreground">为您的账户添加额外的安全保护</p>
            </div>
            <button
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                twoFactorEnabled ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
          {twoFactorEnabled && (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">两步验证已启用</span>
                </div>
                <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">
                  您的账户现在受到额外保护
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" size="sm">
                  查看备用码
                </Button>
                <Button variant="outline" size="sm">
                  重新配置
                </Button>
              </div>
            </div>
          )}
          {!twoFactorEnabled && (
            <Button variant="outline">
              设置两步验证
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 登录安全 */}
      <Card>
        <CardHeader>
          <CardTitle>登录安全</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">登录通知</p>
              <p className="text-sm text-muted-foreground">新设备登录时发送邮件通知</p>
            </div>
            <button
              onClick={() => setLoginNotifications(!loginNotifications)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                loginNotifications ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  loginNotifications ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">IP 白名单</p>
              <p className="text-sm text-muted-foreground">仅允许指定 IP 地址登录</p>
            </div>
            <button
              onClick={() => setIpWhitelist(!ipWhitelist)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                ipWhitelist ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  ipWhitelist ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
          {ipWhitelist && (
            <div>
              <label className="text-sm font-medium">允许的 IP 地址</label>
              <Input placeholder="192.168.1.1, 10.0.0.1" className="mt-1" />
              <p className="text-sm text-muted-foreground mt-1">
                用逗号分隔多个 IP 地址
              </p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium">会话超时时间（小时）</label>
            <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 小时</SelectItem>
                <SelectItem value="6">6 小时</SelectItem>
                <SelectItem value="12">12 小时</SelectItem>
                <SelectItem value="24">24 小时</SelectItem>
                <SelectItem value="168">7 天</SelectItem>
                <SelectItem value="never">永不过期</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* API 密钥管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            API 密钥管理
            <Button variant="outline" size="sm">
              <Key className="h-4 w-4 mr-2" />
              创建密钥
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                name: 'Mobile App Key',
                created: '2024-01-15',
                lastUsed: '2 小时前',
                permissions: '读写',
              },
              {
                name: 'Backup Script',
                created: '2024-01-10',
                lastUsed: '1 天前',
                permissions: '只读',
              },
            ].map((key, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{key.name}</p>
                  <p className="text-sm text-muted-foreground">
                    创建于 {key.created} • 最后使用 {key.lastUsed} • {key.permissions}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    编辑
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600">
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 数据加密与隐私 */}
      <Card>
        <CardHeader>
          <CardTitle>数据加密与隐私</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">端到端加密</p>
              <p className="text-sm text-muted-foreground">使用 AES-256 加密保护您的文件</p>
            </div>
            <button
              onClick={() => setDataEncryption(!dataEncryption)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                dataEncryption ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  dataEncryption ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">审计日志</p>
              <p className="text-sm text-muted-foreground">记录所有安全相关操作</p>
            </div>
            <button
              onClick={() => setAuditLog(!auditLog)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                auditLog ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  auditLog ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline">
              下载数据
            </Button>
            <Button variant="outline">
              查看日志
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 登录会话 */}
      <Card>
        <CardHeader>
          <CardTitle>活跃会话</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                device: 'Windows PC',
                location: '北京, 中国',
                lastActive: '当前会话',
                isCurrent: true,
              },
              {
                device: 'iPhone 15',
                location: '上海, 中国',
                lastActive: '2 小时前',
                isCurrent: false,
              },
              {
                device: 'Chrome 浏览器',
                location: '广州, 中国',
                lastActive: '1 天前',
                isCurrent: false,
              },
            ].map((session, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium flex items-center">
                    {session.device}
                    {session.isCurrent && (
                      <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        当前
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {session.location} • {session.lastActive}
                  </p>
                </div>
                {!session.isCurrent && (
                  <Button variant="outline" size="sm">
                    终止会话
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 危险操作 */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            危险操作
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">删除账户</h4>
              <p className="text-sm text-muted-foreground mb-3">
                永久删除您的账户和所有相关数据。此操作无法撤销。
              </p>
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)}
              >
                删除账户
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 删除账户确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              确认删除账户
            </DialogTitle>
            <DialogDescription>
              此操作将永久删除您的账户和所有相关数据，包括文件、文件夹和设置。
              此操作无法撤销，请谨慎操作。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive">
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AppearanceSettings() {
  const { theme, setTheme } = useThemeStore()
  const [language, setLanguage] = useState('zh-CN')
  const [fontSize, setFontSize] = useState('medium')
  const [compactMode, setCompactMode] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">外观设置</h3>
        <p className="text-sm text-muted-foreground">
          自定义界面外观和显示偏好
        </p>
      </div>

      <div className="space-y-6">
        {/* 主题设置 */}
        <div>
          <h4 className="font-medium mb-4">主题</h4>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'light', label: '浅色', preview: 'bg-white border-2' },
              { value: 'dark', label: '深色', preview: 'bg-gray-900 border-2' },
              { value: 'system', label: '跟随系统', preview: 'bg-gradient-to-r from-white to-gray-900 border-2' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value as any)}
                className={cn(
                  'p-3 rounded-lg border-2 transition-colors',
                  theme === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className={cn('w-full h-16 rounded mb-2', option.preview)} />
                <p className="text-sm font-medium">{option.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 语言设置 */}
        <div>
          <h4 className="font-medium mb-4">语言</h4>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zh-CN">简体中文</SelectItem>
              <SelectItem value="zh-TW">繁體中文</SelectItem>
              <SelectItem value="en-US">English</SelectItem>
              <SelectItem value="ja-JP">日本語</SelectItem>
              <SelectItem value="ko-KR">한국어</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 字体大小 */}
        <div>
          <h4 className="font-medium mb-4">字体大小</h4>
          <Select value={fontSize} onValueChange={setFontSize}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">小</SelectItem>
              <SelectItem value="medium">中</SelectItem>
              <SelectItem value="large">大</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 紧凑模式 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">紧凑模式</p>
            <p className="text-sm text-muted-foreground">减少界面元素间距，显示更多内容</p>
          </div>
          <button
            onClick={() => setCompactMode(!compactMode)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              compactMode ? 'bg-primary' : 'bg-muted'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                compactMode ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </div>
    </div>
  )
}

function StorageSettings({ settings, updateSettings, isSaving }: SettingsProps) {
  const { addNotification } = useNotificationStore()
  
  const storageSettings = settings?.storage || {}
  
  const handleToggle = async (key: string) => {
    const newSettings = {
      ...storageSettings,
      [key]: !storageSettings[key]
    }
    await updateSettings('storage', newSettings)
  }
  
  const handleSelectChange = async (key: string, value: string) => {
    const newSettings = {
      ...storageSettings,
      [key]: value
    }
    await updateSettings('storage', newSettings)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">存储设置</h3>
        <p className="text-sm text-muted-foreground">
          管理文件存储和处理选项
        </p>
      </div>

      {/* 文件上传设置 */}
      <Card>
        <CardHeader>
          <CardTitle>文件上传</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">允许重复文件上传</p>
              <p className="text-sm text-muted-foreground">允许上传同名文件，系统会自动重命名</p>
            </div>
            <button
              onClick={() => handleToggle('allowDuplicates')}
              disabled={isSaving}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                storageSettings.allowDuplicates ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  storageSettings.allowDuplicates ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
          <div>
            <label className="text-sm font-medium">单文件大小限制</label>
            <Select value={storageSettings.maxFileSize || '100'} onValueChange={(value) => handleSelectChange('maxFileSize', value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 MB</SelectItem>
                <SelectItem value="50">50 MB</SelectItem>
                <SelectItem value="100">100 MB</SelectItem>
                <SelectItem value="500">500 MB</SelectItem>
                <SelectItem value="1000">1 GB</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>


    </div>
  )
}

function SystemSettings() {
  const [systemConfig, setSystemConfig] = useState<any>(null)
  const [performanceStats, setPerformanceStats] = useState<any>(null)
  const [systemInfo, setSystemInfo] = useState<any>(null)
  const [systemLogs, setSystemLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 加载系统数据
  const loadSystemData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [configRes, perfRes, infoRes] = await Promise.all([
        systemAPI.getSystemConfig(),
        systemAPI.getPerformanceStats(),
        systemAPI.getSystemInfo()
      ])
      
      if (configRes.success) {
        setSystemConfig(configRes.data)
      }
      
      if (perfRes.success) {
        setPerformanceStats(perfRes.data)
      }
      
      if (infoRes.success) {
        setSystemInfo(infoRes.data)
      }
    } catch (err: any) {
      console.error('加载系统数据失败:', err)
      setError(err.response?.data?.error || '加载系统数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 更新系统配置
  const updateConfig = async (category: string, updates: any) => {
    try {
      setSaving(true)
      const newConfig = {
        ...systemConfig,
        [category]: {
          ...systemConfig[category],
          ...updates
        }
      }
      
      const response = await systemAPI.updateSystemConfig(newConfig)
      if (response.success) {
        setSystemConfig(response.data)
        // 可以添加成功提示
      }
    } catch (err: any) {
      console.error('更新配置失败:', err)
      setError(err.response?.data?.error || '更新配置失败')
    } finally {
      setSaving(false)
    }
  }

  // 执行系统操作
  const performSystemAction = async (action: string, params?: any) => {
    try {
      setSaving(true)
      let response
      
      switch (action) {
        case 'backup':
          response = await systemAPI.createBackup()
          break
        case 'cleanup':
          response = await systemAPI.cleanupSystem(params.type)
          break
        case 'logs':
          response = await systemAPI.getSystemLogs()
          if (response.success) {
            setSystemLogs(response.data)
          }
          break
        default:
          throw new Error('未知操作')
      }
      
      if (response.success) {
        // 可以添加成功提示
        console.log(`${action} 操作成功:`, response.data)
      }
    } catch (err: any) {
      console.error(`${action} 操作失败:`, err)
      setError(err.response?.data?.error || `${action} 操作失败`)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    loadSystemData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>加载系统设置中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadSystemData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            重试
          </Button>
        </div>
      </div>
    )
  }

  if (!systemConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>无法加载系统配置</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">系统设置</h3>
        <p className="text-sm text-muted-foreground">
          管理系统级别的配置和维护选项
        </p>
      </div>

      {/* 备份设置 */}
      <Card>
        <CardHeader>
          <CardTitle>数据备份</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">启用自动备份</p>
              <p className="text-sm text-muted-foreground">定期备份您的文件和设置</p>
            </div>
            <button
              onClick={() => updateConfig('backup', { enabled: !systemConfig.backup?.enabled })}
              disabled={saving}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                systemConfig.backup?.enabled ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  systemConfig.backup?.enabled ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
          {systemConfig.backup?.enabled && (
            <div>
              <label className="text-sm font-medium">备份频率</label>
              <Select 
                value={systemConfig.backup?.frequency || 'daily'} 
                onValueChange={(value) => updateConfig('backup', { frequency: value })}
                disabled={saving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">每小时</SelectItem>
                  <SelectItem value="daily">每天</SelectItem>
                  <SelectItem value="weekly">每周</SelectItem>
                  <SelectItem value="monthly">每月</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => performSystemAction('backup')}
              disabled={saving}
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              创建备份
            </Button>
            <Button variant="outline" disabled>
              <Upload className="h-4 w-4 mr-2" />
              恢复备份
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 系统维护 */}
      <Card>
        <CardHeader>
          <CardTitle>系统维护</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">维护模式</p>
              <p className="text-sm text-muted-foreground">启用后将限制系统访问</p>
            </div>
            <button
              onClick={() => updateConfig('maintenance', { enabled: !systemConfig.maintenance?.enabled })}
              disabled={saving}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                systemConfig.maintenance?.enabled ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  systemConfig.maintenance?.enabled ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline"
              onClick={() => performSystemAction('cleanup')}
              disabled={saving}
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              清理系统
            </Button>
            <Button 
              variant="outline"
              onClick={() => performSystemAction('logs')}
              disabled={saving}
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              获取日志
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 更新设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            系统更新
            <Button variant="outline" size="sm" disabled>
              <RefreshCw className="h-4 w-4 mr-2" />
              检查更新
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">自动更新</p>
              <p className="text-sm text-muted-foreground">自动下载并安装系统更新</p>
            </div>
            <button
              onClick={() => updateConfig('updates', { auto: !systemConfig.updates?.auto })}
              disabled={saving}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                systemConfig.updates?.auto ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  systemConfig.updates?.auto ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">系统运行正常</span>
            </div>
            <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">
              当前版本：{systemInfo?.version || 'v1.0.0'} • 平台：{systemInfo?.platform || 'Unknown'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 性能监控 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            性能监控
            <Button variant="outline" size="sm">
              <Monitor className="h-4 w-4 mr-2" />
              查看详情
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">启用性能监控</p>
              <p className="text-sm text-muted-foreground">监控系统资源使用情况</p>
            </div>
            <button
              onClick={() => updateConfig('monitoring', { enabled: !systemConfig.monitoring?.enabled })}
              disabled={saving}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                systemConfig.monitoring?.enabled ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  systemConfig.monitoring?.enabled ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
          <div>
            <label className="text-sm font-medium">资源限制</label>
            <Select 
              value={systemConfig.monitoring?.resourceLimit || 'normal'} 
              onValueChange={(value) => updateConfig('monitoring', { resourceLimit: value })}
              disabled={saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">低（节能模式）</SelectItem>
                <SelectItem value="normal">正常</SelectItem>
                <SelectItem value="high">高（性能模式）</SelectItem>
                <SelectItem value="unlimited">无限制</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {performanceStats && (
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="font-medium">CPU</div>
                <div className="text-2xl font-bold text-blue-600">{performanceStats.cpu_usage?.toFixed(1) || 0}%</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="font-medium">内存</div>
                <div className="text-2xl font-bold text-green-600">{performanceStats.memory_usage?.toFixed(1) || 0}%</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="font-medium">磁盘</div>
                <div className="text-2xl font-bold text-orange-600">{performanceStats.disk_usage?.toFixed(1) || 0}%</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 日志管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            日志管理
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => performSystemAction('logs')}
              disabled={saving}
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              查看日志
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">日志级别</label>
            <Select 
              value={systemConfig.logging?.level || 'info'} 
              onValueChange={(value) => updateConfig('logging', { level: value })}
              disabled={saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debug">调试（Debug）</SelectItem>
                <SelectItem value="info">信息（Info）</SelectItem>
                <SelectItem value="warn">警告（Warning）</SelectItem>
                <SelectItem value="error">错误（Error）</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">最大日志文件大小（MB）</label>
            <Select 
              value={systemConfig.logging?.maxSize || '100'} 
              onValueChange={(value) => updateConfig('logging', { maxSize: value })}
              disabled={saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50 MB</SelectItem>
                <SelectItem value="100">100 MB</SelectItem>
                <SelectItem value="200">200 MB</SelectItem>
                <SelectItem value="500">500 MB</SelectItem>
                <SelectItem value="unlimited">无限制</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {systemLogs && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span>当前日志大小</span>
                <span className="font-medium">{systemLogs.total_size || '0 MB'}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span>日志文件数量</span>
                <span className="font-medium">{systemLogs.file_count || 0} 个文件</span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              导出日志
            </Button>
            <Button variant="outline">
              <Trash2 className="h-4 w-4 mr-2" />
              清理日志
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 开发者选项 */}
      <Card>
        <CardHeader>
          <CardTitle>开发者选项</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">调试模式</p>
              <p className="text-sm text-muted-foreground">启用详细的调试信息</p>
            </div>
            <button
              onClick={() => updateConfig('developer', { debug: !systemConfig.developer?.debug })}
              disabled={saving}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                systemConfig.developer?.debug ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  systemConfig.developer?.debug ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">错误报告</p>
              <p className="text-sm text-muted-foreground">自动发送错误报告以改进系统</p>
            </div>
            <button
              onClick={() => updateConfig('developer', { errorReporting: !systemConfig.developer?.errorReporting })}
              disabled={saving}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                systemConfig.developer?.errorReporting ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  systemConfig.developer?.errorReporting ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline">
              <SettingsIcon className="h-4 w-4 mr-2" />
              API 控制台
            </Button>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              重启服务
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 系统信息 */}
      <Card>
        <CardHeader>
          <CardTitle>系统信息</CardTitle>
        </CardHeader>
        <CardContent>
          {systemInfo ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">版本</span>
                <span>{systemInfo.version || 'v1.0.0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">平台</span>
                <span>{systemInfo.platform || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">架构</span>
                <span>{systemInfo.architecture || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Python 版本</span>
                <span>{systemInfo.python_version || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">上传目录大小</span>
                <span>{systemInfo.upload_dir_size || '0 MB'}</span>
              </div>
              {systemInfo.storage && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">总存储空间</span>
                    <span>{systemInfo.storage.total || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">已用存储空间</span>
                    <span>{systemInfo.storage.used || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">可用存储空间</span>
                    <span>{systemInfo.storage.free || 'Unknown'}</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              {loading ? '加载中...' : '无法获取系统信息'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [settings, setSettings] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { addNotification } = useNotificationStore()

  // 加载用户设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true)
        const response = await settingsAPI.getSettings()
        if (response.success) {
          setSettings(response.data)
        } else {
          addNotification({
            type: 'error',
            title: '加载设置失败',
            message: response.error || '无法加载用户设置'
          })
        }
      } catch (error) {
        console.error('加载设置失败:', error)
        addNotification({
          type: 'error',
          title: '加载设置失败',
          message: '网络错误，请稍后重试'
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  // 更新设置
  const updateSettings = async (category: string, newSettings: any) => {
    try {
      setIsSaving(true)
      const response = await settingsAPI.updateSettings(category, newSettings)
      if (response.success) {
        setSettings(response.data)
        addNotification({
          type: 'success',
          title: '设置已保存',
          message: '您的设置已成功保存'
        })
      } else {
        addNotification({
          type: 'error',
          title: '保存失败',
          message: response.error || '无法保存设置'
        })
      }
    } catch (error) {
      console.error('保存设置失败:', error)
      addNotification({
        type: 'error',
        title: '保存失败',
        message: '网络错误，请稍后重试'
      })
    } finally {
      setIsSaving(false)
    }
  }

  // 重置设置
  const resetSettings = async (category?: string) => {
    try {
      setIsSaving(true)
      const response = await settingsAPI.resetSettings(category)
      if (response.success) {
        setSettings(response.data)
        addNotification({
          type: 'success',
          title: '设置已重置',
          message: category ? `${category}设置已重置为默认值` : '所有设置已重置为默认值'
        })
      } else {
        addNotification({
          type: 'error',
          title: '重置失败',
          message: response.error || '无法重置设置'
        })
      }
    } catch (error) {
      console.error('重置设置失败:', error)
      addNotification({
        type: 'error',
        title: '重置失败',
        message: '网络错误，请稍后重试'
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <PageWrapper
        title="设置"
        breadcrumbs={[
          { label: '首页', href: '/' },
          { label: '设置', href: '/settings' },
        ]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">加载设置中...</p>
          </div>
        </div>
      </PageWrapper>
    )
  }

  const renderTabContent = () => {
    if (!settings) return null

    const commonProps = {
      settings,
      updateSettings,
      resetSettings,
      isSaving
    }

    switch (activeTab) {
      case 'profile':
        return <ProfileSettings {...commonProps} />
      case 'preview':
        return <PreviewSettings {...commonProps} />
      case 'sharing':
        return <SharingSettings {...commonProps} />
      case 'sync':
        return <SyncSettings {...commonProps} />
      case 'notifications':
        return <NotificationSettings {...commonProps} />
      case 'security':
        return <SecuritySettings {...commonProps} />
      case 'appearance':
        return <AppearanceSettings {...commonProps} />
      case 'storage':
        return <StorageSettings {...commonProps} />
      case 'system':
        return <SystemSettings {...commonProps} />
      default:
        return <ProfileSettings {...commonProps} />
    }
  }

  return (
    <PageWrapper
      title="设置"
      breadcrumbs={[
        { label: '首页', href: '/' },
        { label: '设置', href: '/settings' },
      ]}
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 侧边栏 */}
        <div className="lg:w-64 flex-shrink-0">
          <Card>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {settingsTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors',
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    )}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* 主内容区 */}
        <div className="flex-1">
          <Card>
            <CardContent className="p-6">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                {renderTabContent()}
              </motion.div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  )
}