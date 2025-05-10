"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, ChevronDown, Clock, Flame, PlayCircle, ChefHat, X, Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/language-provider"
import { cn } from "@/lib/utils"

// 定义全局样式
const globalStyles = {
  recipeCard: "bg-white dark:bg-gray-800 rounded-lg overflow-hidden border dark:border-gray-700 hover:shadow-md transition-shadow h-[500px] flex flex-col",
  recipeTitle: "font-semibold text-lg mb-3 group-hover:text-[#b94a2c] dark:group-hover:text-[#ff6b47] transition-colors dark:text-white line-clamp-3 min-h-[4.5rem] break-words",
  recipeTagContainer: "flex flex-wrap gap-1 mb-3 h-16 overflow-hidden",
  recipeContent: "p-4 flex flex-col h-[260px] justify-between",
}

// 定义 Recipe 接口
interface Recipe {
  id: string | number;
  title: string;
  image: string;
  time: string;
  calories: string;
  difficulty: string;
  tags: string[];
  videoUrl: string;
  ingredients: string[];
}

// Mock data for ingredients
const ingredients = {
  vegetables: [
    { id: "potato", name: "Potato", zhName: "土豆", emoji: "🥔" },
    { id: "carrot", name: "Carrot", zhName: "胡萝卜", emoji: "🥕" },
    { id: "onion", name: "Onion", zhName: "洋葱", emoji: "🧅" },
    { id: "tomato", name: "Tomato", zhName: "番茄", emoji: "🍅" },
    { id: "celery", name: "Celery", zhName: "芹菜", emoji: "🌿" },
    { id: "cabbage", name: "Cabbage", zhName: "卷心菜", emoji: "🥬" },
    { id: "cucumber", name: "Cucumber", zhName: "黄瓜", emoji: "🥒" },
    { id: "spinach", name: "Spinach", zhName: "菠菜", emoji: "🍃" },
    { id: "lettuce", name: "Lettuce", zhName: "生菜", emoji: "🥗" },
    { id: "radish", name: "White Radish", zhName: "白萝卜", emoji: "🧄" },
    { id: "broccoli", name: "Broccoli", zhName: "西兰花", emoji: "🥦" },
    { id: "mushroom", name: "Mushroom", zhName: "蘑菇", emoji: "🍄" },
    { id: "eggplant", name: "Eggplant", zhName: "茄子", emoji: "🍆" },
    { id: "tofu", name: "Tofu", zhName: "豆腐", emoji: "🧊" }
  ],
  meat: [
    { id: "beef", name: "Beef", zhName: "牛肉", emoji: "🥩" },
    { id: "bacon", name: "Bacon", zhName: "培根", emoji: "🥓" },
    { id: "chicken", name: "Chicken", zhName: "鸡肉", emoji: "🍗" },
    { id: "pork", name: "Pork", zhName: "猪肉", emoji: "🐖" },
    { id: "prawns", name: "Prawns", zhName: "虾", emoji: "🦐" },
    { id: "sausage", name: "Sausage", zhName: "香肠", emoji: "🌭" },
    { id: "salmon", name: "Salmon", zhName: "三文鱼", emoji: "🐟" },
    { id: "lamb", name: "Lamb", zhName: "羊肉", emoji: "🐑" },
    { id: "ham", name: "Ham", zhName: "火腿", emoji: "🍖" },
    { id: "egg", name: "Egg", zhName: "鸡蛋", emoji: "🥚" },
    { id: "fish", name: "Fish", zhName: "鱼", emoji: "🎣" },
  ],
  cookingMethods: [
    { id: "bake", name: "Bake", zhName: "烤", emoji: "🔥" },
    { id: "pan-fry", name: "Pan Fry", zhName: "煎", emoji: "🔍" },
    { id: "deep-fry", name: "Deep Fry", zhName: "炸", emoji: "🍤" },
    { id: "stir-fry", name: "Stir Fry", zhName: "炒", emoji: "🍳" },
    { id: "stew", name: "Stew", zhName: "炖", emoji: "🍲" },
    { id: "boil", name: "Boil", zhName: "煮", emoji: "♨️" },
    { id: "steam", name: "Steam", zhName: "蒸", emoji: "🍚" },
  ],
  cuisineStyles: [
    { id: "western", name: "Western Food", zhName: "西方菜系", description: "Explore European and American cuisine", zhDescription: "体验欧美烹饪风格" },
    { id: "eastern", name: "Eastern Food", zhName: "东方菜系", description: "Discover traditional Asian recipes", zhDescription: "探索传统亚洲美食" },
  ],
}

// Mock video summaries
const videoSummaries = {
  1: "This video demonstrates how to make a perfect brick oven pizza at home. The chef shows techniques for stretching dough, applying sauce evenly, and achieving a crispy crust without a specialized oven.",
  2: "Learn how to make juicy burgers that don't shrink. This tutorial covers meat selection, proper seasoning, and cooking temperatures for the perfect burger.",
  3: "A step-by-step guide to creating authentic Italian lasagna with homemade sauce. The video includes tips for preventing soggy layers and achieving the perfect cheese pull.",
  4: "Quick and easy taco recipe with authentic Mexican flavors. The chef shares secrets for marinating meat and making fresh salsa that complements the dish.",
  5: "This tutorial shows how to create restaurant-quality salads at home. Learn about ingredient pairing, homemade dressings, and beautiful presentation techniques.",
  6: "Master the art of cooking the perfect steak with this detailed guide. The video covers selecting cuts, seasoning methods, and achieving your desired doneness.",
}

export default function BrickLinkRecipes() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isMounted, setIsMounted] = useState(false);

  // 静态化初始状态
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(["Potato", "Beef"]) // 静态默认值
  const [selectedMethods, setSelectedMethods] = useState<string[]>([])
  const [selectedCuisine, setSelectedCuisine] = useState<string>("western") // 静态默认值
  const [apiRecipes, setApiRecipes] = useState<Recipe[]>([])
  const [pageSize, setPageSize] = useState(20) // 静态默认值
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20, // 与pageSize状态匹配
    totalRecipes: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });

  const [showIngredientPanel, setShowIngredientPanel] = useState(true)
  const [previewRecipe, setPreviewRecipe] = useState<number | string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 当筛选条件更新时，同步到URL
  const updateUrlParams = (newParams: Record<string, string | string[] | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    // 更新或删除URL参数
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
        params.delete(key);
      } else if (Array.isArray(value)) {
        params.set(key, value.join(','));
      } else {
        params.set(key, String(value));
      }
    });

    // 使用replace而不是push，避免创建新的历史记录
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleSearch = async (pageNumber = 1) => {
    console.log('[Page] handleSearch triggered');
    setIsLoading(true);
    const params = new URLSearchParams();

    if (selectedIngredients.length > 0) {
      params.append('ingredients', selectedIngredients.join(','));
    }
    if (selectedMethods.length > 0) {
      console.log('[Page] Selected methods:', selectedMethods);
      params.append('methods', selectedMethods.join(','));
    }
    if (searchQuery) {
      params.append('search', searchQuery.toLowerCase()); // send search query in lowercase
    }

    params.append('page', pageNumber.toString());
    params.append('pageSize', pageSize.toString());

    // 简化cuisine处理，仅基于selectedCuisine
    let finalCuisineValue = "";
    if (selectedCuisine) {
      if (selectedCuisine === "eastern") {
        finalCuisineValue = "Eastern";
      } else if (selectedCuisine === "western") {
        finalCuisineValue = "Western";
      }
    }

    // 只有在有cuisine值时才添加参数
    if (finalCuisineValue) {
      params.append('cuisine', finalCuisineValue);
    }

    // 更新URL参数
    updateUrlParams({
      ingredients: selectedIngredients.length > 0 ? selectedIngredients : null,
      methods: selectedMethods.length > 0 ? selectedMethods : null,
      search: searchQuery || null,
      page: pageNumber,
      pageSize,
      cuisine: selectedCuisine || null
    });

    console.log('[Page] Applying filters with params:', params.toString());

    try {
      const response = await fetch(`/api/recipes?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      const data = await response.json();
      console.log('[Page] Recipes fetched:', data);

      if (data.recipes && Array.isArray(data.recipes)) {
        setApiRecipes(data.recipes);

        // 保存数据到sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('brick-recipes-data', JSON.stringify(data.recipes));
        }

        if (data.pagination) {
          setPagination(data.pagination);
          // 保存分页数据到sessionStorage
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('brick-recipes-pagination', JSON.stringify(data.pagination));
          }
          console.log("[Page] Pagination info:", data.pagination);
        }
      } else {
        const recipes = Array.isArray(data) ? data : [];
        setApiRecipes(recipes);

        // 保存数据到sessionStorage
        if (typeof window !== 'undefined' && recipes.length > 0) {
          sessionStorage.setItem('brick-recipes-data', JSON.stringify(recipes));
        }
      }
    } catch (error) {
      console.error("[Page] Failed to fetch recipes:", error);
      setApiRecipes([]); // 设置为空数组，不再使用mockRecipes
    } finally {
      setIsLoading(false);
    }
  };

  // 主 useEffect 用于处理客户端状态同步和初始数据加载
  useEffect(() => {
    if (!isMounted) {
      return; // 等待客户端挂载
    }

    // 1. 从 searchParams 更新状态
    const queryFromUrl = searchParams.get("search") || "";
    const ingredientsFromUrl = searchParams.get("ingredients") 
      ? searchParams.get("ingredients")!.split(",") 
      : ["Potato", "Beef"]; // 使用初始静态默认值
    const methodsFromUrl = searchParams.get("methods") 
      ? searchParams.get("methods")!.split(",") 
      : []; // 使用初始静态默认值
    const cuisineFromUrl = searchParams.get("cuisine")?.toLowerCase() || "western"; // 使用初始静态默认值
    const pageFromUrl = parseInt(searchParams.get("page") || "1");
    const pageSizeFromUrl = parseInt(searchParams.get("pageSize") || "20");

    setSearchQuery(queryFromUrl);
    setSelectedIngredients(ingredientsFromUrl);
    setSelectedMethods(methodsFromUrl);
    setSelectedCuisine(cuisineFromUrl);
    setPageSize(pageSizeFromUrl);

    // 2. 尝试从 sessionStorage 加载
    const savedRecipesJson = sessionStorage.getItem('brick-recipes-data');
    const savedPaginationJson = sessionStorage.getItem('brick-recipes-pagination');
    let recipesLoadedFromSession = false;

    if (savedRecipesJson) {
      try {
        setApiRecipes(JSON.parse(savedRecipesJson));
        recipesLoadedFromSession = true;
      } catch (e) { 
        console.error('[Page] Failed to parse saved recipes:', e); 
        sessionStorage.removeItem('brick-recipes-data'); 
      }
    }

    if (savedPaginationJson) {
      try {
        setPagination(JSON.parse(savedPaginationJson));
      } catch (e) { 
        console.error('[Page] Failed to parse saved pagination:', e); 
        sessionStorage.removeItem('brick-recipes-pagination'); 
      }
    } else {
      // 如果 session 中没有分页信息，则根据 URL/默认值更新分页状态
      setPagination({
        page: pageFromUrl,
        pageSize: pageSizeFromUrl,
        totalRecipes: 0, // 这些会在API响应后更新
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      });
    }

    // 3. 如果未从 session 加载食谱，则决定是否需要API调用
    if (!recipesLoadedFromSession) {
      const hasRelevantParamsInUrl = 
        searchParams.has('ingredients') ||
        searchParams.has('methods') ||
        searchParams.has('search') ||
        searchParams.has('cuisine');

      if (hasRelevantParamsInUrl) {
        console.log('[Page] Client sync: URL有参数，session无食谱。正在使用URL参数搜索。');
        handleSearch(pageFromUrl); 
      } else {
        // 无相关URL参数，但由于 selectedIngredients/selectedCuisine 有静态默认值，我们仍执行默认搜索
        console.log('[Page] Client sync: URL无相关参数，session无食谱。执行默认搜索。');
        handleSearch(1); // 使用已设置的默认筛选条件（如 Potato, Beef, Western）搜索第一页
      }
    }
  }, [isMounted, searchParams]); // 当 isMounted 或 searchParams 变化时运行

  // 分离 beforeunload 事件监听器
  useEffect(() => {
    if (!isMounted) return;
    const handleBeforeUnload = () => {
      if (typeof window !== 'undefined') {
        const currentUrl = window.location.href;
        sessionStorage.setItem('brick-recipes-last-url', currentUrl);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isMounted]);

  const toggleIngredient = (id: string) => {
    // 在这里，id参数实际上是食材的名称（根据renderIngredientButton函数的调用参数）
    console.log('[Page] Toggling ingredient:', id);
    const newIngredients = selectedIngredients.includes(id)
      ? selectedIngredients.filter((i) => i !== id)
      : [...selectedIngredients, id];

    setSelectedIngredients(newIngredients);
    updateUrlParams({
      ingredients: newIngredients.length > 0 ? newIngredients : null
    });
  };

  const toggleMethod = (id: string) => {
    // 使用方法的名称而不是ID，因为后端API期望的是方法名称
    const methodObj = ingredients.cookingMethods.find(m => m.id === id);
    if (!methodObj) return;

    // 获取方法名称并转换为首字母大写格式（如：bake -> Bake）
    const methodName = methodObj.name.charAt(0).toUpperCase() + methodObj.name.slice(1);
    console.log('[Page] Toggling method:', methodName);

    const methodExists = selectedMethods.includes(methodName);
    const newMethods = methodExists
      ? selectedMethods.filter(m => m !== methodName)
      : [...selectedMethods, methodName];

    setSelectedMethods(newMethods);
    updateUrlParams({
      methods: newMethods.length > 0 ? newMethods : null
    });
  };

  const handleRecipePreview = (id: number | string | null) => {
    setPreviewRecipe(id)
  }

  // Close preview when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (previewRef.current && !previewRef.current.contains(event.target as Node)) {
        setPreviewRecipe(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Map for rendering ingredient buttons
  const renderIngredientButton = (item: { id: string; emoji: string; name: string; zhName: string }, type: string) => {
    const displayName = language === "zh" ? item.zhName : item.name;
    const ingredientName = item.name;

    return (
      <button
        key={item.id}
        onClick={() => toggleIngredient(ingredientName)}
        className={cn(
          "flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium dark:border-gray-800 dark:bg-gray-950",
          "hover:shadow-lg hover:scale-105 transform transition-transform duration-150 ease-in-out",
          selectedIngredients.includes(ingredientName) && "bg-black text-white dark:bg-white dark:text-black"
        )}
      >
        <span>{item.emoji}</span>
        <span>{displayName}</span>
      </button>
    )
  }

  // Map for rendering cooking method buttons
  const renderMethodButton = (method: { id: string; emoji: string; name: string; zhName: string }) => {
    const displayName = language === "zh" ? method.zhName : method.name;
    const methodName = method.name.charAt(0).toUpperCase() + method.name.slice(1);

    return (
      <button
        key={method.id}
        onClick={() => toggleMethod(method.id)}
        className={cn(
          "flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium dark:border-gray-800 dark:bg-gray-950",
          "hover:shadow-lg hover:scale-105 transform transition-transform duration-150 ease-in-out",
          selectedMethods.includes(methodName) && "bg-black text-white dark:bg-white dark:text-black"
        )}
      >
        <span>{method.emoji}</span>
        <span>{displayName}</span>
      </button>
    )
  }

  // 在组件内部添加图片处理函数，放在 handleSearch 函数下方
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

  // 创建图片内存缓存
  const imageCache = useRef<Map<string, string>>(new Map());

  // 优化图片处理函数，加入缓存逻辑
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
        console.log('[Page] Processing S3 image URL:', url);

        // 检查URL路径长度，S3有时候会生成特别长的URL，可能导致优化服务处理超时
        if (url.length > 500) {
          console.log('[Page] URL too long, using direct S3 URL');
          imageCache.current.set(cacheKey, url);
          return url;
        }

        // 确保我们使用https协议
        const secureUrl = url.replace(/^http:/, 'https:');
        imageCache.current.set(cacheKey, secureUrl);
        return secureUrl;
      }

      // 对于外部URL，可以使用Next.js的Image优化功能
      // 但需要在next.config.js中配置domains或remotePatterns
      // 这里我们先缓存原始URL
      imageCache.current.set(cacheKey, url);
      return url;
    } catch (e) {
      // URL格式无效，缓存占位图URL
      console.error('[Page] Invalid image URL:', url, e);
      imageCache.current.set(cacheKey, "/placeholder.svg");
      return "/placeholder.svg";
    }
  };

  // 清除所有按钮点击时，也清除sessionStorage中的数据
  const clearAllFilters = () => {
    setSelectedIngredients([]);
    setSelectedMethods([]);
    setSelectedCuisine("");
    setSearchQuery("");

    // 清除URL参数
    updateUrlParams({
      ingredients: null,
      methods: null,
      cuisine: null,
      search: null
    });

    // 清除sessionStorage中的数据
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('brick-recipes-data');
      sessionStorage.removeItem('brick-recipes-pagination');
    }
  };

  // 组件首次加载时，恢复滚动位置
  useEffect(() => {
    if (!isMounted || !apiRecipes || apiRecipes.length === 0) return; // 确保已挂载且有食谱数据
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        const savedPosition = sessionStorage.getItem('brick-recipes-scroll-position');
        if (savedPosition) {
          window.scrollTo(0, parseInt(savedPosition, 10));
          sessionStorage.removeItem('brick-recipes-scroll-position');
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isMounted, apiRecipes]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      {/* 顶部主题图和引导文本 */}
      <div className="relative overflow-hidden bg-[#fdf7ef] dark:bg-[#1e2631] mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                {language === "zh" ? "找到您的完美食谱" : "Find Your Perfect Recipe"}
              </h1>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            {language === "zh" 
                  ? "选择您的食材并探索东方和西方美食！我们的视频分析为您提供包含食材、步骤和营养信息的完整食谱——一站式获取所有信息！"
              : "Pick your ingredients and explore Eastern & Western cuisines! Our video analysis brings you complete recipes with ingredients, steps, and nutrition info—all in one place!"}
          </p>
            </div>
            <div className="order-1 md:order-2 relative">
              <div className="relative z-10 rounded-lg overflow-hidden shadow-md">
                <div className="grid grid-cols-2 gap-2 bg-white dark:bg-gray-800 p-4 rounded-lg">
                  <div className="grid gap-2">
                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-2xl">🥔</span>
                        <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">Potato</span>
                      </div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-2xl">🥩</span>
                        <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">Beef</span>
                      </div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-2xl">🧅</span>
                        <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">Onion</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative h-full">
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                      <div className="text-4xl text-gray-400 dark:text-gray-500">➡️</div>
                    </div>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-3xl block">🍜</span>
                      <span className="mt-1 text-sm font-medium block text-gray-900 dark:text-white">{language === "zh" ? "红烧牛肉" : "Braised Beef"}</span>
                    </div>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-3xl block">🥘</span>
                      <span className="mt-1 text-sm font-medium block text-gray-900 dark:text-white">{language === "zh" ? "牛肉土豆汤" : "Beef Potato Soup"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 筛选面板 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        {/* 使用flex布局实现上下结构 */}
        <div className="flex flex-col gap-8">
          {/* 筛选组件 - 上方 */}
          <div className="w-full">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white">{t("button.filterByIngredients")}</h2>
                {(selectedIngredients.length > 0 || selectedMethods.length > 0 || selectedCuisine) && (
                <Badge variant="secondary" className="bg-[#b94a2c] text-white dark:bg-[#ff6b47] px-3 py-1">
                    {selectedIngredients.length + selectedMethods.length + (selectedCuisine ? 1 : 0)} {language === "zh" ? "个已选择" : "selected"}
                </Badge>
              )}
            </div>

              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center dark:text-white">
                  <span className="mr-2">🥬</span> {language === "zh" ? "蔬菜" : "Vegetables"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ingredients.vegetables.map((veg) => renderIngredientButton(veg, "vegetables"))}
                </div>

                <h3 className="text-lg font-medium mb-4 mt-6 flex items-center dark:text-white">
                  <span className="mr-2">🍖</span> {language === "zh" ? "肉类" : "Meat"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ingredients.meat.map((meat) => renderIngredientButton(meat, "meat"))}
              </div>

                <h3 className="text-lg font-medium mb-4 mt-6 flex items-center dark:text-white">
                  <span className="mr-2">👨‍🍳</span> {language === "zh" ? "烹饪方式" : "Cooking Methods"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ingredients.cookingMethods.map((method) => renderMethodButton(method))}
                </div>

                <h3 className="text-lg font-medium mb-4 mt-6 dark:text-white">
                  {language === "zh" ? "您偏好的风格" : "Which style you prefer"}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {ingredients.cuisineStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => {
                        const newCuisine = style.id === selectedCuisine ? "" : style.id;
                        setSelectedCuisine(newCuisine);
                        updateUrlParams({
                          cuisine: newCuisine || null
                        });
                      }}
                      className={`p-4 rounded-lg border text-center transition-colors flex flex-col items-center justify-center h-28 ${selectedCuisine === style.id
                          ? "border-[#b94a2c] bg-[#fff8f0] dark:border-[#ff6b47] dark:bg-[#3a2e1e]"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                      } dark:text-white`}
                    >
                      <span className="text-3xl mb-1">
                        {style.id === 'eastern' ? '🍜' : '🍕'}
                      </span>
                      <span className="font-medium">
                        {language === "zh" ? style.zhName.split(" ")[0] : style.name.split(" ")[0]}
                      </span>
                    </button>
                  ))}
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                  onClick={clearAllFilters}
                className="dark:text-gray-300 dark:border-gray-600"
              >
                {t("button.clearAll")}
              </Button>
              <Button
                className="bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a]"
                  onClick={() => handleSearch()}
              >
                {t("button.applyFilters")}
              </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Recipe Results - 下方 */}
        <div className="w-full">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold dark:text-white">{t("recipe.recipeResults")}</h2>
            </div>

            {isLoading && <p className="text-center dark:text-white">{t("recipe.loading") || "Loading recipes..."}</p>}
            {!isLoading && apiRecipes.length > 0 ? (
              <>
                <div className="grid sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 px-2 md:px-4">
                  {apiRecipes.map((recipe) => (
                      <div key={recipe.id} className="group relative">
                      <div className={globalStyles.recipeCard}>
                          <div className="relative h-48">
                            <Image
                              src={recipe.image || "/placeholder.svg"}
                              alt={recipe.title}
                              fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            loading="lazy"
                            placeholder="blur"
                            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjwvc3ZnPg=="
                              className="object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = "/placeholder.svg";
                              console.error(`[Page] Card/Preview Image load error for: "${recipe.image}"`, e);
                            }}
                            unoptimized={true}
                          />
                          <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 rounded-full px-3 py-1 text-xs font-medium shadow-sm transition-all duration-200 hover:bg-white dark:hover:bg-gray-800">
                            {recipe.tags && recipe.tags.length > 0 ? recipe.tags[0] : ""}
                          </div>
                        </div>
                        <div className={globalStyles.recipeContent}>
                          <h3 className={globalStyles.recipeTitle} title={recipe.title}>
                              {recipe.title}
                            </h3>
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-4 mb-3">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{recipe.time}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Flame className="h-4 w-4" />
                                <span>{recipe.calories}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <ChefHat className="h-4 w-4" />
                              <span>{t(`recipe.difficulty.${recipe.difficulty?.toLowerCase()}`)}</span>
                            </div>
                          </div>
                          <div className={globalStyles.recipeTagContainer}>
                            {recipe.ingredients?.slice(0, 4).map((ing, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-xs dark:border-gray-600 dark:text-gray-300"
                                >
                                  {ing}
                                </Badge>
                              ))}
                            {recipe.ingredients && recipe.ingredients.length > 4 && (
                              <Badge
                                variant="outline"
                                className="text-xs dark:border-gray-600 dark:text-gray-300"
                              >
                                +{recipe.ingredients.length - 4} more
                              </Badge>
                            )}
                            </div>
                          <div className="flex justify-between mt-auto">
                            <Link
                              href={`/recipe-details?id=${recipe.id}`}
                              className="w-full"
                              onClick={() => {
                                // 保存当前滚动位置
                                if (typeof window !== 'undefined') {
                                  sessionStorage.setItem('brick-recipes-scroll-position', window.scrollY.toString());
                                }
                              }}
                            >
                                <Button
                                  className="w-full bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a] text-white"
                                >
                                  {t("button.viewRecipe")}
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>

                        {previewRecipe === recipe.id && (
                          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div
                              ref={previewRef}
                              className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto relative"
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-2 z-10 dark:text-gray-300"
                                onClick={() => setPreviewRecipe(null)}
                              >
                                <X className="h-5 w-5" />
                              </Button>
                              <div className="grid md:grid-cols-2 gap-6 p-6">
                                <div>
                                  <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                                    <Image
                                      src={recipe.image || "/placeholder.svg"}
                                      alt={recipe.title}
                                      fill
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    loading="lazy"
                                    placeholder="blur"
                                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjwvc3ZnPg=="
                                      className="object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.onerror = null;
                                      target.src = "/placeholder.svg";
                                      console.error(`[Page] Card/Preview Image load error for: "${recipe.image}"`, e);
                                    }}
                                    unoptimized={true}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="rounded-full bg-white/80 hover:bg-white"
                                      >
                                        <PlayCircle className="h-12 w-12 text-[#b94a2c] dark:text-[#ff6b47]" />
                                      </Button>
                                    </div>
                                  </div>
                                  <h3 className="font-semibold mb-2 dark:text-white">{t("video.videoSummary")}</h3>
                                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    {videoSummaries[recipe.id as keyof typeof videoSummaries]}
                                  </p>
                                </div>
                                <div>
                                <h2 className="text-xl font-bold mb-3 dark:text-white break-words" title={recipe.title}>
                                  {recipe.title}
                                </h2>
                                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-4 mb-4">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      <span>{recipe.time}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Flame className="h-4 w-4" />
                                      <span>{recipe.calories}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <ChefHat className="h-4 w-4" />
                                    <span>{t(`recipe.difficulty.${recipe.difficulty?.toLowerCase()}`)}</span>
                                  </div>
                                  </div>

                                  <h3 className="font-semibold mb-3 dark:text-white">{t("video.quickRecipeGuide")}</h3>
                                  <div className="space-y-4 mb-6">
                                    <div className="border-l-4 border-[#b94a2c] dark:border-[#ff6b47] pl-4">
                                      <h4 className="font-medium dark:text-white">{t("video.ingredients")}</h4>
                                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mt-2">
                                      {recipe.ingredients?.map((ing, idx) => (
                                          <li key={idx}>{ing}</li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div className="border-l-4 border-[#b94a2c] dark:border-[#ff6b47] pl-4">
                                      <h4 className="font-medium dark:text-white">{t("video.preparationSteps")}</h4>
                                      <ol className="list-decimal list-inside text-gray-600 dark:text-gray-300 mt-2">
                                        <li>{t("recipe.step.prepare")}</li>
                                        <li>{t("recipe.step.follow")}</li>
                                        <li>{t("recipe.step.cook")}</li>
                                        <li>{t("recipe.step.serve")}</li>
                                      </ol>
                                    </div>
                                    <div className="border-l-4 border-[#b94a2c] dark:border-[#ff6b47] pl-4">
                                      <h4 className="font-medium dark:text-white">{t("video.nutritionInformation")}</h4>
                                      <div className="grid grid-cols-2 gap-2 mt-2">
                                        <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                          <div className="text-xs text-gray-500 dark:text-gray-400">{t("recipe.calories")}</div>
                                          <div className="font-medium dark:text-white">{recipe.calories}</div>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                          <div className="text-xs text-gray-500 dark:text-gray-400">{t("recipe.protein")}</div>
                                          <div className="font-medium dark:text-white">25g</div>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                          <div className="text-xs text-gray-500 dark:text-gray-400">{t("recipe.carbs")}</div>
                                          <div className="font-medium dark:text-white">35g</div>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                          <div className="text-xs text-gray-500 dark:text-gray-400">{t("recipe.fat")}</div>
                                          <div className="font-medium dark:text-white">15g</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                <Link
                                  href={`/recipe-details?id=${recipe.id}`}
                                  onClick={() => {
                                    // 保存当前滚动位置
                                    if (typeof window !== 'undefined') {
                                      sessionStorage.setItem('brick-recipes-scroll-position', window.scrollY.toString());
                                    }
                                    // 移除之前可能存在的fetchRecipeDetails调用，仅作跳转
                                    setPreviewRecipe(null); // Close modal on link click
                                  }}
                                >
                                    <Button variant="outline" className="w-full bg-[#b94a2c] hover:bg-[#a03f25] text-white dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a]">
                                      {t("button.viewFullRecipe")}
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                <div className="flex justify-between items-center mt-8 mb-4">
                  {/* 每页显示数量选择器 */}
                  <div className="flex items-center space-x-2 ml-auto">
                    <span className="text-sm text-gray-500">Show per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        const newSize = parseInt(e.target.value);
                        setPageSize(newSize);
                        // 更新URL参数并重置到第一页
                        updateUrlParams({
                          pageSize: newSize,
                          page: 1
                        });
                        handleSearch(1); // 重置到第一页
                      }}
                      className="border border-gray-300 rounded px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                </div>

                {/* 分页控件 */}
                <div className="flex justify-center mb-4">
                  <nav className="inline-flex rounded-md shadow-sm -space-x-px bg-gray-50 dark:bg-gray-900">
                    <button
                      onClick={() => handleSearch(pagination.page - 1)}
                      disabled={!pagination.hasPrevPage}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${pagination.hasPrevPage
                          ? "text-gray-500 bg-white hover:bg-gray-50 border border-gray-300 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600"
                          : "text-gray-300 bg-white cursor-not-allowed border border-gray-300 dark:text-gray-600 dark:bg-gray-800 dark:border-gray-600"
                        } rounded-l-md`}
                    >
                      Previous
                    </button>

                    {/* 简洁页码显示 */}
                    {[...Array(pagination.totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      // 显示当前页附近的页码和第一页/最后一页
                      if (
                        pageNum === 1 ||
                        pageNum === pagination.totalPages ||
                        (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handleSearch(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                                ${pagination.page === pageNum
                                ? "z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900 dark:border-blue-500 dark:text-blue-200"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }

                      // 简洁的省略号
                      if (
                        (pageNum === 2 && pagination.page > 3) ||
                        (pageNum === pagination.totalPages - 1 && pagination.page < pagination.totalPages - 2)
                      ) {
                        return (
                          <span
                            key={`ellipsis-${pageNum}`}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                          >
                            ...
                          </span>
                        );
                      }

                      return null;
                    })}

                    <button
                      onClick={() => handleSearch(pagination.page + 1)}
                      disabled={!pagination.hasNextPage}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${pagination.hasNextPage
                          ? "text-gray-500 bg-white hover:bg-gray-50 border border-gray-300 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600"
                          : "text-gray-300 bg-white cursor-not-allowed border border-gray-300 dark:text-gray-600 dark:bg-gray-800 dark:border-gray-600"
                        } rounded-r-md`}
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </>
            ) : (
              !isLoading && (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="text-xl font-bold mb-2 dark:text-white">{t("recipe.noRecipesFound")}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{t("recipe.trySelecting")}</p>
                    <Button
                      variant="outline"
                    onClick={clearAllFilters}
                      className="dark:text-gray-300 dark:border-gray-600"
                    >
                      {t("button.clearAll")}
                    </Button>
                  </div>
              )
                )}
          </div>
        </div>
      </div>
    </div>
  )
}
