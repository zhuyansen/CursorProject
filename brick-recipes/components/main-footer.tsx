"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { useLanguage } from "@/components/language-provider"
import { TranslatedText } from "./main-nav"

export function MainFooter() {
  const { resolvedTheme } = useTheme()
  const [logoSrc, setLogoSrc] = useState("/BrickRecipes.svg")
  const { t } = useLanguage()
  
  // 直接使用原始路径
  const brickLinkRecipesLink = "/brick-link-recipes"
  const menuLink = "/menu"
  const videoToRecipesLink = "/videotorecipes"
  
  useEffect(() => {
    setLogoSrc(resolvedTheme === "dark" ? "/BrickRecipes_dark.svg" : "/BrickRecipes.svg")
  }, [resolvedTheme])

  return (
    <footer className="bg-white text-gray-800 py-6 dark:bg-gray-950 dark:text-white border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-6 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Image src={logoSrc} alt="BrickRecipes Logo" width={28} height={28} className="object-contain" />
              <span className="text-lg font-bold">BrickRecipes</span>
            </div>
            <p className="text-gray-600 text-sm dark:text-gray-400">
              <TranslatedText textKey="footer.buildYourRecipes" />
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3">
              <TranslatedText textKey="footer.quickLinks" />
            </h3>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <Link href="/" className="text-gray-600 hover:text-gray-900 hover:underline dark:text-gray-400 dark:hover:text-white transition-colors border-b border-transparent hover:border-gray-300 dark:hover:border-gray-400">
                <TranslatedText textKey="nav.home" />
              </Link>
              <Link href={brickLinkRecipesLink} className="text-gray-600 hover:text-gray-900 hover:underline dark:text-gray-400 dark:hover:text-white transition-colors border-b border-transparent hover:border-gray-300 dark:hover:border-gray-400">
                <TranslatedText textKey="nav.brickLinkRecipes" />
              </Link>
              <Link href={menuLink} className="text-gray-600 hover:text-gray-900 hover:underline dark:text-gray-400 dark:hover:text-white transition-colors border-b border-transparent hover:border-gray-300 dark:hover:border-gray-400">
                <TranslatedText textKey="nav.menu" />
              </Link>
              <Link href={videoToRecipesLink} className="text-gray-600 hover:text-gray-900 hover:underline dark:text-gray-400 dark:hover:text-white transition-colors border-b border-transparent hover:border-gray-300 dark:hover:border-gray-400">
                <TranslatedText textKey="nav.videoToRecipes" />
              </Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3">
              <TranslatedText textKey="footer.support" />
            </h3>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <Link href="/faq" className="text-gray-600 hover:text-gray-900 hover:underline dark:text-gray-400 dark:hover:text-white transition-colors border-b border-transparent hover:border-gray-300 dark:hover:border-gray-400">
                <TranslatedText textKey="nav.faq" />
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900 hover:underline dark:text-gray-400 dark:hover:text-white transition-colors border-b border-transparent hover:border-gray-300 dark:hover:border-gray-400">
                <TranslatedText textKey="nav.contactUs" />
              </Link>
              <a 
                href="mailto:contact@brickrecipes.ai?subject=" 
                className="text-gray-600 hover:text-gray-900 hover:underline dark:text-gray-400 dark:hover:text-white transition-colors border-b border-transparent hover:border-gray-300 dark:hover:border-gray-400"
                aria-label={t("footer.contactEmail")}
              >
                contact@brickrecipes.ai
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800 pt-4 text-center text-xs text-gray-500 dark:text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} BrickRecipes. <TranslatedText textKey="footer.allRightsReserved" />
          </p>
        </div>
      </div>
    </footer>
  )
}
