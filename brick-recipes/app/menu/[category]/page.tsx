"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlayCircle, Clock, Flame, ChevronLeft, ChevronRight } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { categories } from "@/data/recipes"

// 定义菜谱类型
interface Recipe {
  id: string;
  title: string;
  image: string;
  time: string;
  calories: string;
  difficulty: string;
  tags: string[];
  videoUrl: string;
  ingredients: string[];
  hasVideo?: boolean;
}

// 分页信息类型
interface Pagination {
  page: number;
  pageSize: number;
  totalRecipes: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// 缓存键前缀
const CACHE_PREFIX = 'brickRecipes_category_';

export default function CategoryPage() {
  const { t, language } = useLanguage()
  const params = useParams()
  const router = useRouter()
  const category = params.category as string
  
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 8,
    totalRecipes: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isFreshLoad, setIsFreshLoad] = useState(true)
  
  // 生成缓存键
  const getCacheKey = (cat: string, page: number, pageSize: number) => {
    return `${CACHE_PREFIX}${cat}_p${page}_size${pageSize}`;
  }
  
  // 获取分类信息
  const categoryInfo = categories.find(c => c.id === category)
  
  // 加载指定页的菜谱
  const loadRecipes = async (page: number = 1, pageSize: number = pagination.pageSize) => {
    // 立即设置加载状态，确保UI响应
    setIsLoading(true);
    
    // 保存当前请求的页码，避免竞态条件
    const requestedPage = page;
    
    // 记录当前请求信息
    console.log(`[CategoryPage] 请求加载第${requestedPage}页，每页${pageSize}个菜谱，分类：${category}`);
    
    // 尝试从缓存获取数据
    const cacheKey = getCacheKey(category, page, pageSize);
    
    // 获取缓存的函数 - 包装在Promise中便于异步处理
    const getFromCache = async () => {
      try {
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData) {
          console.log(`[CategoryPage] Loading from cache: ${cacheKey}`);
          
          // 使用setTimeout异步解析JSON，避免阻塞UI
          return new Promise(resolve => {
            setTimeout(() => {
              try {
                const parsedData = JSON.parse(cachedData);
                resolve(parsedData);
              } catch (e) {
                console.error('[CategoryPage] Error parsing cache:', e);
                resolve(null);
              }
            }, 0);
          });
        }
      } catch (error) {
        console.error(`[CategoryPage] Cache error:`, error);
      }
      return null;
    };
    
    // 先尝试快速从缓存获取数据
    getFromCache().then(async (parsedData: any) => {
      if (parsedData) {
        const { recipes: cachedRecipes, pagination: cachedPagination, timestamp } = parsedData;
        
        // 检查缓存数据完整性
        if (!cachedRecipes || !Array.isArray(cachedRecipes) || !cachedPagination) {
          console.error(`[CategoryPage] 缓存数据不完整或格式错误:`, parsedData);
          await fetchFreshData(requestedPage, pageSize, cacheKey);
          return;
        }
        
        // 记录缓存的分页信息
        console.log(`[CategoryPage] 缓存的分页信息:`, {
          page: cachedPagination.page,
          totalPages: cachedPagination.totalPages,
          totalRecipes: cachedPagination.totalRecipes,
          hasNextPage: cachedPagination.hasNextPage,
          hasPrevPage: cachedPagination.hasPrevPage
        });
        
        // 检查缓存是否过期（24小时）
        const now = Date.now();
        const cacheAge = now - timestamp;
        const cacheExpiry = 24 * 60 * 60 * 1000; // 24小时
        
        if (cacheAge < cacheExpiry) {
          // 缓存有效，使用缓存数据
          setRecipes(cachedRecipes);
          setPagination({
            ...cachedPagination,
            page: requestedPage, // 确保使用请求的页码
            // 确保分页信息正确
            totalPages: Math.max(1, Math.ceil(cachedPagination.totalRecipes / pageSize)),
            hasNextPage: requestedPage < Math.ceil(cachedPagination.totalRecipes / pageSize),
            hasPrevPage: requestedPage > 1
          });
          setIsLoading(false);
          
          // 延迟预加载图片，避免阻塞UI
          requestAnimationFrame(() => {
            setTimeout(() => {
              cachedRecipes.forEach((recipe: Recipe) => {
                if (recipe.image && recipe.image !== "/placeholder.svg") {
                  const img = new window.Image();
                  img.src = recipe.image;
                }
              });
            }, 100);
          });
          
          console.log(`[CategoryPage] Used cache: ${cachedRecipes.length} recipes loaded from cache`);
          
          // 后台刷新缓存
          setTimeout(() => {
            fetchFreshData(requestedPage, pageSize, cacheKey);
          }, 3000);
          
          return;
        } else {
          console.log(`[CategoryPage] Cache expired: ${cacheKey}`);
        }
      }
      
      // 缓存不存在、无效或已过期，获取新数据
      await fetchFreshData(requestedPage, pageSize, cacheKey);
    });
  }
  
  // 从API获取新数据
  const fetchFreshData = async (page: number, pageSize: number, cacheKey: string) => {
    try {
      console.log(`[CategoryPage] Fetching fresh data for page ${page}, category: ${category}, pageSize: ${pageSize}`);
      const response = await fetch(`/api/menu?category=${category}&page=${page}&pageSize=${pageSize}`);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`[CategoryPage] Loaded ${data.recipes.length} recipes, total: ${data.pagination.totalRecipes}`);
      
      // 检查API返回的数据完整性
      if (!data.recipes || !Array.isArray(data.recipes)) {
        console.error(`[CategoryPage] API返回的菜谱数据无效:`, data);
        setIsLoading(false);
        return;
      }
      
      if (!data.pagination) {
        console.error(`[CategoryPage] API返回的分页数据无效:`, data);
        data.pagination = {
          page: page,
          pageSize: pageSize,
          totalRecipes: data.recipes.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: page > 1
        };
      }
      
      // 记录API返回的分页信息
      console.log(`[CategoryPage] API返回的分页信息:`, {
        page: data.pagination.page,
        totalPages: data.pagination.totalPages,
        totalRecipes: data.pagination.totalRecipes,
        hasNextPage: data.pagination.hasNextPage,
        hasPrevPage: data.pagination.hasPrevPage
      });
      
      // 确保分页信息正确
      const correctedPagination = {
        ...data.pagination,
        page: page,
        totalPages: Math.max(1, Math.ceil(data.pagination.totalRecipes / pageSize)),
        hasNextPage: page < Math.ceil(data.pagination.totalRecipes / pageSize),
        hasPrevPage: page > 1
      };
      
      // 更新UI
      setRecipes(data.recipes);
      setPagination(correctedPagination);
      setIsLoading(false);
      setIsFreshLoad(false);
      
      // 保存到本地缓存 - 使用异步方式避免阻塞UI
      Promise.resolve().then(() => {
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            recipes: data.recipes,
            pagination: correctedPagination,
            timestamp: Date.now()
          }));
          console.log(`[CategoryPage] Cached data with key: ${cacheKey}`);
          
          // 延迟预加载图片，避免阻塞UI
          setTimeout(() => {
            data.recipes.forEach((recipe: Recipe) => {
              if (recipe.image && recipe.image !== "/placeholder.svg") {
                const img = new window.Image();
                img.src = recipe.image;
              }
            });
          }, 500);
        } catch (storageError) {
          console.error(`[CategoryPage] Failed to cache data:`, storageError);
        }
      });
      
    } catch (error) {
      console.error(`[CategoryPage] Failed to fetch recipes:`, error);
      if (isFreshLoad) {
        setRecipes([]);
        setIsLoading(false);
      }
    }
  }
  
  // 处理每页显示数量变化
  const handlePageSizeChange = (value: string) => {
    const newPageSize = parseInt(value);
    // 保存pageSize设置
    try {
      localStorage.setItem(`${CACHE_PREFIX}${category}_pageSize`, newPageSize.toString());
    } catch (error) {
      console.error(`[CategoryPage] Error saving pageSize:`, error);
    }
    loadRecipes(1, newPageSize);
  }

  // 初始加载
  useEffect(() => {
    if (category) {
      // 先显示加载状态，让UI立即渲染
      setIsLoading(true);
      
      // 使用requestAnimationFrame将缓存加载推迟到下一帧，避免阻塞当前帧渲染
      requestAnimationFrame(() => {
        // 异步加载缓存
        setTimeout(async () => {
          try {
            const savedPageSize = localStorage.getItem(`${CACHE_PREFIX}${category}_pageSize`);
            if (savedPageSize) {
              const pageSize = parseInt(savedPageSize);
              setPagination(prev => ({...prev, pageSize}));
              loadRecipes(1, pageSize);
            } else {
              loadRecipes(1);
            }
          } catch (error) {
            console.error(`[CategoryPage] Error loading saved pageSize:`, error);
            loadRecipes(1);
          }
        }, 0);
      });
    }
  }, [category]);
  
  // 如果分类不存在，显示错误信息
  if (!categoryInfo) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-5xl mb-6">😕</div>
          <h1 className="text-2xl font-bold mb-4 dark:text-white">{t("menu.categoryNotFound")}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {language === "zh" 
              ? `抱歉，我们找不到"${category}"这个分类。` 
              : `Sorry, we couldn't find the "${category}" category.`}
          </p>
          <Link href="/menu">
            <Button className="bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a] text-white">
              <ChevronLeft className="h-4 w-4 mr-2" />
              {t("menu.backToMenu")}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Category Header */}
      <div className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link href="/menu" className="inline-flex items-center text-[#b94a2c] dark:text-[#ff6b47] mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            {language === "zh" ? "返回菜单" : "BackToMenu"}
          </Link>
          
          <h1 className="text-3xl font-bold mb-2 dark:text-white">{t(categoryInfo.nameKey)}</h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-3xl">
            {t(`menu.description.${category}`)}
          </p>
        </div>
      </div>

      {/* Recipes Grid */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow animate-pulse h-80">
                <div className="h-40 bg-gray-200 dark:bg-gray-700"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mt-4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recipes.length > 0 ? (
          <>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recipes.map((recipe) => (
                <div key={recipe.id} className="group">
                <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="relative h-40">
                      <Image 
                        src={recipe.image || "/placeholder.svg"} 
                        alt={recipe.title}
                        fill
                        className="object-cover"
                        unoptimized={true}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = "/placeholder.svg";
                          console.error(`[CategoryPage] Image load error for: "${recipe.image}"`, e);
                        }}
                      />
                  </div>
                  <div className="p-4">
                      <h3 className="font-medium text-lg mb-2 group-hover:text-[#b94a2c] dark:text-white dark:group-hover:text-[#ff6b47] transition-colors line-clamp-2">
                        {recipe.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-3 mb-3">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-[#b94a2c] dark:text-[#ff6b47]" />
                          <span>{recipe.time}</span>
                      </div>
                      <div className="flex items-center">
                        <Flame className="h-4 w-4 mr-1 text-[#b94a2c] dark:text-[#ff6b47]" />
                          <span>{recipe.calories}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300">
                          {t(`recipe.difficulty.${recipe.difficulty?.toLowerCase()}`)}
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

            {/* 更新分页组件 */}
            {pagination.totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <div className="flex items-center">
                  <div className="inline-flex rounded-md">
                    <Button
                      variant="outline"
                      onClick={() => loadRecipes(pagination.page - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="rounded-l-md rounded-r-none border-r-0 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600"
                    >
                      {language === "zh" ? "上一页" : "Previous"}
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-none border-x-0 pointer-events-none bg-white dark:bg-gray-800 dark:border-gray-600"
                    >
                      {pagination.page}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => loadRecipes(pagination.page + 1)}
                      disabled={!pagination.hasNextPage}
                      className="rounded-r-md rounded-l-none border-l-0 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600"
                    >
                      {language === "zh" ? "下一页" : "Next"}
                    </Button>
                  </div>
          </div>
          </div>
        )}
          </>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
            <div className="text-5xl mb-6">🍽️</div>
            <h2 className="text-xl font-bold mb-2 dark:text-white">{t("recipe.noRecipesFound")}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
              {language === "zh" 
                ? `抱歉，我们没有找到${t(categoryInfo.nameKey)}分类下的菜谱。` 
                : `Sorry, we couldn't find any recipes in the ${t(categoryInfo.nameKey)} category.`}
            </p>
            <Link href="/menu">
              <Button className="bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a] text-white">
                <ChevronLeft className="h-4 w-4 mr-2" />
                {t("menu.backToMenu")}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
} 