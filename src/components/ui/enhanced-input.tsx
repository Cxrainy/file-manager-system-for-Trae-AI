import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { animations } from '@/lib/animations'

export interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  clearable?: boolean
  variant?: 'default' | 'filled' | 'outlined' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const inputVariants = {
  default: 'border border-input bg-background',
  filled: 'border-0 bg-muted',
  outlined: 'border-2 border-input bg-background',
  ghost: 'border-0 bg-transparent'
}

const inputSizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-3 text-sm',
  lg: 'h-12 px-4 text-base'
}

export const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({
    className,
    type = 'text',
    label,
    error,
    success,
    hint,
    leftIcon,
    rightIcon,
    clearable = false,
    variant = 'default',
    size = 'md',
    loading = false,
    value,
    onChange,
    disabled,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [showPassword, setShowPassword] = React.useState(false)
    const [internalValue, setInternalValue] = React.useState(value || '')
    const inputRef = React.useRef<HTMLInputElement>(null)

    React.useImperativeHandle(ref, () => inputRef.current!)

    React.useEffect(() => {
      setInternalValue(value || '')
    }, [value])

    const handleClear = () => {
      setInternalValue('')
      if (onChange) {
        const event = {
          target: { value: '' }
        } as React.ChangeEvent<HTMLInputElement>
        onChange(event)
      }
      inputRef.current?.focus()
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value)
      if (onChange) {
        onChange(e)
      }
    }

    const hasValue = String(internalValue).length > 0
    const showClearButton = clearable && hasValue && !disabled && !loading
    const showPasswordToggle = type === 'password'
    const inputType = type === 'password' && showPassword ? 'text' : type

    const containerClasses = cn(
      'relative flex flex-col gap-1.5',
      disabled && 'opacity-50 cursor-not-allowed'
    )

    const inputClasses = cn(
      'flex w-full rounded-md font-medium transition-all duration-200',
      'placeholder:text-muted-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      inputVariants[variant],
      inputSizes[size],
      leftIcon && 'pl-10',
      (rightIcon || showClearButton || showPasswordToggle) && 'pr-10',
      error && 'border-destructive focus-visible:ring-destructive',
      success && 'border-green-500 focus-visible:ring-green-500',
      isFocused && variant === 'outlined' && 'border-primary',
      className
    )

    return (
      <div className={containerClasses}>
        {label && (
          <motion.label
            className={cn(
              'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              error && 'text-destructive',
              success && 'text-green-600'
            )}
            {...animations.fadeIn}
          >
            {label}
          </motion.label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          
          <motion.input
            ref={inputRef}
            type={inputType}
            className={inputClasses}
            value={internalValue}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled || loading}
            {...animations.slideIn}
            {...props}
          />
          
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <AnimatePresence>
              {loading && (
                <motion.div
                  className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                  {...animations.fadeIn}
                />
              )}
              
              {showClearButton && (
                <motion.button
                  type="button"
                  onClick={handleClear}
                  className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                  {...animations.fadeIn}
                >
                  <X className="h-4 w-4" />
                </motion.button>
              )}
              
              {showPasswordToggle && (
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                  {...animations.fadeIn}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </motion.button>
              )}
              
              {rightIcon && !showClearButton && !showPasswordToggle && !loading && (
                <motion.div
                  className="text-muted-foreground"
                  {...animations.fadeIn}
                >
                  {rightIcon}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <AnimatePresence>
          {(error || success || hint) && (
            <motion.div
              className="text-xs"
              {...animations.slideIn}
              exit={{ opacity: 0, height: 0 }}
            >
              {error && (
                <span className="text-destructive">{error}</span>
              )}
              {success && (
                <span className="text-green-600">{success}</span>
              )}
              {hint && !error && !success && (
                <span className="text-muted-foreground">{hint}</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

EnhancedInput.displayName = 'EnhancedInput'

// 预设输入框组件
export function SearchInput({ ...props }: Omit<EnhancedInputProps, 'leftIcon'>) {
  return (
    <EnhancedInput
      leftIcon={<Search className="h-4 w-4" />}
      placeholder="搜索..."
      clearable
      {...props}
    />
  )
}

export function PasswordInput({ ...props }: EnhancedInputProps) {
  return (
    <EnhancedInput
      type="password"
      {...props}
    />
  )
}

export function EmailInput({ ...props }: EnhancedInputProps) {
  return (
    <EnhancedInput
      type="email"
      placeholder="example@email.com"
      {...props}
    />
  )
}