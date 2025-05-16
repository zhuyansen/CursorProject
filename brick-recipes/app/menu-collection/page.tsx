"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Clock, Flame, PlayCircle, ChefHat } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/language-provider"
import { useSearchParams } from "next/navigation"

// Mock data for recipe results
const mockRecipes = {
  breakfast: [
    {
      id: 101,
      title: "Brick Oven Pancakes",
      image: "/placeholder.svg?height=200&width=300",
      time: "20 min",
      calories: "320 kcal",
      difficulty: "Easy",
      tags: ["Breakfast", "Sweet"],
      ingredients: ["Flour", "Eggs", "Milk", "Sugar"],
      hasVideo: true,
    },
    {
      id: 102,
      title: "Brick Layer Omelette",
      image: "/placeholder.svg?height=200&width=300",
      time: "15 min",
      calories: "280 kcal",
      difficulty: "Easy",
      tags: ["Breakfast", "Savory"],
      ingredients: ["Eggs", "Cheese", "Vegetables", "Butter"],
      hasVideo: true,
    },
    {
      id: 103,
      title: "Brick Foundation Avocado Toast",
      image: "/placeholder.svg?height=200&width=300",
      time: "10 min",
      calories: "220 kcal",
      difficulty: "Easy",
      tags: ["Breakfast", "Healthy"],
      ingredients: ["Bread", "Avocado", "Lemon", "Salt"],
      hasVideo: true,
    },
    {
      id: 104,
      title: "Brick Road Breakfast Burrito",
      image: "/placeholder.svg?height=200&width=300",
      time: "25 min",
      calories: "450 kcal",
      difficulty: "Medium",
      tags: ["Breakfast", "Mexican"],
      ingredients: ["Tortilla", "Eggs", "Beans", "Cheese"],
      hasVideo: true,
    },
    {
      id: 105,
      title: "Brick Corner Granola Bowl",
      image: "/placeholder.svg?height=200&width=300",
      time: "10 min",
      calories: "380 kcal",
      difficulty: "Easy",
      tags: ["Breakfast", "Healthy"],
      ingredients: ["Yogurt", "Granola", "Berries", "Honey"],
      hasVideo: true,
    },
    {
      id: 106,
      title: "Brick Top French Toast",
      image: "/placeholder.svg?height=200&width=300",
      time: "20 min",
      calories: "420 kcal",
      difficulty: "Easy",
      tags: ["Breakfast", "Sweet"],
      ingredients: ["Bread", "Eggs", "Milk", "Cinnamon"],
      hasVideo: true,
    },
  ],
  lunch: [
    {
      id: 201,
      title: "Brick House Sandwich",
      image: "/placeholder.svg?height=200&width=300",
      time: "15 min",
      calories: "380 kcal",
      difficulty: "Easy",
      tags: ["Lunch", "Quick"],
      ingredients: ["Bread", "Cheese", "Lettuce", "Turkey"],
      hasVideo: true,
    },
    {
      id: 202,
      title: "Brick Wall Salad",
      image: "/placeholder.svg?height=200&width=300",
      time: "10 min",
      calories: "180 kcal",
      difficulty: "Easy",
      tags: ["Lunch", "Healthy"],
      ingredients: ["Lettuce", "Tomato", "Cucumber", "Dressing"],
      hasVideo: true,
    },
    {
      id: 203,
      title: "Brick Layer Soup",
      image: "/placeholder.svg?height=200&width=300",
      time: "30 min",
      calories: "250 kcal",
      difficulty: "Medium",
      tags: ["Lunch", "Comfort"],
      ingredients: ["Chicken", "Vegetables", "Noodles", "Broth"],
      hasVideo: true,
    },
    {
      id: 204,
      title: "Brick Road Wrap",
      image: "/placeholder.svg?height=200&width=300",
      time: "15 min",
      calories: "320 kcal",
      difficulty: "Easy",
      tags: ["Lunch", "Vegetarian"],
      ingredients: ["Tortilla", "Hummus", "Vegetables", "Feta"],
      hasVideo: true,
    },
    {
      id: 205,
      title: "Brick Tower Burger",
      image: "/placeholder.svg?height=200&width=300",
      time: "25 min",
      calories: "520 kcal",
      difficulty: "Medium",
      tags: ["Lunch", "American"],
      ingredients: ["Beef", "Cheese", "Lettuce", "Bun"],
      hasVideo: true,
    },
    {
      id: 206,
      title: "Brick Edge Pita Pocket",
      image: "/placeholder.svg?height=200&width=300",
      time: "15 min",
      calories: "350 kcal",
      difficulty: "Easy",
      tags: ["Lunch", "Mediterranean"],
      ingredients: ["Pita", "Falafel", "Tzatziki", "Vegetables"],
      hasVideo: true,
    },
  ],
  dinner: [
    {
      id: 301,
      title: "Brick Oven Pizza",
      image: "/placeholder.svg?height=200&width=300",
      time: "30 min",
      calories: "520 kcal",
      difficulty: "Medium",
      tags: ["Dinner", "Italian"],
      ingredients: ["Dough", "Sauce", "Cheese", "Toppings"],
      hasVideo: true,
    },
    {
      id: 302,
      title: "Brick Layer Lasagna",
      image: "/placeholder.svg?height=200&width=300",
      time: "60 min",
      calories: "620 kcal",
      difficulty: "Hard",
      tags: ["Dinner", "Italian"],
      ingredients: ["Pasta", "Sauce", "Cheese", "Meat"],
      hasVideo: true,
    },
    {
      id: 303,
      title: "Brick Wall Steak",
      image: "/placeholder.svg?height=200&width=300",
      time: "40 min",
      calories: "480 kcal",
      difficulty: "Medium",
      tags: ["Dinner", "American"],
      ingredients: ["Steak", "Butter", "Garlic", "Herbs"],
      hasVideo: true,
    },
    {
      id: 304,
      title: "Brick Foundation Risotto",
      image: "/placeholder.svg?height=200&width=300",
      time: "45 min",
      calories: "420 kcal",
      difficulty: "Medium",
      tags: ["Dinner", "Italian"],
      ingredients: ["Rice", "Broth", "Wine", "Parmesan"],
      hasVideo: true,
    },
    {
      id: 305,
      title: "Brick Side Salmon",
      image: "/placeholder.svg?height=200&width=300",
      time: "30 min",
      calories: "380 kcal",
      difficulty: "Medium",
      tags: ["Dinner", "Seafood"],
      ingredients: ["Salmon", "Lemon", "Dill", "Olive Oil"],
      hasVideo: true,
    },
    {
      id: 306,
      title: "Brick Column Curry",
      image: "/placeholder.svg?height=200&width=300",
      time: "40 min",
      calories: "450 kcal",
      difficulty: "Medium",
      tags: ["Dinner", "Indian"],
      ingredients: ["Chicken", "Spices", "Coconut Milk", "Rice"],
      hasVideo: true,
    },
  ],
  desserts: [
    {
      id: 401,
      title: "Brick Layer Cake",
      image: "/placeholder.svg?height=200&width=300",
      time: "50 min",
      calories: "380 kcal",
      difficulty: "Medium",
      tags: ["Dessert", "Baking"],
      ingredients: ["Flour", "Sugar", "Butter", "Eggs"],
      hasVideo: true,
    },
    {
      id: 402,
      title: "Brick Road Cookies",
      image: "/placeholder.svg?height=200&width=300",
      time: "25 min",
      calories: "220 kcal",
      difficulty: "Easy",
      tags: ["Dessert", "Baking"],
      ingredients: ["Flour", "Sugar", "Butter", "Chocolate"],
      hasVideo: true,
    },
    {
      id: 403,
      title: "Brick House Brownies",
      image: "/placeholder.svg?height=200&width=300",
      time: "35 min",
      calories: "320 kcal",
      difficulty: "Easy",
      tags: ["Dessert", "Chocolate"],
      ingredients: ["Chocolate", "Flour", "Sugar", "Eggs"],
      hasVideo: true,
    },
    {
      id: 404,
      title: "Brick Oven Apple Pie",
      image: "/placeholder.svg?height=200&width=300",
      time: "60 min",
      calories: "350 kcal",
      difficulty: "Medium",
      tags: ["Dessert", "Baking"],
      ingredients: ["Apples", "Flour", "Sugar", "Cinnamon"],
      hasVideo: true,
    },
    {
      id: 405,
      title: "Brick Pillar Ice Cream",
      image: "/placeholder.svg?height=200&width=300",
      time: "240 min",
      calories: "280 kcal",
      difficulty: "Medium",
      tags: ["Dessert", "Frozen"],
      ingredients: ["Cream", "Sugar", "Vanilla", "Eggs"],
      hasVideo: true,
    },
    {
      id: 406,
      title: "Brick Edge Tiramisu",
      image: "/placeholder.svg?height=200&width=300",
      time: "30 min",
      calories: "420 kcal",
      difficulty: "Medium",
      tags: ["Dessert", "Italian"],
      ingredients: ["Ladyfingers", "Coffee", "Mascarpone", "Cocoa"],
      hasVideo: true,
    },
  ],
  snacks: [
    {
      id: 501,
      title: "Brick Chips",
      image: "/placeholder.svg?height=200&width=300",
      time: "20 min",
      calories: "180 kcal",
      difficulty: "Easy",
      tags: ["Snack", "Crunchy"],
      ingredients: ["Potatoes", "Oil", "Salt", "Herbs"],
      hasVideo: true,
    },
    {
      id: 502,
      title: "Brick Dip",
      image: "/placeholder.svg?height=200&width=300",
      time: "15 min",
      calories: "150 kcal",
      difficulty: "Easy",
      tags: ["Snack", "Creamy"],
      ingredients: ["Yogurt", "Herbs", "Garlic", "Lemon"],
      hasVideo: true,
    },
    {
      id: 503,
      title: "Brick Bites",
      image: "/placeholder.svg?height=200&width=300",
      time: "25 min",
      calories: "220 kcal",
      difficulty: "Easy",
      tags: ["Snack", "Party"],
      ingredients: ["Cheese", "Pastry", "Herbs", "Egg"],
      hasVideo: true,
    },
    {
      id: 504,
      title: "Brick Nuts",
      image: "/placeholder.svg?height=200&width=300",
      time: "10 min",
      calories: "280 kcal",
      difficulty: "Easy",
      tags: ["Snack", "Protein"],
      ingredients: ["Nuts", "Spices", "Oil", "Salt"],
      hasVideo: true,
    },
    {
      id: 505,
      title: "Brick Popcorn Mix",
      image: "/placeholder.svg?height=200&width=300",
      time: "15 min",
      calories: "200 kcal",
      difficulty: "Easy",
      tags: ["Snack", "Movie"],
      ingredients: ["Popcorn", "Butter", "Salt", "Seasonings"],
      hasVideo: true,
    },
    {
      id: 506,
      title: "Brick Trail Mix",
      image: "/placeholder.svg?height=200&width=300",
      time: "10 min",
      calories: "320 kcal",
      difficulty: "Easy",
      tags: ["Snack", "Healthy"],
      ingredients: ["Nuts", "Dried Fruit", "Seeds", "Chocolate"],
      hasVideo: true,
    },
  ],
  drinks: [
    {
      id: 601,
      title: "Brick Smoothie",
      image: "/placeholder.svg?height=200&width=300",
      time: "10 min",
      calories: "180 kcal",
      difficulty: "Easy",
      tags: ["Drink", "Healthy"],
      ingredients: ["Banana", "Berries", "Yogurt", "Milk"],
      hasVideo: true,
    },
    {
      id: 602,
      title: "Brick Lemonade",
      image: "/placeholder.svg?height=200&width=300",
      time: "15 min",
      calories: "120 kcal",
      difficulty: "Easy",
      tags: ["Drink", "Refreshing"],
      ingredients: ["Lemon", "Sugar", "Water", "Mint"],
      hasVideo: true,
    },
    {
      id: 603,
      title: "Brick Cocktail",
      image: "/placeholder.svg?height=200&width=300",
      time: "10 min",
      calories: "220 kcal",
      difficulty: "Easy",
      tags: ["Drink", "Alcoholic"],
      ingredients: ["Whiskey", "Bitters", "Sugar", "Orange"],
      hasVideo: true,
    },
    {
      id: 604,
      title: "Brick Coffee",
      image: "/placeholder.svg?height=200&width=300",
      time: "5 min",
      calories: "80 kcal",
      difficulty: "Easy",
      tags: ["Drink", "Morning"],
      ingredients: ["Coffee", "Water", "Milk", "Sugar"],
      hasVideo: true,
    },
    {
      id: 605,
      title: "Brick Column Milkshake",
      image: "/placeholder.svg?height=200&width=300",
      time: "10 min",
      calories: "350 kcal",
      difficulty: "Easy",
      tags: ["Drink", "Dessert"],
      ingredients: ["Ice Cream", "Milk", "Chocolate", "Whipped Cream"],
      hasVideo: true,
    },
    {
      id: 606,
      title: "Brick Tea Infusion",
      image: "/placeholder.svg?height=200&width=300",
      time: "8 min",
      calories: "40 kcal",
      difficulty: "Easy",
      tags: ["Drink", "Healthy"],
      ingredients: ["Tea Leaves", "Water", "Herbs", "Honey"],
      hasVideo: true,
    },
  ],
}

export default function MenuCollection() {
  const { t, language } = useLanguage()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("breakfast")
  
  // Set active category from URL parameter if available
  useEffect(() => {
    const category = searchParams.get("category")
    if (category && mockRecipes[category as keyof typeof mockRecipes]) {
      setActiveCategory(category)
    }
  }, [searchParams])

  // Filter recipes based on search query and active category
  const filteredRecipes = mockRecipes[activeCategory as keyof typeof mockRecipes].filter((recipe) => {
    return recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - 去掉搜索框 */}
      <div className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-2 text-center dark:text-white">
            {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Recipes
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
            {t(`menu.description.${activeCategory}`)}
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* Recipe Results */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6 border dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold dark:text-white">{t("recipe.recipeResults")}</h2>
          </div>

          <Tabs defaultValue={activeCategory} value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="dark:bg-gray-700">
              <TabsTrigger
                value="breakfast"
                className="dark:data-[state=active]:bg-gray-900"
              >
                Breakfast
              </TabsTrigger>
              <TabsTrigger
                value="lunch"
                className="dark:data-[state=active]:bg-gray-900"
              >
                Lunch
              </TabsTrigger>
              <TabsTrigger
                value="dinner"
                className="dark:data-[state=active]:bg-gray-900"
              >
                Dinner
              </TabsTrigger>
              <TabsTrigger
                value="desserts"
                className="dark:data-[state=active]:bg-gray-900"
              >
                Desserts
              </TabsTrigger>
              <TabsTrigger
                value="snacks"
                className="dark:data-[state=active]:bg-gray-900"
              >
                Snacks
              </TabsTrigger>
              <TabsTrigger
                value="drinks"
                className="dark:data-[state=active]:bg-gray-900"
              >
                Drinks
              </TabsTrigger>
            </TabsList>

            {Object.keys(mockRecipes).map((category) => (
              <TabsContent key={category} value={category} className="mt-4">
                {filteredRecipes.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                            {recipe.hasVideo && (
                              <div className="absolute bottom-2 right-2">
                                <div className="bg-white/80 dark:bg-gray-800/80 p-1 rounded-full">
                                  <PlayCircle className="h-6 w-6 text-[#b94a2c] dark:text-[#ff6b47]" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-lg mb-2 group-hover:text-[#b94a2c] dark:group-hover:text-[#ff6b47] transition-colors dark:text-white">
                              {recipe.title}
                            </h3>
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-4 mb-3">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{recipe.time.split(" ")[0]} {t("recipe.timeUnit")}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Flame className="h-4 w-4" />
                                <span>{recipe.calories.split(" ")[0]} {t("recipe.calorieUnit")}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <ChefHat className="h-4 w-4" />
                                <span>
                                  {language === "zh" ? 
                                    (recipe.difficulty?.toLowerCase() === "easy" ? "简单" : 
                                     recipe.difficulty?.toLowerCase() === "medium" ? "中等" : 
                                     recipe.difficulty?.toLowerCase() === "hard" ? "困难" : recipe.difficulty) : 
                                    recipe.difficulty}
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between mt-4">
                              <Link href={`/recipe-details?id=${recipe.id}`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-[#b94a2c] dark:text-[#ff6b47] dark:border-gray-600 w-full"
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
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="text-xl font-bold mb-2 dark:text-white">{t("recipe.noRecipesFound")}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{t("recipe.trySelecting")}</p>
                    <Button
                      variant="outline"
                      onClick={() => setSearchQuery("")}
                      className="dark:text-gray-300 dark:border-gray-600"
                    >
                      {t("button.clearAll")}
                    </Button>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  )
} 