import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useUserStore, useNotificationStore } from '@/store'
import { userAPI } from '@/services/api'
import { Loader2 } from 'lucide-react'

export function Login() {
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin123')
  const [username, setUsername] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { setUser } = useUserStore()
  const { addNotification } = useNotificationStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isRegisterMode) {
        // 注册逻辑
        if (password !== confirmPassword) {
          addNotification({
            type: 'error',
            title: '注册失败',
            message: '两次输入的密码不一致',
          })
          return
        }

        const response = await userAPI.register({ username, email, password })
        if (response.success && response.data) {
          // 保存token
          localStorage.setItem('token', response.data.token)
          // 设置用户信息
          setUser(response.data.user)
          // 跳转到文件管理页面
          navigate('/files')
          addNotification({
            type: 'success',
            title: '注册成功',
            message: '欢迎加入！',
          })
        }
      } else {
        // 登录逻辑
        const response = await userAPI.login({ email, password })
        if (response.success && response.data) {
          // 保存token
          localStorage.setItem('token', response.data.token)
          // 设置用户信息
          setUser(response.data.user)
          
          // 检查是否有返回URL
          const returnUrl = localStorage.getItem('returnUrl')
          if (returnUrl) {
            localStorage.removeItem('returnUrl')
            navigate(returnUrl)
          } else {
            // 跳转到文件管理页面
            navigate('/files')
          }
          
          addNotification({
            type: 'success',
            title: '登录成功',
            message: '欢迎回来！',
          })
        }
      }
    } catch (error: any) {
      console.error(isRegisterMode ? 'Register failed:' : 'Login failed:', error)
      addNotification({
        type: 'error',
        title: isRegisterMode ? '注册失败' : '登录失败',
        message: error.response?.data?.error || (isRegisterMode ? '注册失败，请重试' : '用户名或密码错误'),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode)
    // 清空表单
    setEmail(isRegisterMode ? 'admin@example.com' : '')
    setPassword(isRegisterMode ? 'admin123' : '')
    setUsername('')
    setConfirmPassword('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">文件管理系统</CardTitle>
          <CardDescription>
            {isRegisterMode ? '创建新账户' : '请登录您的账户以继续'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
              />
            </div>
            {isRegisterMode && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认密码</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入密码"
                  required
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isRegisterMode ? '注册' : '登录'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button 
              variant="ghost" 
              onClick={toggleMode}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {isRegisterMode ? '已有账户？点击登录' : '没有账户？点击注册'}
            </Button>
          </div>
          {!isRegisterMode && (
            <div className="mt-2 text-sm text-muted-foreground text-center">
              <p>默认管理员账户：</p>
              <p>邮箱：admin@example.com</p>
              <p>密码：admin123</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}