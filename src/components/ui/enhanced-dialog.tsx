import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { animations } from '@/lib/animations'

interface EnhancedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}

interface EnhancedDialogContentProps {
  children: React.ReactNode
  className?: string
}

interface EnhancedDialogHeaderProps {
  children: React.ReactNode
  className?: string
}

interface EnhancedDialogTitleProps {
  children: React.ReactNode
  className?: string
}

interface EnhancedDialogDescriptionProps {
  children: React.ReactNode
  className?: string
}

interface EnhancedDialogFooterProps {
  children: React.ReactNode
  className?: string
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  full: 'max-w-full mx-4'
}

export function EnhancedDialog({
  open,
  onOpenChange,
  children,
  className,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true
}: EnhancedDialogProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, closeOnEscape, onOpenChange])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onOpenChange(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleOverlayClick}
          />
          
          {/* 对话框内容 */}
          <motion.div
            {...animations.modal}
            className={cn(
              'relative w-full bg-background rounded-lg shadow-lg border',
              sizeClasses[size],
              className
            )}
            role="dialog"
            aria-modal="true"
          >
            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 z-10"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">关闭</span>
              </Button>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function EnhancedDialogContent({ children, className }: EnhancedDialogContentProps) {
  return (
    <div className={cn('p-6', className)}>
      {children}
    </div>
  )
}

export function EnhancedDialogHeader({ children, className }: EnhancedDialogHeaderProps) {
  return (
    <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left mb-4', className)}>
      {children}
    </div>
  )
}

export function EnhancedDialogTitle({ children, className }: EnhancedDialogTitleProps) {
  return (
    <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)}>
      {children}
    </h2>
  )
}

export function EnhancedDialogDescription({ children, className }: EnhancedDialogDescriptionProps) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      {children}
    </p>
  )
}

export function EnhancedDialogFooter({ children, className }: EnhancedDialogFooterProps) {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6', className)}>
      {children}
    </div>
  )
}