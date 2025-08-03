import React, { createContext, useContext, useEffect, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Command, Keyboard, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { EnhancedCard } from './enhanced-card'
import { EnhancedDialog, EnhancedDialogContent, EnhancedDialogHeader, EnhancedDialogTitle } from './enhanced-dialog'

interface HotkeyAction {
  id: string
  keys: string[]
  description: string
  category?: string
  action: () => void
  enabled?: boolean
  global?: boolean
}

interface HotkeyContextType {
  hotkeys: HotkeyAction[]
  registerHotkey: (hotkey: HotkeyAction) => void
  unregisterHotkey: (id: string) => void
  enableHotkey: (id: string) => void
  disableHotkey: (id: string) => void
  showHelp: () => void
  hideHelp: () => void
}

const HotkeyContext = createContext<HotkeyContextType | undefined>(undefined)

export function useHotkeys() {
  const context = useContext(HotkeyContext)
  if (!context) {
    throw new Error('useHotkeys must be used within a HotkeyProvider')
  }
  return context
}

interface HotkeyProviderProps {
  children: React.ReactNode
}

export function HotkeyProvider({ children }: HotkeyProviderProps) {
  const [hotkeys, setHotkeys] = useState<HotkeyAction[]>([])
  const [showHelpDialog, setShowHelpDialog] = useState(false)

  // 注册快捷键
  const registerHotkey = useCallback((hotkey: HotkeyAction) => {
    setHotkeys(prev => {
      const existing = prev.find(h => h.id === hotkey.id)
      if (existing) {
        return prev.map(h => h.id === hotkey.id ? { ...hotkey, enabled: hotkey.enabled ?? true } : h)
      }
      return [...prev, { ...hotkey, enabled: hotkey.enabled ?? true }]
    })
  }, [])

  // 注销快捷键
  const unregisterHotkey = useCallback((id: string) => {
    setHotkeys(prev => prev.filter(h => h.id !== id))
  }, [])

  // 启用快捷键
  const enableHotkey = useCallback((id: string) => {
    setHotkeys(prev => prev.map(h => h.id === id ? { ...h, enabled: true } : h))
  }, [])

  // 禁用快捷键
  const disableHotkey = useCallback((id: string) => {
    setHotkeys(prev => prev.map(h => h.id === id ? { ...h, enabled: false } : h))
  }, [])

  // 显示帮助
  const showHelp = useCallback(() => {
    setShowHelpDialog(true)
  }, [])

  // 隐藏帮助
  const hideHelp = useCallback(() => {
    setShowHelpDialog(false)
  }, [])

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 检查是否在输入框中
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return
      }

      // 构建按键组合
      const keys: string[] = []
      if (event.ctrlKey) keys.push('ctrl')
      if (event.altKey) keys.push('alt')
      if (event.shiftKey) keys.push('shift')
      if (event.metaKey) keys.push('meta')
      
      // 添加主键
      const mainKey = event.key.toLowerCase()
      if (!['control', 'alt', 'shift', 'meta'].includes(mainKey)) {
        keys.push(mainKey)
      }

      // 查找匹配的快捷键
      const matchedHotkey = hotkeys.find(hotkey => {
        if (!hotkey.enabled) return false
        
        const hotkeyKeys = hotkey.keys.map(k => k.toLowerCase())
        return keys.length === hotkeyKeys.length && 
               keys.every(key => hotkeyKeys.includes(key))
      })

      if (matchedHotkey) {
        event.preventDefault()
        event.stopPropagation()
        matchedHotkey.action()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [hotkeys])

  // 注册默认快捷键
  useEffect(() => {
    registerHotkey({
      id: 'show-help',
      keys: ['ctrl', 'shift', '?'],
      description: '显示快捷键帮助',
      category: '系统',
      action: showHelp
    })

    registerHotkey({
      id: 'show-help-alt',
      keys: ['f1'],
      description: '显示快捷键帮助',
      category: '系统',
      action: showHelp
    })
  }, [registerHotkey, showHelp])

  return (
    <HotkeyContext.Provider value={{
      hotkeys,
      registerHotkey,
      unregisterHotkey,
      enableHotkey,
      disableHotkey,
      showHelp,
      hideHelp
    }}>
      {children}
      <HotkeyHelpDialog open={showHelpDialog} onOpenChange={setShowHelpDialog} />
    </HotkeyContext.Provider>
  )
}

// 快捷键帮助对话框
interface HotkeyHelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function HotkeyHelpDialog({ open, onOpenChange }: HotkeyHelpDialogProps) {
  const { hotkeys } = useHotkeys()

  // 按类别分组
  const groupedHotkeys = hotkeys.reduce((groups, hotkey) => {
    const category = hotkey.category || '其他'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(hotkey)
    return groups
  }, {} as Record<string, HotkeyAction[]>)

  return (
    <EnhancedDialog open={open} onOpenChange={onOpenChange}>
      <EnhancedDialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <EnhancedDialogHeader>
          <EnhancedDialogTitle className="flex items-center space-x-2">
            <Keyboard className="h-5 w-5" />
            <span>快捷键帮助</span>
          </EnhancedDialogTitle>
        </EnhancedDialogHeader>
        
        <div className="overflow-y-auto pr-2">
          <div className="space-y-6">
            {Object.entries(groupedHotkeys).map(([category, categoryHotkeys]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryHotkeys.map((hotkey) => (
                    <motion.div
                      key={hotkey.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="text-sm">{hotkey.description}</span>
                      <div className="flex items-center space-x-1">
                        {hotkey.keys.map((key, index) => (
                          <React.Fragment key={index}>
                            {index > 0 && (
                              <span className="text-xs text-muted-foreground">+</span>
                            )}
                            <kbd className="px-2 py-1 text-xs font-mono bg-muted border border-border rounded">
                              {formatKey(key)}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </EnhancedDialogContent>
    </EnhancedDialog>
  )
}

// 格式化按键显示
function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    'ctrl': 'Ctrl',
    'alt': 'Alt',
    'shift': 'Shift',
    'meta': 'Cmd',
    'arrowup': '↑',
    'arrowdown': '↓',
    'arrowleft': '←',
    'arrowright': '→',
    'enter': 'Enter',
    'escape': 'Esc',
    'backspace': 'Backspace',
    'delete': 'Del',
    'tab': 'Tab',
    'space': 'Space',
    ' ': 'Space'
  }
  
  return keyMap[key.toLowerCase()] || key.toUpperCase()
}

// 快捷键Hook
export function useHotkey(
  keys: string[],
  action: () => void,
  options: {
    id?: string
    description?: string
    category?: string
    enabled?: boolean
    deps?: React.DependencyList
  } = {}
) {
  const { registerHotkey, unregisterHotkey } = useHotkeys()
  const id = options.id || `hotkey-${keys.join('-')}-${Date.now()}`

  useEffect(() => {
    registerHotkey({
      id,
      keys,
      action,
      description: options.description || `${keys.join(' + ')} 快捷键`,
      category: options.category,
      enabled: options.enabled
    })

    return () => unregisterHotkey(id)
  }, [id, keys, action, options.description, options.category, options.enabled, ...(options.deps || [])])

  return id
}

// 快捷键显示组件
interface HotkeyDisplayProps {
  keys: string[]
  className?: string
}

export function HotkeyDisplay({ keys, className }: HotkeyDisplayProps) {
  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="text-xs text-muted-foreground">+</span>
          )}
          <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted border border-border rounded">
            {formatKey(key)}
          </kbd>
        </React.Fragment>
      ))}
    </div>
  )
}

// 快捷键提示组件
interface HotkeyTooltipProps {
  keys: string[]
  description: string
  children: React.ReactNode
}

export function HotkeyTooltip({ keys, description, children }: HotkeyTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
              <div className="text-xs font-medium mb-1">{description}</div>
              <HotkeyDisplay keys={keys} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// 常用快捷键Hook
export function useCommonHotkeys() {
  const { registerHotkey } = useHotkeys()

  useEffect(() => {
    // 文件操作
    registerHotkey({
      id: 'new-file',
      keys: ['ctrl', 'n'],
      description: '新建文件',
      category: '文件',
      action: () => console.log('新建文件')
    })

    registerHotkey({
      id: 'open-file',
      keys: ['ctrl', 'o'],
      description: '打开文件',
      category: '文件',
      action: () => console.log('打开文件')
    })

    registerHotkey({
      id: 'save-file',
      keys: ['ctrl', 's'],
      description: '保存文件',
      category: '文件',
      action: () => console.log('保存文件')
    })

    // 编辑操作
    registerHotkey({
      id: 'select-all',
      keys: ['ctrl', 'a'],
      description: '全选',
      category: '编辑',
      action: () => console.log('全选')
    })

    registerHotkey({
      id: 'copy',
      keys: ['ctrl', 'c'],
      description: '复制',
      category: '编辑',
      action: () => console.log('复制')
    })

    registerHotkey({
      id: 'paste',
      keys: ['ctrl', 'v'],
      description: '粘贴',
      category: '编辑',
      action: () => console.log('粘贴')
    })

    // 导航操作
    registerHotkey({
      id: 'search',
      keys: ['ctrl', 'f'],
      description: '搜索',
      category: '导航',
      action: () => console.log('搜索')
    })

    registerHotkey({
      id: 'refresh',
      keys: ['f5'],
      description: '刷新',
      category: '导航',
      action: () => window.location.reload()
    })
  }, [registerHotkey])
}