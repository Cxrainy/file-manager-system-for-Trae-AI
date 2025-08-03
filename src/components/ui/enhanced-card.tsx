import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { animations } from '@/lib/animations'

interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  hover?: boolean
  clickable?: boolean
  variant?: 'default' | 'elevated' | 'outlined' | 'glass'
  size?: 'sm' | 'md' | 'lg'
}

interface EnhancedCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface EnhancedCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

interface EnhancedCardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

interface EnhancedCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface EnhancedCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const cardVariants = {
  default: 'bg-card text-card-foreground border border-border shadow-sm',
  elevated: 'bg-card text-card-foreground border border-border shadow-lg',
  outlined: 'bg-card text-card-foreground border-2 border-border',
  glass: 'bg-card/80 text-card-foreground border border-border/50 backdrop-blur-sm'
}

const cardSizes = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
}

export function EnhancedCard({
  children,
  className,
  hover = false,
  clickable = false,
  variant = 'default',
  size = 'md',
  ...props
}: EnhancedCardProps) {
  const motionProps = {
    ...(hover && animations.cardHover),
    ...(clickable && {
      whileTap: { scale: 0.98 },
      style: { cursor: 'pointer' }
    })
  }

  return (
    <motion.div
      className={cn(
        'rounded-lg transition-all duration-200',
        cardVariants[variant],
        cardSizes[size],
        hover && 'hover:shadow-md',
        clickable && 'cursor-pointer select-none',
        className
      )}
      {...motionProps}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function EnhancedCardHeader({ children, className, ...props }: EnhancedCardHeaderProps) {
  return (
    <div className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function EnhancedCardTitle({ children, className, ...props }: EnhancedCardTitleProps) {
  return (
    <h3 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props}>
      {children}
    </h3>
  )
}

export function EnhancedCardDescription({ children, className, ...props }: EnhancedCardDescriptionProps) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)} {...props}>
      {children}
    </p>
  )
}

export function EnhancedCardContent({ children, className, ...props }: EnhancedCardContentProps) {
  return (
    <div className={cn('pt-0', className)} {...props}>
      {children}
    </div>
  )
}

export function EnhancedCardFooter({ children, className, ...props }: EnhancedCardFooterProps) {
  return (
    <div className={cn('flex items-center pt-4', className)} {...props}>
      {children}
    </div>
  )
}

// 预设卡片组件
export function FileCard({ children, ...props }: EnhancedCardProps) {
  return (
    <EnhancedCard
      hover
      clickable
      variant="default"
      size="sm"
      className="group transition-all duration-200 hover:border-primary/20"
      {...props}
    >
      {children}
    </EnhancedCard>
  )
}

export function StatsCard({ children, ...props }: EnhancedCardProps) {
  return (
    <EnhancedCard
      variant="elevated"
      size="md"
      className="bg-gradient-to-br from-background to-muted/20"
      {...props}
    >
      {children}
    </EnhancedCard>
  )
}

export function FeatureCard({ children, ...props }: EnhancedCardProps) {
  return (
    <EnhancedCard
      hover
      variant="glass"
      size="lg"
      className="backdrop-blur-md border-primary/10 hover:border-primary/20"
      {...props}
    >
      {children}
    </EnhancedCard>
  )
}