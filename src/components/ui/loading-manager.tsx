import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { animations } from '@/lib/animations'
import { Button } from './button'

interface LoadingState {
  id: string
  message: string
  progress?: number
  type?: 'loading' | 'success' | 'error'
  duration?: number
}

interface LoadingContextType {
  loadingStates: LoadingState[]
  showLoading: (id: string, message: string, options?: Partial<LoadingState>) => void
  updateLoading: (id: string, updates: Partial<LoadingState>) => void
  hideLoading: (id: string) => void
  clearAll: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

interface LoadingProviderProps {
  children: React.ReactNode
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [loadingStates, setLoadingStates] = useState<LoadingState[]>([])

  const showLoading = useCallback((id: string, message: string, options: Partial<LoadingState> = {}) => {
    const newState: LoadingState = {
      id,
      message,
      type: 'loading',
      ...options
    }

    setLoadingStates(prev => {
      const existing = prev.find(state => state.id === id)
      if (existing) {
        return prev.map(state => state.id === id ? { ...state, ...newState } : state)
      }
      return [...prev, newState]
    })

    // 自动隐藏成功/错误状态
    if (options.type === 'success' || options.type === 'error') {
      setTimeout(() => {
        hideLoading(id)
      }, options.duration || 3000)
    }
  }, [])

  const updateLoading = useCallback((id: string, updates: Partial<LoadingState>) => {
    setLoadingStates(prev => 
      prev.map(state => 
        state.id === id ? { ...state, ...updates } : state
      )
    )

    // 自动隐藏成功/错误状态
    if (updates.type === 'success' || updates.type === 'error') {
      setTimeout(() => {
        hideLoading(id)
      }, updates.duration || 3000)
    }
  }, [])

  const hideLoading = useCallback((id: string) => {
    setLoadingStates(prev => prev.filter(state => state.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setLoadingStates([])
  }, [])

  return (
    <LoadingContext.Provider value={{
      loadingStates,
      showLoading,
      updateLoading,
      hideLoading,
      clearAll
    }}>
      {children}
      <LoadingOverlay />
    </LoadingContext.Provider>
  )
}

function LoadingOverlay() {
  const { loadingStates, hideLoading } = useLoading()
  const globalLoading = loadingStates.find(state => state.type === 'loading')
  const notifications = loadingStates.filter(state => state.type !== 'loading')

  return (
    <>
      {/* 全局加载遮罩 */}
      <AnimatePresence>
        {globalLoading && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-card border rounded-lg p-6 shadow-lg max-w-sm w-full mx-4"
              {...animations.slideIn}
            >
              <div className="flex items-center space-x-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{globalLoading.message}</p>
                  {globalLoading.progress !== undefined && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>进度</span>
                        <span>{Math.round(globalLoading.progress)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <motion.div
                          className="bg-primary h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${globalLoading.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 通知消息 */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              className={cn(
                'bg-card border rounded-lg p-4 shadow-lg',
                notification.type === 'success' && 'border-green-500/20 bg-green-50/50 dark:bg-green-950/20',
                notification.type === 'error' && 'border-red-500/20 bg-red-50/50 dark:bg-red-950/20'
              )}
              initial={{ opacity: 0, x: 300, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {notification.type === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {notification.type === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{notification.message}</p>
                  {notification.progress !== undefined && (
                    <div className="mt-2">
                      <div className="w-full bg-muted rounded-full h-1">
                        <motion.div
                          className={cn(
                            'h-1 rounded-full',
                            notification.type === 'success' && 'bg-green-600',
                            notification.type === 'error' && 'bg-red-600'
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${notification.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => hideLoading(notification.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}

// 便捷的加载状态Hook
export function useAsyncOperation() {
  const { showLoading, updateLoading, hideLoading } = useLoading()

  const execute = useCallback(async <T,>(
    operation: () => Promise<T>,
    options: {
      loadingMessage: string
      successMessage?: string
      errorMessage?: string
      id?: string
      showProgress?: boolean
    }
  ) => {
    const id = options.id || `operation-${Date.now()}`
    
    try {
      showLoading(id, options.loadingMessage)
      
      const result = await operation()
      
      if (options.successMessage) {
        updateLoading(id, {
          type: 'success',
          message: options.successMessage
        })
      } else {
        hideLoading(id)
      }
      
      return result
    } catch (error) {
      const errorMessage = options.errorMessage || 
        (error instanceof Error ? error.message : '操作失败')
      
      updateLoading(id, {
        type: 'error',
        message: errorMessage
      })
      
      throw error
    }
  }, [showLoading, updateLoading, hideLoading])

  return { execute }
}

// 文件上传进度Hook
export function useFileUpload() {
  const { showLoading, updateLoading, hideLoading } = useLoading()

  const uploadFile = useCallback(async (
    file: File,
    uploadFn: (file: File, onProgress: (progress: number) => void) => Promise<any>
  ) => {
    const id = `upload-${file.name}-${Date.now()}`
    
    try {
      showLoading(id, `正在上传 ${file.name}`, { progress: 0 })
      
      const result = await uploadFn(file, (progress) => {
        updateLoading(id, { progress })
      })
      
      updateLoading(id, {
        type: 'success',
        message: `${file.name} 上传成功`,
        progress: 100
      })
      
      return result
    } catch (error) {
      updateLoading(id, {
        type: 'error',
        message: `${file.name} 上传失败`,
        progress: undefined
      })
      
      throw error
    }
  }, [showLoading, updateLoading])

  return { uploadFile }
}

// 批量操作Hook
export function useBatchOperation() {
  const { showLoading, updateLoading, hideLoading } = useLoading()

  const executeBatch = useCallback(async <T,>(
    items: T[],
    operation: (item: T, index: number) => Promise<any>,
    options: {
      batchMessage: string
      successMessage?: string
      errorMessage?: string
      id?: string
    }
  ) => {
    const id = options.id || `batch-${Date.now()}`
    const total = items.length
    let completed = 0
    const errors: string[] = []
    
    try {
      showLoading(id, options.batchMessage, { progress: 0 })
      
      for (let i = 0; i < items.length; i++) {
        try {
          await operation(items[i], i)
          completed++
        } catch (error) {
          errors.push(error instanceof Error ? error.message : '未知错误')
        }
        
        const progress = ((i + 1) / total) * 100
        updateLoading(id, { 
          progress,
          message: `${options.batchMessage} (${i + 1}/${total})`
        })
      }
      
      if (errors.length === 0) {
        updateLoading(id, {
          type: 'success',
          message: options.successMessage || `批量操作完成 (${completed}/${total})`,
          progress: 100
        })
      } else {
        updateLoading(id, {
          type: 'error',
          message: options.errorMessage || `批量操作完成，${errors.length} 个失败`,
          progress: 100
        })
      }
      
      return { completed, errors }
    } catch (error) {
      updateLoading(id, {
        type: 'error',
        message: '批量操作失败'
      })
      
      throw error
    }
  }, [showLoading, updateLoading])

  return { executeBatch }
}