import { create } from 'zustand'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

interface NotificationStore {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  addNotification: (notification) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = { ...notification, id }
    
    set((state) => ({
      notifications: [...state.notifications, newNotification]
    }))
    
    // Auto remove after duration (default 5 seconds)
    const duration = notification.duration || 5000
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }))
      }, duration)
    }
  },
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }))
  },
  clearNotifications: () => {
    set({ notifications: [] })
  }
}))

// Helper function to show notifications
export const showNotification = (notification: Omit<Notification, 'id'>) => {
  useNotificationStore.getState().addNotification(notification)
}

export const showSuccess = (title: string, message?: string) => {
  showNotification({ type: 'success', title, message })
}

export const showError = (title: string, message?: string) => {
  showNotification({ type: 'error', title, message })
}

export const showWarning = (title: string, message?: string) => {
  showNotification({ type: 'warning', title, message })
}

export const showInfo = (title: string, message?: string) => {
  showNotification({ type: 'info', title, message })
}