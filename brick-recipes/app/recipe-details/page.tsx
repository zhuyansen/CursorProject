"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Clock, Users, ChefHat, Flame, Heart, Share2, Printer, PlayCircle } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

interface RecipeDetail {
  // 基本信息
  idMeal: string
  strMeal: string
  strCategory?: string
  strArea?: string
  strMealThumb?: string
  strTags?: string
  strYoutube?: string
  strBilibili?: string
  
  // 烹饪信息
  cookingMethods?: string
  mealStyle?: string
  time?: number | string
  difficulty?: string
  servings?: number | string
  Weight?: string
  
  // 营养信息
  Energy?: string
  Protein?: string
  "Total Fat"?: string
  Saturated?: string
  "Carbohydrate Total"?: string
  Sugars?: string
  Sodium?: string
  
  // 营养信息（每份）
  NutritionPerServing?: {
    Energy?: string
    Protein?: string
    "Total Fat"?: string
    Saturated?: string
    "Carbohydrate Total"?: string
    Sugars?: string
    Sodium?: string
    Cholesterol?: string
    TransFat?: string
    "Dietary Fiber"?: string
    "Added Sugars"?: string
    "Vitamin D"?: string
    Calcium?: string
    Iron?: string
    Potassium?: string
  }
  
  // 食材和步骤
  ingredients?: string[]
  instructions?: string[]
  strInstructions?: string  // 添加 MealDB API 格式的说明字段
  
  // MealDB API 格式的食材和计量
  strIngredient1?: string
  strIngredient2?: string
  strIngredient3?: string
  strIngredient4?: string
  strIngredient5?: string
  strIngredient6?: string
  strIngredient7?: string
  strIngredient8?: string
  strIngredient9?: string
  strIngredient10?: string
  strIngredient11?: string
  strIngredient12?: string
  strIngredient13?: string
  strIngredient14?: string
  strIngredient15?: string
  strIngredient16?: string
  strIngredient17?: string
  strIngredient18?: string
  strIngredient19?: string
  strIngredient20?: string
  
  strMeasure1?: string
  strMeasure2?: string
  strMeasure3?: string
  strMeasure4?: string
  strMeasure5?: string
  strMeasure6?: string
  strMeasure7?: string
  strMeasure8?: string
  strMeasure9?: string
  strMeasure10?: string
  strMeasure11?: string
  strMeasure12?: string
  strMeasure13?: string
  strMeasure14?: string
  strMeasure15?: string
  strMeasure16?: string
  strMeasure17?: string
  strMeasure18?: string
  strMeasure19?: string
  strMeasure20?: string
}

export default function RecipeDetails() {
  const { t, language } = useLanguage()
  const searchParams = useSearchParams()
  const recipeId = searchParams.get("id")

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [servings, setServings] = useState(1)
  const imageCache = useRef(new Map<string, string>())
  const [checkedIngredients, set_checked_ingredients] = useState<Record<string, boolean>>({})
  const [madeCounts, setMadeCounts] = useState(1426)
  const [hasMade, setHasMade] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  // 从MealDB格式获取食材和计量数据
  const getIngredientsWithMeasures = (recipe: RecipeDetail) => {
    const ingredients_with_measures: { ingredient: string; measure: string }[] = []
    
    // 首先尝试从strIngredient和strMeasure字段获取
    for (let i = 1; i <= 20; i++) {
      const ingredient_key = `strIngredient${i}` as keyof RecipeDetail
      const measure_key = `strMeasure${i}` as keyof RecipeDetail
      
      const ingredient = recipe[ingredient_key] as string
      const measure = recipe[measure_key] as string
      
      if (ingredient && ingredient.trim() !== '') {
        ingredients_with_measures.push({
          ingredient: ingredient.trim(),
          measure: measure ? measure.trim() : ''
        })
      }
    }
    
    // 如果没有MealDB格式的数据，则使用现有的ingredients数组
    if (ingredients_with_measures.length === 0 && recipe.ingredients && Array.isArray(recipe.ingredients)) {
      return recipe.ingredients.map(ing => {
        // 尝试拆分食材字符串中的计量信息（如果存在）
        const parts = ing.split(',').map(p => p.trim())
        if (parts.length > 1) {
          return { ingredient: parts[0], measure: parts.slice(1).join(', ') }
        }
        return { ingredient: ing, measure: '' }
      })
    }
    
    return ingredients_with_measures
  }

  // 图片处理函数
  const getValidImageUrl = (url: string) => {
    // 检查URL是否有效
    if (!url || url.includes("placeholder.svg")) {
      return "/placeholder.svg";
    }

    try {
      // 尝试创建一个URL对象来验证URL格式
      new URL(url);
      return url;
    } catch (e) {
      // URL格式无效
      return "/placeholder.svg";
    }
  };

  // 优化图片处理函数
  const getOptimizedImageUrl = (url: string, width = 300, height = 200) => {
    // 如果URL无效，返回占位图
    if (!url || url.includes("placeholder.svg")) {
      return "/placeholder.svg";
    }

    // 创建缓存键
    const cacheKey = `${url}_${width}_${height}`;

    // 检查缓存中是否已存在
    if (imageCache.current.has(cacheKey)) {
      return imageCache.current.get(cacheKey);
    }

    try {
      // 验证URL格式
      const parsedUrl = new URL(url);

      // 检查是否为S3 URL
      if (parsedUrl.hostname === 's3.us-east-1.amazonaws.com') {
        console.log('[RecipeDetails] Processing S3 image URL:', url);

        // 确保使用https
        const secureUrl = url.replace(/^http:/, 'https:');
        imageCache.current.set(cacheKey, secureUrl);
        return secureUrl;
      }

      // 确保我们使用https协议
      const secureUrl = url.replace(/^http:/, 'https:');
      imageCache.current.set(cacheKey, secureUrl);
      return secureUrl;
    } catch (e) {
      // URL格式无效，缓存占位图URL
      console.error('[RecipeDetails] Invalid image URL:', url, e);
      imageCache.current.set(cacheKey, "/placeholder.svg");
      return "/placeholder.svg";
    }
  };

  // 勾选/取消勾选食材的处理函数
  const toggle_ingredient = (index: number) => {
    set_checked_ingredients(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  useEffect(() => {
    if (recipeId) {
      const fetchRecipeDetails = async () => {
        setIsLoading(true)
        setError(null)
        setRecipe(null)

        // 添加重试机制
        let retries = 0;
        const maxRetries = 3;
        const retryDelay = 1000; // 初始延迟1秒

        const attemptFetch = async (): Promise<RecipeDetail | null> => {
          try {
            const response = await fetch(`/api/get-recipe-by-id?id=${recipeId}`)
            
            if (!response.ok) {
              const errorData = await response.json()
              
              // 检查是否可以重试
              if ((response.status === 503 || response.status === 500) && 
                  errorData.retryable === true && 
                  retries < maxRetries) {
                retries++;
                const currentDelay = retryDelay * Math.pow(1.5, retries - 1); // 指数退避
                console.log(`Retrying fetch (${retries}/${maxRetries}) after ${currentDelay}ms...`);
                
                // 等待一段时间后重试
                await new Promise(resolve => setTimeout(resolve, currentDelay));
                return attemptFetch();
              }
              
              throw new Error(errorData.message || `Failed to fetch recipe details. Status: ${response.status}`)
            }
            
            const data: RecipeDetail = await response.json()
            console.log("Fetched recipe data:", data)
            
            // 确保ingredients是数组
            if (data.ingredients && !Array.isArray(data.ingredients)) {
              data.ingredients = String(data.ingredients).split(',').map(item => item.trim())
            }
            
            // 处理instructions，如果不存在或不是数组，创建一个默认的说明
            if (!data.instructions || !Array.isArray(data.instructions)) {
              // 如果有strInstructions字段（MealDB API格式），按段落分割
              if (data.strInstructions) {
                data.instructions = data.strInstructions
                  .split(/\r?\n\r?\n/) // 按空行分段
                  .filter(para => para.trim().length > 0) // 过滤空段落
                  .map(para => para.trim());
              } else {
                // 创建默认说明
                data.instructions = [
                  language === "zh" 
                    ? "准备所有食材，将肉类腌制入味。" 
                    : "Prepare all ingredients and marinate the meat.",
                  language === "zh" 
                    ? "按照视频中的步骤烹饪食材。" 
                    : "Cook according to the steps shown in the video.",
                  language === "zh" 
                    ? "装盘并享用美食！" 
                    : "Plate and enjoy your meal!"
                ];
              }
            }
            
            return data;
          } catch (err: any) {
            if (retries < maxRetries && err.message && 
                (err.message.includes('Redis service is not available') || 
                 err.message.includes('Redis operation timed out'))) {
              retries++;
              const currentDelay = retryDelay * Math.pow(1.5, retries - 1);
              console.log(`Error occurred: ${err.message}. Retrying (${retries}/${maxRetries}) after ${currentDelay}ms...`);
              
              // 等待一段时间后重试
              await new Promise(resolve => setTimeout(resolve, currentDelay));
              return attemptFetch();
            }
            
            throw err;
          }
        };

        try {
          const data = await attemptFetch();
          
          if (data) {
            setRecipe(data);
            if (data.servings) {
              const numServings = parseInt(String(data.servings), 10)
              if (!isNaN(numServings) && numServings > 0) {
                setServings(numServings)
              }
            }
          }
        } catch (err: any) {
          console.error("Error fetching recipe details:", err)
          setError(err.message || "发生了意外错误，请稍后再试。")
        } finally {
          setIsLoading(false)
        }
      }

      fetchRecipeDetails()
    } else {
      setError("菜谱ID缺失。")
      setIsLoading(false)
    }
  }, [recipeId, language])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-[#b94a2c] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg dark:text-white">Loading recipe details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg max-w-md mx-auto">
          <h3 className="text-red-600 dark:text-red-400 font-medium text-lg mb-2">错误</h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-[#b94a2c] hover:bg-[#a03f25] text-white"
          >
            重试
          </Button>
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Recipe not found or no ID provided.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Recipe Header */}
      <div className="bg-white border-b dark:bg-gray-800 dark:border-gray-800">
        <div className="container py-10 px-6 md:px-10 lg:px-16 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-10 items-start">
            {/* Recipe Title and Description */}
            <div className="flex-1 max-w-2xl">
              <h1 className="text-4xl font-bold mb-4 dark:text-white">{recipe.strMeal}</h1>
              {typeof recipe.strCategory !== 'object' && typeof recipe.strArea !== 'object' && (
              <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg leading-relaxed">
                  {typeof recipe.strCategory !== 'object' ? recipe.strCategory : ''} • {typeof recipe.strArea !== 'object' ? recipe.strArea : ''} • {typeof recipe.mealStyle !== 'object' ? recipe.mealStyle : ''}
              </p>
              )}

              {/* Recipe Meta Info */}
              <div className="flex flex-wrap gap-4 mb-8">
                {recipe.time && (
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full">
                  <Clock className="h-4 w-4 text-[#b94a2c] dark:text-[#ff6b47]" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {typeof recipe.time === 'number' 
                        ? `${recipe.time} ${language === "zh" ? "分钟" : "min"}` 
                        : recipe.time}
                    </span>
                </div>
                )}
                {recipe.servings && (
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full">
                  <Users className="h-4 w-4 text-[#b94a2c] dark:text-[#ff6b47]" />
                    <span className="text-gray-700 dark:text-gray-300">{servings}</span>
                </div>
                )}
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full">
                  <ChefHat className="h-4 w-4 text-[#b94a2c] dark:text-[#ff6b47]" />
                  <span className="text-gray-700 dark:text-gray-300">{language === "zh" ? "难度" : "Difficulty"}: {recipe.difficulty ? (language === "zh" ? 
                    (recipe.difficulty.toLowerCase() === "easy" ? "简单" : 
                     recipe.difficulty.toLowerCase() === "medium" ? "中等" : 
                     recipe.difficulty.toLowerCase() === "hard" ? "困难" : recipe.difficulty) : 
                    recipe.difficulty) : ""}</span>
                </div>
                {recipe.Energy && (
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full">
                  <Flame className="h-4 w-4 text-[#b94a2c] dark:text-[#ff6b47]" />
                    <span className="text-gray-700 dark:text-gray-300">{t("recipe.calories")}: {recipe.Energy}</span>
                </div>
                )}
              </div>
            </div>

            {/* Video Preview */}
            <div className="w-full md:w-[450px] flex-shrink-0">
              <div className="sticky top-24">
                {recipe.strYoutube || recipe.strBilibili ? (
                  <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
                    {recipe.strYoutube ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${recipe.strYoutube.split('v=')[1]}`}
                        title={`${recipe.strMeal} Video Tutorial`}
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      ></iframe>
                    ) : recipe.strBilibili ? (
                      <iframe
                        src={`https://player.bilibili.com/player.html?bvid=${recipe.strBilibili.split('video/')[1]}&page=1&high_quality=1&danmaku=0&autoplay=0`}
                        title={`${recipe.strMeal} Video Tutorial`}
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        scrolling="no"
                        frameBorder="no"
                        sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts"
                      ></iframe>
                    ) : null}
                  </div>
                ) : (
                <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
                    {recipe.strMealThumb && (
                      <div className="relative w-full h-full min-h-[200px]">
                        <img 
                          src={getOptimizedImageUrl(recipe.strMealThumb, 400, 300)}
                          alt={recipe.strMeal} 
                          className="absolute inset-0 w-full h-full object-cover rounded-md"
                          onError={(e) => {
                            // 当图片加载失败时，使用本地占位图
                            const target = e.target as HTMLImageElement;
                            target.onerror = null; // 防止无限循环
                            target.src = "/placeholder.svg";
                          }}
                        />
                      </div>
                    )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button variant="outline" size="icon" className="rounded-full bg-white/80 hover:bg-white dark:bg-black/80 dark:hover:bg-black h-16 w-16">
                      <PlayCircle className="h-10 w-10 text-[#b94a2c] dark:text-[#ff6b47]" />
                    </Button>
                  </div>
                </div>
                )}
                <div className="mt-3 text-center text-sm text-gray-500 dark:text-gray-300">
                  {language === "zh" ? "点击观看视频教程" : "Click to watch the video tutorial"}
                </div>
              </div>
            </div>
          </div>
        </div>
                </div>
                
      {/* Video Summary */}
      <div className="py-8 bg-gray-50 dark:bg-black">
        <div className="container px-6 md:px-10 lg:px-16 max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="flex-1">
              <div className="bg-[#fff8f0] dark:bg-gray-800 p-6 md:p-8 rounded-lg border border-[#f8e3c5] dark:border-gray-700 shadow-sm h-full">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 dark:text-white">
                  <PlayCircle className="h-6 w-6 text-[#b94a2c] dark:text-[#ff6b47]" />
                    {t("video.videoSummary")}
                  </h3>
                <div className="flex flex-col md:flex-row gap-6">
                  {recipe.strMealThumb && (
                    <div className="relative w-full md:w-2/5 h-48 md:h-auto flex-shrink-0 rounded-md overflow-hidden">
                      <div className="w-full h-full" style={{ minHeight: "200px", position: "relative" }}>
                        <img 
                          src={getOptimizedImageUrl(recipe.strMealThumb, 400, 300)}
                          alt={recipe.strMeal} 
                          className="w-full h-full object-cover rounded-md"
                          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null; // 防止无限循环
                            target.src = "/placeholder.svg";
                          }}
                          loading="lazy"
                        />
                      </div>
                    </div>
                  )}
                  <div className="md:w-3/5">
                    <p className="text-gray-600 dark:text-gray-200 leading-relaxed">
                    {language === "zh" 
                      ? "这个视频展示了如何在家中制作完美的砖炉披萨。厨师展示了拉伸面团、均匀涂抹酱料以及在没有专用烤箱的情况下获得酥脆外皮的技巧。关键时间点：面团准备（0:45）、酱料涂抹（3:20）、配料摆放（5:15）和烘焙技巧（7:30）。"
                      : "This video demonstrates how to make a perfect brick oven pizza at home. The chef shows techniques for stretching dough, applying sauce evenly, and achieving a crispy crust without a specialized oven. Key timestamps: dough preparation (0:45), sauce application (3:20), topping arrangement (5:15), and baking techniques (7:30)."}
                  </p>
                    <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                      {language === "zh" 
                        ? "视频长度: 8分钟 • 由Gordon Ramsay提供"
                        : "Video length: 8 minutes • By Gordon Ramsay"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recipe Content */}
      <div className="py-12 bg-gray-50 dark:bg-black">
        <div className="container px-6 md:px-10 lg:px-16 max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Ingredients */}
            <div className="flex-1">
              <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg border dark:border-gray-800 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold dark:text-white">{t("video.ingredients")}</h2>
                </div>

                <div className="space-y-4">
                  {getIngredientsWithMeasures(recipe).map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div 
                        className={`w-5 h-5 border border-gray-300 dark:border-gray-500 rounded flex-shrink-0 cursor-pointer flex items-center justify-center ${checkedIngredients[index] ? 'bg-[#b94a2c] dark:bg-[#ff6b47] border-[#b94a2c] dark:border-[#ff6b47]' : ''}`}
                        onClick={() => toggle_ingredient(index)}
                      >
                        {checkedIngredients[index] && (
                          <svg className="w-3 h-3 text-white dark:text-black" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-gray-800 dark:text-white ${checkedIngredients[index] ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
                        {item.ingredient}
                      </span>
                      {item.measure && (
                        <span className={`text-gray-500 dark:text-gray-400 ${checkedIngredients[index] ? 'line-through' : ''}`}>
                          ({item.measure})
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex gap-4 flex-col">
                  <div className="text-sm text-gray-700 dark:text-gray-300 text-center">
                    {getIngredientsWithMeasures(recipe).length - Object.values(checkedIngredients).filter(Boolean).length} {language === "zh" ? "项待购买" : "items remaining"}
                  </div>
                  <Button 
                    className="w-full bg-[#b94a2c] hover:bg-[#9a3a22] text-white dark:bg-[#ff6b47] dark:hover:bg-[#ff5a33] dark:text-black font-medium"
                    onClick={() => {
                      // 这里可以添加函数来处理食材清单
                    }}
                  >
                    {language === "zh" ? "检查清单" : "Check List"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="flex-1">
              <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg border dark:border-gray-800 shadow-sm">
                <h2 className="text-2xl font-bold mb-6 dark:text-white">{language === "zh" ? "步骤说明" : "Instructions"}</h2>

                <div className="space-y-6">
                  {recipe.instructions?.map((instruction, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="w-8 h-8 bg-[#b94a2c] dark:bg-[#ff6b47] rounded-full flex items-center justify-center flex-shrink-0 text-white dark:text-black font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-700 dark:text-gray-200 leading-relaxed">{instruction}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 互动按钮区域 */}
                <div className="mt-8 flex flex-col md:flex-row gap-4">
                  <div className="flex gap-4 flex-grow">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-14 text-lg gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 15h6" /><path d="M8.5 11h7" /><path d="M9 7h6" /></svg>
                        <span className="ml-2">{language === "zh" ? "评论" : "Reviews"}</span>
                        <span className="ml-auto text-lg">62</span>
                       </div>
                    </Button>
                    <Button 
                      variant="outline" 
                      className={`flex-1 h-14 text-lg gap-2 ${hasMade 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 dark:bg-blue-600 dark:text-white dark:border-blue-600 dark:hover:bg-blue-700'
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                      }`}
                      onClick={() => {
                        if (hasMade) {
                          setMadeCounts(prev => prev - 1);
                        } else {
                          setMadeCounts(prev => prev + 1);
                        }
                        setHasMade(!hasMade);
                      }}
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={hasMade ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" /><path d="M7 7h.01" /></svg>
                        <span className="ml-2">{language === "zh" ? (hasMade ? "已完成" : "我做过了") : (hasMade ? "Done" : "I made this")}</span>
                        <span className="ml-auto text-lg">{madeCounts.toLocaleString()}</span>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* 圆形功能按钮 */}
                <div className="mt-4 flex justify-center gap-6">
                  <button 
                    className="w-14 h-14 rounded-full bg-white hover:bg-gray-50 border border-gray-200 flex items-center justify-center dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700 shadow-sm"
                    onClick={() => window.print()}
                    title={language === "zh" ? "打印食谱" : "Print recipe"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-gray-300"><polyline points="6 9 6 2 18 2 18 9"/><path d="M9 15h6" /><path d="M8.5 11h7" /><path d="M9 7h6" /></svg>
                  </button>
                  <button 
                    className={`w-14 h-14 rounded-full border ${isFavorite 
                      ? 'bg-red-50 hover:bg-red-100 text-red-500 border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-800/30' 
                      : 'bg-white hover:bg-gray-50 border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700'
                    } flex items-center justify-center transition-colors shadow-sm`}
                    onClick={() => setIsFavorite(!isFavorite)}
                    title={language === "zh" ? "收藏食谱" : "Save recipe"}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="22" 
                      height="22" 
                      viewBox="0 0 24 24" 
                      fill={isFavorite ? "currentColor" : "none"} 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className={isFavorite ? "text-red-500 dark:text-red-400" : "text-gray-600 dark:text-gray-300"}
                    >
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                    </svg>
                  </button>
                  <button 
                    className="w-14 h-14 rounded-full bg-white hover:bg-gray-50 border border-gray-200 flex items-center justify-center dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700 shadow-sm"
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(window.location.href);
                        
                        // 创建自定义toast提示而非使用alert
                        const toast = document.createElement('div');
                        toast.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center';
                        toast.style.maxWidth = '90%';
                        
                        // 添加图标
                        const checkIcon = document.createElement('span');
                        checkIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                        toast.appendChild(checkIcon);
                        
                        const text = document.createTextNode(language === "zh" ? "链接已复制！" : "Link copied to clipboard!");
                        toast.appendChild(text);
                        
                        document.body.appendChild(toast);
                        
                        // 2秒后移除提示
                        setTimeout(() => {
                          toast.classList.add('opacity-0');
                          toast.style.transition = 'opacity 0.5s ease';
                          setTimeout(() => document.body.removeChild(toast), 500);
                        }, 2000);
                      } catch (err) {
                        console.error('Failed to copy link:', err);
                      }
                    }}
                    title={language === "zh" ? "复制链接" : "Copy link"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-gray-300"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Nutrition Facts */}
          <div className="mt-12">
            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg border dark:border-gray-800 shadow-sm">
              <h2 className="text-2xl font-bold mb-6 dark:text-white">{t("video.nutritionInformation")}</h2>

              {/* 新的营养标签样式 */}
              <div className="max-w-md mx-auto border border-gray-800 dark:border-gray-300 p-4 dark:text-white">
                {/* 标题 */}
                <h3 className="text-4xl font-bold mb-2">Nutrition Facts</h3>
                <div className="border-b-2 border-black dark:border-gray-300 my-1"></div>
                
                {/* 份量信息 */}
                <div className="flex justify-between py-1">
                  <span className="text-lg">{servings} {language === "zh" ? "份" : "servings per container"}</span>
                  <span></span>
                </div>
                <div className="flex justify-between py-1 border-b-8 border-black dark:border-gray-300">
                  <span className="text-xl font-bold">{language === "zh" ? "每份重量" : "Serving size"}</span>
                  <span className="text-xl font-bold">({(() => {
                    // 获取Weight数据
                    const weightStr = String(recipe.Weight || "0");
                    
                    // 尝试匹配数字部分
                    const numMatch = weightStr.match(/(\d+)(?:\.\d+)?/);
                    if (!numMatch) return "0g";
                    const value = parseFloat(numMatch[1]);
                    
                    // 确保数字后面有g单位
                    return weightStr.toLowerCase().endsWith('g') ? weightStr : `${value}g`;
                  })()})</span>
                </div>

                {/* 卡路里 */}
                <div className="py-2">
                  <div className="text-sm">{language === "zh" ? "每份含量" : "Amount per serving"}</div>
                  <div className="flex justify-between items-center">
                    <span className="text-3xl font-bold">{language === "zh" ? "卡路里" : "Calories"}</span>
                    <span className="text-5xl font-bold">{
                      (() => {
                        // 首先尝试从NutritionPerServing中获取Energy数据
                        const energyStr = recipe.NutritionPerServing?.Energy || recipe.Energy;
                        if (!energyStr) return "0 cal";

                        // 尝试匹配括号内的卡路里值: "422 kJ (101 cal)" -> "101"
                        const calMatch = energyStr.match(/\(\s*(\d+)(?:\.\d+)?\s*(?:k?cal|kcal|calories)\s*\)/i);
                        if (calMatch && calMatch[1]) {
                          return `${calMatch[1]} cal`;
                        }

                        // 如果没有括号格式，尝试直接匹配数字+cal: "101 cal" -> "101"
                        const directMatch = energyStr.match(/(\d+)(?:\.\d+)?\s*(?:k?cal|kcal|calories)/i);
                        if (directMatch && directMatch[1]) {
                          return `${directMatch[1]} cal`;
                        }

                        // 如果上述都失败，尝试提取任何数字
                        const numMatch = energyStr.match(/(\d+)(?:\.\d+)?/);
                        if (numMatch && numMatch[1]) {
                          return `${numMatch[1]} cal`;
                        }

                        return "0 cal";
                      })()
                    }</span>
                  </div>
                </div>
                <div className="border-b-4 border-black dark:border-gray-300 my-1"></div>
                
                {/* 每日价值百分比 */}
                <div className="text-right text-sm py-1 border-b border-gray-300">
                  <span className="font-bold">% {language === "zh" ? "每日参考值" : "Daily Value*"}</span>
                </div>
                
                {/* 主要营养素 */}
                {/* 总脂肪 */}
                <div className="flex justify-between py-2 border-b border-gray-300">
                  <span className="font-bold">{language === "zh" ? "总脂肪" : "Total Fat"} {recipe.NutritionPerServing?.["Total Fat"] || recipe["Total Fat"] || "14.2g"}</span>
                  <span className="font-bold">{(() => {
                    const fat = recipe.NutritionPerServing?.["Total Fat"] || recipe["Total Fat"] || "14.2g";
                    // 提取数值，保留小数点
                    const match = String(fat).match(/(\d+\.?\d*)/);
                    if (!match) return "18.2%";
                    const value = parseFloat(match[1]);
                    
                    // 确保数字后面有g单位
                    return fat.toLowerCase().endsWith('g') ? fat : `${value}g`;
                  })()}</span>
                </div>
                
                {/* 饱和脂肪 - 缩进 */}
                <div className="flex justify-between py-1 border-b border-gray-300 pl-8">
                  <span>{language === "zh" ? "饱和脂肪" : "Saturated Fat"} {recipe.NutritionPerServing?.Saturated || recipe.Saturated || "2.0g"}</span>
                  <span>{(() => {
                    const satFat = recipe.NutritionPerServing?.Saturated || recipe.Saturated || "2.0g";
                    // 提取数值，保留小数点
                    const match = String(satFat).match(/(\d+\.?\d*)/);
                    if (!match) return "10.0%";
                    const satFatValue = parseFloat(match[1]);
                    
                    // 确保数字后面有g单位
                    return satFat.toLowerCase().endsWith('g') ? satFat : `${satFatValue}g`;
                  })()}</span>
                </div>
                
                {/* 胆固醇 */}
                <div className="flex justify-between py-2 border-b border-gray-300">
                  <span className="font-bold">{language === "zh" ? "胆固醇" : "Cholesterol"} {recipe.NutritionPerServing?.Cholesterol || "1.5mg"}</span>
                  <span>{(() => {
                    const chol = recipe.NutritionPerServing?.Cholesterol || "1.5mg";
                    // 提取数值，保留小数点
                    const match = String(chol).match(/(\d+\.?\d*)/);
                    if (!match) return "0.5%";
                    const cholValue = parseFloat(match[1]);
                    
                    // 确保数字后面有mg单位
                    return chol.toLowerCase().endsWith('mg') ? chol : `${cholValue}mg`;
                  })()}</span>
                </div>
                
                {/* 钠 */}
                <div className="flex justify-between py-2 border-b border-gray-300">
                  <span className="font-bold">{language === "zh" ? "钠" : "Sodium"} {recipe.NutritionPerServing?.Sodium || recipe.Sodium || "150.5mg"}</span>
                  <span>{(() => {
                    const sodium = recipe.NutritionPerServing?.Sodium || recipe.Sodium || "150.5mg";
                    // 提取数值，保留小数点
                    const match = String(sodium).match(/(\d+\.?\d*)/);
                    if (!match) return "6.5%";
                    const sodiumValue = parseFloat(match[1]);
                    
                    // 确保数字后面有mg单位
                    return sodium.toLowerCase().endsWith('mg') ? sodium : `${sodiumValue}mg`;
                  })()}</span>
                </div>
                
                {/* 总碳水化合物 */}
                <div className="flex justify-between py-2 border-b border-gray-300">
                  <span className="font-bold">{language === "zh" ? "总碳水化合物" : "Total Carbohydrate"} {recipe.NutritionPerServing?.["Carbohydrate Total"] || recipe["Carbohydrate Total"] || "1.8g"}</span>
                  <span className="font-bold">{(() => {
                    const carbs = recipe.NutritionPerServing?.["Carbohydrate Total"] || recipe["Carbohydrate Total"] || "1.8g";
                    // 提取数值，保留小数点
                    const match = String(carbs).match(/(\d+\.?\d*)/);
                    if (!match) return "0.7%";
                    const carbsValue = parseFloat(match[1]);
                    
                    // 确保数字后面有g单位
                    return carbs.toLowerCase().endsWith('g') ? carbs : `${carbsValue}g`;
                  })()}</span>
                </div>
                
                {/* 总糖 - 缩进 */}
                <div className="flex justify-between py-1 border-b border-gray-300 pl-8">
                  <span>{language === "zh" ? "总糖" : "Total Sugars"} {recipe.NutritionPerServing?.Sugars || recipe.Sugars || "1.0g"}</span>
                  <span></span>
                </div>

                {/* 蛋白质 */}
                <div className="flex justify-between py-2 border-b-8 border-black dark:border-gray-300">
                  <span className="font-bold">{language === "zh" ? "蛋白质" : "Protein"} {recipe.NutritionPerServing?.Protein || recipe.Protein || "1.0g"}</span>
                  <span>{(() => {
                    const protein = recipe.NutritionPerServing?.Protein || recipe.Protein || "1.0g";
                    // 提取数值，保留小数点
                    const match = String(protein).match(/(\d+\.?\d*)/);
                    if (!match) return "2.0%";
                    const proteinValue = parseFloat(match[1]);
                    
                    // 确保数字后面有g单位
                    return protein.toLowerCase().endsWith('g') ? protein : `${proteinValue}g`;
                  })()}</span>
                </div>
                
                {/* 维生素和矿物质 */}
                <div className="flex justify-between py-1 border-b border-gray-300">
                  <span>{language === "zh" ? "维生素D" : "Vitamin D"} {recipe.NutritionPerServing?.["Vitamin D"] || "0.1μg"}</span>
                  <span>{(() => {
                    const vitD = recipe.NutritionPerServing?.["Vitamin D"] || "0.1μg";
                    const match = String(vitD).match(/(\d+\.?\d*)/);
                    if (!match) return "0.5%";
                    const value = parseFloat(match[1]);
                    
                    // 参考值: 维生素D每日参考值为20μg
                    let percentage = 0;
                    // 检查单位并进行相应的转换
                    if (String(vitD).toLowerCase().includes("mg")) {
                      // 毫克转微克 (1mg = 1000μg)
                      percentage = (value * 1000) / 20;
                    } else {
                      // 默认单位为微克
                      percentage = value / 20;
                    }
                    
                    // 四舍五入到一位小数并显示
                    return percentage < 0.0005 ? "0.0%" : `${(percentage * 100).toFixed(1)}%`;
                  })()}</span>
                </div>
                
                <div className="flex justify-between py-1 border-b border-gray-300">
                  <span>{language === "zh" ? "钙" : "Calcium"} {recipe.NutritionPerServing?.Calcium || "19.1mg"}</span>
                  <span>{(() => {
                    const calcium = recipe.NutritionPerServing?.Calcium || "19.1mg";
                    const match = String(calcium).match(/(\d+\.?\d*)/);
                    if (!match) return "1.5%";
                    const value = parseFloat(match[1]);
                    
                    // 参考值: 钙每日参考值为1300mg
                    let percentage = 0;
                    // 检查单位并进行相应的转换
                    if (String(calcium).toLowerCase().includes("g")) {
                      // 克转毫克 (1g = 1000mg)
                      percentage = (value) / 1300;
                    } else {
                      // 默认单位为毫克
                      percentage = value / 1300;
                    }
                    
                    // 四舍五入到一位小数并显示
                    return `${(percentage * 100).toFixed(1)}%`;
                  })()}</span>
                </div>
                
                <div className="flex justify-between py-1 border-b border-gray-300">
                  <span>{language === "zh" ? "铁" : "Iron"} {recipe.NutritionPerServing?.Iron || "0.1mg"}</span>
                  <span>{(() => {
                    const iron = recipe.NutritionPerServing?.Iron || "0.1mg";
                    const match = String(iron).match(/(\d+\.?\d*)/);
                    if (!match) return "0.6%";
                    const value = parseFloat(match[1]);
                    
                    // 参考值: 铁每日参考值为18mg
                    let percentage = 0;
                    // 检查单位并进行相应的转换
                    if (String(iron).toLowerCase().includes("g")) {
                      // 克转毫克 (1g = 1000mg)
                      percentage = (value) / 18;
                    } else {
                      // 默认单位为毫克
                      percentage = value / 18;
                    }
                    
                    // 四舍五入到一位小数并显示
                    return `${(percentage * 100).toFixed(1)}%`;
                  })()}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-gray-300">
                  <span>{language === "zh" ? "钾" : "Potassium"} {recipe.NutritionPerServing?.Potassium || "88.0mg"}</span>
                  <span>{(() => {
                    const potassium = recipe.NutritionPerServing?.Potassium || "88.0mg";
                    const match = String(potassium).match(/(\d+\.?\d*)/);
                    if (!match) return "1.9%";
                    const value = parseFloat(match[1]);
                    
                    // 参考值: 钾每日参考值为4700mg
                    let percentage = 0;
                    // 检查单位并进行相应的转换
                    if (String(potassium).toLowerCase().includes("g")) {
                      // 克转毫克 (1g = 1000mg)
                      percentage = (value) / 4700;
                    } else {
                      // 默认单位为毫克
                      percentage = value / 4700;
                    }
                    
                    // 四舍五入到一位小数并显示
                    return `${(percentage * 100).toFixed(1)}%`;
                  })()}</span>
                </div>
                
                {/* 注释 */}
                <div className="text-xs mt-4">
                  <p>* {language === "zh" 
                      ? "每日参考值百分比告诉您食品中的营养成分对每日饮食的贡献程度。每天2,000卡路里被用作一般营养建议。"
                      : "The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
