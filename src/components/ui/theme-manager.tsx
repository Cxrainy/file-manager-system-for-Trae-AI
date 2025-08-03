import React, { createContext, useContext, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon, Monitor, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { EnhancedCard } from './enhanced-card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'

type Theme = 'dark' | 'light' | 'system'
type ColorScheme = 'default' | 'blue' | 'green' | 'purple' | 'orange' | 'red'

interface ThemeContextType {
  theme: Theme
  colorScheme: ColorScheme
  setTheme: (theme: Theme) => void
  setColorScheme: (scheme: ColorScheme) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  defaultColorScheme?: ColorScheme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  defaultColorScheme = 'default',
  storageKey = 'ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme
    }
    return defaultTheme
  })

  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(`${storageKey}-color`) as ColorScheme) || defaultColorScheme
    }
    return defaultColorScheme
  })

  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
      setIsDark(systemTheme === 'dark')
    } else {
      root.classList.add(theme)
      setIsDark(theme === 'dark')
    }

    // 应用颜色方案
    root.classList.remove('scheme-default', 'scheme-blue', 'scheme-green', 'scheme-purple', 'scheme-orange', 'scheme-red')
    root.classList.add(`scheme-${colorScheme}`)
  }, [theme, colorScheme])

  const value = {
    theme,
    colorScheme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
    setColorScheme: (scheme: ColorScheme) => {
      localStorage.setItem(`${storageKey}-color`, scheme)
      setColorScheme(scheme)
    },
    isDark
  }

  return (
    <ThemeContext.Provider {...props} value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// 主题切换按钮组件
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">切换主题</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>主题设置</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>浅色</span>
          {theme === 'light' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>深色</span>
          {theme === 'dark' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>跟随系统</span>
          {theme === 'system' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// 颜色方案选择器
export function ColorSchemeSelector() {
  const { colorScheme, setColorScheme } = useTheme()

  const schemes = [
    { name: 'default', label: '默认', color: 'hsl(var(--primary))' },
    { name: 'blue', label: '蓝色', color: '#3b82f6' },
    { name: 'green', label: '绿色', color: '#10b981' },
    { name: 'purple', label: '紫色', color: '#8b5cf6' },
    { name: 'orange', label: '橙色', color: '#f59e0b' },
    { name: 'red', label: '红色', color: '#ef4444' }
  ] as const

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">选择颜色方案</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>颜色方案</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {schemes.map((scheme) => (
          <DropdownMenuItem
            key={scheme.name}
            onClick={() => setColorScheme(scheme.name as ColorScheme)}
            className="flex items-center space-x-2"
          >
            <div
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: scheme.color }}
            />
            <span>{scheme.label}</span>
            {colorScheme === scheme.name && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// 主题设置面板
interface ThemeSettingsPanelProps {
  className?: string
}

export function ThemeSettingsPanel({ className }: ThemeSettingsPanelProps) {
  const { theme, colorScheme, setTheme, setColorScheme } = useTheme()

  const themes = [
    { value: 'light', label: '浅色模式', icon: Sun },
    { value: 'dark', label: '深色模式', icon: Moon },
    { value: 'system', label: '跟随系统', icon: Monitor }
  ] as const

  const schemes = [
    { name: 'default', label: '默认', color: 'hsl(var(--primary))' },
    { name: 'blue', label: '蓝色', color: '#3b82f6' },
    { name: 'green', label: '绿色', color: '#10b981' },
    { name: 'purple', label: '紫色', color: '#8b5cf6' },
    { name: 'orange', label: '橙色', color: '#f59e0b' },
    { name: 'red', label: '红色', color: '#ef4444' }
  ] as const

  return (
    <EnhancedCard className={cn('p-6', className)}>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">主题设置</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-3 block">外观模式</label>
              <div className="grid grid-cols-3 gap-2">
                {themes.map((themeOption) => {
                  const Icon = themeOption.icon
                  return (
                    <motion.button
                      key={themeOption.value}
                      className={cn(
                        'flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all',
                        'hover:bg-muted/50',
                        theme === themeOption.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border'
                      )}
                      onClick={() => setTheme(themeOption.value as Theme)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="h-5 w-5 mb-2" />
                      <span className="text-xs font-medium">{themeOption.label}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">颜色方案</label>
              <div className="grid grid-cols-3 gap-2">
                {schemes.map((scheme) => (
                  <motion.button
                    key={scheme.name}
                    className={cn(
                      'flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all',
                      'hover:bg-muted/50',
                      colorScheme === scheme.name
                        ? 'border-primary bg-primary/10'
                        : 'border-border'
                    )}
                    onClick={() => setColorScheme(scheme.name as ColorScheme)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      className="w-6 h-6 rounded-full border border-border mb-2"
                      style={{ backgroundColor: scheme.color }}
                    />
                    <span className="text-xs font-medium">{scheme.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">预览</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm">主色调</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-secondary" />
              <span className="text-sm">次要色</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-muted" />
              <span className="text-sm">背景色</span>
            </div>
          </div>
        </div>
      </div>
    </EnhancedCard>
  )
}

// 自动主题切换Hook
export function useAutoTheme() {
  const { setTheme } = useTheme()

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [setTheme])
}

// 主题动画Hook
export function useThemeTransition() {
  const { isDark } = useTheme()
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    setIsTransitioning(true)
    const timer = setTimeout(() => setIsTransitioning(false), 300)
    return () => clearTimeout(timer)
  }, [isDark])

  return { isTransitioning, isDark }
}