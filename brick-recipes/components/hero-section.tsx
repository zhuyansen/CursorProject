import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { TranslatedText } from "@/components/main-nav"
import { useLanguage } from "@/components/language-provider"
import { useRouter } from "next/navigation"
import { ChefHat, Utensils, Video } from "lucide-react"

export default function HeroSection() {
  const { resolvedTheme } = useTheme()
  const [logoSrc, setLogoSrc] = useState("/BrickRecipes.svg")
  const { t, language } = useLanguage()
  const router = useRouter()
  
  // 默认选中第一个按钮
  const [activeButton, setActiveButton] = useState("ingredients")
  
  useEffect(() => {
    setLogoSrc(resolvedTheme === "dark" ? "/BrickRecipes_dark.svg" : "/BrickRecipes.svg")
  }, [resolvedTheme])
  
  // 点击按钮处理函数
  const handleButtonClick = (buttonType: string, path: string) => {
    setActiveButton(buttonType)
    router.push(path)
  }

  // 按钮样式
  const primaryButtonClass = "bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a] text-white"
  const secondaryButtonClass = "bg-white hover:bg-gray-100 text-[#b94a2c] border border-[#b94a2c] dark:bg-gray-800 dark:text-[#ff6b47] dark:border-[#ff6b47] dark:hover:bg-gray-700"
  const baseButtonClass = "px-6 py-5 rounded-md text-base md:text-lg"

  // 功能特性数据
  const features = [
    {
      icon: <ChefHat className="w-8 h-8 mb-2 text-[#b94a2c] dark:text-[#ff6b47]" />,
      title: language === "zh" ? "按食材查找" : "Search by Ingredients",
      description: language === "zh" ? "选择您已有的食材，获取个性化食谱推荐" : "Select ingredients you have, get personalized recipe recommendations",
      buttonText: "button.findByIngredients",
      path: "/brick-link-recipes",
      type: "ingredients"
    },
    {
      icon: <Utensils className="w-8 h-8 mb-2 text-[#b94a2c] dark:text-[#ff6b47]" />,
      title: language === "zh" ? "精选菜单" : "Curated Menu",
      description: language === "zh" ? "探索我们精心准备的带有视频教程的食谱合集" : "Explore our carefully curated recipe collections with video tutorials",
      buttonText: "button.browseMenu",
      path: "/menu",
      type: "menu"
    },
    {
      icon: <Video className="w-8 h-8 mb-2 text-[#b94a2c] dark:text-[#ff6b47]" />,
      title: language === "zh" ? "视频转食谱" : "Video to Recipes",
      description: language === "zh" ? "将任何烹饪视频转换为详细的食谱指南" : "Turn any cooking video into a detailed recipe guide",
      buttonText: "button.videoToRecipes",
      path: "/videotorecipes",
      type: "video"
    }
  ]

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-[#fff8f0] via-[#fff2e5] to-white dark:from-gray-800 dark:via-gray-900 dark:to-black overflow-hidden relative">
      {/* 装饰元素 */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#f8e3c5] dark:bg-[#3a2e1e] rounded-full opacity-30 blur-xl"></div>
      <div className="absolute top-1/2 -left-24 w-48 h-48 bg-[#f8e3c5] dark:bg-[#3a2e1e] rounded-full opacity-30 blur-xl"></div>
      <div className="absolute -bottom-12 right-1/4 w-36 h-36 bg-[#b94a2c] dark:bg-[#ff6b47] rounded-full opacity-20 blur-lg"></div>
      
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* 主标题部分 */}
        <div className="text-center mb-16">
          <div className="inline-block bg-[#f8e3c5] dark:bg-[#3a2e1e] px-5 py-1.5 rounded-full text-[#b94a2c] dark:text-[#ff6b47] font-medium text-sm mb-6 animate-bounce">
            {language === "zh" ? "革命性的食谱体验" : "Revolutionary Recipe Experience"}
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6 relative z-10 transition-all duration-700 ease-in-out">
            <span className="bg-gradient-to-r from-[#b94a2c] to-[#e05a3a] dark:from-[#ff6b47] dark:to-[#ff8a6f] text-transparent bg-clip-text">
              {language === "zh" ? "厨房革命" : "Kitchen Revolution"}
            </span>
            <br />
            {language === "zh" ? "一砖一瓦构建美食!" : "Build Delicious, Brick by Brick!"}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10">
            {language === "zh" 
              ? "通过食材查找食谱、探索精选合集或将视频转换为详细食谱指南 — 一站式烹饪解决方案" 
              : "Find recipes by ingredients, explore curated collections, or convert videos into detailed recipes — all in one place"
            }
          </p>
          
          {/* 功能亮点列表 */}
          <div className="max-w-3xl mx-auto text-left space-y-6 mb-10">
            <div className="flex items-start gap-4">
              <div className="bg-[#f8e3c5] dark:bg-[#3a2e1e] p-3 rounded-full text-[#b94a2c] dark:text-[#ff6b47]">
                <ChefHat className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {language === "zh" ? "🔍 按食材查找食谱" : "🔍 Find by Ingredients"}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {language === "zh" 
                    ? "输入您已有的食材，立即获取个性化食谱推荐" 
                    : "Input ingredients you have, instantly get personalized recipe suggestions"
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-[#f8e3c5] dark:bg-[#3a2e1e] p-3 rounded-full text-[#b94a2c] dark:text-[#ff6b47]">
                <Utensils className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {language === "zh" ? "📚 浏览精选菜单" : "📚 Browse Curated Menu"}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {language === "zh" 
                    ? "探索我们精心准备的食谱合集，配有详细视频教程" 
                    : "Explore our carefully crafted recipe collections with step-by-step video tutorials"
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-[#f8e3c5] dark:bg-[#3a2e1e] p-3 rounded-full text-[#b94a2c] dark:text-[#ff6b47]">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {language === "zh" ? "🎬 视频转食谱" : "🎬 Video to Recipes"}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {language === "zh" 
                    ? "将任何烹饪视频快速转换为详细的步骤食谱" 
                    : "Convert any cooking video into detailed step-by-step recipe instructions"
                  }
                </p>
              </div>
            </div>
          </div>
          
          {/* 主行动按钮 */}
          <div className="mt-8">
            <Button 
              className={`${baseButtonClass} ${primaryButtonClass} text-lg font-bold shadow-lg shadow-[#b94a2c]/30 dark:shadow-[#ff6b47]/30 px-8 py-6 relative overflow-hidden group`}
              onClick={() => handleButtonClick("ingredients", "/brick-link-recipes")}
            >
              <span className="absolute top-0 left-0 w-full h-full bg-white opacity-20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
              <TranslatedText textKey="button.tryNow" /> →
            </Button>
          </div>
        </div>
        
        {/* 三大功能特性展示 - 卡片式设计，保留但可以留作备用方案 */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700"
            >
              <div className="text-center">
                {feature.icon}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 h-16">{feature.description}</p>
                <Button 
                  className={`${baseButtonClass} ${activeButton === feature.type ? primaryButtonClass : secondaryButtonClass} w-full`}
                  onClick={() => handleButtonClick(feature.type, feature.path)}
                >
                  <TranslatedText textKey={feature.buttonText} />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {/* 统计数据部分 */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 md:col-span-3">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#b94a2c] to-[#e05a3a] rounded-full blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
                  <div className="relative">
                    <Image
                      src={logoSrc}
                      alt="BrickRecipes Logo"
                      width={70}
                      height={70}
                      className="object-contain transform group-hover:scale-110 transition duration-300"
                      priority
                    />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#b94a2c] dark:text-[#ff6b47] mb-1 group-hover:text-[#a03f25] dark:group-hover:text-[#ff8a6f] transition-colors">BrickRecipes</h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {language === "zh" ? "一砖一瓦构建您的食谱！" : "Build Your Recipes, Brick by Brick!"}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8 mt-6 md:mt-0">
                <div className="bg-[#f8e3c5] dark:bg-[#3a2e1e] p-5 rounded-lg text-center shadow-md transform hover:scale-105 transition-transform duration-300 hover:shadow-xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#b94a2c]/10 dark:to-[#ff6b47]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1"><TranslatedText textKey="hero.over" /></p>
                  <p className="text-4xl font-bold text-[#b94a2c] dark:text-[#ff6b47] group-hover:animate-pulse">1,000+</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1"><TranslatedText textKey="hero.recipes" /></p>
                </div>
                <div className="bg-[#f8e3c5] dark:bg-[#3a2e1e] p-5 rounded-lg text-center shadow-md transform hover:scale-105 transition-transform duration-300 hover:shadow-xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#b94a2c]/10 dark:to-[#ff6b47]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1"><TranslatedText textKey="hero.join" /></p>
                  <p className="text-4xl font-bold text-[#b94a2c] dark:text-[#ff6b47] group-hover:animate-pulse">200+</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1"><TranslatedText textKey="hero.users" /></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
