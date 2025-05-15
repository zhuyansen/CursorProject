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
  const [recipeData, setRecipeData] = useState<any>(null)

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

  const handleAnalyzeVideo = async () => {
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

    // 提取视频ID并构建URL（不依赖processedUrl状态）
    let urlToProcess = "";
    
    if (activeTab === "youtube") {
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
      const match = videoUrl.match(youtubeRegex);
      
      if (match && match[1]) {
        const videoId = match[1];
        urlToProcess = `https://www.youtube.com/watch?v=${videoId}`;
      } else {
        setShowError(true);
        setErrorTitle(t("video.linkError"));
        setErrorMessage(t("video.invalidYoutubeLink"));
        return;
      }
    } else if (activeTab === "bilibili") {
      const bilibiliRegex = /(?:bilibili\.com\/video\/|b23\.tv\/)(BV[a-zA-Z0-9]+|av\d+)/i;
      const match = videoUrl.match(bilibiliRegex);
      
      if (match && match[1]) {
        const videoId = match[1];
        urlToProcess = `https://www.bilibili.com/video/${videoId}`;
      } else {
        setShowError(true);
        setErrorTitle(t("video.linkError"));
        setErrorMessage(t("video.invalidBilibiliLink"));
        return;
      }
    }
    
    // 确保URL已处理
    if (!urlToProcess) {
      setShowError(true);
      setErrorTitle(t("video.linkError"));
      setErrorMessage(t("video.invalidVideoUrl"));
      return;
    }

    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setRecipeData(null);

    try {
      // 调用我们的API
      console.log("发送视频URL到API:", urlToProcess);
      const response = await fetch('/api/video-to-recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl: urlToProcess }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '视频分析失败');
      }

      const data = await response.json();
      console.log("API返回数据:", data);
      
      // 处理API返回的数据
      let processedData = data;
      
      // 如果data.summary存在且是字符串，尝试解析JSON
      if (data.summary && typeof data.summary === 'string') {
        try {
          // 尝试提取JSON部分
          const jsonMatch = data.summary.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch && jsonMatch[1]) {
            const parsedSummary = JSON.parse(jsonMatch[1]);
            processedData = {
              ...data,
              ...parsedSummary
            };
          }
        } catch (error) {
          console.error("解析summary JSON失败:", error);
        }
      } 
      // 如果data.summary已经是对象（在API中已处理），则直接使用
      else if (data.summary && typeof data.summary === 'object') {
        processedData = {
          ...data,
          ...data.summary
        };
      }
      
      console.log("处理后的数据:", processedData);
      setRecipeData(processedData);
      setIsAnalyzing(false);
      setAnalysisComplete(true);
    } catch (error: any) {
      console.error('分析视频时出错:', error);
      setIsAnalyzing(false);
      setShowError(true);
      setErrorTitle(t("video.analysisError"));
      setErrorMessage(error.message || t("video.genericError"));
    }
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
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-6">
                <Loader2 className="h-12 w-12 animate-spin text-[#b94a2c] dark:text-[#ff6b47]" />
              </div>
              <h2 className="text-xl font-bold mb-2 dark:text-white">{t("video.analyzingVideo")}</h2>
              <p className="text-gray-600 dark:text-gray-300 text-center max-w-md">
                {t("video.analyzingDescription")}
              </p>
              <div className="mt-8 w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div className="bg-[#b94a2c] dark:bg-[#ff6b47] h-2.5 rounded-full animate-pulse w-3/4"></div>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {t("video.analyzingTimeEstimate")}
              </p>
            </div>
          )}

          {analysisComplete && !isAnalyzing && (
            <div className="grid md:grid-cols-3 gap-8">
              {/* 左侧栏 - 使用sticky定位使其在滚动时悬浮 */}
              <div className="md:col-span-1">
                <div className="sticky top-24 space-y-6">
                  {/* 组件1: 图片和文字描述 */}
                  <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm dark:border dark:border-gray-700 w-full">
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                      <Image
                        src={recipeData?.detail?.cover || recipeData?.metadata?.strMealThumb || recipeData?.thumbnail || recipeData?.detail?.thumbnailUrl || "/placeholder.svg?height=300&width=500"}
                        alt={recipeData?.metadata?.strMeal || recipeData?.title || recipeData?.detail?.title || "Recipe thumbnail"}
                        fill
                        className="object-cover"
                        unoptimized
                        priority
                      />
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2 dark:text-white">
                      {recipeData?.metadata?.strMeal || recipeData?.title || recipeData?.detail?.title || "Recipe from Video"}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {recipeData?.metadata?.strArea || "International"} • {recipeData?.metadata?.all_time || "N/A"}
                    </p>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{recipeData?.metadata?.all_time || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ChefHat className="h-4 w-4" />
                        <span>{recipeData?.metadata?.difficulty || "Medium"}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 组件2: 视频播放器和原始视频链接 */}
                  <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm dark:border dark:border-gray-700 w-full">
                    {/* 内嵌视频播放器 */}
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                      {recipeData?.sourceUrl && (
                        <iframe
                          src={
                            recipeData.sourceUrl.includes('youtube.com') 
                              ? recipeData.sourceUrl.replace('watch?v=', 'embed/').split('&')[0]
                              : recipeData.sourceUrl.includes('bilibili.com')
                                ? `https://player.bilibili.com/player.html?bvid=${recipeData.sourceUrl.split('/').pop()}&high_quality=1&danmaku=0`
                                : recipeData.sourceUrl
                          }
                          className="w-full h-full"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          loading="lazy"
                          referrerPolicy="strict-origin-when-cross-origin"
                        ></iframe>
                      )}
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
              </div>

              {/* 右侧内容区域 */}
              <div className="md:col-span-2">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm mb-6 dark:border dark:border-gray-700">
                  <h2 className="text-xl font-bold mb-4 dark:text-white">{t("video.videoSummary")}</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {recipeData?.metadata?.videoSummary || recipeData?.detail?.descriptionText || "视频分析中..."}
                  </p>
                  {recipeData?.steps && recipeData.steps.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h3 className="font-medium mb-2 dark:text-white">Key Steps</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm dark:text-gray-300">
                        {recipeData.steps.map((step: any, index: number) => (
                          <div key={index}>
                            {index + 1}. {step.title} - {step.time} min
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm mb-6 dark:border dark:border-gray-700">
                  <h2 className="text-xl font-bold mb-4 dark:text-white">{t("video.quickRecipeGuide")}</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-2 dark:text-white">{t("video.ingredients")}</h3>
                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
                        {recipeData?.steps ? (
                          recipeData.steps.flatMap((step: any) => 
                            step.ingredients ? step.ingredients.map((ingredient: any, idx: number) => (
                              <li key={`${step.step_number}-${idx}`}>
                                {ingredient.name} - {ingredient.quantity}
                              </li>
                            )) : []
                          )
                        ) : (
                          <li>加载中...</li>
                        )}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2 dark:text-white">{t("video.preparationSteps")}</h3>
                      <ol className="list-decimal list-inside text-gray-600 dark:text-gray-300">
                        {recipeData?.steps ? (
                          recipeData.steps.map((step: any, stepIndex: number) => (
                            <li key={stepIndex} className="mb-2">
                              <span className="font-medium">{step.title}</span>
                              <ul className="list-disc list-inside ml-4 mt-1">
                                {step.instructions && step.instructions.map((instruction: string, idx: number) => (
                                  <li key={idx} className="text-sm">{instruction}</li>
                                ))}
                              </ul>
                            </li>
                          ))
                        ) : (
                          <li>加载中...</li>
                        )}
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm dark:border dark:border-gray-700">
                  <h2 className="text-xl font-bold mb-4 dark:text-white">{t("Recipe Information")}</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                        <div className="bg-gray-100 dark:bg-gray-700 p-3 border-b dark:border-gray-600">
                          <h3 className="font-medium dark:text-white">{t("video.amountPerServing")}</h3>
                        </div>
                        <div className="p-3 space-y-2 text-sm dark:text-gray-300">
                          <div className="flex justify-between">
                            <span>Total Cooking Time</span>
                            <span>{recipeData?.metadata?.all_time || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Difficulty</span>
                            <span>{recipeData?.metadata?.difficulty || "Medium"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cooking Method</span>
                            <span>{recipeData?.metadata?.cookingMethods || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cuisine Style</span>
                            <span>{recipeData?.metadata?.mealStyle || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3 dark:text-white">{t("video.dietaryInformation")}</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {recipeData?.metadata?.strTags ? (
                          recipeData.metadata.strTags.split(',').map((tag: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                              {tag.trim()}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                            未分类
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Link href="/recipe-details">
                      <Button 
                        className="bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a]"
                      >
                        View Recipes
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