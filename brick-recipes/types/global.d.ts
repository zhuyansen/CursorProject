// 全局类型声明

declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: any
    ) => void
    _hmt?: any[]
  }
}

export {} 