import { useEffect, useRef, useCallback } from 'react'

// localStorage key
const LOGOUT_EVENT = 'stockview-logout'

/**
 * 监听其他窗口的退出登录事件
 * 使用 localStorage 事件实现跨窗口通信
 */
export function useAuthSync() {
  const lastReload = useRef(0)
  const COOLDOWN = 2000 // 2秒冷却时间

  const handleStorage = useCallback((event: StorageEvent) => {
    // 只处理 logout 事件
    if (event.key !== LOGOUT_EVENT) return

    const now = Date.now()
    // 冷却期内不刷新
    if (now - lastReload.current < COOLDOWN) return

    lastReload.current = now
    window.location.reload()
  }, [])

  useEffect(() => {
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [handleStorage])
}

/**
 * 广播退出登录消息
 * 使用 localStorage 事件让其他窗口监听
 */
export function broadcastLogout() {
  // 设置一个值触发其他窗口的 storage 事件
  // 使用 sessionStorage 避免影响当前窗口
  sessionStorage.setItem(LOGOUT_EVENT, Date.now().toString())
  localStorage.setItem(LOGOUT_EVENT, Date.now().toString())
  // 立即清除，让其他窗口能监听下次变化
  localStorage.removeItem(LOGOUT_EVENT)
}
