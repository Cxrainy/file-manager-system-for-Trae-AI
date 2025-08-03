import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FolderOpen,
  Upload,
  Search,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Home,
  Trash2,
  Users,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store'

interface SidebarProps {
  className?: string
}

const navigation = [
  {
    name: '系统分析',
    href: '/',
    icon: BarChart3,
  },
  {
    name: '文件管理',
    href: '/files',
    icon: FolderOpen,
  },
  {
    name: '上传文件',
    href: '/upload',
    icon: Upload,
  },
  {
    name: '搜索',
    href: '/search',
    icon: Search,
  },
  {
    name: '回收站',
    href: '/trash',
    icon: Trash2,
  },
  {
    name: '好友管理',
    href: '/friends',
    icon: Users,
  },
  {
    name: '收到的分享',
    href: '/received-shares',
    icon: Download,
  },
  {
    name: '设置',
    href: '/settings',
    icon: Settings,
  },
]

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation()
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore()

  return (
    <motion.div
      initial={false}
      animate={{
        width: sidebarCollapsed ? 64 : 256,
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'relative flex h-full flex-col border-r bg-card',
        className
      )}
    >
      {/* 头部 */}
      <div className={cn(
        "flex h-16 items-center px-4",
        sidebarCollapsed ? "justify-center" : "justify-between"
      )}>
        {!sidebarCollapsed && (
          <motion.div
            initial={false}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{ duration: 0.2 }}
            className="flex items-center space-x-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FolderOpen className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">Foolder OS</span>
          </motion.div>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={cn(
            "h-8 w-8 flex-shrink-0",
            sidebarCollapsed && "mx-auto"
          )}
          title={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              to={item.href}
              title={sidebarCollapsed ? item.name : undefined}
              className={cn(
                'group flex items-center rounded-lg text-sm font-medium transition-colors',
                sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-2',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <motion.span
                  initial={false}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                  className="ml-3"
                >
                  {item.name}
                </motion.span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* 底部信息 */}
      <div className="border-t p-4">
        <motion.div
          initial={false}
          animate={{
            opacity: sidebarCollapsed ? 0 : 1,
          }}
          transition={{ duration: 0.2 }}
          className="text-xs text-muted-foreground"
        >
          {!sidebarCollapsed && (
            <div className="space-y-1">
              <div>版本 1.0.0</div>
              <div>© 2024 Foolder OS</div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}