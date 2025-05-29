"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlayCircle, Clock, Flame, ChefHat } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { categories } from "@/data/recipes"
import CaloriesDisplay from "@/components/calories-display"
import { useAuthGuard } from "@/hooks/useAuthGuard"
import { useUserPlan } from '@/hooks/useUserPlan'

// 定义菜谱类型
interface Recipe {
  id: string;
  title: string;
  image: string;
  time: string;
  calories: string;
  Energy?: string;
  difficulty: string;
  tags: string[];
  videoUrl: string;
  ingredients: string[];
  hasVideo?: boolean;
  strArea?: string;
}

// 分类组件
interface CategorySectionProps {
  category: {
    id: string;
    nameKey: string;
  };
  language: string;
  t: (key: string) => string;
}

// 缓存键前缀
const CACHE_PREFIX = 'brickRecipes_menu_';

// 在文件顶部添加一个全局加载状态跟踪对象
// 这将跟踪已经加载或正在加载的分类
const LOADING_TRACKER = {
  loadedCategories: new Set<string>(),
  loadingCategories: new Set<string>(),
  isLoading: false,
  // 添加重置方法
  reset: () => {
    LOADING_TRACKER.loadedCategories.clear();
    LOADING_TRACKER.loadingCategories.clear();
    LOADING_TRACKER.isLoading = false;
    console.log('[Menu] Reset tracking state');
  }
};

const CategorySection = ({ category, language, t }: CategorySectionProps) => {
  const { checkAuthWithMessage } = useAuthGuard()
  const { checkAndHandleUsage } = useUserPlan()
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCached, setIsCached] = useState(false);
  const [componentInitialized, setComponentInitialized] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);

  // 组件初始化时清除该分类的加载状态
  useEffect(() => {
    setComponentInitialized(true);
    // 只有breakfast分类在组件初始化时标记为需要加载
    if (category.id === "breakfast") {
      setShouldLoad(true);
    }
    return () => {
      // 组件卸载时也清除
      LOADING_TRACKER.loadingCategories.delete(category.id);
    };
  }, [category.id]);

  // 生成缓存键
  const getCacheKey = (categoryId: string) => {
    return `${CACHE_PREFIX}${categoryId}`;
  }

    const fetchCategoryRecipes = async () => {
    // 避免跳过首次加载
    // 如果该分类已经加载过或正在加载中，则跳过
    if ((componentInitialized && LOADING_TRACKER.loadedCategories.has(category.id)) || 
        LOADING_TRACKER.loadingCategories.has(category.id)) {
      console.log(`[Menu] Skipping duplicate load for category: ${category.id}`);
      return;
    }

    // 标记该分类正在加载中
    LOADING_TRACKER.loadingCategories.add(category.id);
      setIsLoading(true);

    // 尝试从缓存加载数据
    try {
        const cacheKey = getCacheKey(category.id);
          const cachedData = localStorage.getItem(cacheKey);
          
          if (cachedData) {
                try {
                  const parsedData = JSON.parse(cachedData);
          const { recipes: cachedRecipes, timestamp } = parsedData;
        
        // 检查缓存是否过期（24小时）
        const now = Date.now();
        const cacheAge = now - timestamp;
        const cacheExpiry = 24 * 60 * 60 * 1000; // 24小时
        
        if (cacheAge < cacheExpiry) {
          // 缓存有效，使用缓存数据
            console.log(`[Menu] Used cache: ${cachedRecipes.length} recipes from cache for ${category.id}`);
          setRecipes(cachedRecipes);
          setIsLoading(false);
          setIsCached(true);
          
            // 标记该分类已加载完成
            LOADING_TRACKER.loadedCategories.add(category.id);
            LOADING_TRACKER.loadingCategories.delete(category.id);
            
            // 不再触发后台刷新，除非用户明确请求刷新
          return;
        } else {
            console.log(`[Menu] Cache expired: ${cacheKey}`);
          }
        } catch (e) {
          console.error(`[Menu] Error parsing cache for ${category.id}:`, e);
        }
      }
    } catch (error) {
      console.error(`[Menu] Cache error for ${category.id}:`, error);
      }
      
      // 缓存不存在或已过期，获取新数据
      await fetchFreshData(getCacheKey(category.id));
    };

    const fetchFreshData = async (cacheKey: string) => {
    // 如果全局已经在加载中，避免并发请求
    if (LOADING_TRACKER.isLoading) {
      console.log(`[Menu] Delaying fetch for ${category.id} - another fetch in progress`);
      setTimeout(() => fetchCategoryRecipes(), 1000);
      return;
    }
    
    LOADING_TRACKER.isLoading = true;
    
      try {
        console.log(`[Menu] Fetching fresh data for category: ${category.id}`);
        const response = await fetch(`/api/menu?category=${category.id}&limit=4`);
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`[Menu] Loaded ${data.recipes.length} recipes for category: ${category.id}`);
        
        // 只有在未缓存数据时才更新UI，避免闪烁
        if (!isCached) {
          setRecipes(data.recipes);
          setIsLoading(false);
        }
        
      // 保存到本地缓存
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              recipes: data.recipes,
              timestamp: Date.now()
            }));
            console.log(`[Menu] Cached data with key: ${cacheKey}`);
          } catch (storageError) {
            console.error(`[Menu] Failed to cache data for ${category.id}:`, storageError);
          }
        
      // 标记该分类已加载完成
      LOADING_TRACKER.loadedCategories.add(category.id);
      LOADING_TRACKER.loadingCategories.delete(category.id);
      } catch (error) {
        console.error(`[Menu] Failed to fetch recipes for category ${category.id}:`, error);
        if (!isCached) {
          setRecipes([]);
          setIsLoading(false);
        }
      LOADING_TRACKER.loadingCategories.delete(category.id);
    } finally {
      LOADING_TRACKER.isLoading = false;
      }
    };

  useEffect(() => {
    // 只有在shouldLoad为true时才加载数据
    if (shouldLoad) {
      // 使用requestAnimationFrame将缓存加载推迟到下一帧，避免阻塞当前帧渲染
      requestAnimationFrame(() => {
        setTimeout(() => {
          fetchCategoryRecipes();
        }, 0);
      });
    }
  }, [shouldLoad]);

  // 监听lazy loading触发事件
  useEffect(() => {
    const handleTriggerLoad = (event: CustomEvent) => {
      if (event.detail.categoryId === category.id) {
        console.log(`[Menu] Triggering load for category: ${category.id}`);
        setShouldLoad(true);
      }
    };

    window.addEventListener('triggerCategoryLoad', handleTriggerLoad as EventListener);
    
    return () => {
      window.removeEventListener('triggerCategoryLoad', handleTriggerLoad as EventListener);
    };
  }, [category.id]);

  // 添加认证检查的View All处理函数
  const handleViewAll = () => {
    // 首先检查用户是否登录，未登录直接重定向到登录页面
    checkAuthWithMessage(() => {
      window.location.href = `/menu/${category.id}`;
    }, language === "zh" ? "查看全部" : "view all");
  };

  const handleViewRecipe = (recipeId: string) => {
    // 首先检查用户是否登录，未登录直接重定向到登录页面
    checkAuthWithMessage(async () => {
      // 用户已登录，进行使用量检查和跟踪
      const success = await checkAndHandleUsage(
        'brick', 
        language === "zh" ? "查看食谱" : "view recipe",
        () => {
          window.location.href = `/recipe-details?id=${recipeId}`;
        }
      );
    }, language === "zh" ? "查看食谱" : "view recipe");
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold dark:text-white">{t(category.nameKey)}</h2>
          <Button 
            onClick={handleViewAll}
            className="bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a] text-white">
              {t("menu.viewAll")}
            </Button>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-8">{t(`menu.description.${category.id}`)}</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 h-64">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse h-full"></div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse h-full hidden sm:block"></div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse h-full hidden md:block"></div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse h-full hidden lg:block"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-[#fff0e8] dark:bg-[#3a2e1e] flex items-center justify-center mr-3">
            <span className="text-[#b94a2c] dark:text-[#ff6b47] font-bold text-lg">{category.id.charAt(0).toUpperCase()}</span>
          </div>
          <h2 className="text-2xl font-bold dark:text-white">{t(category.nameKey)}</h2>
        </div>
          <Button 
          onClick={handleViewAll}
            className="bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a] text-white mt-3 md:mt-0">
            {t("menu.viewAll")} <span className="ml-1">→</span>
          </Button>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8 border-l-4 border-[#b94a2c] pl-4 italic dark:border-[#ff6b47]">
        {t(`menu.description.${category.id}`)}
      </p>
      
      {recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {recipes.map((recipe, index) => (
            <div
              key={recipe.id || `recipe-${index}`}
              className="group cursor-pointer"
              onClick={() => handleViewRecipe(recipe.id)}
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-gray-700 h-full flex flex-col">
                <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <Image 
                    src={recipe.image || "/placeholder.svg"} 
                    alt={recipe.title} 
                    fill 
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = "/placeholder.svg";
                      console.error(`[Page] Image load error for: "${recipe.image}"`, e);
                    }}
                    unoptimized={true}
                  />
                  {/* 区域标签 */}
                  {recipe.strArea && (
                    <div className="absolute top-2 right-2 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 text-xs px-2 py-1 rounded-md shadow-sm">
                      {recipe.strArea}
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
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
                      <CaloriesDisplay energy={recipe.Energy} calories={recipe.calories} />
                    </div>
                  </div>
                  
                  {/* 难度标签区域 */}
                  <div className="flex items-center mb-4">
                    <ChefHat className="h-4 w-4 mr-2 text-[#b94a2c] dark:text-[#ff6b47]" />
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f8e3c5] dark:bg-[#3a2e1e] text-[#b94a2c] dark:text-[#ff6b47] border border-[#b94a2c]/20 dark:border-[#ff6b47]/20">
                      {language === "zh" ? 
                        (recipe.difficulty?.toLowerCase() === "easy" ? "简单" : 
                         recipe.difficulty?.toLowerCase() === "medium" ? "中等" : 
                         recipe.difficulty?.toLowerCase() === "hard" ? "困难" : recipe.difficulty) : 
                        recipe.difficulty}
                    </span>
                  </div>
                  
                  {/* 按钮区域 */}
                  <div className="mt-auto">
                    <Button 
                      onClick={() => handleViewRecipe(recipe.id)}
                      className="w-full bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a] text-white shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      {t("button.viewRecipe")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">{t("menu.noRecipesFound")}</p>
        </div>
      )}
    </div>
  );
};

export default function MenuPage() {
  const { t, language } = useLanguage()
  const [activeCategory, setActiveCategory] = useState<string>("breakfast")
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const [pageInitialized, setPageInitialized] = useState(false);

  // 过滤掉不需要显示的分类
  const filteredCategories = categories.filter(category => 
    category.id !== "quickmeals" && category.id !== "holiday"
  )

  // 组件初始化时重置加载跟踪状态
  useEffect(() => {
    // 重置全局跟踪器状态
    LOADING_TRACKER.reset();
    setPageInitialized(true);
    
    return () => {
      // 组件卸载时也重置
      LOADING_TRACKER.reset();
    }
  }, []);

  // 初始化时从localStorage加载上次选择的分类
  useEffect(() => {
    try {
      const savedCategory = localStorage.getItem('brickRecipes_activeCategory');
      if (savedCategory) {
        // 确保保存的分类在过滤后的分类列表中存在
        const categoryExists = filteredCategories.some(cat => cat.id === savedCategory);
        if (categoryExists) {
          setActiveCategory(savedCategory);
          // 滚动到保存的分类位置
          setTimeout(() => {
            const element = categoryRefs.current[savedCategory];
            if (element) {
              element.scrollIntoView({ behavior: "smooth" });
            }
          }, 300);
        }
      }
    } catch (error) {
      console.error('[Menu] Error loading saved category from localStorage:', error);
    }
  }, [filteredCategories]);

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId)
    // 保存选中的分类到localStorage
    try {
      localStorage.setItem('brickRecipes_activeCategory', categoryId);
    } catch (error) {
      console.error('[Menu] Error saving category to localStorage:', error);
    }
    
    const element = categoryRefs.current[categoryId]
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  // 使用IntersectionObserver进行按需加载
  useEffect(() => {
    if ('IntersectionObserver' in window && Object.keys(categoryRefs.current).length > 0) {
      // 创建观察者实例
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const categoryId = entry.target.id;
            if (categoryId && !LOADING_TRACKER.loadedCategories.has(categoryId) && 
                !LOADING_TRACKER.loadingCategories.has(categoryId)) {
              // 当分类进入视口时触发加载
              console.log(`[Menu] Lazy loading category: ${categoryId}`);
              
              // 停止观察已进入视口的元素
              observer.unobserve(entry.target);
              
              // 触发该分类的数据加载 - 这里是关键修复
              // 通过设置一个trigger来让对应的CategorySection组件重新加载
              const event = new CustomEvent('triggerCategoryLoad', { 
                detail: { categoryId } 
              });
              window.dispatchEvent(event);
            }
          }
        });
      }, {
        rootMargin: '200px', // 提前200px开始加载
        threshold: 0.1
      });
      
      // 为每个分类元素添加观察，除了已加载的
      Object.entries(categoryRefs.current).forEach(([id, el]) => {
        if (el && !LOADING_TRACKER.loadedCategories.has(id)) {
          observer.observe(el);
        }
      });
      
      // 清理函数
      return () => observer.disconnect();
    }
  }, [filteredCategories, pageInitialized]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Menu Header */}
      <div className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold mb-2 text-center dark:text-white">{t("menu.recipeCategories")}</h1>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
            {t("menu.browseByCategory")}
          </p>
          
          {/* Category Buttons - 更加吸引人的按钮设计 */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {filteredCategories.map((category) => (
              <Button
                key={category.id}
                variant="outline"
                className={`rounded-full border-2 px-5 py-2 transition-all duration-300 
                  ${activeCategory === category.id 
                    ? "border-[#b94a2c] bg-[#fff8f0] text-[#b94a2c] font-semibold scale-105 shadow-md dark:border-[#ff6b47] dark:bg-[#3a2e1e] dark:text-[#ff6b47]" 
                    : "border-gray-300 hover:border-[#b94a2c] hover:bg-white hover:text-[#b94a2c] hover:scale-105 dark:border-gray-600 dark:text-gray-200 dark:hover:border-[#ff6b47] dark:hover:text-[#ff6b47]"
                  }`}
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
        <div className="space-y-24">
          {filteredCategories.map((category) => (
            <div 
              key={category.id} 
              id={category.id} 
              className="scroll-mt-24"
              ref={(el) => {
                categoryRefs.current[category.id] = el;
              }}
            >
              <CategorySection 
                category={category} 
                language={language} 
                t={t} 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
