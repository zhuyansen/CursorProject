"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlayCircle, Clock, Flame, ArrowLeft } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { recipesByCategory } from "@/data/recipes"

// 每次加载的项目数量
const ITEMS_PER_PAGE = 8

export default function CategoryMenuPage({ params }: { params: { category: string } }) {
  const { t, language } = useLanguage()
  const [recipes, setRecipes] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const observer = useRef<IntersectionObserver | null>(null)
  const lastRecipeElementRef = useRef<HTMLDivElement | null>(null)

  // 获取类别名称的翻译
  const getCategoryName = () => {
    const categoryKey = `category.${params.category}`
    return t(categoryKey)
  }

  // 加载更多项目
  const loadMoreItems = useCallback(() => {
    if (loading) return
    
    setLoading(true)
    
    // 模拟API调用延迟
    setTimeout(() => {
      const category = params.category as keyof typeof recipesByCategory
      
      if (!recipesByCategory[category]) {
        setHasMore(false)
        setLoading(false)
        return
      }
      
      // 获取当前页面应显示的食谱
      const allRecipes = recipesByCategory[category]
      const nextItems = allRecipes.slice(0, page * ITEMS_PER_PAGE)
      
      setRecipes(nextItems)
      setHasMore(nextItems.length < allRecipes.length)
      setLoading(false)
      setPage(prev => prev + 1)
    }, 800)
  }, [page, params.category, loading])

  // 初始加载
  useEffect(() => {
    loadMoreItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 设置交叉观察器用于无限滚动
  useEffect(() => {
    if (loading) return
    
    if (observer.current) observer.current.disconnect()
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreItems()
      }
    })
    
    if (lastRecipeElementRef.current) {
      observer.current.observe(lastRecipeElementRef.current)
    }
  }, [loading, hasMore, loadMoreItems])

  // 如果类别不存在
  if (params.category && !recipesByCategory[params.category as keyof typeof recipesByCategory]) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 dark:text-white">{language === "zh" ? "类别不存在" : "Category Not Found"}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {language === "zh" 
              ? "我们找不到您请求的菜单类别。" 
              : "We couldn't find the menu category you requested."}
          </p>
          <Link href="/menu">
            <Button className="bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a]">
              {language === "zh" ? "返回菜单" : "Back to Menu"}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/menu" className="inline-flex items-center text-[#b94a2c] dark:text-[#ff6b47] mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {language === "zh" ? "返回菜单" : "Back to Menu"}
          </Link>
          <h1 className="text-3xl font-bold dark:text-white">{getCategoryName()}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {language === "zh"
              ? `浏览所有${getCategoryName()}食谱，每个都配有详细视频教程`
              : `Browse all ${getCategoryName()} recipes with detailed video tutorials`}
          </p>
        </div>
      </div>

      {/* Recipes Grid */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {recipes.map((recipe, index) => {
            // 为最后一个元素添加ref
            const isLastElement = index === recipes.length - 1

            return (
              <div 
                key={recipe.id} 
                ref={isLastElement ? lastRecipeElementRef : null}
              >
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
            )
          })}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center mt-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#b94a2c] dark:border-[#ff6b47]"></div>
          </div>
        )}

        {/* No more items */}
        {!hasMore && recipes.length > 0 && (
          <div className="text-center mt-8 text-gray-600 dark:text-gray-300">
            {language === "zh" ? "已显示全部食谱" : "All recipes loaded"}
          </div>
        )}

        {/* No items */}
        {!loading && recipes.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🍽️</div>
            <h3 className="text-xl font-bold mb-2 dark:text-white">
              {language === "zh" ? "此类别暂无食谱" : "No recipes in this category yet"}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {language === "zh" ? "请稍后再查看或尝试其他类别" : "Please check back later or try another category"}
            </p>
            <Link href="/menu">
              <Button variant="outline" className="dark:text-gray-300 dark:border-gray-600">
                {language === "zh" ? "返回菜单" : "Back to Menu"}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
} 