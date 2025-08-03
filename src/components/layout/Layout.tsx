import React from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useUIStore } from '@/store'
import { cn } from '@/lib/utils'

interface LayoutProps {
  title?: string
  breadcrumbs?: { name: string; href?: string }[]
}

export function Layout({ title, breadcrumbs }: LayoutProps) {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="flex h-screen bg-background">
      {/* 侧边栏 */}
      <Sidebar />
      
      {/* 主内容区域 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 顶部导航栏 */}
        <Header title={title} breadcrumbs={breadcrumbs} />
        
        {/* 主内容 */}
        <motion.main
          initial={false}
          animate={{
            marginLeft: 0,
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex-1 overflow-auto"
        >
          <div className="container mx-auto p-6">
            <Outlet />
          </div>
        </motion.main>
      </div>
    </div>
  )
}

// 页面包装器组件，用于设置页面标题和面包屑
export function PageWrapper({
  title,
  breadcrumbs,
  children,
  className,
}: {
  title?: string
  breadcrumbs?: { name: string; href?: string }[]
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('space-y-6', className)}
    >
      {/* 页面头部 */}
      {(title || breadcrumbs) && (
        <div className="space-y-2">
          {title && (
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          )}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span>/</span>}
                  {crumb.href ? (
                    <a
                      href={crumb.href}
                      className="hover:text-foreground transition-colors"
                    >
                      {crumb.name}
                    </a>
                  ) : (
                    <span className="text-foreground truncate">{crumb.name}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
        </div>
      )}
      
      {/* 页面内容 */}
      {children}
    </motion.div>
  )
}

// 加载状态组件
export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent"
      />
    </div>
  )
}

// 错误状态组件
export function ErrorMessage({ 
  title = '出错了', 
  message = '请稍后重试', 
  onRetry,
  className 
}: { 
  title?: string
  message?: string
  onRetry?: () => void
  className?: string 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('flex flex-col items-center justify-center p-8 text-center', className)}
    >
      <div className="rounded-full bg-destructive/10 p-3 mb-4">
        <svg
          className="h-6 w-6 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          重试
        </button>
      )}
    </motion.div>
  )
}

// 空状态组件
export function EmptyState({ 
  title = '暂无数据', 
  description, 
  action,
  icon,
  className 
}: { 
  title?: string
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
  className?: string 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col items-center justify-center p-8 text-center', className)}
    >
      {icon && (
        <div className="rounded-full bg-muted p-3 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-4 max-w-sm">{description}</p>
      )}
      {action}
    </motion.div>
  )
}