"use client"

import PricingPlans from "@/components/pricing-plans"
import HeroSection from "@/components/hero-section"
import { TranslatedText } from "@/components/main-nav"
import { useLanguage } from "@/components/language-provider"
import Link from "next/link"
import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

export default function Home() {
  const { t, language } = useLanguage()
  const searchParams = useSearchParams()
  
  // 处理认证成功后的支付链接重定向
  useEffect(() => {
    const success = searchParams.get('success')
    
    if (success === 'true') {
      try {
        const pendingPaymentLink = localStorage.getItem('pendingPaymentLink')
        if (pendingPaymentLink) {
          // 清除存储的支付链接
          localStorage.removeItem('pendingPaymentLink')
          localStorage.removeItem('pendingPlanType')
          
          // 打开支付页面
          window.open(pendingPaymentLink, '_blank')
        }
      } catch (error) {
        console.error('Error handling payment redirect:', error)
      }
    }
  }, [searchParams])
  
  // 直接使用原始路径
  const brickLinkRecipesLink = "/brick-link-recipes"
  const menuLink = "/menu"
  const videoToRecipesLink = "/videotorecipes"
  
  return (
    <>
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 dark:text-white"><TranslatedText textKey="section.whyChoose.title" /></h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              <TranslatedText textKey="section.whyChoose.description" />
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-[#f8e3c5] dark:bg-[#3a2e1e] rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#b94a2c] dark:text-[#ff6b47]"
                >
                  <path d="m21 21-6-6m6 6v-4.8m0 4.8h-4.8" />
                  <path d="M3 16.2V21m0 0h4.8M3 21l6-6" />
                  <path d="M21 7.8V3m0 0h-4.8M21 3l-6 6" />
                  <path d="M3 7.8V3m0 0h4.8M3 3l6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 dark:text-white">{language === "zh" ? "按食材筛选食谱" : "Filter by Ingredients"}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                <TranslatedText textKey="recipe.brickLinkDescription" />
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-[#f8e3c5] dark:bg-[#3a2e1e] rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#b94a2c] dark:text-[#ff6b47]"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 dark:text-white">{language === "zh" ? "传统食谱库" : "Recipe Collection"}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                <TranslatedText textKey="recipe.menuDescription" />
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-[#f8e3c5] dark:bg-[#3a2e1e] rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#b94a2c] dark:text-[#ff6b47]"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 dark:text-white">{language === "zh" ? "视频转食谱" : "Video to Recipes"}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                <TranslatedText textKey="recipe.videoToRecipesDescription" />
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 dark:bg-gray-900">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 dark:text-white"><TranslatedText textKey="section.howItWorks.title" /></h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              <TranslatedText textKey="section.howItWorks.description" />
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#f8e3c5] dark:bg-[#3a2e1e] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-[#b94a2c] dark:text-[#ff6b47] text-xl font-bold">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">{language === "zh" ? "按食材筛选" : "Filter by Ingredients"}</h3>
              <p className="text-gray-600 dark:text-gray-300">{language === "zh" ? "选择您已有的食材，我们为您推荐适合的菜肴" : "Select ingredients you have, we'll suggest matching recipes"}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#f8e3c5] dark:bg-[#3a2e1e] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-[#b94a2c] dark:text-[#ff6b47] text-xl font-bold">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">{language === "zh" ? "浏览菜单" : "Browse Menu"}</h3>
              <p className="text-gray-600 dark:text-gray-300">{language === "zh" ? "按类别探索我们精心策划的传统食谱系列" : "Explore our curated collection of recipes by categories"}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#f8e3c5] dark:bg-[#3a2e1e] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-[#b94a2c] dark:text-[#ff6b47] text-xl font-bold">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">{language === "zh" ? "视频转食谱" : "Video to Recipes"}</h3>
              <p className="text-gray-600 dark:text-gray-300">{language === "zh" ? "将任何烹饪视频转换为完整的食谱详情" : "Turn any cooking video into a complete recipe"}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#f8e3c5] dark:bg-[#3a2e1e] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-[#b94a2c] dark:text-[#ff6b47] text-xl font-bold">4</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">{language === "zh" ? "烹饪与享用" : "Cook & Enjoy"}</h3>
              <p className="text-gray-600 dark:text-gray-300">{language === "zh" ? "按照详细说明烹饪，每次都能做出完美的菜肴" : "Follow detailed instructions to cook perfect dishes every time"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <PricingPlans />

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 dark:text-white"><TranslatedText textKey="section.faq.title" /></h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              <TranslatedText textKey="section.faq.description" />
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2 dark:text-white">{language === "zh" ? "什么是砖块食谱？" : "What is BrickRecipes?"}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {language === "zh" 
                  ? "砖块食谱是一个集合多功能于一体的烹饪平台，让您可以按食材查找食谱，浏览传统菜单，将视频转换为详细食谱"
                  : "BrickRecipes is a multi-functional cooking platform that lets you find recipes by ingredients, browse traditional menus, and convert videos into detailed recipes"}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2 dark:text-white">{language === "zh" ? "如何使用按食材筛选功能？" : "How to use the ingredient filter feature?"}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                <TranslatedText textKey="recipe.brickLinkDescription" />
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2 dark:text-white">{language === "zh" ? "菜单页面有哪些特点？" : "What are the menu page features?"}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                <TranslatedText textKey="recipe.menuDescription" />
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2 dark:text-white">{language === "zh" ? "视频转食谱功能如何工作？" : "How does Video to Recipes work?"}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                <TranslatedText textKey="recipe.videoToRecipesDescription" />
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
