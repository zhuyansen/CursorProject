import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { TranslatedText } from "@/components/main-nav"
import { useLanguage } from "@/components/language-provider"
import { useRouter } from "next/navigation"

export default function HeroSection() {
  const { resolvedTheme } = useTheme()
  const [logoSrc, setLogoSrc] = useState("/BrickRecipes.png")
  const { t, language } = useLanguage()
  const router = useRouter()
  
  // 默认选中第一个按钮
  const [activeButton, setActiveButton] = useState("ingredients")
  
  useEffect(() => {
    setLogoSrc(resolvedTheme === "dark" ? "/BrickRecipes_dark.png" : "/BrickRecipes.png")
  }, [resolvedTheme])
  
  // 点击按钮处理函数
  const handleButtonClick = (buttonType: string, path: string) => {
    setActiveButton(buttonType)
    router.push(path)
  }

  // 按钮样式
  const primaryButtonClass = "bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a] text-white"
  const secondaryButtonClass = "bg-white hover:bg-gray-100 text-[#b94a2c] border border-[#b94a2c] dark:bg-gray-800 dark:text-[#ff6b47] dark:border-[#ff6b47] dark:hover:bg-gray-700"
  const baseButtonClass = "px-6 py-5 rounded-md text-base md:text-lg"

  return (
    <section className="py-12 md:py-20 bg-gradient-to-b from-[#fff8f0] to-white dark:from-gray-800 dark:to-black">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-5 gap-10 items-center">
          <div className="space-y-6 lg:col-span-3">
            <div className="inline-block bg-[#f8e3c5] dark:bg-[#3a2e1e] px-4 py-1 rounded-full text-[#b94a2c] dark:text-[#ff6b47] font-medium text-sm">
              BrickRecipes
            </div>
            <div>
              <div className="mb-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight block">
                  {language === "zh" ? "找到您的完美食谱" : "Find Your Perfect Recipe"}
                </h1>
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#b94a2c] dark:text-[#ff6b47] leading-tight block">
                  {language === "zh" ? "砖块搭建，食谱精彩！" : "Build Your Recipes, Brick by Brick!"}
                </h2>
              </div>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-lg">
              <TranslatedText textKey="recipe.discoverDelicious" />
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                className={`${baseButtonClass} ${activeButton === "ingredients" ? primaryButtonClass : secondaryButtonClass}`}
                onClick={() => handleButtonClick("ingredients", "/brick-link-recipes")}
              >
                <TranslatedText textKey="button.findByIngredients" />
              </Button>
              <Button 
                className={`${baseButtonClass} ${activeButton === "menu" ? primaryButtonClass : secondaryButtonClass}`}
                onClick={() => handleButtonClick("menu", "/menu")}
              >
                <TranslatedText textKey="button.browseMenu" />
              </Button>
              <Button 
                className={`${baseButtonClass} ${activeButton === "video" ? primaryButtonClass : secondaryButtonClass}`}
                onClick={() => handleButtonClick("video", "/videotorecipes")}
              >
                <TranslatedText textKey="button.videoToRecipes" />
              </Button>
            </div>
          </div>
          <div className="relative lg:col-span-2">
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-[#f8e3c5] dark:bg-[#3a2e1e] rounded-full opacity-50"></div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#f8e3c5] dark:bg-[#3a2e1e] rounded-full opacity-50"></div>
            <div className="relative bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="flex justify-center mb-4">
                <Image
                  src={logoSrc}
                  alt="BrickRecipes Logo"
                  width={160}
                  height={160}
                  className="object-contain"
                />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-[#b94a2c] dark:text-[#ff6b47] mb-2">BrickRecipes</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{language === "zh" ? "砖块搭建，食谱精彩！" : "Build Your Recipes, Brick by Brick!"}</p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-[#f8e3c5] dark:bg-[#3a2e1e] p-3 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300"><TranslatedText textKey="hero.over" /></p>
                    <p className="text-xl font-bold text-[#b94a2c] dark:text-[#ff6b47]">10,000+</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300"><TranslatedText textKey="hero.recipes" /></p>
                  </div>
                  <div className="bg-[#f8e3c5] dark:bg-[#3a2e1e] p-3 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300"><TranslatedText textKey="hero.join" /></p>
                    <p className="text-xl font-bold text-[#b94a2c] dark:text-[#ff6b47]">5,000+</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300"><TranslatedText textKey="hero.users" /></p>
                  </div>
                </div>
                <Button 
                  className={`${baseButtonClass} ${primaryButtonClass} w-full`}
                  onClick={() => handleButtonClick("ingredients", "/brick-link-recipes")}
                >
                  <TranslatedText textKey="button.getStarted" /> →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
