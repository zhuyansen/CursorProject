"use client"

import { useState, useEffect } from "react"
import { Check, ChevronDown, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/components/language-provider"
import { useTheme } from "next-themes"

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()
  const { theme } = useTheme()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "zh", name: "中文", flag: "🇨🇳" },
  ]

  if (!mounted) {
    return (
      <Button 
        variant="outline" 
        className="flex items-center gap-2 px-3 rounded-full border-gray-200"
      >
        <Globe className="h-5 w-5" />
        <ChevronDown className="h-4 w-4" />
      </Button>
    )
  }

  const currentLanguage = languages.find((lang) => lang.code === language) || languages[0]

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={`flex items-center gap-2 px-3 rounded-full ${
            theme === "dark" 
              ? "bg-gray-800 text-white border-gray-700 hover:bg-gray-700" 
              : "bg-white text-gray-800 border-gray-200 hover:bg-gray-100"
          }`}
        >
          <span>{currentLanguage.flag}</span>
          <span>{currentLanguage.name}</span>
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className={`w-[160px] ${
          theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            className={`flex items-center justify-between cursor-pointer ${
              theme === "dark" 
                ? "hover:bg-gray-700 focus:bg-gray-700" 
                : "hover:bg-gray-100 focus:bg-gray-100"
            }`}
            onClick={() => {
              setLanguage(lang.code as "en" | "zh")
              setOpen(false)
            }}
          >
            <div className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span className={theme === "dark" ? "text-white" : "text-gray-800"}>{lang.name}</span>
            </div>
            {language === lang.code && (
              <Check className={`h-4 w-4 ${theme === "dark" ? "text-green-400" : "text-green-600"}`} />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
