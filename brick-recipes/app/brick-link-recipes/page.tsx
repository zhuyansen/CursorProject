"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, ChevronDown, Clock, Flame, PlayCircle, ChefHat, X, Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/language-provider"
import { cn } from "@/lib/utils"

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
    { id: "tofu", name: "Tofu", zhName: "豆腐", emoji: "🧊" },
    { id: "chinese-cabbage", name: "Chinese Cabbage", zhName: "白菜", emoji: "🥢" },
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
    { id: "eastern", name: "Eastern Food", zhName: "东方菜系", description: "Discover traditional Asian recipes", zhDescription: "探索传统亚洲美食" },
    { id: "western", name: "Western Food", zhName: "西方菜系", description: "Explore European and American cuisine", zhDescription: "体验欧美烹饪风格" },
  ],
}

// Mock data for recipe results
const mockRecipes = [
  {
    id: 1,
    title: "Brick Oven Pizza",
    image: "/placeholder.svg?height=200&width=300",
    time: "30 min",
    calories: "320 kcal",
    difficulty: "Easy",
    tags: ["Italian", "Dinner"],
    videoUrl: "https://example.com/video1",
    ingredients: ["Flour", "Tomato", "Cheese", "Olive Oil"],
  },
  {
    id: 2,
    title: "Brick House Burger",
    image: "/placeholder.svg?height=200&width=300",
    time: "25 min",
    calories: "450 kcal",
    difficulty: "Medium",
    tags: ["American", "Lunch"],
    videoUrl: "https://example.com/video2",
    ingredients: ["Beef", "Onion", "Lettuce", "Tomato"],
  },
  {
    id: 3,
    title: "Brick Layer Lasagna",
    image: "/placeholder.svg?height=200&width=300",
    time: "60 min",
    calories: "520 kcal",
    difficulty: "Medium",
    tags: ["Italian", "Dinner"],
    videoUrl: "https://example.com/video3",
    ingredients: ["Pasta", "Tomato", "Beef", "Cheese"],
  },
  {
    id: 4,
    title: "Brick Road Tacos",
    image: "/placeholder.svg?height=200&width=300",
    time: "20 min",
    calories: "280 kcal",
    difficulty: "Easy",
    tags: ["Mexican", "Lunch"],
    videoUrl: "https://example.com/video4",
    ingredients: ["Tortilla", "Chicken", "Onion", "Cilantro"],
  },
  {
    id: 5,
    title: "Brick Foundation Salad",
    image: "/placeholder.svg?height=200&width=300",
    time: "15 min",
    calories: "180 kcal",
    difficulty: "Easy",
    tags: ["Healthy", "Lunch"],
    videoUrl: "https://example.com/video5",
    ingredients: ["Lettuce", "Tomato", "Cucumber", "Olive Oil"],
  },
  {
    id: 6,
    title: "Brick Wall Steak",
    image: "/placeholder.svg?height=200&width=300",
    time: "40 min",
    calories: "520 kcal",
    difficulty: "Hard",
    tags: ["American", "Dinner"],
    videoUrl: "https://example.com/video6",
    ingredients: ["Beef", "Butter", "Garlic", "Rosemary"],
  },
]

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
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])
  const [selectedMethods, setSelectedMethods] = useState<string[]>([])
  const [selectedCuisine, setSelectedCuisine] = useState<string>("")
  const [showIngredientPanel, setShowIngredientPanel] = useState(true)
  const [previewRecipe, setPreviewRecipe] = useState<number | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // Filter recipes based on search query, active filter, and selected ingredients/methods
  const filteredRecipes = mockRecipes.filter((recipe) => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = activeFilter === "all" || recipe.tags.includes(activeFilter)

    // If no ingredients are selected, don't filter by ingredients
    const matchesIngredients =
      selectedIngredients.length === 0 ||
      selectedIngredients.some((ing) => {
        // 获取所有可能的食材名称（英文和中文）
        const allIngredientNames = [
          ...ingredients.vegetables.map(v => language === "zh" ? v.zhName : v.name),
          ...ingredients.meat.map(m => language === "zh" ? m.zhName : m.name)
        ];
        
        return recipe.ingredients.some((i) => 
          i.toLowerCase().includes(ing.toLowerCase()) || 
          allIngredientNames.some(name => name.toLowerCase().includes(ing.toLowerCase()))
        )
      })

    // Check if recipe matches selected cooking methods
    const matchesMethods = 
      selectedMethods.length === 0 || 
      selectedMethods.some(method => {
        const methodObj = ingredients.cookingMethods.find(m => m.id === method);
        return methodObj && recipe.tags.some(tag => 
          tag.toLowerCase().includes(methodObj.name.toLowerCase()) ||
          (methodObj.zhName && tag.toLowerCase().includes(methodObj.zhName.toLowerCase()))
        );
      })
    
    // Check if recipe matches selected cuisine style
    const matchesCuisine = 
      !selectedCuisine || 
      ingredients.cuisineStyles.some(style => 
        style.id === selectedCuisine && 
        recipe.tags.some(tag => 
          tag.toLowerCase().includes(style.name.toLowerCase()) ||
          (style.zhName && tag.toLowerCase().includes(style.zhName.toLowerCase()))
        )
      )

    return matchesSearch && matchesFilter && matchesIngredients && matchesMethods && matchesCuisine
  })

  const toggleIngredient = (id: string) => {
    setSelectedIngredients((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const toggleMethod = (id: string) => {
    setSelectedMethods((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]))
  }

  const handleSearch = () => {
    // 保持筛选面板打开状态
  }

  const handleRecipePreview = (id: number | null) => {
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
    return (
      <button
        key={item.id}
        onClick={() => toggleIngredient(language === "zh" ? item.zhName : item.name)}
        className={cn(
          "flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium dark:border-gray-800 dark:bg-gray-950",
          selectedIngredients.includes(language === "zh" ? item.zhName : item.name) && "bg-black text-white dark:bg-white dark:text-black"
        )}
      >
        <span>{item.emoji}</span>
        <span>{language === "zh" ? item.zhName : item.name}</span>
      </button>
    )
  }

  // Map for rendering cooking method buttons
  const renderMethodButton = (method: { id: string; emoji: string; name: string; zhName: string }) => {
    return (
      <button
        key={method.id}
        onClick={() => toggleMethod(method.id)}
        className={cn(
          "flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium dark:border-gray-800 dark:bg-gray-950",
          selectedMethods.includes(method.id) && "bg-black text-white dark:bg-white dark:text-black"
        )}
      >
        <span>{method.emoji}</span>
        <span>{language === "zh" ? method.zhName : method.name}</span>
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
        <div className="container mx-auto px-6 md:px-10 lg:px-16 py-8">
          <h1 className="text-3xl font-bold mb-2 text-center dark:text-white">{t("recipe.findYourPerfect")}</h1>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
            {language === "zh" 
              ? "选好食材，东西美食一网打尽！视频解析，轻松获取食谱全攻略——配料、步骤、营养，样样齐全！" 
              : "Pick your ingredients and explore Eastern & Western cuisines! Our video analysis brings you complete recipes with ingredients, steps, and nutrition info—all in one place!"}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 md:px-10 lg:px-16 py-8">
        {/* 筛选组件 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8 border dark:border-gray-700">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white">{t("button.filterByIngredients")}</h2>
              {selectedIngredients.length > 0 && (
                <Badge variant="secondary" className="bg-[#b94a2c] text-white dark:bg-[#ff6b47] px-3 py-1">
                  {selectedIngredients.length} {language === "zh" ? "个已选择" : "selected"}
                </Badge>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center dark:text-white">
                  <span className="mr-2">🥬</span> {language === "zh" ? "蔬菜" : "Vegetables"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ingredients.vegetables.map((veg) => renderIngredientButton(veg, "vegetables"))}
                </div>

                <h3 className="text-lg font-medium mb-3 mt-6 flex items-center dark:text-white">
                  <span className="mr-2">🍖</span> {language === "zh" ? "肉类" : "Meat"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ingredients.meat.map((meat) => renderIngredientButton(meat, "meat"))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center dark:text-white">
                  <span className="mr-2">👨‍🍳</span> {language === "zh" ? "烹饪方式" : "Cooking Methods"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ingredients.cookingMethods.map((method) => renderMethodButton(method))}
                </div>

                <h3 className="text-lg font-medium mb-3 mt-6 dark:text-white">
                  {language === "zh" ? "您偏好的风格" : "Which style you prefer"}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {ingredients.cuisineStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedCuisine(style.id === selectedCuisine ? "" : style.id)}
                      className={`p-4 rounded-lg border text-left transition-colors ${
                        selectedCuisine === style.id
                          ? "border-[#b94a2c] bg-[#fff8f0] dark:border-[#ff6b47] dark:bg-[#3a2e1e]"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                      } dark:text-white`}
                    >
                      <div className="font-medium mb-1">{language === "zh" ? style.zhName : style.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {language === "zh" ? style.zhDescription : style.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedIngredients([])
                  setSelectedMethods([])
                  setSelectedCuisine("")
                }}
                className="dark:text-gray-300 dark:border-gray-600"
              >
                {t("button.clearAll")}
              </Button>
              <Button
                className="bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a]"
                onClick={handleSearch}
              >
                {t("button.applyFilters")}
              </Button>
            </div>
          </div>
        </div>

        {/* Recipe Results */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-6 border dark:border-gray-700">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold dark:text-white">{t("recipe.recipeResults")}</h2>
            </div>

            <Tabs defaultValue="all">
              <TabsList className="dark:bg-gray-700 mb-6">
                <TabsTrigger
                  value="all"
                  onClick={() => setActiveFilter("all")}
                  className="dark:data-[state=active]:bg-gray-900"
                >
                  {t("filter.all")}
                </TabsTrigger>
                <TabsTrigger
                  value="eastern"
                  onClick={() => setActiveFilter("Eastern")}
                  className="dark:data-[state=active]:bg-gray-900"
                >
                  {t("filter.eastern")}
                </TabsTrigger>
                <TabsTrigger
                  value="western"
                  onClick={() => setActiveFilter("Western")}
                  className="dark:data-[state=active]:bg-gray-900"
                >
                  {t("filter.western")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                {filteredRecipes.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                    {filteredRecipes.map((recipe) => (
                      <div key={recipe.id} className="group relative">
                        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border dark:border-gray-700 hover:shadow-md transition-shadow">
                          <div className="relative h-48">
                            <Image
                              src={recipe.image || "/placeholder.svg"}
                              alt={recipe.title}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full px-2 py-1 text-xs font-medium">
                              {recipe.tags[0]}
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-lg mb-2 group-hover:text-[#b94a2c] dark:group-hover:text-[#ff6b47] transition-colors dark:text-white">
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
                                <span>{t(`recipe.difficulty.${recipe.difficulty.toLowerCase()}`)}</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {recipe.ingredients.map((ing, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-xs dark:border-gray-600 dark:text-gray-300"
                                >
                                  {ing}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex justify-between">
                              <Link href={`/recipe-details?id=${recipe.id}`} className="w-full">
                                <Button
                                  className="w-full bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a] text-white"
                                >
                                  {t("button.viewRecipe")}
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>

                        {/* Recipe Preview Overlay */}
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
                                      className="object-cover"
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
                                  <h2 className="text-xl font-bold mb-3 dark:text-white">{recipe.title}</h2>
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
                                      <span>{t(`recipe.difficulty.${recipe.difficulty.toLowerCase()}`)}</span>
                                    </div>
                                  </div>

                                  <h3 className="font-semibold mb-3 dark:text-white">{t("video.quickRecipeGuide")}</h3>
                                  <div className="space-y-4 mb-6">
                                    <div className="border-l-4 border-[#b94a2c] dark:border-[#ff6b47] pl-4">
                                      <h4 className="font-medium dark:text-white">{t("video.ingredients")}</h4>
                                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mt-2">
                                        {recipe.ingredients.map((ing, idx) => (
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

                                  <Link href={`/recipe-details?id=${recipe.id}`}>
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
                ) : (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="text-xl font-bold mb-2 dark:text-white">{t("recipe.noRecipesFound")}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{t("recipe.trySelecting")}</p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedIngredients([])
                        setSelectedMethods([])
                        setSelectedCuisine("")
                        setSearchQuery("")
                      }}
                      className="dark:text-gray-300 dark:border-gray-600"
                    >
                      {t("button.clearAll")}
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
