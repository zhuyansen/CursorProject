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
  
  // 营养信息
  Energy?: string
  Protein?: string
  "Total Fat"?: string
  Saturated?: string
  "Carbohydrate Total"?: string
  Sugars?: string
  Sodium?: string
  
  // 食材和步骤
  ingredients?: string[]
  instructions?: string[]
  strInstructions?: string  // 添加 MealDB API 格式的说明字段
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

        // 对于S3 URL，直接使用本地占位图
        const placeholderUrl = "/placeholder.svg";
        imageCache.current.set(cacheKey, placeholderUrl);
        return placeholderUrl;
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
          <p className="text-lg dark:text-white">正在加载菜谱详情...</p>
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
              {recipe.strCategory && recipe.strArea && (
                <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg leading-relaxed">
                  {recipe.strCategory} • {recipe.strArea} • {recipe.mealStyle}
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
                  <span className="text-gray-700 dark:text-gray-300">{t("recipe.difficulty")}: {t(`recipe.difficulty.${recipe.difficulty?.toLowerCase() || ''}`)}</span>
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
                        border="0"
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
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold dark:text-white">{t("video.ingredients")}</h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
                      onClick={() => setServings(Math.max(1, servings - 1))}
                    >
                      -
                    </Button>
                    <span className="mx-2 min-w-8 text-center dark:text-white">{servings}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
                      onClick={() => setServings(servings + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {recipe.ingredients && Array.isArray(recipe.ingredients) ? (
                    recipe.ingredients.map((ingredient, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-5 h-5 border border-gray-300 dark:border-gray-500 rounded flex-shrink-0"></div>
                        <span className="text-gray-800 dark:text-white">{ingredient}</span>
                      </div>
                    ))
                  ) : recipe.ingredients ? (
                    // 如果ingredients不是数组但存在，显示为单个项目
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border border-gray-300 dark:border-gray-500 rounded flex-shrink-0"></div>
                      <span className="text-gray-800 dark:text-white">{String(recipe.ingredients)}</span>
                    </div>
                  ) : null}
                </div>

                <Button className="mt-8 w-full bg-[#b94a2c] hover:bg-[#9a3a22] text-white dark:bg-[#ff6b47] dark:hover:bg-[#ff5a33] dark:text-black font-medium">
                  {language === "zh" ? "添加所有到购物清单" : "Add All to Shopping List"}
                </Button>
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
              </div>
            </div>
          </div>

          {/* Nutrition Facts */}
          <div className="mt-12">
            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg border dark:border-gray-800 shadow-sm">
              <h2 className="text-2xl font-bold mb-6 dark:text-white">{t("video.nutritionInformation")}</h2>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                <div className="text-3xl font-bold mb-2 dark:text-white">{recipe.Energy}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {language === "zh" ? "每份卡路里" : "calories per serving"}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between dark:text-white">
                  <span>{language === "zh" ? "总脂肪" : "Total Fat"}</span>
                  <span>{recipe["Total Fat"]}</span>
                </div>
                <div className="flex justify-between pl-6 text-sm text-gray-600 dark:text-gray-300">
                  <span>{language === "zh" ? "饱和脂肪" : "Saturated Fat"}</span>
                  <span>{recipe.Saturated}</span>
                </div>
                <div className="flex justify-between dark:text-white">
                  <span>{language === "zh" ? "总碳水化合物" : "Total Carbohydrates"}</span>
                  <span>{recipe["Carbohydrate Total"]}</span>
                </div>
                <div className="flex justify-between pl-6 text-sm text-gray-600 dark:text-gray-300">
                  <span>{language === "zh" ? "膳食纤维" : "Dietary Fiber"}</span>
                  <span>{recipe.fiber}</span>
                </div>
                <div className="flex justify-between pl-6 text-sm text-gray-600 dark:text-gray-300">
                  <span>{language === "zh" ? "糖分" : "Sugars"}</span>
                  <span>{recipe.Sugars}</span>
                </div>
                <div className="flex justify-between dark:text-white">
                  <span>{language === "zh" ? "蛋白质" : "Protein"}</span>
                  <span>{recipe.Protein}</span>
                </div>
                <div className="flex justify-between dark:text-white">
                  <span>{language === "zh" ? "钠" : "Sodium"}</span>
                  <span>{recipe.Sodium}</span>
                </div>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-5 italic">
                {language === "zh" 
                  ? "* 每日参考值基于2,000卡路里饮食。根据您的卡路里需求，您的每日值可能更高或更低。"
                  : "* Percent Daily Values are based on a 2,000 calorie diet. Your daily values may be higher or lower depending on your calorie needs."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Related Recipes */}
      <div className="bg-gray-50 dark:bg-black py-12 border-t dark:border-gray-800">
        <div className="container px-6 md:px-10 lg:px-16 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 dark:text-white">
            {language === "zh" ? "您可能还喜欢" : "You Might Also Like"}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((item) => (
              <Link href={`/recipe-details?id=${item}`} key={item} className="group">
                <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border hover:shadow-md transition-shadow dark:border-gray-800">
                  <div className="relative h-32 md:h-40">
                    <Image
                      src={`/placeholder.svg?height=200&width=300`}
                      alt={`Related Recipe ${item}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3 md:p-4">
                    <h3 className="font-medium text-sm md:text-base group-hover:text-[#b94a2c] dark:text-white dark:group-hover:text-[#ff6b47] transition-colors">
                      {language === "zh" 
                        ? (item === 1
                            ? "砖层千层面"
                            : item === 2
                              ? "砖屋汉堡"
                              : item === 3
                                ? "砖路墨西哥卷饼"
                                : "砖基沙拉")
                        : (item === 1
                            ? "Brick Layer Lasagna"
                            : item === 2
                              ? "Brick House Burger"
                              : item === 3
                                ? "Brick Road Tacos"
                                : "Brick Foundation Salad")}
                    </h3>
                    <div className="flex items-center text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-2">
                      <Clock className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                      <span>{item * 10 + 10} {language === "zh" ? "分钟" : "min"}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
