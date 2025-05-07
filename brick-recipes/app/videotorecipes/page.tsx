"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Clock, Flame, PlayCircle, ChefHat, AlertCircle, Loader2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useLanguage } from "@/components/language-provider"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"

export default function VideoToRecipes() {
  const { t, language } = useLanguage()
  const [videoUrl, setVideoUrl] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [activeTab, setActiveTab] = useState("youtube")
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [errorTitle, setErrorTitle] = useState("")
  const [processedUrl, setProcessedUrl] = useState("")

  // 当用户粘贴链接时自动检测类型
  useEffect(() => {
    if (!videoUrl) return;
    
    // 检测链接类型，但不自动切换标签页
    // 我们将允许用户看到错误信息，而不是自动切换
    const isYoutubeLink = /(?:youtube\.com\/|youtu\.be\/)/i.test(videoUrl);
    const isBilibiliLink = /(?:bilibili\.com\/video\/|b23\.tv\/)/i.test(videoUrl);
    
    // 如果是平台不匹配的情况，清除之前可能存在的成功状态
    if ((isYoutubeLink && activeTab !== "youtube") || (isBilibiliLink && activeTab !== "bilibili")) {
      setProcessedUrl("");
    }
  }, [videoUrl, activeTab]);

  // 验证视频URL并提取ID
  const validateVideoUrl = (url: string, platform: string) => {
    if (!url) return false;

    // 检测是否为YouTube链接
    const isYoutubeLink = /(?:youtube\.com\/|youtu\.be\/)/i.test(url);
    
    // 检测是否为Bilibili链接
    const isBilibiliLink = /(?:bilibili\.com\/video\/|b23\.tv\/)/i.test(url);

    // 平台不匹配检查 - YouTube链接在Bilibili标签页
    if (isYoutubeLink && platform === "bilibili") {
      setErrorTitle(t("video.platformMismatchTitle"));
      setErrorMessage(t("video.onlyUseYoutubeOnYoutube"));
      return false;
    }

    // 平台不匹配检查 - Bilibili链接在YouTube标签页
    if (isBilibiliLink && platform === "youtube") {
      setErrorTitle(t("video.platformMismatchTitle"));
      setErrorMessage(t("video.onlyUseBilibiliOnBilibili"));
      return false;
    }

    // YouTube链接验证
    if (platform === "youtube") {
      // 匹配各种YouTube URL格式
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
      const match = url.match(youtubeRegex);

      if (match && match[1]) {
        // 提取视频ID并构建标准化URL
        const videoId = match[1];
        setProcessedUrl(`https://www.youtube.com/watch?v=${videoId}`);
        console.log("处理后的YouTube链接:", `https://www.youtube.com/watch?v=${videoId}`);
        return true;
      } else {
        setErrorTitle(t("video.linkError"));
        setErrorMessage(t("video.invalidYoutubeLink"));
        return false;
      }
    }
    
    // Bilibili链接验证
    if (platform === "bilibili") {
      // 匹配Bilibili URL格式，支持BV号和av号格式
      const bilibiliRegex = /(?:bilibili\.com\/video\/|b23\.tv\/)(BV[a-zA-Z0-9]+|av\d+)/i;
      const match = url.match(bilibiliRegex);

      if (match && match[1]) {
        // 提取视频ID并构建标准化URL
        const videoId = match[1];
        setProcessedUrl(`https://www.bilibili.com/video/${videoId}`);
        console.log("处理后的Bilibili链接:", `https://www.bilibili.com/video/${videoId}`);
        return true;
      } else {
        setErrorTitle(t("video.linkError"));
        setErrorMessage(t("video.invalidBilibiliLink"));
        return false;
      }
    }
    
    // 不支持的链接类型
    setErrorTitle(t("video.linkError"));
    setErrorMessage(t("video.unsupportedPlatform"));
    return false;
  }

  const handleAnalyzeVideo = () => {
    if (!videoUrl) return;

    // 重置错误状态
    setShowError(false);
    setErrorMessage("");
    setErrorTitle("");

    // 根据当前活动的标签页验证URL
    const isValid = validateVideoUrl(videoUrl, activeTab);

    if (!isValid) {
      setShowError(true);
      return;
    }

    setIsAnalyzing(true);

    // 模拟视频分析
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisComplete(true);
    }, 3000);
  }

  // 关闭错误弹窗
  const closeErrorDialog = () => {
    setShowError(false);
  }

  // 处理标签切换，清除错误状态
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setShowError(false);
    setErrorMessage("");
    setErrorTitle("");

    // 检查当前输入的URL是否与新标签匹配
    if (videoUrl) {
      const isYoutubeLink = /(?:youtube\.com\/|youtu\.be\/)/i.test(videoUrl);
      const isBilibiliLink = /(?:bilibili\.com\/video\/|b23\.tv\/)/i.test(videoUrl);

      if ((value === "youtube" && !isYoutubeLink && isBilibiliLink) || 
          (value === "bilibili" && !isBilibiliLink && isYoutubeLink)) {
        // 如果切换到了不匹配的标签，清空输入框
        setVideoUrl("");
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
        <div className="container mx-auto px-6 md:px-10 lg:px-16 py-8">
          <h1 className="text-3xl font-bold mb-2 text-center dark:text-white">{t("video.title")}</h1>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-6">{t("video.description")}</p>

          <div className="max-w-2xl mx-auto">
            <Tabs defaultValue="youtube" className="mb-6" onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2 dark:bg-gray-700">
                <TabsTrigger value="youtube" className="dark:data-[state=active]:bg-gray-900 dark:text-gray-200">
                  YouTube
                </TabsTrigger>
                <TabsTrigger value="bilibili" className="dark:data-[state=active]:bg-gray-900 dark:text-gray-200">
                  Bilibili
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative">
              <Input
                type="text"
                placeholder={t("video.pastePlaceholder").replace(
                  "{platform}",
                  activeTab === "youtube" ? "YouTube" : "Bilibili",
                )}
                className="pl-10 py-6 text-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Button
                className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a]"
                onClick={handleAnalyzeVideo}
                disabled={isAnalyzing || !videoUrl}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("button.analyzing")}
                  </>
                ) : (
                  t("button.analyzeVideo")
                )}
              </Button>
            </div>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">{t("video.searchVideoUrl")}</p>
          </div>
        </div>
      </div>

      {/* 错误对话框 */}
      <Dialog open={showError} onOpenChange={closeErrorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-500">
              <AlertCircle className="h-5 w-5 mr-2" />
              {errorTitle || t("video.linkError")}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {errorMessage}
            </DialogDescription>
            {(errorTitle === t("video.platformMismatchTitle")) && (
              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-sm">
                <p className="text-gray-700 dark:text-gray-300">{t("video.switchToCorrectTab")}</p>
              </div>
            )}
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={closeErrorDialog} className="bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a]">
              {t("video.confirmButtonText")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-6 md:px-10 lg:px-16 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Tips Alert */}
          <Alert className="mb-8 dark:bg-gray-800 dark:border-gray-700">
            <AlertCircle className="h-4 w-4 dark:text-gray-300" />
            <AlertTitle className="dark:text-white">{t("video.tipTitle")}</AlertTitle>
            <AlertDescription className="dark:text-gray-300">
              <p className="mb-2">{t("video.forBestResults")}:</p>
              <ul className="list-disc list-inside text-sm">
                <li>{t("video.tipClearVideo")}</li>
                <li>{t("video.tipMayTakeTime")}</li>
                <li>{t("video.tipDetailedVideo")}</li>
                <li>{t("video.tipCorrectUrl")}</li>
                <li className="font-medium text-[#b94a2c] dark:text-[#ff6b47]">
                  {activeTab === "youtube" 
                    ? t("video.onlyUseYoutubeOnYoutube") 
                    : t("video.onlyUseBilibiliOnBilibili")}
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* 示例链接提示 */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-8 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium mb-2 dark:text-white">
              {t("video.exampleLinkFormats")}
            </h3>
            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
              {activeTab === "youtube" ? (
                <p><strong>YouTube:</strong> https://www.youtube.com/watch?v=kYPfnnuviFI</p>
              ) : (
                <p><strong>Bilibili:</strong> https://www.bilibili.com/video/BV16J411U79k</p>
              )}
            </div>
          </div>

          {isAnalyzing && (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm text-center dark:border dark:border-gray-700">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-[#b94a2c] dark:text-[#ff6b47]" />
              <h2 className="text-2xl font-bold mb-2 dark:text-white">{t("video.analyzingVideo")}</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">{t("video.pleaseWait")}</p>
              <div className="w-full max-w-md mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-6">
                <div className="bg-[#b94a2c] dark:bg-[#ff6b47] h-2.5 rounded-full w-2/3 animate-pulse"></div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("video.identifying")}</p>
            </div>
          )}

          {analysisComplete && !isAnalyzing && (
            <div className="grid md:grid-cols-3 gap-8">
              {/* Video Preview */}
              <div className="md:col-span-1">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm dark:border dark:border-gray-700">
                  <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                    <Image
                      src="/placeholder.svg?height=300&width=500"
                      alt="Video thumbnail"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800"
                      >
                        <PlayCircle className="h-12 w-12 text-[#b94a2c] dark:text-[#ff6b47]" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 dark:text-white">Homemade Pizza Recipe</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    By Chef John • 1.2M views • 15:42 minutes
                  </p>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>30 min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Flame className="h-4 w-4" />
                      <span>320 kcal</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ChefHat className="h-4 w-4" />
                      <span>Medium</span>
                    </div>
                  </div>
                  <a 
                    href={processedUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a]">
                      {t("button.watchOriginalVideo")}
                    </Button>
                  </a>
                </div>
              </div>

              {/* Recipe Details */}
              <div className="md:col-span-2">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm mb-6 dark:border dark:border-gray-700">
                  <h2 className="text-xl font-bold mb-4 dark:text-white">{t("video.videoSummary")}</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    This video demonstrates how to make a perfect homemade pizza from scratch. The chef shows techniques
                    for making the dough, preparing the sauce, and achieving a crispy crust using a regular home oven. Key
                    techniques include proper kneading methods, the importance of letting the dough rest, and how to
                    stretch the dough without tearing.
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-medium mb-2 dark:text-white">Key Timestamps</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm dark:text-gray-300">
                      <div>0:45 - Dough preparation</div>
                      <div>3:20 - Sauce making</div>
                      <div>5:15 - Dough stretching</div>
                      <div>7:30 - Topping application</div>
                      <div>9:45 - Baking techniques</div>
                      <div>12:30 - Serving suggestions</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm mb-6 dark:border dark:border-gray-700">
                  <h2 className="text-xl font-bold mb-4 dark:text-white">{t("video.quickRecipeGuide")}</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-2 dark:text-white">{t("video.ingredients")}</h3>
                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
                        <li>2 1/2 cups all-purpose flour</li>
                        <li>1 teaspoon salt</li>
                        <li>1 teaspoon sugar</li>
                        <li>1 tablespoon active dry yeast</li>
                        <li>1 cup warm water</li>
                        <li>2 tablespoons olive oil</li>
                        <li>1/2 cup tomato sauce</li>
                        <li>2 cups mozzarella cheese, shredded</li>
                        <li>Toppings of your choice</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2 dark:text-white">{t("video.preparationSteps")}</h3>
                      <ol className="list-decimal list-inside text-gray-600 dark:text-gray-300">
                        <li>Mix flour, salt, sugar, and yeast in a large bowl</li>
                        <li>Add warm water and olive oil, mix until dough forms</li>
                        <li>Knead dough for 5 minutes until smooth and elastic</li>
                        <li>Let dough rise for 30 minutes in a warm place</li>
                        <li>Preheat oven to 475°F (245°C)</li>
                        <li>Roll out dough and transfer to a baking sheet</li>
                        <li>Add sauce, cheese, and toppings</li>
                        <li>Bake for 12-15 minutes until crust is golden</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm dark:border dark:border-gray-700">
                  <h2 className="text-xl font-bold mb-4 dark:text-white">{t("video.nutritionInformation")}</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                        <div className="bg-gray-100 dark:bg-gray-700 p-3 border-b dark:border-gray-600">
                          <h3 className="font-medium dark:text-white">{t("video.amountPerServing")}</h3>
                        </div>
                        <div className="p-3 border-b dark:border-gray-600">
                          <div className="flex justify-between items-center dark:text-white">
                            <span className="font-medium">Calories</span>
                            <span>320</span>
                          </div>
                        </div>
                        <div className="p-3 space-y-2 text-sm dark:text-gray-300">
                          <div className="flex justify-between">
                            <span>Total Fat</span>
                            <span>12g</span>
                          </div>
                          <div className="flex justify-between pl-4 text-gray-600 dark:text-gray-400">
                            <span>Saturated Fat</span>
                            <span>5g</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Carbohydrates</span>
                            <span>40g</span>
                          </div>
                          <div className="flex justify-between pl-4 text-gray-600 dark:text-gray-400">
                            <span>Dietary Fiber</span>
                            <span>2g</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Protein</span>
                            <span>15g</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3 dark:text-white">{t("video.dietaryInformation")}</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                          Vegetarian
                        </Badge>
                        <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                          High Protein
                        </Badge>
                        <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                          Contains Gluten
                        </Badge>
                        <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                          Contains Dairy
                        </Badge>
                      </div>

                      <h3 className="font-medium mb-3 dark:text-white">{t("video.healthBenefits")}</h3>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                        <li>Good source of calcium from cheese</li>
                        <li>Contains lycopene from tomato sauce</li>
                        <li>Provides complex carbohydrates for energy</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Link href="/recipe-details?id=1">
                      <Button className="bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a]">
                        {t("button.viewFullRecipe")}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isAnalyzing && !analysisComplete && (
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm dark:border dark:border-gray-700">
                <div className="w-12 h-12 bg-[#f8e3c5] dark:bg-[#3a2e1e] rounded-full flex items-center justify-center mb-4">
                  <PlayCircle className="h-6 w-6 text-[#b94a2c] dark:text-[#ff6b47]" />
                </div>
                <h2 className="text-xl font-bold mb-4 dark:text-white">{t("video.howItWorks")}</h2>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-[#b94a2c] dark:bg-[#ff6b47] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white dark:text-black text-xs font-medium">
                      1
                    </div>
                    <span>{t("video.howItWorksContent1")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-[#b94a2c] dark:bg-[#ff6b47] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white dark:text-black text-xs font-medium">
                      2
                    </div>
                    <span>{t("video.howItWorksContent2")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-[#b94a2c] dark:bg-[#ff6b47] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white dark:text-black text-xs font-medium">
                      3
                    </div>
                    <span>{t("video.howItWorksContent3")}</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm dark:border dark:border-gray-700">
                <div className="w-12 h-12 bg-[#f8e3c5] dark:bg-[#3a2e1e] rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-[#b94a2c] dark:text-[#ff6b47]"
                  >
                    <path d="M12 2H2v10h10V2Z" />
                    <path d="M22 12h-8v10h8V12Z" />
                    <path d="M12 12H2v10h10V12Z" />
                    <path d="M22 2h-8v6h8V2Z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold mb-4 dark:text-white">{t("video.supportedVideoTypes")}</h2>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 border border-[#b94a2c] dark:border-[#ff6b47] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"></div>
                    <span>{t("video.supportedVideoTypes1")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 border border-[#b94a2c] dark:border-[#ff6b47] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"></div>
                    <span>{t("video.supportedVideoTypes2")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 border border-[#b94a2c] dark:border-[#ff6b47] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"></div>
                    <span>{t("video.supportedVideoTypes3")}</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 