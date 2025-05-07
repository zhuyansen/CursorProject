"use client"

import { useEffect } from "react"
import { useLanguage } from "@/components/language-provider"

export function DynamicHtmlLang() {
  const { language } = useLanguage()

  useEffect(() => {
    // 修改html元素的lang属性
    if (document && document.documentElement) {
      document.documentElement.lang = language
    }
  }, [language])

  // 这是一个不渲染任何内容的组件
  return null
} 