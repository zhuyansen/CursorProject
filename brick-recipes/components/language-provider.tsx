"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { translations } from "../data/translations"

type Language = "en" | "zh"

type LanguageContextType = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key: string) => key,
})

export const useLanguage = () => useContext(LanguageContext)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted to avoid hydration mismatch
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "zh")) {
      setLanguageState(savedLanguage)
    }
    setMounted(true)
  }, [])

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
    localStorage.setItem("language", newLanguage)
    // Force re-render of components that use the language context
    document.documentElement.lang = newLanguage
  }

  const t = (key: string): string => {
    if (!mounted) return key
    
    // 处理嵌套键，如 'section.whyChoose.title'
    if (key.includes('.')) {
      const parts = key.split('.')
      let current: any = translations
      
      // 遍历路径
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        
        // 如果当前是最后一级，并且我们已经到达了语言级别
        if (i === parts.length - 1 && current[language]) {
          const result = current[language][part]
          if (result !== undefined) {
            return result as string
          }
          return key
        }
        
        // 如果当前部分存在
        if (current[part] !== undefined) {
          current = current[part]
          
          // 如果我们已经到达了语言级别，但还有更多路径要处理
          if (i < parts.length - 2 && current[language]) {
            current = current[language]
          }
        } else {
          return key
        }
      }
      
      // 如果结果是对象而不是字符串，返回键名
      if (typeof current === 'object') {
        return key
      }
      
      return current as string
    }
    
    // 处理普通键
    // 遍历 translations 的所有部分，查找匹配的键
    for (const section of Object.keys(translations) as Array<keyof typeof translations>) {
      const sectionTranslations = translations[section]
      if (sectionTranslations && sectionTranslations[language]) {
        const langSection = sectionTranslations[language]
        const result = langSection[key as keyof typeof langSection]
        if (result !== undefined) {
          return result as string
        }
      }
    }
    
    // 如果没有找到翻译，返回原始键
    return key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}
