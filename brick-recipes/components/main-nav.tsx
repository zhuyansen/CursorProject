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

export function TranslatedText({ textKey }: { textKey: string }) {
  const { t } = useLanguage()
  return <>{t(textKey)}</>
}

export function MainNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const [logoSrc, setLogoSrc] = useState("/BrickRecipes.png")
  
  useEffect(() => {
    setLogoSrc(resolvedTheme === "dark" ? "/BrickRecipes_dark.png" : "/BrickRecipes.png")
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
            <Link
              href="/brick-link-recipes"
              className="text-sm font-medium hover:text-[#b94a2c] dark:hover:text-[#ff6b47] transition-colors dark:text-gray-200"
            >
              <TranslatedText textKey="nav.brickLinkRecipes" />
            </Link>
            <Link
              href="/menu"
              className="text-sm font-medium hover:text-[#b94a2c] dark:hover:text-[#ff6b47] transition-colors dark:text-gray-200"
            >
              <TranslatedText textKey="nav.menu" />
            </Link>
            <Link
              href="/videotorecipes"
              className="text-sm font-medium hover:text-[#b94a2c] dark:hover:text-[#ff6b47] transition-colors dark:text-gray-200"
            >
              <TranslatedText textKey="nav.videoToRecipes" />
            </Link>
            <Link
              href="/billing"
              className="text-sm font-medium hover:text-[#b94a2c] dark:hover:text-[#ff6b47] transition-colors dark:text-gray-200"
            >
              <TranslatedText textKey="nav.billing" />
            </Link>
            <Link
              href="/faq"
              className="text-sm font-medium hover:text-[#b94a2c] dark:hover:text-[#ff6b47] transition-colors dark:text-gray-200"
            >
              <TranslatedText textKey="nav.faq" />
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium hover:text-[#b94a2c] dark:hover:text-[#ff6b47] transition-colors dark:text-gray-200"
            >
              <TranslatedText textKey="nav.contactUs" />
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <LanguageSwitcher />
          <div className="hidden sm:flex items-center gap-2">
            <Button variant="outline" className="dark:border-gray-700 dark:text-gray-200">
              <TranslatedText textKey="nav.signIn" />
            </Button>
            <Button className="bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a]">
              <TranslatedText textKey="nav.signUp" />
            </Button>
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
            <Link
              href="/brick-link-recipes"
              className="block py-2 text-sm font-medium hover:text-[#b94a2c] dark:hover:text-[#ff6b47] dark:text-gray-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <TranslatedText textKey="nav.brickLinkRecipes" />
            </Link>
            <Link
              href="/menu"
              className="block py-2 text-sm font-medium hover:text-[#b94a2c] dark:hover:text-[#ff6b47] dark:text-gray-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <TranslatedText textKey="nav.menu" />
            </Link>
            <Link
              href="/videotorecipes"
              className="block py-2 text-sm font-medium hover:text-[#b94a2c] dark:hover:text-[#ff6b47] dark:text-gray-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <TranslatedText textKey="nav.videoToRecipes" />
            </Link>
            <Link
              href="/billing"
              className="block py-2 text-sm font-medium hover:text-[#b94a2c] dark:hover:text-[#ff6b47] dark:text-gray-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <TranslatedText textKey="nav.billing" />
            </Link>
            <Link
              href="/faq"
              className="block py-2 text-sm font-medium hover:text-[#b94a2c] dark:hover:text-[#ff6b47] dark:text-gray-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <TranslatedText textKey="nav.faq" />
            </Link>
            <Link
              href="/contact"
              className="block py-2 text-sm font-medium hover:text-[#b94a2c] dark:hover:text-[#ff6b47] dark:text-gray-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <TranslatedText textKey="nav.contactUs" />
            </Link>
            <div className="flex items-center gap-2 pt-2">
              <Button variant="outline" className="w-full dark:border-gray-700 dark:text-gray-200">
                <TranslatedText textKey="nav.signIn" />
              </Button>
              <Button className="w-full bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a]">
                <TranslatedText textKey="nav.signUp" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
