import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Users,
  HardDrive,
  FileText,
  Folder,
  Download,
  Upload,
  Activity,
  Calendar,
  Clock,
  Filter,
  Database,
  Cpu,
  Zap,
  Globe,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Share2,
  Search,
  Settings,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageWrapper } from '@/components/layout/Layout'
import { cn, formatFileSize, formatDate } from '@/lib/utils'
import { useFileStore, useFolderStore, useUserStore } from '@/store'
import { statisticsAPI } from '@/services/api'
import type { File } from '@/types'

type TimeRange = '7d' | '30d' | '90d' | '1y'
type AnalysisView = 'overview' | 'storage' | 'usage'

interface MetricCard {
  title: string
  value: string | number
  change: number
  changeType: 'positive' | 'negative' | 'neutral'
  icon: React.ReactNode
  color: string
  description?: string
}

interface ChartData {
  name: string
  value: number
  color?: string
  percentage?: number
}

interface TimeSeriesData {
  date: string
  uploads: number
  downloads: number
  views: number
  storage: number
  users: number
}

// 移除了面向管理员的接口定义

// 模拟数据生成函数
const generateMetrics = (timeRange: TimeRange): MetricCard[] => {
  const multipliers = {
    '7d': 1,
    '30d': 4.3,
    '90d': 13,
    '1y': 52
  }
  
  const base = multipliers[timeRange]
  
  return [
    {
      title: '总文件数',
      value: Math.floor(1234 * base).toLocaleString(),
      change: 12.5,
      changeType: 'positive',
      icon: <FileText className="h-6 w-6" />,
      color: 'bg-blue-500',
      description: '系统中所有文件的总数量'
    },
    {
      title: '存储使用量',
      value: formatFileSize(45.2 * 1024 * 1024 * 1024 * base),
      change: 8.3,
      changeType: 'neutral',
      icon: <HardDrive className="h-6 w-6" />,
      color: 'bg-green-500',
      description: '当前存储空间使用情况'
    },
    {
      title: '活跃用户',
      value: Math.floor(89 * Math.sqrt(base)),
      change: 15.2,
      changeType: 'positive',
      icon: <Users className="h-6 w-6" />,
      color: 'bg-purple-500',
      description: '最近活跃的用户数量'
    },
    {
      title: '系统性能',
      value: '98.5%',
      change: 2.1,
      changeType: 'positive',
      icon: <Cpu className="h-6 w-6" />,
      color: 'bg-orange-500',
      description: '系统整体运行效率'
    },
    {
      title: '数据传输',
      value: formatFileSize(2.3 * 1024 * 1024 * 1024 * base),
      change: -5.7,
      changeType: 'negative',
      icon: <Globe className="h-6 w-6" />,
      color: 'bg-indigo-500',
      description: '总数据传输量'
    },
    {
      title: '安全评分',
      value: '95/100',
      change: 3.2,
      changeType: 'positive',
      icon: <Shield className="h-6 w-6" />,
      color: 'bg-emerald-500',
      description: '系统安全健康度评分'
    }
  ]
}

const generateTimeSeriesData = (timeRange: TimeRange): TimeSeriesData[] => {
  const days = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365
  }[timeRange]
  
  return Array.from({ length: Math.min(days, 30) }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (days - i - 1))
    
    return {
      date: date.toISOString().split('T')[0],
      uploads: Math.floor(Math.random() * 100) + 20,
      downloads: Math.floor(Math.random() * 200) + 50,
      views: Math.floor(Math.random() * 500) + 100,
      storage: Math.floor(Math.random() * 1000) + 500,
      users: Math.floor(Math.random() * 50) + 10
    }
  })
}

const fileTypeDistribution: ChartData[] = [
  { name: '文档', value: 35, color: '#3b82f6', percentage: 35 },
  { name: '图片', value: 28, color: '#10b981', percentage: 28 },
  { name: '视频', value: 20, color: '#f59e0b', percentage: 20 },
  { name: '音频', value: 10, color: '#ef4444', percentage: 10 },
  { name: '其他', value: 7, color: '#8b5cf6', percentage: 7 }
]

// 移除了面向管理员的性能监控和安全事件数据

function MetricCard({ metric }: { metric: MetricCard }) {
  const getChangeColor = (type: MetricCard['changeType']) => {
    switch (type) {
      case 'positive':
        return 'text-green-600 dark:text-green-400'
      case 'negative':
        return 'text-red-600 dark:text-red-400'
      case 'neutral':
      default:
        return 'text-blue-600 dark:text-blue-400'
    }
  }

  const getChangeIcon = (type: MetricCard['changeType']) => {
    if (type === 'positive') {
      return <TrendingUp className="h-4 w-4" />
    } else if (type === 'negative') {
      return <TrendingDown className="h-4 w-4" />
    }
    return <Activity className="h-4 w-4" />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </p>
              <p className="text-3xl font-bold">{metric.value}</p>
              <div className={cn(
                'flex items-center space-x-1 text-sm',
                getChangeColor(metric.changeType)
              )}>
                {getChangeIcon(metric.changeType)}
                <span>{metric.change > 0 ? '+' : ''}{metric.change}%</span>
                <span className="text-muted-foreground">vs 上期</span>
              </div>
              {metric.description && (
                <p className="text-xs text-muted-foreground mt-2">
                  {metric.description}
                </p>
              )}
            </div>
            <div className={cn(
              'p-4 rounded-full text-white shadow-lg',
              metric.color
            )}>
              {metric.icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function AdvancedPieChart({ data, title }: { data: ChartData[]; title: string }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let cumulativePercentage = 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <PieChart className="h-5 w-5 mr-2" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-56 h-56">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {data.map((item, index) => {
                const percentage = (item.value / total) * 100
                const strokeDasharray = `${percentage} ${100 - percentage}`
                const strokeDashoffset = -cumulativePercentage
                cumulativePercentage += percentage

                return (
                  <motion.circle
                    key={index}
                    cx="50"
                    cy="50"
                    r="15.915"
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth="6"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    initial={{ strokeDasharray: '0 100' }}
                    animate={{ strokeDasharray, strokeDashoffset }}
                    transition={{ duration: 1, delay: index * 0.2 }}
                    className="hover:stroke-[8] transition-all cursor-pointer"
                  />
                )
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold">{total}</div>
                <div className="text-sm text-muted-foreground">总计</div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {data.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium truncate">{item.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">{item.percentage}%</div>
                <div className="text-xs text-muted-foreground">{item.value}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TimeSeriesChart({ data }: { data: TimeSeriesData[] }) {
  const maxValue = Math.max(
    ...data.flatMap(d => [d.uploads, d.downloads, d.views])
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          活动趋势分析
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 图例 */}
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span>上传</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span>下载</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <span>查看</span>
            </div>
          </div>

          {/* 图表 */}
          <div className="h-80 flex items-end space-x-1 px-2">
            {data.map((item, index) => {
              const uploadHeight = (item.uploads / maxValue) * 100
              const downloadHeight = (item.downloads / maxValue) * 100
              const viewHeight = (item.views / maxValue) * 100

              return (
                <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                  <div className="w-full flex items-end justify-center space-x-0.5 h-72">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${uploadHeight}%` }}
                      transition={{ duration: 0.8, delay: index * 0.05 }}
                      className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                      title={`上传: ${item.uploads}`}
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${downloadHeight}%` }}
                      transition={{ duration: 0.8, delay: index * 0.05 + 0.1 }}
                      className="w-full bg-green-500 rounded-t hover:bg-green-600 transition-colors"
                      title={`下载: ${item.downloads}`}
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${viewHeight}%` }}
                      transition={{ duration: 0.8, delay: index * 0.05 + 0.2 }}
                      className="w-full bg-yellow-500 rounded-t hover:bg-yellow-600 transition-colors"
                      title={`查看: ${item.views}`}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground transform rotate-45 origin-left">
                    {new Date(item.date).getDate()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 移除了面向管理员的组件

export function SystemAnalytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [analysisView, setAnalysisView] = useState<AnalysisView>('overview')
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<MetricCard[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [fileTypeData, setFileTypeData] = useState<ChartData[]>([])
  const [recentFiles, setRecentFiles] = useState<File[]>([])
  const [storageData, setStorageData] = useState<{ used: number; total: number; percentage: number } | null>(null)
  const { user } = useUserStore()
  
  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true)
      
      // 并行加载所有数据
      const [statsRes, storageRes, fileTypesRes, uploadTrendRes, recentFilesRes] = await Promise.all([
        statisticsAPI.getStatistics(),
        statisticsAPI.getStorageUsage(),
        statisticsAPI.getFileTypeDistribution(),
        statisticsAPI.getUploadTrend(getDaysFromTimeRange(timeRange)),
        statisticsAPI.getRecentFiles(10)
      ])
      
      // 处理基本统计数据
      if (statsRes.success) {
        const stats = statsRes.data
        const generatedMetrics: MetricCard[] = [
          {
            title: '总文件数',
            value: stats.totalFiles,
            change: stats.recentUploads,
            changeType: 'positive',
            icon: <FileText className="h-6 w-6" />,
            color: 'text-blue-600',
            description: `最近${getTimeRangeLabel(timeRange)}新增 ${stats.recentUploads} 个文件`
          },
          {
            title: '存储使用',
            value: formatFileSize(stats.totalSize),
            change: Math.round((stats.totalSize / stats.storageLimit) * 100),
            changeType: stats.totalSize > stats.storageLimit * 0.8 ? 'negative' : 'positive',
            icon: <HardDrive className="h-6 w-6" />,
            color: 'text-green-600',
            description: `存储限制 ${formatFileSize(stats.storageLimit)}`
          },
          {
            title: '文件夹数',
            value: stats.totalFolders,
            change: 0,
            changeType: 'neutral',
            icon: <Folder className="h-6 w-6" />,
            color: 'text-purple-600',
            description: '文件夹总数'
          },
          {
            title: '平均文件大小',
            value: stats.totalFiles > 0 ? formatFileSize(Math.round(stats.totalSize / stats.totalFiles)) : '0 B',
            change: stats.totalFiles > 0 ? Math.round(stats.totalSize / stats.totalFiles / 1024) : 0,
            changeType: 'neutral',
            icon: <BarChart3 className="h-6 w-6" />,
            color: 'text-orange-600',
            description: '每个文件的平均大小'
          },
          {
            title: '上传活跃度',
            value: `${stats.recentUploads}个`,
            change: Math.round((stats.recentUploads / Math.max(stats.totalFiles, 1)) * 100),
            changeType: stats.recentUploads > 0 ? 'positive' : 'neutral',
            icon: <Upload className="h-6 w-6" />,
            color: 'text-emerald-600',
            description: `${getTimeRangeLabel(timeRange)}的上传活跃度`
          },
          {
            title: '存储使用率',
            value: `${Math.round((stats.totalSize / stats.storageLimit) * 100)}%`,
            change: Math.round((stats.totalSize / stats.storageLimit) * 100),
            changeType: stats.totalSize > stats.storageLimit * 0.8 ? 'negative' : stats.totalSize > stats.storageLimit * 0.5 ? 'neutral' : 'positive',
            icon: <Database className="h-6 w-6" />,
            color: 'text-indigo-600',
            description: '个人存储空间使用情况'
          }
        ]
        setMetrics(generatedMetrics)
      }
      
      // 处理存储数据
      if (storageRes.success) {
        setStorageData(storageRes.data)
      }
      
      // 处理文件类型分布
      if (fileTypesRes.success) {
        const typeColors = {
          'image': '#3b82f6',
          'document': '#10b981',
          'video': '#f59e0b',
          'audio': '#ef4444',
          'archive': '#8b5cf6',
          'other': '#6b7280'
        }
        
        const totalFiles = fileTypesRes.data.reduce((sum, item) => sum + item.count, 0)
        const processedFileTypes = fileTypesRes.data.map(item => ({
          name: getFileTypeDisplayName(item.type),
          value: item.count,
          color: typeColors[item.type as keyof typeof typeColors] || typeColors.other,
          percentage: Math.round((item.count / totalFiles) * 100)
        }))
        setFileTypeData(processedFileTypes)
      }
      
      // 处理上传趋势数据
      if (uploadTrendRes.success) {
        const processedTrendData = uploadTrendRes.data.map(item => ({
          date: item.date,
          uploads: item.count,
          downloads: 0, // 后端暂无下载统计
          views: 0, // 后端暂无查看统计
          storage: item.size,
          users: 1 // 单用户系统
        }))
        setTimeSeriesData(processedTrendData)
      }
      
      // 处理最近文件
      if (recentFilesRes.success) {
        setRecentFiles(recentFilesRes.data)
      }
      
    } catch (error) {
      console.error('加载统计数据失败:', error)
      // 如果API调用失败，使用模拟数据作为后备
      setMetrics(generateMetrics(timeRange))
      setTimeSeriesData(generateTimeSeriesData(timeRange))
      setFileTypeData(fileTypeDistribution)
    } finally {
      setLoading(false)
    }
  }
  
  // 时间范围改变时重新加载数据
  useEffect(() => {
    loadData()
  }, [timeRange])
  
  // 辅助函数
  const getDaysFromTimeRange = (range: TimeRange): number => {
    switch (range) {
      case '7d': return 7
      case '30d': return 30
      case '90d': return 90
      case '1y': return 365
      default: return 30
    }
  }
  
  const getFileTypeDisplayName = (type: string): string => {
    const typeMap: Record<string, string> = {
      'image': '图片',
      'document': '文档',
      'video': '视频',
      'audio': '音频',
      'archive': '压缩包',
      'other': '其他'
    }
    return typeMap[type] || type
  }

  const getTimeRangeLabel = (range: TimeRange): string => {
    const rangeMap: Record<string, string> = {
      '7d': '最近7天',
      '30d': '最近30天',
      '90d': '最近90天',
      '1y': '最近1年'
    }
    return rangeMap[range] || '最近7天'
  }



  const getViewLabel = (view: AnalysisView) => {
    switch (view) {
      case 'overview':
        return '总览'
      case 'storage':
        return '存储分析'
      case 'usage':
        return '使用情况'
      default:
        return '总览'
    }
  }

  return (
    <PageWrapper
      title="系统分析中心"
      breadcrumbs={[
        { label: '首页', href: '/' },
        { label: '系统分析', href: '/analytics' },
      ]}
    >
      <div className="space-y-6">
        {/* 欢迎横幅 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                欢迎使用系统分析中心，{user?.name || '管理员'}！
              </h1>
              <p className="text-blue-100 text-lg">
                专业的文件系统数据分析与性能监控平台
              </p>
              <p className="text-blue-200 text-sm mt-1">
                {new Date().toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </p>
            </div>
            <div className="hidden md:block">
              <Database className="h-16 w-16 text-blue-200" />
            </div>
          </div>
        </motion.div>

        {/* 控制面板 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-4">
            <Select value={analysisView} onValueChange={(value: AnalysisView) => setAnalysisView(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">总览</SelectItem>
                <SelectItem value="storage">存储分析</SelectItem>
                <SelectItem value="usage">使用统计</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">最近 7 天</SelectItem>
                <SelectItem value="30d">最近 30 天</SelectItem>
                <SelectItem value="90d">最近 90 天</SelectItem>
                <SelectItem value="1y">最近 1 年</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              导出报告
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              设置
            </Button>
          </div>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-lg text-gray-600">加载数据中...</span>
          </div>
        )}

        {/* 核心指标卡片 */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.map((metric, index) => (
              <MetricCard key={index} metric={metric} />
            ))}
          </div>
        )}

        {/* 主要内容区域 */}
        {!loading && analysisView === 'overview' && (
          <>
            {/* 图表区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdvancedPieChart data={fileTypeData} title="文件类型分布" />
              <TimeSeriesChart data={timeSeriesData} />
            </div>
            
            {/* 详细分析 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 最近上传文件 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    最近上传文件
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentFiles.slice(0, 5).map((file, index) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center space-x-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                      >
                        <div className="flex-shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                            <span>{formatFileSize(file.size)}</span>
                            <span>{formatDate(file.uploadTime)}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {recentFiles.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>暂无最近上传的文件</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 存储空间分析 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <HardDrive className="h-5 w-5 mr-2" />
                    存储空间分析
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>已使用空间</span>
                        <span className="font-medium">{formatFileSize(storageData.used)}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-3">
                        <motion.div
                          className={cn(
                            'h-3 rounded-full',
                            storageData.percentage > 80 ? 'bg-red-500' :
                            storageData.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${storageData.percentage}%` }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0</span>
                        <span>{formatFileSize(storageData.total)}</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">可用空间</span>
                        <span className="text-sm font-medium">{formatFileSize(storageData.total - storageData.used)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">使用率</span>
                        <span className={cn(
                          'text-sm font-medium',
                          storageData.percentage > 80 ? 'text-red-600' :
                          storageData.percentage > 60 ? 'text-yellow-600' : 'text-green-600'
                        )}>
                          {storageData.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {analysisView === 'storage' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <HardDrive className="h-5 w-5 mr-2" />
                    存储详情
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>已使用空间</span>
                        <span className="font-medium">{formatFileSize(storageData.used)}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-4">
                        <motion.div
                          className={cn(
                            'h-4 rounded-full',
                            storageData.percentage > 80 ? 'bg-red-500' :
                            storageData.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${storageData.percentage}%` }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{formatFileSize(storageData.used)}</div>
                        <div className="text-sm text-muted-foreground">已使用</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{formatFileSize(storageData.total - storageData.used)}</div>
                        <div className="text-sm text-muted-foreground">可用空间</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <AdvancedPieChart data={fileTypeData} title="文件类型分布" />
            </div>
            <TimeSeriesChart data={timeSeriesData} />
          </div>
        )}

        {analysisView === 'usage' && (
          <div className="space-y-6">
            <TimeSeriesChart data={timeSeriesData} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdvancedPieChart data={fileTypeData} title="文件类型分布" />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    文件统计概览
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalFiles}</div>
                        <div className="text-sm text-muted-foreground">总文件数</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold text-green-600">{stats.totalFolders}</div>
                        <div className="text-sm text-muted-foreground">总文件夹数</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">平均文件大小</span>
                        <span className="text-sm font-medium">
                          {stats.totalFiles > 0 ? formatFileSize(Math.round(stats.totalSize / stats.totalFiles)) : '0 B'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">最大文件</span>
                        <span className="text-sm font-medium">
                          {recentFiles.length > 0 ? formatFileSize(Math.max(...recentFiles.map(f => f.size))) : '0 B'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{getTimeRangeLabel(timeRange)}上传</span>
                        <span className="text-sm font-medium text-blue-600">{stats.recentUploads} 个文件</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}