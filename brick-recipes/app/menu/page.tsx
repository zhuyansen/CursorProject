"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlayCircle, Clock, Flame, ChefHat } from "lucide-react"
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

const CategorySection = ({ category, language, t }: CategorySectionProps) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCached, setIsCached] = useState(false);

  // 生成缓存键
  const getCacheKey = (categoryId: string) => {
    return `${CACHE_PREFIX}${categoryId}`;
  }

  useEffect(() => {
    const fetchCategoryRecipes = async () => {
      setIsLoading(true);

      // 尝试从缓存加载数据 - 使用异步方式
      const loadCacheAsync = async () => {
        const cacheKey = getCacheKey(category.id);
        try {
          const cachedData = localStorage.getItem(cacheKey);
          
          if (cachedData) {
            // 使用Promise和setTimeout异步解析JSON，避免阻塞UI
            return new Promise(resolve => {
              setTimeout(() => {
                try {
                  const parsedData = JSON.parse(cachedData);
                  resolve(parsedData);
                } catch (e) {
                  console.error(`[Menu] Error parsing cache for ${category.id}:`, e);
                  resolve(null);
                }
              }, 0);
            });
          }
        } catch (error) {
          console.error(`[Menu] Cache error for ${category.id}:`, error);
        }
        return null;
      };
      
      // 尝试异步加载缓存
      const parsedData = await loadCacheAsync();
      
      if (parsedData) {
        const { recipes: cachedRecipes, timestamp } = parsedData as any;
        
        // 检查缓存是否过期（24小时）
        const now = Date.now();
        const cacheAge = now - timestamp;
        const cacheExpiry = 24 * 60 * 60 * 1000; // 24小时
        
        if (cacheAge < cacheExpiry) {
          // 缓存有效，使用缓存数据
          setRecipes(cachedRecipes);
          setIsLoading(false);
          setIsCached(true);
          
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
          
          console.log(`[Menu] Used cache: ${cachedRecipes.length} recipes loaded from cache for ${category.id}`);
          
          // 在后台刷新缓存
          setTimeout(() => {
            fetchFreshData(getCacheKey(category.id));
          }, 3000); // 3秒后在后台刷新
          
          return;
        } else {
          console.log(`[Menu] Cache expired: ${getCacheKey(category.id)}`);
        }
      }
      
      // 缓存不存在或已过期，获取新数据
      await fetchFreshData(getCacheKey(category.id));
    };

    // 从API获取新数据
    const fetchFreshData = async (cacheKey: string) => {
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
        
        // 保存到本地缓存 - 使用异步方式
        Promise.resolve().then(() => {
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              recipes: data.recipes,
              timestamp: Date.now()
            }));
            console.log(`[Menu] Cached data with key: ${cacheKey}`);
            
            // 延迟预加载图片，避免阻塞UI
            setTimeout(() => {
              data.recipes.forEach((recipe: Recipe) => {
                if (recipe.image && recipe.image !== "/placeholder.svg") {
                  const img = new window.Image();
                  img.src = recipe.image;
                }
              });
            }, 300);
          } catch (storageError) {
            console.error(`[Menu] Failed to cache data for ${category.id}:`, storageError);
          }
        });
        
      } catch (error) {
        console.error(`[Menu] Failed to fetch recipes for category ${category.id}:`, error);
        if (!isCached) {
          setRecipes([]);
          setIsLoading(false);
        }
      }
    };

    // 使用requestAnimationFrame将缓存加载推迟到下一帧，避免阻塞当前帧渲染
    requestAnimationFrame(() => {
      setTimeout(() => {
        fetchCategoryRecipes();
      }, 0);
    });
  }, [category.id, isCached]);

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold dark:text-white">{t(category.nameKey)}</h2>
          <Link href={`/menu/${category.id}`}>
            <Button className="bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a] text-white">
              {t("menu.viewAll")}
            </Button>
          </Link>
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
        <Link href={`/menu/${category.id}`}>
          <Button 
            className="bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a] text-white mt-3 md:mt-0">
            {t("menu.viewAll")} <span className="ml-1">→</span>
          </Button>
        </Link>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8 border-l-4 border-[#b94a2c] pl-4 italic dark:border-[#ff6b47]">
        {t(`menu.description.${category.id}`)}
      </p>
      
      {recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="group transform transition-all duration-300 hover:scale-[1.02]">
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <div className="relative h-40">
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
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center">
                      <ChefHat className="h-4 w-4 mr-1 text-[#b94a2c] dark:text-[#ff6b47]" />
                      <span className="text-sm">
                        {language === "zh" ? 
                          (recipe.difficulty?.toLowerCase() === "easy" ? "简单" : 
                           recipe.difficulty?.toLowerCase() === "medium" ? "中等" : 
                           recipe.difficulty?.toLowerCase() === "hard" ? "困难" : recipe.difficulty) : 
                          recipe.difficulty}
                      </span>
                    </div>
                    <Link href={`/recipe-details?id=${recipe.id}`}>
                      <Button 
                        className="w-full bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a] text-white"
                      >
                        {t("button.viewRecipe")}
                      </Button>
                    </Link>
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

  // 过滤掉不需要显示的分类
  const filteredCategories = categories.filter(category => 
    category.id !== "quickmeals" && category.id !== "holiday"
  )

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

  // 预加载所有分类的图片缓存
  useEffect(() => {
    // 在后台预加载其他分类的缓存 - 使用低优先级加载
    const preloadAllCategories = async () => {
      // 推迟执行，让主要UI先渲染完成
      setTimeout(() => {
        // 先加载激活的分类，然后是其他分类
        const sortedCategories = [...filteredCategories].sort((a, b) => 
          a.id === activeCategory ? -1 : b.id === activeCategory ? 1 : 0
        );
        
        // 使用Promise.all和延迟执行，降低优先级
        Promise.all(sortedCategories.map((category, index) => {
          return new Promise<void>(resolve => {
            // 为每个分类设置延迟，错开加载时间
            setTimeout(async () => {
              try {
                const cacheKey = `${CACHE_PREFIX}${category.id}`;
                const cachedData = localStorage.getItem(cacheKey);
                
                if (cachedData) {
                  const { recipes } = JSON.parse(cachedData);
                  console.log(`[Menu] Preloading images for ${category.id}`);
                  
                  // 每5张图片加载一次，降低同时加载的数量
                  for (let i = 0; i < recipes.length; i++) {
                    const recipe = recipes[i];
                    if (recipe.image && recipe.image !== "/placeholder.svg") {
                      setTimeout(() => {
                        const img = new window.Image();
                        img.src = recipe.image;
                      }, i * 200); // 每张图片间隔200ms加载
                    }
                  }
                }
              } catch (error) {
                console.error(`[Menu] Error preloading cache for ${category.id}:`, error);
              }
              resolve();
            }, index * 500); // 每个分类之间间隔500ms
          });
        }));
      }, 1000); // 页面加载后等待1秒再开始预加载
    };
    
    preloadAllCategories();
  }, [activeCategory, filteredCategories]);

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
