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
  generatedBy?: string
  videoSummary?: string
  
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
  steps?: any[] // 添加steps字段，用于存储videotorecipe解析的步骤
  
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
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null)

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

  // 添加getIngredientEmoji函数
  const getIngredientEmoji = (name: string): string => {
    // 基于食材名称返回表情符号
    const normalizedName = name.toLowerCase().trim();
    
    // 蔬菜
    if (normalizedName.includes('potato') || normalizedName.includes('土豆')) return '🥔';
    if (normalizedName.includes('tomato') || normalizedName.includes('番茄') || normalizedName.includes('西红柿')) return '🍅';
    if (normalizedName.includes('carrot') || normalizedName.includes('胡萝卜')) return '🥕';
    if (normalizedName.includes('corn') || normalizedName.includes('玉米')) return '🌽';
    if (normalizedName.includes('broccoli') || normalizedName.includes('西兰花') || normalizedName.includes('花椰菜')) return '🥦';
    if (normalizedName.includes('cucumber') || normalizedName.includes('黄瓜')) return '🥒';
    if (normalizedName.includes('pepper') || normalizedName.includes('辣椒')) return '🌶️';
    if (normalizedName.includes('garlic') || normalizedName.includes('大蒜')) return '🧄';
    if (normalizedName.includes('onion') || normalizedName.includes('洋葱')) return '🧅';
    if (normalizedName.includes('lettuce') || normalizedName.includes('生菜') || normalizedName.includes('莴苣')) return '🥬';
    if (normalizedName.includes('avocado') || normalizedName.includes('牛油果')) return '🥑';
    
    // 水果
    if (normalizedName.includes('apple') || normalizedName.includes('苹果')) return '🍎';
    if (normalizedName.includes('orange') || normalizedName.includes('橙子')) return '🍊';
    if (normalizedName.includes('banana') || normalizedName.includes('香蕉')) return '🍌';
    if (normalizedName.includes('grape') || normalizedName.includes('葡萄')) return '🍇';
    if (normalizedName.includes('pineapple') || normalizedName.includes('菠萝')) return '🍍';
    if (normalizedName.includes('kiwi') || normalizedName.includes('猕猴桃')) return '🥝';
    if (normalizedName.includes('lemon') || normalizedName.includes('柠檬')) return '🍋';
    if (normalizedName.includes('strawberry') || normalizedName.includes('草莓')) return '🍓';
    if (normalizedName.includes('coconut') || normalizedName.includes('椰子')) return '🥥';
    
    // 肉类
    if (normalizedName.includes('meat') || normalizedName.includes('beef') || normalizedName.includes('肉') || normalizedName.includes('牛肉')) return '🥩';
    if (normalizedName.includes('chicken') || normalizedName.includes('鸡肉')) return '🍗';
    if (normalizedName.includes('turkey') || normalizedName.includes('火鸡')) return '🦃';
    if (normalizedName.includes('bacon') || normalizedName.includes('培根')) return '🥓';
    
    // 海鲜
    if (normalizedName.includes('fish') || normalizedName.includes('鱼')) return '🐟';
    if (normalizedName.includes('shrimp') || normalizedName.includes('prawn') || normalizedName.includes('虾')) return '🦐';
    if (normalizedName.includes('crab') || normalizedName.includes('蟹')) return '🦀';
    if (normalizedName.includes('squid') || normalizedName.includes('octopus') || normalizedName.includes('鱿鱼') || normalizedName.includes('章鱼')) return '🦑';
    
    // 主食
    if (normalizedName.includes('rice') || normalizedName.includes('米饭') || normalizedName.includes('大米')) return '🍚';
    if (normalizedName.includes('bread') || normalizedName.includes('面包')) return '🍞';
    if (normalizedName.includes('noodle') || normalizedName.includes('pasta') || normalizedName.includes('spaghetti') || normalizedName.includes('面条')) return '🍜';
    if (normalizedName.includes('baguette') || normalizedName.includes('法棍')) return '🥖';
    if (normalizedName.includes('pancake') || normalizedName.includes('薄饼')) return '🥞';
    if (normalizedName.includes('dumpling') || normalizedName.includes('饺子')) return '🥟';
    
    // 调味料
    if (normalizedName.includes('salt') || normalizedName.includes('盐')) return '🧂';
    if (normalizedName.includes('sugar') || normalizedName.includes('糖')) return '🍬';
    if (normalizedName.includes('honey') || normalizedName.includes('蜂蜜')) return '🍯';
    
    // 饮料
    if (normalizedName.includes('tea') || normalizedName.includes('茶')) return '🍵';
    if (normalizedName.includes('coffee') || normalizedName.includes('咖啡')) return '☕';
    if (normalizedName.includes('milk') || normalizedName.includes('牛奶')) return '🥛';
    if (normalizedName.includes('wine') || normalizedName.includes('葡萄酒')) return '🍷';
    if (normalizedName.includes('beer') || normalizedName.includes('啤酒')) return '🍺';
    if (normalizedName.includes('water') || normalizedName.includes('水')) return '💧';
    
    // 坚果
    if (normalizedName.includes('peanut') || normalizedName.includes('花生')) return '🥜';
    
    // 蛋奶制品
    if (normalizedName.includes('egg') || normalizedName.includes('蛋')) return '🥚';
    if (normalizedName.includes('cheese') || normalizedName.includes('奶酪') || normalizedName.includes('芝士')) return '🧀';
    
    // 甜点
    if (normalizedName.includes('cake') || normalizedName.includes('蛋糕')) return '🍰';
    if (normalizedName.includes('cookie') || normalizedName.includes('饼干')) return '🍪';
    if (normalizedName.includes('chocolate') || normalizedName.includes('巧克力')) return '🍫';
    if (normalizedName.includes('ice cream') || normalizedName.includes('冰淇淋')) return '🍦';
    
    // 其他
    if (normalizedName.includes('butter') || normalizedName.includes('黄油')) return '🧈';
    if (normalizedName.includes('oil') || normalizedName.includes('油')) return '🛢️';
    if (normalizedName.includes('sauce') || normalizedName.includes('酱')) return '🧴';
    
    // 默认情况
    return '🍲';
  }

  // 添加getIngredientBgStyle函数
  const getIngredientBgStyle = (name: string, idx: number): {bg: string, from: string, to: string} => {
    // 归一化食材名称
    const normalizedName = name.toLowerCase().trim();
    
    // 基于食材类别的样式映射
    const styleMap: {[key: string]: {bg: string, from: string, to: string}} = {
      // 蔬菜类: 绿色调
      vegetable: {
        bg: "bg-green-50 dark:bg-green-900/20",
        from: "from-green-200 dark:from-green-800",
        to: "to-green-100 dark:to-green-900"
      },
      // 肉类: 红色调
      meat: {
        bg: "bg-red-50 dark:bg-red-900/20",
        from: "from-red-200 dark:from-red-800",
        to: "to-red-100 dark:to-red-900"
      },
      // 海鲜类: 蓝色调
      seafood: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        from: "from-blue-200 dark:from-blue-800",
        to: "to-blue-100 dark:to-blue-900"
      },
      // 谷物类: 黄色调
      grain: {
        bg: "bg-yellow-50 dark:bg-yellow-900/20",
        from: "from-yellow-200 dark:from-yellow-800",
        to: "to-yellow-100 dark:to-yellow-900"
      },
      // 水果类: 橙色调
      fruit: {
        bg: "bg-orange-50 dark:bg-orange-900/20",
        from: "from-orange-200 dark:from-orange-800",
        to: "to-orange-100 dark:to-orange-900"
      },
      // 调味料: 紫色调
      spice: {
        bg: "bg-purple-50 dark:bg-purple-900/20",
        from: "from-purple-200 dark:from-purple-800",
        to: "to-purple-100 dark:to-purple-900"
      },
      // 奶制品: 青色调
      dairy: {
        bg: "bg-cyan-50 dark:bg-cyan-900/20",
        from: "from-cyan-200 dark:from-cyan-800",
        to: "to-cyan-100 dark:to-cyan-900"
      },
      // 液体: 蓝绿色调
      liquid: {
        bg: "bg-teal-50 dark:bg-teal-900/20",
        from: "from-teal-200 dark:from-teal-800",
        to: "to-teal-100 dark:to-teal-900"
      },
      // 默认: 灰色调
      default: {
        bg: "bg-gray-50 dark:bg-gray-900/20",
        from: "from-gray-200 dark:from-gray-800",
        to: "to-gray-100 dark:to-gray-900"
      }
    };
    
    // 根据食材名称选择样式
    // 蔬菜
    if (/potato|tomato|carrot|corn|broccoli|cucumber|pepper|garlic|onion|lettuce|avocado|eggplant|radish|pumpkin|cabbage|spinach|菜|蔬菜|土豆|番茄|西红柿|胡萝卜|玉米|西兰花|黄瓜|辣椒|大蒜|洋葱|生菜|牛油果|茄子|白萝卜|南瓜|卷心菜|菠菜/.test(normalizedName)) {
      return styleMap.vegetable;
    }
    
    // 肉类
    if (/beef|pork|chicken|meat|lamb|duck|turkey|bacon|sausage|肉|牛肉|猪肉|鸡肉|羊肉|鸭肉|火鸡|培根|香肠/.test(normalizedName)) {
      return styleMap.meat;
    }
    
    // 海鲜
    if (/fish|shrimp|prawn|crab|squid|octopus|lobster|clam|mussel|oyster|鱼|虾|蟹|鱿鱼|章鱼|龙虾|蛤蜊|贻贝|牡蛎/.test(normalizedName)) {
      return styleMap.seafood;
    }
    
    // 谷物
    if (/rice|bread|noodle|pasta|spaghetti|flour|oat|corn|米饭|面包|面条|意面|面粉|燕麦|玉米/.test(normalizedName)) {
      return styleMap.grain;
    }
    
    // 水果
    if (/apple|orange|banana|grape|pineapple|kiwi|lemon|strawberry|berry|cherry|peach|watermelon|fruit|苹果|橙子|香蕉|葡萄|菠萝|猕猴桃|柠檬|草莓|浆果|樱桃|桃子|西瓜|水果/.test(normalizedName)) {
      return styleMap.fruit;
    }
    
    // 调味料
    if (/salt|pepper|sugar|honey|spice|herb|vanilla|cinnamon|ginger|garlic|vinegar|sauce|盐|胡椒|糖|蜂蜜|香料|香草|香草精|肉桂|姜|蒜|醋|酱/.test(normalizedName)) {
      return styleMap.spice;
    }
    
    // 奶制品
    if (/milk|cheese|cream|butter|yogurt|牛奶|奶酪|芝士|奶油|黄油|酸奶/.test(normalizedName)) {
      return styleMap.dairy;
    }
    
    // 液体
    if (/water|oil|juice|wine|beer|milk|vinegar|水|油|果汁|葡萄酒|啤酒|牛奶|醋/.test(normalizedName)) {
      return styleMap.liquid;
    }
    
    // 默认样式，根据索引变化颜色
    const styles = Object.values(styleMap);
    return styles[idx % styles.length];
  }

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
            if (!data.steps || !Array.isArray(data.steps)) {
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

  useEffect(() => {
    // 添加打印样式
    const addPrintStyles = () => {
      // 检查是否已存在打印样式表
      let printStyleSheet = document.getElementById('recipe-print-styles');
      
      if (!printStyleSheet) {
        // 创建新的样式表元素，并使用HTMLStyleElement类型断言
        const styleElement = document.createElement('style') as HTMLStyleElement;
        styleElement.id = 'recipe-print-styles';
        styleElement.media = 'print';
        
        // 添加打印样式规则
        styleElement.innerHTML = `
          /* 基本页面设置 */
          @page {
            size: A4;
            margin: 1.5cm;
          }
          
          /* 隐藏不需要打印的元素 */
          .bg-[#fff8f0], 
          .py-8.bg-gray-50,
          .bg-white.border-b, 
          button,
          .sticky {
            display: none !important;
          }
          
          /* 确保内容在页面中显示完整 */
          body, html {
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            font-size: 12pt !important;
            color: black !important;
          }
          
          /* 重置容器样式 */
          .container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* 打印布局调整 - 修复重叠问题 */
          .print-two-columns {
            display: block !important;
            clear: both !important;
          }
          
          /* 保持材料和步骤明确分开 */
          .print-column {
            width: 100% !important;
            margin-bottom: 20px !important;
            page-break-inside: avoid !important;
            clear: both !important;
          }
          
          /* 食材部分样式调整 */
          .ingredients-section {
            width: 100% !important;
            page-break-after: always !important; 
            margin-bottom: 30px !important;
            display: block !important;
          }
          
          /* 内容区域样式 */
          .bg-white.dark\\:bg-gray-800 {
            background: white !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin-bottom: 30px !important;
            page-break-inside: avoid !important;
          }
          
          /* 标题样式 */
          h1, h2, h3 {
            page-break-after: avoid !important;
            margin-top: 20px !important;
          }
          
          /* 食材列表调整 */
          .space-y-4 {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
            margin-bottom: 30px !important;
          }
          
          .space-y-4 > div {
            display: flex !important;
            align-items: center !important;
            border-bottom: 1px solid #eee !important;
            padding: 8px 0 !important;
            margin-bottom: 6px !important;
          }
          
          .space-y-4 > div > div.flex-1 {
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            width: 90% !important;
          }
          
          .space-y-4 > div > div.flex-1 > span:first-child {
            max-width: 60% !important;
            display: inline-block !important;
            overflow: visible !important;
            white-space: normal !important;
          }
          
          .space-y-4 > div > div.flex-1 > span:last-child {
            max-width: 35% !important;
            display: inline-block !important;
            text-align: right !important;
          }
          
          /* 步骤和食材列表 */
          .space-y-6 {
            display: block !important;
            page-break-before: always !important;
            margin-top: 30px !important;
          }
          
          /* 步骤项 */
          .mb-6 {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-bottom: 20px !important;
            clear: both !important;
          }
          
          /* 步骤食材图标调整 */
          .flex.flex-wrap.gap-3 {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 12px !important;
            width: 100% !important;
            margin: 15px 0 !important;
            page-break-inside: avoid !important;
          }
          
          .flex.flex-wrap.gap-3 > div {
            width: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            padding: 8px !important;
            box-sizing: border-box !important;
            break-inside: avoid !important;
          }
          
          /* 食材名称和图标调整 */
          .line-clamp-2 {
            display: block !important;
            overflow: visible !important;
            text-overflow: clip !important;
            white-space: normal !important;
            max-width: 100% !important;
            width: 100% !important;
            text-align: center !important;
            font-size: 10pt !important;
          }
          
          /* 固定可能产生错位的图标和文字 */
          .w-10.h-10, .lg\\:w-14.lg\\:h-14 {
            width: 44px !important;
            height: 44px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            margin: 0 auto 8px auto !important;
          }
          
          .text-2xl, .lg\\:text-3xl {
            font-size: 18px !important;
            line-height: 1 !important;
          }
          
          /* 指令说明步骤调整 */
          .flex.gap-4.mb-6 {
            display: block !important;
            margin-bottom: 15px !important;
            padding-bottom: 10px !important;
            border-bottom: 1px solid #ddd !important;
          }
          
          .flex.gap-4.mb-6 > div:first-child {
            float: left !important;
            margin-right: 10px !important;
            margin-top: 3px !important;
          }
          
          .flex.gap-4.mb-6 > div.flex-1 {
            display: block !important;
            overflow: auto !important;
          }
          
          /* 确保每个步骤不会在页面间分隔 */
          #step-0, #step-1, #step-2, #step-3, #step-4, #step-5, #step-6, #step-7, #step-8, #step-9 {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-bottom: 25px !important;
            border: 1px solid #ddd !important;
            padding: 15px !important;
            clear: both !important;
          }
          
          /* 保留部分圆角和边框 */
          .rounded-lg, .rounded-md, .rounded-full {
            border-radius: 2px !important;
          }
          
          /* 改进打印标题 */
          .recipe-print-title {
            display: block !important;
            font-size: 24pt !important;
            font-weight: bold !important;
            text-align: center !important;
            margin: 20px 0 !important;
            border-bottom: 1px solid #000 !important;
            padding-bottom: 10px !important;
          }
          
          /* 步骤标题调整 */
          .flex.justify-between.items-center {
            display: flex !important;
            justify-content: space-between !important;
            margin-bottom: 10px !important;
            border-bottom: 1px solid #ddd !important;
            padding-bottom: 6px !important;
          }
          
          /* 打印时隐藏时间控制按钮 */
          .timer-controls {
            display: none !important;
          }
          
          /* 确保分栏显示不重叠 */
          .lg\\:w-1\\/3, .lg\\:w-2\\/3 {
            display: block !important;
            width: 100% !important;
            clear: both !important;
          }
          
          /* 调整打印时食材和步骤显示顺序 */
          .container.py-12 > div {
            display: flex !important;
            flex-direction: column !important;
          }
          
          /* 确保打印时食材区域在顶部 */
          .container.py-12 > div > div:first-child {
            order: 1 !important;
          }
          
          /* 确保打印时步骤区域在食材之后 */
          .container.py-12 > div > div:last-child {
            order: 2 !important;
            page-break-before: always !important;
          }
          
          /* 增加食材列表区域 */
          .ingredients-section .bg-white {
            padding: 15px !important;
            margin-bottom: 20px !important;
          }
          
          /* 添加食材部分结束标记 */
          .ingredients-section::after {
            content: "" !important;
            display: block !important;
            page-break-after: always !important;
            height: 1px !important;
          }
        `;
        
        // 将样式表添加到文档头
        document.head.appendChild(styleElement);
        printStyleSheet = styleElement;
      }
    };
    
    // 添加打印样式
    addPrintStyles();
    
    // 清理函数
    return () => {
      const printStyleSheet = document.getElementById('recipe-print-styles');
      if (printStyleSheet) {
        printStyleSheet.remove();
      }
    };
  }, []);

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
      {/* 打印标题 - 仅在打印时显示 */}
      <div style={{ display: 'none' }} className="recipe-print-title">
        {recipe.strMeal}
      </div>
      
      {/* Recipe Header */}
      <div className="bg-white border-b dark:bg-gray-800 dark:border-gray-800">
        <div className="container py-10 px-6 md:px-10 lg:px-16 max-w-7xl mx-auto">
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
        <div className="container px-6 md:px-10 lg:px-16 max-w-7xl mx-auto">
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
                      ? (recipe.videoSummary || "这个视频展示了如何在家中制作完美的砖炉披萨。厨师展示了拉伸面团、均匀涂抹酱料以及在没有专用烤箱的情况下获得酥脆外皮的技巧。关键时间点：面团准备（0:45）、酱料涂抹（3:20）、配料摆放（5:15）和烘焙技巧（7:30）。") 
                      : (recipe.videoSummary || "This video demonstrates how to make a perfect brick oven pizza at home. The chef shows techniques for stretching dough, applying sauce evenly, and achieving a crispy crust without a specialized oven. Key timestamps: dough preparation (0:45), sauce application (3:20), topping arrangement (5:15), and baking techniques (7:30).")}
                  </p>
                    <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                      {language === "zh" 
                        ? `生成者: ${recipe.generatedBy || "Gordon Ramsay"}`
                        : `Generated by: ${recipe.generatedBy || "Gordon Ramsay"}`}
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
        <div className="container px-6 md:px-10 lg:px-16 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 print-two-columns">
            {/* Ingredients - 减小宽度并使其悬浮 */}
            <div className="lg:w-1/3 flex-shrink-0 print-column ingredients-section">
              <div className="sticky top-24">
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
                        <div className="flex flex-1 flex-wrap items-center justify-between">
                          <span className={`text-gray-800 dark:text-white ${checkedIngredients[index] ? 'line-through text-gray-500 dark:text-gray-400' : ''} max-w-[60%]`}>
                        {item.ingredient}
                      </span>
                      {item.measure && (
                            <span className={`text-gray-500 dark:text-gray-400 ${checkedIngredients[index] ? 'line-through' : ''} text-right max-w-[35%]`}>
                              {item.measure}
                        </span>
                      )}
                        </div>
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
            </div>

            {/* Instructions - 增加宽度 */}
            <div className="lg:w-2/3 flex-grow print-column">
              <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg border dark:border-gray-800 shadow-sm">
                <h2 className="text-2xl font-bold mb-6 dark:text-white">{language === "zh" ? "步骤说明" : "Instructions"}</h2>

                <div className="space-y-6 mb-8">
                  {recipe.steps && Array.isArray(recipe.steps) ? (
                    recipe.steps.map((step: any, index: number) => (
                      <div key={index} id={`step-${index}`} className={`mb-6 border-[1.5px] ${
                        activeStepIndex === index 
                          ? 'border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-gray-750 shadow-md' 
                          : 'border-orange-100 dark:border-gray-600'
                      } rounded-lg p-4 shadow-sm hover:shadow-md transition-all dark:bg-gray-800/80`}
                        style={{
                          boxShadow: activeStepIndex === index ? '0 0 8px rgba(237, 137, 54, 0.5)' : '',
                          borderWidth: activeStepIndex === index ? '2px' : '',
                          borderColor: activeStepIndex === index ? '#ed8936' : ''
                        }}>
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#b94a2c] dark:bg-[#ff6b47] rounded-full flex items-center justify-center text-white dark:text-black font-medium">
                        {index + 1}
                      </div>
                            <span className="font-medium text-base dark:text-white">
                              {step.title || `步骤 ${step.step_number || index + 1}`}
                            </span>
                      </div>
                          {step.time && (
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-[#b94a2c] dark:text-[#ff6b47]" />
                              <div className="flex gap-1 timer-controls">
                                <button 
                                  id={`start-${index}`}
                                  className="bg-[#b94a2c] text-white dark:bg-[#ff6b47] px-3 py-1 rounded-l-md text-xs hover:bg-[#a03f25] dark:hover:bg-[#e05a3a] transition-colors"
                                  onClick={(e) => {
                                    // 获取时间
                                    const timeInMinutes = parseInt(step.time) || 5;
                                    const timeInSeconds = timeInMinutes * 60;
                                    const startBtn = document.getElementById(`start-${index}`);
                                    const pauseBtn = document.getElementById(`pause-${index}`);
                                    const timerElement = document.getElementById(`timer-${index}`);
                                    
                                    if (!timerElement?.dataset.running || timerElement?.dataset.running === "false") {
                                      // 设置新的活动步骤（清除旧的高亮）
                                      setActiveStepIndex(index);
                                      
                                      // 设置状态为运行中
                                      timerElement!.dataset.running = "true";
                                      timerElement!.dataset.endTime = String(Date.now() + (parseInt(timerElement!.dataset.remaining || String(timeInSeconds)) * 1000));
                                      
                                      // 更新UI
                                      startBtn!.textContent = language === "zh" ? "继续" : "Resume";
                                      pauseBtn!.style.display = "block";
                                      
                                      // 创建通知
                                      if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
                                        const timeoutId = setTimeout(() => {
                                          new Notification(language === "zh" ? `步骤 ${index + 1} 完成` : `Step ${index + 1} Complete`, {
                                            body: language === "zh" 
                                              ? `${step.title || `步骤 ${index + 1}`} 已完成` 
                                              : `${step.title || `Step ${index + 1}`} is complete`,
                                            icon: "/favicon.ico"
                                          });
                                        }, parseInt(timerElement!.dataset.remaining || String(timeInSeconds)) * 1000);
                                        
                                        timerElement!.dataset.timeoutId = String(timeoutId);
                                      }
                                      
                                      // 显示倒计时
                                      if (timerElement) {
                                        const timerInterval = setInterval(() => {
                                          if (timerElement.dataset.running === "true") {
                                            const now = Date.now();
                                            const endTime = parseInt(timerElement.dataset.endTime || "0");
                                            const remainingMs = endTime - now;
                                            
                                            if (remainingMs <= 0) {
                                              clearInterval(parseInt(timerElement.dataset.intervalId || "0"));
                                              timerElement.textContent = language === "zh" ? "完成!" : "Done!";
                                              timerElement.classList.add("text-green-500");
                                              startBtn!.style.display = "none";
                                              pauseBtn!.style.display = "none";
                                              timerElement.dataset.running = "false";
                                              
                                              // 移除当前步骤的高亮
                                              setActiveStepIndex(null);
                                              
                                              // 如果有下一个步骤，自动开始下一个步骤
                                              const nextStepIndex = index + 1;
                                              setTimeout(() => {
                                                const nextStartBtn = document.getElementById(`start-${nextStepIndex}`);
                                                if (nextStartBtn) {
                                                  nextStartBtn.click();
                                                }
                                              }, 1000);
                                            } else {
                                              const remainingSecs = Math.ceil(remainingMs / 1000);
                                              timerElement.dataset.remaining = String(remainingSecs);
                                              const minutes = Math.floor(remainingSecs / 60);
                                              const seconds = remainingSecs % 60;
                                              timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
                                            }
                                          }
                                        }, 500);
                                        
                                        timerElement.dataset.intervalId = String(timerInterval);
                                      }
                                    } else if (timerElement?.dataset.running === "paused") {
                                      // 继续计时
                                      timerElement.dataset.running = "true";
                                      timerElement.dataset.endTime = String(Date.now() + (parseInt(timerElement.dataset.remaining || "0") * 1000));
                                      startBtn!.textContent = language === "zh" ? "继续" : "Resume";
                                      
                                      // 设置新的活动步骤
                                      setActiveStepIndex(index);
                                    }
                                  }}
                                >
                                  {language === "zh" ? "开始" : "Start"} {step.time}
                                </button>
                                <button 
                                  id={`pause-${index}`}
                                  className="bg-gray-500 text-white px-3 py-1 rounded-r-md text-xs hover:bg-gray-600 transition-colors hidden"
                      onClick={() => {
                                    const timerElement = document.getElementById(`timer-${index}`);
                                    if (timerElement?.dataset.running === "true") {
                                      // 暂停计时器
                                      timerElement.dataset.running = "paused";
                                      
                                      // 清除通知计时器
                                      if (timerElement.dataset.timeoutId) {
                                        clearTimeout(parseInt(timerElement.dataset.timeoutId));
                                      }
                                      
                                      // 更新UI
                                      const startBtn = document.getElementById(`start-${index}`);
                                      startBtn!.textContent = language === "zh" ? "继续" : "Resume";
                                    }
                                  }}
                                >
                                  {language === "zh" ? "暂停" : "Pause"}
                                </button>
                      </div>
                              <span 
                                id={`timer-${index}`} 
                                className="text-sm font-mono"
                                data-running="false"
                                data-remaining={parseInt(step.time || "5") * 60}
                              ></span>
                              {/* 添加打印时显示的时间文本 */}
                              <span className="hidden print:inline-block print:ml-2">
                                {step.time} {language === "zh" ? "分钟" : "mins"}
                              </span>
                  </div>
                          )}
                </div>

                        {/* 显示食材图标 */}
                        {step.ingredients && step.ingredients.length > 0 && (
                          <div className="flex flex-wrap gap-3 my-3 pb-3 border-b border-orange-100 dark:border-gray-700">
                            {step.ingredients.map((ingredient: any, idx: number) => {
                              const ingredientName = typeof ingredient === 'string' ? ingredient : ingredient.name || '';
                              
                              // 获取基于食材的样式
                              const { bg, from, to } = getIngredientBgStyle(ingredientName, idx);
                              
                              return (
                                <div key={idx} className={`flex flex-col items-center ${bg} p-2 rounded-lg shadow-sm hover:shadow-md transition-all border-[1.5px] border-gray-200 dark:border-gray-600`}>
                                  <div className={`w-10 h-10 lg:w-14 lg:h-14 bg-gradient-to-br ${from} ${to} rounded-full flex items-center justify-center mb-1 shadow-sm`}>
                                    <span className="text-2xl lg:text-3xl" role="img" aria-label={ingredientName}>
                                      {getIngredientEmoji(ingredientName)}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-center w-full">
                                    <span className="text-xs text-center font-medium text-gray-700 dark:text-gray-100 line-clamp-2 w-16 lg:w-20">{ingredientName}</span>
                                    {typeof ingredient !== 'string' && ingredient.quantity && (
                                      <span className="text-xs text-center text-gray-500 dark:text-gray-300 mt-1">{ingredient.quantity}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* 步骤说明 */}
                        <div className="text-gray-700 dark:text-gray-200 leading-relaxed">
                          {typeof step === 'string' ? (
                            <p>{step}</p>
                          ) : (
                            Array.isArray(step.instructions) ? (
                              <ul className="list-disc list-inside ml-4 mt-3 space-y-2">
                                {step.instructions.map((instruction: any, idx: number) => (
                                  <li key={idx} className="text-sm my-1 text-gray-700 dark:text-gray-200">
                                    {typeof instruction === 'string' ? instruction : instruction.text || ''}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p>{step.description || step.text || step.content || `步骤 ${index + 1}`}</p>
                            )
                          )}
                        </div>
                      </div>
                    ))
                  ) : recipe.instructions?.map((instruction, index) => (
                    <div key={index} className="flex gap-4 mb-6" id={`step-${index}`}>
                      <div className="w-8 h-8 bg-[#b94a2c] dark:bg-[#ff6b47] rounded-full flex items-center justify-center flex-shrink-0 text-white dark:text-black font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-700 dark:text-gray-200 leading-relaxed">{instruction}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 互动按钮区域 - 修改为居中对齐 */}
                <div className="flex justify-center gap-6 mt-8">
                  <button 
                    className="w-14 h-14 rounded-full bg-white hover:bg-gray-50 border border-gray-200 flex items-center justify-center dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700 shadow-sm"
                    onClick={() => window.print()}
                    title={language === "zh" ? "打印食谱" : "Print recipe"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-gray-300"><polyline points="6 9 6 2 18 2 18 9"/><path d="M9 15h6" /><path d="M8.5 11h7" /><path d="M9 7h6" /></svg>
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
              <div className="max-w-xl mx-auto border border-gray-800 dark:border-gray-300 p-4 dark:text-white">
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
                    
                    // 计算每日摄入百分比 - 脂肪每日参考值为78g
                    const percentage = (value / 78 * 100).toFixed(1);
                    
                    // 返回百分比
                    return `${percentage}%`;
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
                    
                    // 计算每日摄入百分比 - 饱和脂肪每日参考值为20g
                    const percentage = (satFatValue / 20 * 100).toFixed(1);
                    
                    // 返回百分比
                    return `${percentage}%`;
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
                    
                    // 计算每日摄入百分比 - 胆固醇每日参考值为300mg
                    const percentage = (cholValue / 300 * 100).toFixed(1);
                    
                    // 返回百分比
                    return `${percentage}%`;
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
                    
                    // 计算每日摄入百分比 - 钠每日参考值为2300mg
                    const percentage = (sodiumValue / 2300 * 100).toFixed(1);
                    
                    // 返回百分比
                    return `${percentage}%`;
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
                    
                    // 计算每日摄入百分比 - 碳水化合物每日参考值为275g
                    const percentage = (carbsValue / 275 * 100).toFixed(1);
                    
                    // 返回百分比
                    return `${percentage}%`;
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
                    
                    // 计算每日摄入百分比 - 蛋白质每日参考值为50g
                    const percentage = (proteinValue / 50 * 100).toFixed(1);
                    
                    // 返回百分比
                    return `${percentage}%`;
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
