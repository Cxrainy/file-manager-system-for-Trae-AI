import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { animations } from '@/lib/animations'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  overscan?: number
  onScroll?: (scrollTop: number) => void
  loading?: boolean
  loadingComponent?: React.ReactNode
  emptyComponent?: React.ReactNode
}

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  placeholder?: string
  className?: string
  onLoad?: () => void
  onError?: () => void
}

interface IntersectionObserverOptions {
  threshold?: number
  rootMargin?: string
}

// 虚拟滚动列表组件
export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  overscan = 5,
  onScroll,
  loading = false,
  loadingComponent,
  emptyComponent
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const totalHeight = items.length * itemHeight
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index
    }))
  }, [items, startIndex, endIndex])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop
    setScrollTop(newScrollTop)
    onScroll?.(newScrollTop)
  }

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height: containerHeight }}>
        {loadingComponent || (
          <motion.div
            className="flex flex-col items-center space-y-4"
            {...animations.fadeIn}
          >
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">加载中...</p>
          </motion.div>
        )}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height: containerHeight }}>
        {emptyComponent || (
          <motion.div
            className="flex flex-col items-center space-y-4 text-center"
            {...animations.fadeIn}
          >
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl text-muted-foreground">📁</span>
            </div>
            <div>
              <h3 className="text-lg font-medium">暂无文件</h3>
              <p className="text-sm text-muted-foreground">此文件夹为空</p>
            </div>
          </motion.div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index }) => (
          <motion.div
            key={index}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: (index - startIndex) * 0.02 }}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// 懒加载图片组件
export function LazyImage({
  src,
  alt,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE0cHgiIGZpbGw9IiM5OTk5OTkiPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+',
  className,
  onLoad,
  onError,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setIsError(true)
    onError?.()
  }

  return (
    <div className={cn('relative overflow-hidden', className)} ref={imgRef}>
      {!isInView ? (
        <motion.div
          className="w-full h-full bg-muted flex items-center justify-center"
          {...animations.pulse}
        >
          <span className="text-muted-foreground text-sm">📷</span>
        </motion.div>
      ) : (
        <>
          {!isLoaded && !isError && (
            <motion.img
              src={placeholder}
              alt="Loading..."
              className={cn('w-full h-full object-cover', className)}
              {...animations.pulse}
            />
          )}
          
          {isError ? (
            <motion.div
              className="w-full h-full bg-muted flex items-center justify-center"
              {...animations.fadeIn}
            >
              <span className="text-muted-foreground text-sm">❌</span>
            </motion.div>
          ) : (
            <motion.img
              src={src}
              alt={alt}
              className={cn(
                'w-full h-full object-cover transition-opacity duration-300',
                isLoaded ? 'opacity-100' : 'opacity-0',
                className
              )}
              onLoad={handleLoad}
              onError={handleError}
              {...props}
            />
          )}
        </>
      )}
    </div>
  )
}

// 无限滚动Hook
export function useInfiniteScroll(
  callback: () => void,
  options: IntersectionObserverOptions = {}
) {
  const [isFetching, setIsFetching] = useState(false)
  const targetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetching) {
          setIsFetching(true)
          callback()
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '100px'
      }
    )

    if (targetRef.current) {
      observer.observe(targetRef.current)
    }

    return () => observer.disconnect()
  }, [callback, isFetching, options])

  useEffect(() => {
    setIsFetching(false)
  }, [callback])

  return { targetRef, isFetching }
}

// 防抖Hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// 节流Hook
export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastExecuted = useRef<number>(Date.now())

  useEffect(() => {
    if (Date.now() >= lastExecuted.current + delay) {
      lastExecuted.current = Date.now()
      setThrottledValue(value)
    } else {
      const timer = setTimeout(() => {
        lastExecuted.current = Date.now()
        setThrottledValue(value)
      }, delay)

      return () => clearTimeout(timer)
    }
  }, [value, delay])

  return throttledValue
}

// 性能监控Hook
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0)
  const startTime = useRef(performance.now())

  useEffect(() => {
    renderCount.current += 1
    const endTime = performance.now()
    const renderTime = endTime - startTime.current
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} - Render #${renderCount.current} took ${renderTime.toFixed(2)}ms`)
    }
    
    startTime.current = performance.now()
  })

  return { renderCount: renderCount.current }
}