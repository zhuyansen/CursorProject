"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlayCircle, Clock, Flame } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { categories, recipesByCategory } from "@/data/recipes"

export default function MenuPage() {
  const { t, language } = useLanguage()
  const [activeCategory, setActiveCategory] = useState("breakfast")
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId)
    const element = categoryRefs.current[categoryId]
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Menu Header */}
      <div className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold mb-2 text-center dark:text-white">{t("menu.recipeCategories")}</h1>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
            {t("menu.browseByCategory")}
          </p>
          
          {/* Category Buttons */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant="outline"
                className="rounded-full border-gray-300 dark:border-gray-600 dark:text-gray-200 hover:border-[#b94a2c] hover:bg-white hover:text-[#b94a2c] dark:hover:border-[#ff6b47] dark:hover:text-[#ff6b47]"
                onClick={() => scrollToCategory(category.id)}
              >
                {t(category.nameKey)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Categories List */}
        <div className="space-y-16">
          {categories.map((category) => (
            <div 
              key={category.id} 
              id={category.id} 
              className="scroll-mt-24"
              ref={(el) => {
                categoryRefs.current[category.id] = el;
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold dark:text-white">{t(category.nameKey)}</h2>
                <Link href={`/menu/${category.id}`}>
                  <Button variant="link" className="text-[#b94a2c] dark:text-[#ff6b47]">
                    {t("menu.viewAll")}
                  </Button>
                </Link>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-8">{t(`menu.description.${category.id}`)}</p>
              
              {/* Recipes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {recipesByCategory[category.id as keyof typeof recipesByCategory].slice(0, 4).map((recipe) => (
                  <div key={recipe.id} className="group">
                    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                      <div className="relative h-40">
                        <Image src={recipe.image} alt={t(`menu.recipeTitle.${recipe.title.replace(/\s+/g, "")}`)} fill className="object-cover" />
                        {recipe.hasVideo && (
                          <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                            <PlayCircle className="h-3 w-3 mr-1" />
                            {language === "zh" ? "视频" : "Video"}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-lg mb-2 group-hover:text-[#b94a2c] dark:text-white dark:group-hover:text-[#ff6b47] transition-colors">
                          {t(`menu.recipeTitle.${recipe.title.replace(/\s+/g, "")}`)}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-3 mb-3">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-[#b94a2c] dark:text-[#ff6b47]" />
                            <span>{recipe.time.split(" ")[0]} {t("recipe.timeUnit")}</span>
                          </div>
                          <div className="flex items-center">
                            <Flame className="h-4 w-4 mr-1 text-[#b94a2c] dark:text-[#ff6b47]" />
                            <span>{recipe.calories.split(" ")[0]} {t("recipe.calorieUnit")}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300">
                            {t(`recipe.difficulty.${recipe.difficulty.toLowerCase()}`)}
                          </span>
                        </div>
                        <Link href={`/recipe-details?id=${recipe.id}`} className="w-full block">
                          <Button
                            className="w-full bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a] text-white"
                          >
                            {t("button.viewRecipe")}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* View All Link (Mobile only) */}
              <div className="flex justify-center mt-8 md:hidden">
                <Link href={`/menu/${category.id}`}>
                  <Button className="w-full bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a]">
                    {language === "zh" ? `查看全部${t(category.nameKey)}食谱` : `View All ${t(category.nameKey)} Recipes`}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Video Tutorials Benefits */}
      <div className="bg-white border-t dark:bg-gray-800 dark:border-gray-700 py-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2 dark:text-white">{t("video.tutorialBenefits")}</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t("menu.exploreRecipes")}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#f8e3c5] dark:bg-[#3a2e1e] rounded-full flex items-center justify-center mx-auto mb-4">
                <PlayCircle className="h-8 w-8 text-[#b94a2c] dark:text-[#ff6b47]" />
              </div>
              <h3 className="text-lg font-medium mb-2 dark:text-white">{t("video.seeEveryStep")}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t("video.watchSteps")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#f8e3c5] dark:bg-[#3a2e1e] rounded-full flex items-center justify-center mx-auto mb-4">
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
                  className="h-8 w-8 text-[#b94a2c] dark:text-[#ff6b47]"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2 dark:text-white">{t("video.timeReferences")}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t("video.timeReferencesDesc")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#f8e3c5] dark:bg-[#3a2e1e] rounded-full flex items-center justify-center mx-auto mb-4">
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
                  className="h-8 w-8 text-[#b94a2c] dark:text-[#ff6b47]"
                >
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2 dark:text-white">{t("video.expertTips")}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t("video.expertTipsDesc")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
