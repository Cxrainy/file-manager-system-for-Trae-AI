import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { FileManager } from '@/pages/FileManager'
import { Upload } from '@/pages/Upload'
import { Search } from '@/pages/Search'
import { Trash } from '@/pages/Trash'
import { SystemAnalytics } from '@/pages/SystemAnalytics'
import { Settings } from '@/pages/Settings'
import { Login } from '@/pages/Login'
import Friends from '@/pages/Friends'
import Chat from '@/pages/Chat'
import ShareFile from '@/pages/ShareFile'
import ReceivedShares from '@/pages/ReceivedShares'
import { PublicShare } from '@/pages/PublicShare'
import { useThemeStore, useUserStore } from '@/store'
import { cn } from '@/lib/utils'
import { userAPI } from '@/services/api'
import { LoadingProvider } from '@/components/ui/loading-manager'
import { ThemeProvider } from '@/components/ui/theme-manager'
import { HotkeyProvider, useCommonHotkeys } from '@/components/ui/hotkey-manager'

// 内部应用组件
function AppContent() {
  const { user, setUser, logout } = useUserStore()
  
  // 注册常用快捷键
  useCommonHotkeys()

  // 强制清理所有localStorage数据的函数
  const clearAllStorage = () => {
    const keysToRemove = [
      'token',
      'user-storage',
      'theme-storage', 
      'file-storage',
      'ui-storage',
      'searchHistory'
    ]
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })
    
    // 清理所有以项目相关前缀开头的项目
    const allKeys = Object.keys(localStorage)
    allKeys.forEach(key => {
      if (key.includes('file') || key.includes('user') || key.includes('folder')) {
        localStorage.removeItem(key)
      }
    })
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token && !user) {
      // 验证token是否有效
      userAPI.verifyToken()
        .then(response => {
          if (response.success && response.data.user) {
            setUser(response.data.user)
          } else {
            // token无效，清除token但不强制重定向
            localStorage.removeItem('token')
            logout()
          }
        })
        .catch(() => {
          // token验证失败，清除token但不强制重定向
          localStorage.removeItem('token')
          logout()
        })
    }
  }, [user, setUser, logout])

  return (
    <div className={cn(
      'min-h-screen bg-background font-sans antialiased',
      'transition-colors duration-300'
    )}>
      <Router>
        <Routes>
          {/* 登录页面 */}
          <Route path="/login" element={<Login />} />
          
          {/* 公共分享页面 */}
          <Route path="/share/:shareId" element={<PublicShare />} />
          
          {/* 应用路由 */}
          <Route path="/" element={<Layout />}>
            <Route index element={<SystemAnalytics />} />
            <Route path="files" element={<FileManager />} />
            <Route path="files/:folderId" element={<FileManager />} />
            <Route path="upload" element={<Upload />} />
            <Route path="search" element={<Search />} />
            <Route path="trash" element={<Trash />} />
            <Route path="friends" element={<Friends />} />
            <Route path="chat/:friendId" element={<Chat />} />
            <Route path="share-file/:friendId" element={<ShareFile />} />
            <Route path="received-shares" element={<ReceivedShares />} />
            <Route path="analytics" element={<SystemAnalytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* 默认重定向 */}
          <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
        </Routes>
      </Router>
    </div>
  )
}

// 主App组件，包装所有Provider
function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="foolder-theme">
      <LoadingProvider>
        <HotkeyProvider>
          <AppContent />
        </HotkeyProvider>
      </LoadingProvider>
    </ThemeProvider>
  )
}

export default App