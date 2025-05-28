"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/components/language-provider"
import { Menu } from "lucide-react"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import HeaderAuth from "./header-auth"
import { usePathname } from "next/navigation"
import { useAuth } from "./auth-wrapper"

export function TranslatedText({ textKey }: { textKey: string }) {
  const { t } = useLanguage()
  return <>{t(textKey)}</>
}

export function NavLink({ href, children, onClick, className }: { 
  href: string; 
  children: React.ReactNode; 
  onClick?: () => void;
  className?: string;
}) {
  const pathname = usePathname()
  const isActive = pathname === href
  
  // 预取页面，提高导航速度
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefetchPage = () => {
        const linkEl = document.createElement('link')
        linkEl.rel = 'prefetch'
        linkEl.href = href
        linkEl.as = 'document'
        document.head.appendChild(linkEl)
      }
      
      // 使用IntersectionObserver更高效地检测链接是否可见
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              prefetchPage()
              observer.disconnect()
            }
          })
        }, { threshold: 0.1 })
        
        // 开始观察链接元素
        const linkElement = document.querySelector(`a[href="${href}"]`)
        if (linkElement) {
          observer.observe(linkElement)
        }
        
        return () => {
          observer.disconnect()
        }
      } else {
        // 兼容不支持IntersectionObserver的浏览器
        const timer = setTimeout(prefetchPage, 1000)
        return () => clearTimeout(timer)
      }
    }
  }, [href])
  
  return (
    <Link
      href={href}
      className={`${className} ${isActive ? 'text-[#b94a2c] dark:text-[#ff6b47] font-medium' : ''}`}
      onClick={onClick}
      prefetch={false} // 使用我们自定义的预取逻辑
    >
      {children}
    </Link>
  )
}

export function MainNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const [logoSrc, setLogoSrc] = useState("/BrickRecipes.svg")
  const pathname = usePathname()
  const { user } = useAuth()
  
  // 直接使用原始路径
  const brickLinkRecipesLink = "/brick-link-recipes"
  const menuLink = "/menu"
  const videoToRecipesLink = "/videotorecipes"
  
  useEffect(() => {
    setLogoSrc(resolvedTheme === "dark" ? "/BrickRecipes_dark.svg" : "/BrickRecipes.svg")
  }, [resolvedTheme])

  return (
    <header className="border-b sticky top-0 z-50 w-full bg-white dark:bg-gray-900 shadow-sm">
      <div className="max-w-[1440px] mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src={logoSrc} alt="BrickRecipes Logo" width={40} height={40} className="object-contain" />
            <span className="text-xl font-bold text-[#b94a2c] dark:text-[#ff6b47]">BrickRecipes</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <NavLink
              href={brickLinkRecipesLink}
              className="text-sm font-medium hover:text-[#b94a2c] dark:hover:text-[#ff6b47] transition-colors dark:text-gray-200"
            >
              <TranslatedText textKey="nav.brickLinkRecipes" />
            </NavLink>
            <NavLink
              href={menuLink}
              className="text-sm font-medium hover:text-[#b94a2c] dark:hover:text-[#ff6b47] transition-colors dark:text-gray-200"
            >
              <TranslatedText textKey="nav.menu" />
            </NavLink>
            <NavLink
              href={videoToRecipesLink}
              className="text-sm font-medium hover:text-[#b94a2c] dark:hover:text-[#ff6b47] transition-colors dark:text-gray-200"
            >
              <TranslatedText textKey="nav.videoToRecipes" />
            </NavLink>
            <NavLink
              href="/pricing"
              className="text-sm font-medium hover:text-[#b94a2c] dark:hover:text-[#ff6b47] transition-colors dark:text-gray-200"
            >
              <TranslatedText textKey="nav.billing" />
            </NavLink>
            <NavLink
              href="/faq"
              className="text-sm font-medium hover:text-[#b94a2c] dark:hover:text-[#ff6b47] transition-colors dark:text-gray-200"
            >
              <TranslatedText textKey="nav.faq" />
            </NavLink>
            <NavLink
              href="/contact"
              className="text-sm font-medium hover:text-[#b94a2c] dark:hover:text-[#ff6b47] transition-colors dark:text-gray-200"
            >
              <TranslatedText textKey="nav.contactUs" />
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <LanguageSwitcher />
          <div className="hidden sm:flex items-center">
            <HeaderAuth />
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="h-6 w-6 dark:text-gray-200" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-800 py-4">
          <div className="max-w-[1440px] mx-auto px-4 space-y-3">
            <NavLink
              href={brickLinkRecipesLink}
              className="block py-2 text-sm font-medium hover:text-[#b94a2c] dark:hover:text-[#ff6b47] dark:text-gray-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <TranslatedText textKey="nav.brickLinkRecipes" />
            </NavLink>
            <NavLink
              href={menuLink}
              className="block py-2 text-sm font-medium hover:text-[#b94a2c] dark:hover:text-[#ff6b47] dark:text-gray-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <TranslatedText textKey="nav.menu" />
            </NavLink>
            <NavLink
              href={videoToRecipesLink}
              className="block py-2 text-sm font-medium hover:text-[#b94a2c] dark:hover:text-[#ff6b47] dark:text-gray-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <TranslatedText textKey="nav.videoToRecipes" />
            </NavLink>
            <NavLink
              href="/pricing"
              className="block py-2 text-sm font-medium hover:text-[#b94a2c] dark:hover:text-[#ff6b47] dark:text-gray-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <TranslatedText textKey="nav.billing" />
            </NavLink>
            <NavLink
              href="/faq"
              className="block py-2 text-sm font-medium hover:text-[#b94a2c] dark:hover:text-[#ff6b47] dark:text-gray-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <TranslatedText textKey="nav.faq" />
            </NavLink>
            <NavLink
              href="/contact"
              className="block py-2 text-sm font-medium hover:text-[#b94a2c] dark:hover:text-[#ff6b47] dark:text-gray-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <TranslatedText textKey="nav.contactUs" />
            </NavLink>
            <div className="flex flex-col pt-2">
              {/* 移动设备上简单显示登录/注册链接 */}
              <NavLink
                href="/sign-in"
                className="block py-2 text-sm font-medium hover:text-[#b94a2c] dark:hover:text-[#ff6b47] dark:text-gray-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                <TranslatedText textKey="nav.signIn" />
              </NavLink>
              <NavLink
                href="/sign-up"
                className="block py-2 text-sm font-medium hover:text-[#b94a2c] dark:hover:text-[#ff6b47] dark:text-gray-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                <TranslatedText textKey="nav.signUp" />
              </NavLink>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
