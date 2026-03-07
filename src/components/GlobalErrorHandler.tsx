'use client'

import { useEffect } from 'react'

/**
 * 全局错误捕获组件
 * 捕获未处理的 JavaScript 错误和 Promise 拒绝
 */
export function GlobalErrorHandler() {
  useEffect(() => {
    // 捕获未处理的 Promise 拒绝
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('未处理的 Promise 拒绝:', event.reason)
      // 可以在这里上报到错误监控服务
    }

    // 捕获 JavaScript 错误
    const handleError = (event: ErrorEvent) => {
      console.error('JavaScript 错误:', event.error || event.message)
      // 可以在这里上报到错误监控服务
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])

  return null
}
