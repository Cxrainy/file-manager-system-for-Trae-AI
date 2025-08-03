// 统一的动画配置
export const animations = {
  // 页面切换动画
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: 'easeInOut' }
  },

  // 模态框动画
  modal: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2, ease: 'easeOut' }
  },

  // 侧边栏动画
  sidebar: {
    initial: { x: -300 },
    animate: { x: 0 },
    exit: { x: -300 },
    transition: { duration: 0.3, ease: 'easeInOut' }
  },

  // 列表项动画
  listItem: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.2 }
  },

  // 卡片悬停动画
  cardHover: {
    whileHover: { 
      scale: 1.02, 
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      transition: { duration: 0.2 }
    },
    whileTap: { scale: 0.98 }
  },

  // 按钮点击动画
  buttonTap: {
    whileTap: { scale: 0.95 },
    transition: { duration: 0.1 }
  },

  // 加载动画
  loading: {
    animate: { rotate: 360 },
    transition: { duration: 1, repeat: Infinity, ease: 'linear' }
  },

  // 淡入动画
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 }
  },

  // 滑入动画
  slideIn: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: 'easeOut' }
  },

  // 弹跳动画
  bounce: {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        repeatType: 'reverse' as const
      }
    }
  },

  // 脉冲动画
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  },

  // 展开/折叠动画
  expand: {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: 'auto' },
    exit: { opacity: 0, height: 0 },
    transition: { duration: 0.3, ease: 'easeInOut' }
  },

  // 通知动画
  notification: {
    initial: { opacity: 0, x: 300 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 300 },
    transition: { duration: 0.3, ease: 'easeOut' }
  }
}

// 动画变体预设
export const variants = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1
      }
    }
  },
  item: {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  }
}

// 缓动函数
export const easings = {
  easeInOut: [0.4, 0, 0.2, 1],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  bounce: [0.68, -0.55, 0.265, 1.55]
}

// 持续时间常量
export const durations = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8
}