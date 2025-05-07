"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Clock, Users, ChefHat, Flame, Heart, Share2, Printer, PlayCircle } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

// Mock recipe data
const recipe = {
  id: 1,
  title: {
    en: "Brick Oven Pizza",
    zh: "砖炉披萨"
  },
  description: {
    en: "A classic brick oven pizza with a crispy crust and delicious toppings. Perfect for a family dinner or entertaining guests.",
    zh: "经典砖炉披萨，酥脆的外皮和美味的配料。非常适合家庭晚餐或招待客人。"
  },
  image: "/placeholder.svg?height=500&width=800",
  videoUrl: "https://example.com/video",
  prepTime: "15 min",
  cookTime: "15 min",
  totalTime: "30 min",
  servings: 4,
  difficulty: {
    en: "Medium",
    zh: "中等"
  },
  calories: "320 kcal",
  author: "Chef Brick",
  ingredients: [
    {
      en: "2 1/2 cups all-purpose flour",
      zh: "2 1/2 杯通用面粉"
    },
    {
      en: "1 teaspoon salt",
      zh: "1 茶匙盐"
    },
    {
      en: "1 teaspoon sugar",
      zh: "1 茶匙糖"
    },
    {
      en: "1 tablespoon active dry yeast",
      zh: "1 汤匙活性干酵母"
    },
    {
      en: "1 cup warm water",
      zh: "1 杯温水"
    },
    {
      en: "2 tablespoons olive oil",
      zh: "2 汤匙橄榄油"
    },
    {
      en: "1/2 cup tomato sauce",
      zh: "1/2 杯番茄酱"
    },
    {
      en: "2 cups mozzarella cheese, shredded",
      zh: "2 杯马苏里拉奶酪，切碎"
    },
    {
      en: "1/4 cup parmesan cheese, grated",
      zh: "1/4 杯帕玛森奶酪，磨碎"
    },
    {
      en: "Toppings of your choice (pepperoni, mushrooms, bell peppers, etc.)",
      zh: "自选配料（意大利辣香肠、蘑菇、彩椒等）"
    },
  ],
  instructions: [
    {
      step: 1,
      description: {
        en: "In a large bowl, combine flour, salt, sugar, and yeast. Add warm water and olive oil, and mix until a dough forms.",
        zh: "在一个大碗中，混合面粉、盐、糖和酵母。加入温水和橄榄油，搅拌直至形成面团。"
      }
    },
    {
      step: 2,
      description: {
        en: "Knead the dough on a floured surface for about 5 minutes until smooth and elastic.",
        zh: "在撒有面粉的表面上揉面团约5分钟，直至光滑有弹性。"
      }
    },
    {
      step: 3,
      description: {
        en: "Place the dough in a greased bowl, cover with a damp cloth, and let rise in a warm place for about 30 minutes.",
        zh: "将面团放入涂油的碗中，用湿布盖好，放在温暖的地方发酵约30分钟。"
      }
    },
    {
      step: 4,
      description: {
        en: "Preheat your oven to 475°F (245°C). If you have a pizza stone, place it in the oven to heat.",
        zh: "预热烤箱至475°F（245°C）。如果有披萨石，放入烤箱加热。"
      }
    },
    {
      step: 5,
      description: {
        en: "Punch down the dough and roll it out on a floured surface to your desired thickness.",
        zh: "将面团压扁，在撒有面粉的表面上擀至所需厚度。"
      }
    },
    {
      step: 6,
      description: {
        en: "Transfer the dough to a pizza pan or a piece of parchment paper.",
        zh: "将面团转移到披萨盘或一张烘焙纸上。"
      }
    },
    {
      step: 7,
      description: {
        en: "Spread tomato sauce over the dough, leaving a small border for the crust.",
        zh: "将番茄酱涂抹在面团上，边缘留出一小部分作为饼边。"
      }
    },
    {
      step: 8,
      description: {
        en: "Sprinkle mozzarella and parmesan cheese over the sauce.",
        zh: "在酱上撒上马苏里拉奶酪和帕玛森奶酪。"
      }
    },
    {
      step: 9,
      description: {
        en: "Add your desired toppings.",
        zh: "加入您喜欢的配料。"
      }
    },
    {
      step: 10,
      description: {
        en: "Bake for 12-15 minutes, or until the crust is golden and the cheese is bubbly.",
        zh: "烤12-15分钟，直到饼边呈金黄色，奶酪冒泡。"
      }
    },
  ],
  nutritionFacts: {
    calories: 320,
    fat: "12g",
    saturatedFat: "5g",
    carbohydrates: "40g",
    protein: "15g",
    fiber: "2g",
    sugar: "3g",
    sodium: "580mg",
  },
  tags: ["Italian", "Dinner", "Family Friendly"],
}

export default function RecipeDetails() {
  const { t, language } = useLanguage()
  const [servings, setServings] = useState(recipe.servings)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Recipe Header */}
      <div className="bg-white border-b dark:bg-black dark:border-gray-800">
        <div className="container py-10 px-6 md:px-10 lg:px-16 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-10 items-start">
            {/* Recipe Title and Description */}
            <div className="flex-1 max-w-2xl">
              <h1 className="text-4xl font-bold mb-4 dark:text-white">{recipe.title[language]}</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg leading-relaxed">
                {recipe.description[language]}
              </p>

              {/* Recipe Meta Info */}
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full">
                  <Clock className="h-4 w-4 text-[#b94a2c] dark:text-[#ff6b47]" />
                  <span className="text-sm font-medium dark:text-white">{t("recipe.total")}: {recipe.totalTime}</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full">
                  <Users className="h-4 w-4 text-[#b94a2c] dark:text-[#ff6b47]" />
                  <span className="text-sm font-medium dark:text-white">{t("recipe.servings")}: {recipe.servings}</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full">
                  <ChefHat className="h-4 w-4 text-[#b94a2c] dark:text-[#ff6b47]" />
                  <span className="text-sm font-medium dark:text-white">{t("recipe.difficulty")}: {t(`recipe.difficulty.${recipe.difficulty[language].toLowerCase()}`)}</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full">
                  <Flame className="h-4 w-4 text-[#b94a2c] dark:text-[#ff6b47]" />
                  <span className="text-sm font-medium dark:text-white">{t("recipe.calories")}: {recipe.calories}</span>
                </div>
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-3 mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-gray-700 dark:text-white">CB</span>
                </div>
                <div>
                  <p className="text-sm font-medium dark:text-white">{t("recipe.by")} {recipe.author}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("recipe.publishedOn")} April 28, 2023</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mb-8">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="flex items-center gap-2 flex-1 dark:border-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Heart className="h-5 w-5" />
                  <span>{t("button.save")}</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="flex items-center gap-2 flex-1 dark:border-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Share2 className="h-5 w-5" />
                  <span>{t("button.share")}</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="flex items-center gap-2 flex-1 dark:border-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Printer className="h-5 w-5" />
                  <span>{t("button.print")}</span>
                </Button>
              </div>

              {/* Video Summary - Only visible on mobile */}
              <div className="bg-[#fff8f0] dark:bg-gray-800 p-5 rounded-lg mb-6 border border-[#f8e3c5] dark:border-gray-700 md:hidden">
                <h3 className="font-medium flex items-center gap-2 mb-3 dark:text-white">
                  <PlayCircle className="h-5 w-5 text-[#b94a2c] dark:text-[#ff6b47]" />
                  {t("video.videoSummary")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-200 leading-relaxed">
                  {language === "zh" 
                    ? "这个视频展示了如何在家中制作完美的砖炉披萨。厨师展示了拉伸面团、均匀涂抹酱料以及在没有专用烤箱的情况下获得酥脆外皮的技巧。关键时间点：面团准备（0:45）、酱料涂抹（3:20）、配料摆放（5:15）和烘焙技巧（7:30）。"
                    : "This video demonstrates how to make a perfect brick oven pizza at home. The chef shows techniques for stretching dough, applying sauce evenly, and achieving a crispy crust without a specialized oven. Key timestamps: dough preparation (0:45), sauce application (3:20), topping arrangement (5:15), and baking techniques (7:30)."}
                </p>
              </div>
            </div>

            {/* Video Preview */}
            <div className="w-full md:w-[450px] flex-shrink-0">
              <div className="sticky top-24">
                <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
                  <Image src={recipe.image || "/placeholder.svg"} alt={recipe.title[language]} fill className="object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button variant="outline" size="icon" className="rounded-full bg-white/80 hover:bg-white dark:bg-black/80 dark:hover:bg-black h-16 w-16">
                      <PlayCircle className="h-10 w-10 text-[#b94a2c] dark:text-[#ff6b47]" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 text-center text-sm text-gray-500 dark:text-gray-300">
                  {language === "zh" ? "点击观看视频教程" : "Click to watch the video tutorial"}
                </div>
                
                {/* Video Summary - Hidden on mobile */}
                <div className="bg-[#fff8f0] dark:bg-gray-800 p-5 rounded-lg mt-6 border border-[#f8e3c5] dark:border-gray-700 hidden md:block">
                  <h3 className="font-medium flex items-center gap-2 mb-3 dark:text-white">
                    <PlayCircle className="h-5 w-5 text-[#b94a2c] dark:text-[#ff6b47]" />
                    {t("video.videoSummary")}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-200 leading-relaxed">
                    {language === "zh" 
                      ? "这个视频展示了如何在家中制作完美的砖炉披萨。厨师展示了拉伸面团、均匀涂抹酱料以及在没有专用烤箱的情况下获得酥脆外皮的技巧。关键时间点：面团准备（0:45）、酱料涂抹（3:20）、配料摆放（5:15）和烘焙技巧（7:30）。"
                      : "This video demonstrates how to make a perfect brick oven pizza at home. The chef shows techniques for stretching dough, applying sauce evenly, and achieving a crispy crust without a specialized oven. Key timestamps: dough preparation (0:45), sauce application (3:20), topping arrangement (5:15), and baking techniques (7:30)."}
                  </p>
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
                  {recipe.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 border border-gray-300 dark:border-gray-500 rounded flex-shrink-0"></div>
                      <span className="text-gray-800 dark:text-white">{ingredient[language]}</span>
                    </div>
                  ))}
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
                  {recipe.instructions.map((instruction, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="w-8 h-8 bg-[#b94a2c] dark:bg-[#ff6b47] rounded-full flex items-center justify-center flex-shrink-0 text-white dark:text-black font-medium">
                        {instruction.step}
                      </div>
                      <p className="text-gray-700 dark:text-white">{instruction.description[language]}</p>
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
                <div className="text-3xl font-bold mb-2 dark:text-white">{recipe.nutritionFacts.calories}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {language === "zh" ? "每份卡路里" : "calories per serving"}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between dark:text-white">
                  <span>{language === "zh" ? "总脂肪" : "Total Fat"}</span>
                  <span>{recipe.nutritionFacts.fat}</span>
                </div>
                <div className="flex justify-between pl-6 text-sm text-gray-600 dark:text-gray-300">
                  <span>{language === "zh" ? "饱和脂肪" : "Saturated Fat"}</span>
                  <span>{recipe.nutritionFacts.saturatedFat}</span>
                </div>
                <div className="flex justify-between dark:text-white">
                  <span>{language === "zh" ? "总碳水化合物" : "Total Carbohydrates"}</span>
                  <span>{recipe.nutritionFacts.carbohydrates}</span>
                </div>
                <div className="flex justify-between pl-6 text-sm text-gray-600 dark:text-gray-300">
                  <span>{language === "zh" ? "膳食纤维" : "Dietary Fiber"}</span>
                  <span>{recipe.nutritionFacts.fiber}</span>
                </div>
                <div className="flex justify-between pl-6 text-sm text-gray-600 dark:text-gray-300">
                  <span>{language === "zh" ? "糖分" : "Sugars"}</span>
                  <span>{recipe.nutritionFacts.sugar}</span>
                </div>
                <div className="flex justify-between dark:text-white">
                  <span>{language === "zh" ? "蛋白质" : "Protein"}</span>
                  <span>{recipe.nutritionFacts.protein}</span>
                </div>
                <div className="flex justify-between dark:text-white">
                  <span>{language === "zh" ? "钠" : "Sodium"}</span>
                  <span>{recipe.nutritionFacts.sodium}</span>
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
