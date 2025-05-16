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
  const [dataSource, setDataSource] = useState<"cache" | "api" | null>(null)
  
  // 定义缓存键前缀
  const CACHE_PREFIX = "brickRecipes_videoRecipe_"

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
    let videoId = "";
    
    if (activeTab === "youtube") {
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
      const match = videoUrl.match(youtubeRegex);
      
      if (match && match[1]) {
        videoId = match[1];
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
        videoId = match[1];
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
    
    // 生成缓存键
    const cacheKey = `${CACHE_PREFIX}${activeTab}_${videoId}`;
    let processedData = null;
    
    try {
      // 1. 首先检查localStorage中是否有数据
      if (typeof window !== 'undefined') {
        try {
          const cachedDataString = localStorage.getItem(cacheKey);
          if (cachedDataString) {
            // 如果有缓存数据，解析并使用
            console.log("使用localStorage缓存数据:", cacheKey);
            const cachedData = JSON.parse(cachedDataString);
            processedData = cachedData;
            setRecipeData(cachedData);
            setProcessedUrl(urlToProcess);
            setIsAnalyzing(false);
            setAnalysisComplete(true);
            setDataSource("cache");
            return; // 使用缓存数据后直接返回，不调用API
          }
        } catch (cacheError) {
          console.error("读取localStorage缓存失败:", cacheError);
          // localStorage缓存读取失败，继续尝试MongoDB
        }
      }
      
      // 2. localStorage没有数据，查询MongoDB数据库
      console.log("尝试从MongoDB查询:", activeTab, videoId);
      const dbResponse = await fetch('/api/video-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          service: activeTab, 
          videoId: videoId 
        }),
      });
      
      // 记录MongoDB查询响应状态
      console.log("MongoDB查询状态码:", dbResponse.status);

      // 获取完整响应内容进行调试
      let dbResponseText = '';
      try {
        // 克隆响应以避免错误
        const clonedResponse = dbResponse.clone();
        dbResponseText = await clonedResponse.text();
        console.log("MongoDB响应详情:", dbResponseText);
      } catch (textError) {
        console.error("无法读取响应文本:", textError);
      }

      // 状态码200表示MongoDB查询成功，直接使用返回的videotorecipe集合数据
      if (dbResponse.ok) { // ok为true意味着状态码是2xx
        const dbData = await dbResponse.json();
        console.log("MongoDB返回数据:", JSON.stringify(dbData).slice(0, 500) + "...");
        
        // 根据不同来源处理数据结构
        if (dbData.source === 'videoCache') {
          processedData = dbData.data;
          console.log("数据来源: videoCache集合, data字段类型:", typeof dbData.data);
          
          // 先检查顶级字段中是否有summary对象
          if (processedData?.summary && typeof processedData.summary === 'object') {
            console.log("videoCache中发现summary对象，将其展开到顶层");
            processedData = {
              ...processedData,
              ...processedData.summary
            };
          }
          
          // 检查detail字段
          if (processedData?.detail && typeof processedData.detail === 'object') {
            console.log("发现detail对象，将其关键字段提升到顶层");
            processedData = {
              ...processedData,
              ...processedData.detail
            };
          }
          
          // 标记为bilibili数据
          if (processedData.service === 'bilibili' || 
              (processedData.sourceUrl && processedData.sourceUrl.includes('bilibili.com'))) {
            processedData.isBilibili = true;
          }
        } else if (dbData.source === 'videotorecipe') {
          // 如果来自videotorecipe集合，可能需要进一步处理
          // videotorecipe集合直接存储完整的数据，不是包含在data字段中
          processedData = dbData.data;
          console.log("数据来源: videotorecipe集合, data字段类型:", typeof dbData.data);
          
          // 检查特殊数据，记录以便调试
          console.log("检查源URL:", {
            videoUrl: processedData?.videoUrl,
            sourceUrl: processedData?.sourceUrl,
            hasBilibili: (processedData?.videoUrl && processedData.videoUrl.includes('bilibili.com')) || 
                         (processedData?.sourceUrl && processedData.sourceUrl.includes('bilibili.com'))
          });

          // 特殊处理哔哩哔哩数据
          if (processedData?.isBilibili === true || 
              (processedData?.videoUrl && processedData.videoUrl.includes('bilibili.com')) || 
              (processedData?.sourceUrl && processedData.sourceUrl.includes('bilibili.com'))) {
            console.log("检测到哔哩哔哩视频，提取BV/AV号");
            
            // 提取视频ID，优先使用id字段，然后从URL提取
            let bvidMatch = null;
            let aidMatch = null;
            
            // 尝试所有可能的URL提取BV号或AV号
            const urlToCheck = processedData?.videoUrl || processedData?.sourceUrl || '';
            if (urlToCheck) {
              bvidMatch = urlToCheck.match(/\/(BV[a-zA-Z0-9]+)/i);
              aidMatch = urlToCheck.match(/\/(av\d+)/i);
              
              if (bvidMatch && bvidMatch[1]) {
                processedData.bvid = bvidMatch[1];
                console.log("从URL提取到BV号:", processedData.bvid);
              } else if (aidMatch && aidMatch[1]) {
                processedData.avid = aidMatch[1];
                console.log("从URL提取到AV号:", processedData.avid);
              }
            }
            
            // 如果没有从URL提取到，尝试从现有字段中提取
            if (!processedData.bvid && !processedData.avid) {
              if (processedData.id && /^BV/i.test(processedData.id)) {
                processedData.bvid = processedData.id;
                console.log("从id字段提取到BV号:", processedData.bvid);
              } else if (processedData.id && /^av/i.test(processedData.id)) {
                processedData.avid = processedData.id;
                console.log("从id字段提取到AV号:", processedData.avid);
              } else if (processedData.videoId && /^BV/i.test(processedData.videoId)) {
                processedData.bvid = processedData.videoId;
                console.log("从videoId字段提取到BV号:", processedData.bvid);
              } else if (processedData.videoId && /^av/i.test(processedData.videoId)) {
                processedData.avid = processedData.videoId;
                console.log("从videoId字段提取到AV号:", processedData.avid);
              }
            }
            
            // 如果只有数字ID，尝试从其他字段确定是AV号还是BV号
            if (!processedData.bvid && !processedData.avid && processedData.id) {
              if (/^\d+$/.test(processedData.id)) {
                processedData.avid = `av${processedData.id}`;
                console.log("将纯数字ID解释为AV号:", processedData.avid);
              }
            }
            
            // 设置isBilibili标记
            processedData.isBilibili = true;
            
            // 提取标题信息
            if (!processedData.title && !processedData.strMeal) {
              try {
                // 尝试从URL路径提取标题
                const url = processedData.videoUrl || processedData.sourceUrl;
                if (url) {
                  const urlObj = new URL(url);
                  const pathParts = urlObj.pathname.split('/');
                  // 获取最后一个路径段落
                  const lastPart = pathParts[pathParts.length - 1];
                  
                  // 如果最后一个部分不是ID
                  if (lastPart && !lastPart.match(/^(BV[a-zA-Z0-9]+|av\d+)$/i) && lastPart.length > 5) {
                    processedData.extractedTitle = decodeURIComponent(lastPart);
                    console.log("从URL提取到标题:", processedData.extractedTitle);
                  }
                }
              } catch (e) {
                console.error("提取标题失败:", e);
              }
            }
          }

          // 如果存在processedData.data，意味着数据被嵌套了一层
          if (processedData && processedData.data) {
            console.log("检测到嵌套的data字段，提取内部数据");
            processedData = processedData.data;
          }

          // 特殊处理summary字段
          if (processedData && processedData.summary && typeof processedData.summary === 'object') {
            console.log("检测到summary对象，将字段提升到顶层");
            processedData = {
              ...processedData,
              ...processedData.summary
            };
          }

          // 特殊处理metadata字段
          if (processedData && processedData.metadata && typeof processedData.metadata === 'object') {
            console.log("检测到metadata对象，将字段提升到顶层");
            processedData = {
              ...processedData,
              ...processedData.metadata
            };
          }
        } else {
          // 默认情况，尝试使用data字段
          processedData = dbData.data;
          console.log("未知数据来源，默认使用data字段, 字段类型:", typeof dbData.data);
        }
        
        console.log("处理后准备使用的数据:", {
          source: dbData.source,
          hasData: !!processedData,
          topLevelKeys: processedData ? Object.keys(processedData) : []
        });
        
        // 确保processedData不为空再进行后续操作
        if (processedData) {
          // 同时更新localStorage缓存
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(cacheKey, JSON.stringify(processedData));
              console.log("MongoDB数据已保存到localStorage缓存");
            } catch (storageError) {
              console.error("更新localStorage缓存失败:", storageError);
            }
          }
          
          // 使用MongoDB返回的数据更新UI
          setRecipeData(processedData);
          setProcessedUrl(urlToProcess);
          setIsAnalyzing(false);
          setAnalysisComplete(true);
          setDataSource("cache");
          return; // 重要: 使用MongoDB数据后直接返回，不调用API
        } else {
          console.log("MongoDB返回的数据为空，需要调用API获取");
        }
      } else {
        // 非200状态码，表示MongoDB没有数据或发生错误
        let errorDetails = "";
        try {
          // 尝试解析错误响应为JSON
          const errorData = JSON.parse(dbResponseText);
          errorDetails = errorData.details 
            ? JSON.stringify(errorData.details) 
            : errorData.error || "";
          console.log("MongoDB查询错误详情:", errorData);
        } catch (jsonError) {
          errorDetails = dbResponseText;
        }
        
        console.log(`MongoDB查询失败(${dbResponse.status}): ${errorDetails}`);
      }
      
      // 3. MongoDB中没有数据，需要调用API获取并缓存
      console.log("MongoDB中未找到数据，准备调用API获取:", {
        url: urlToProcess,
        videoId: videoId,
        service: activeTab,
        shouldCache: true
      });

      // 确保一定有videoId，如果提取失败，再尝试一次
      if (!videoId) {
        console.log("警告: videoId为空，尝试重新提取...");
        if (activeTab === "youtube") {
          const match = urlToProcess.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?\/\s]{11})/);
          if (match && match[1]) {
            videoId = match[1];
            console.log("成功重新提取YouTube videoId:", videoId);
          }
        } else if (activeTab === "bilibili") {
          const match = urlToProcess.match(/(?:bilibili\.com\/video\/)(BV[a-zA-Z0-9]+|av\d+)/);
          if (match && match[1]) {
            videoId = match[1];
            console.log("成功重新提取Bilibili videoId:", videoId);
          }
        }
      }

      // 如果仍然没有videoId，生成一个临时ID
      if (!videoId) {
        videoId = `temp-${Date.now()}`;
        console.log("创建临时videoId:", videoId);
      }

      // 发送API请求获取新数据
      console.log("调用API获取数据并缓存到MongoDB...");
      const response = await fetch('/api/video-to-recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          videoUrl: urlToProcess,
          videoId: videoId,
          service: activeTab,
          shouldCache: true // 告诉API保存到MongoDB供后续查询使用
        }),
      });

      // 记录API响应状态码和头信息
      console.log("API响应状态:", response.status, response.statusText);
      console.log("API响应头信息:", Object.fromEntries(response.headers.entries()));

      // 处理API响应
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API请求失败:", errorText);
        throw new Error(errorText || '视频分析失败');
      }

      const data = await response.json();
      console.log("API返回数据大致大小:", JSON.stringify(data).length, "字节");
      console.log("API返回数据字段:", Object.keys(data));

      // 处理API返回的数据
      processedData = data;

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
      
      // 保存到localStorage以便快速访问 (API已经自动保存到MongoDB)
      if (typeof window !== 'undefined' && processedData) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(processedData));
          console.log("API数据已保存到localStorage缓存:", cacheKey);
          console.log("（注：相同数据已由API自动保存到MongoDB供后续查询）");
        } catch (cacheError) {
          console.error("保存localStorage缓存失败:", cacheError);
        }
      }
      
      // 更新UI展示数据
      setRecipeData(processedData);
      setProcessedUrl(urlToProcess);
      setIsAnalyzing(false);
      setAnalysisComplete(true);
      setDataSource("api"); // 标记为API数据源
    } catch (error: any) {
      console.error('分析视频时出错:', error);
      setIsAnalyzing(false);
      setShowError(true);
      setErrorTitle(t("video.analysisError"));
      setErrorMessage(error.message || t("video.genericError"));
    }
  }

  // 清除特定视频的缓存
  const clearVideoCache = () => {
    if (!processedUrl) return;
    
    let videoId = "";
    // 根据当前标签提取视频ID
    if (activeTab === "youtube") {
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
      const match = processedUrl.match(youtubeRegex);
      if (match && match[1]) {
        videoId = match[1];
      }
    } else if (activeTab === "bilibili") {
      const bilibiliRegex = /(?:bilibili\.com\/video\/|b23\.tv\/)(BV[a-zA-Z0-9]+|av\d+)/i;
      const match = processedUrl.match(bilibiliRegex);
      if (match && match[1]) {
        videoId = match[1];
      }
    }
    
    if (!videoId) return;
    
    const cacheKey = `${CACHE_PREFIX}${activeTab}_${videoId}`;
    try {
      localStorage.removeItem(cacheKey);
      console.log("已清除缓存:", cacheKey);
      
      // 重新分析视频，从API获取新数据
      handleAnalyzeVideo();
    } catch (error) {
      console.error("清除缓存失败:", error);
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

  // 辅助函数，用于安全地渲染可能是对象的值
  const safeRender = (value: any, fallback: string = "N/A") => {
    if (value === null || value === undefined) return fallback;
    
    // 对象处理
    if (typeof value === 'object') {
      // 特殊处理字符串字段
      if (value.videoSummary && typeof value.videoSummary === 'string') {
        return value.videoSummary;
      } else if (value.data && typeof value.data === 'string') {
        return value.data;
      } else if (value.text && typeof value.text === 'string') {
        return value.text;
      } else if (value.content && typeof value.content === 'string') {
        return value.content;
      } else if (value.description && typeof value.description === 'string') {
        return value.description;
      } else if (value.summary && typeof value.summary === 'string') {
        return value.summary;
      } else if (value.value && typeof value.value === 'string') {
        return value.value;
      } else if (value.metadata && value.metadata.videoSummary && typeof value.metadata.videoSummary === 'string') {
        return value.metadata.videoSummary;
      } else if (value.extractedTitle && typeof value.extractedTitle === 'string') {
        return value.extractedTitle;
      }
      
      // 尝试JSON转换但避免太长的字符串
      const jsonStr = JSON.stringify(value);
      if (jsonStr.length > 200) {
        return "[复杂对象]";
      }
      return jsonStr;
    }
    
    return String(value);
  };

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
                        src={
                          (() => {
                            // 检查所有可能的图片URL字段
                            const possibleImageUrls = [
                              recipeData?.thumbnail,
                              recipeData?.detail?.thumbnailUrl,
                              recipeData?.cover,
                              recipeData?.metadata?.strMealThumb,
                              recipeData?.detail?.cover,
                              recipeData?.detail?.coverUrl,
                              recipeData?.summary?.thumbnail,
                              recipeData?.summary?.cover
                            ];
                            
                            // 第一步：检查是否为B站视频
                            const isBilibiliVideo = (recipeData?.isBilibili === true) || 
                              activeTab === "bilibili" || 
                              (recipeData?.videoUrl && recipeData.videoUrl.includes('bilibili.com')) || 
                              (recipeData?.sourceUrl && recipeData.sourceUrl.includes('bilibili.com'));
                            
                            // 第二步：查找有效的图片URL
                            let imageUrl = null;
                            for (let url of possibleImageUrls) {
                              if (url) {
                                // 检查URL是否是B站图片
                                const isBilibiliImage = typeof url === 'string' && (
                                  url.includes('i1.hdslb.com') || 
                                  url.includes('i0.hdslb.com') || 
                                  url.includes('i2.hdslb.com') ||
                                  url.startsWith('http://i1.hdslb.com') ||
                                  url.startsWith('http://i0.hdslb.com') ||
                                  url.startsWith('https://i1.hdslb.com') ||
                                  url.startsWith('https://i0.hdslb.com')
                                );
                                
                                // 如果是B站图片，使用代理
                                if (isBilibiliImage) {
                                  console.log("检测到B站图片URL，使用代理:", url);
                                  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
                                }
                                
                                // 保存第一个有效的非B站URL
                                if (!imageUrl) {
                                  imageUrl = url;
                                }
                              }
                            }
                            
                            // 如果没有B站图片但有普通图片，使用普通图片
                            if (imageUrl) {
                              return imageUrl;
                            }
                            
                            // 如果是B站视频但没找到图片，使用默认占位图
                            if (isBilibiliVideo) {
                              return "/placeholder.svg?height=300&width=500";
                            }
                            
                            // 最后的默认值
                            return "/placeholder.svg?height=300&width=500";
                          })()
                        }
                        alt={recipeData?.title || recipeData?.detail?.title || recipeData?.name || recipeData?.metadata?.strMeal || "Recipe thumbnail"}
                        fill
                        className="object-cover"
                        unoptimized
                        priority
                        onError={(e) => {
                          // 图片加载错误时设置为默认图片
                          const imgElement = e.currentTarget as HTMLImageElement;
                          imgElement.onerror = null; // 防止循环触发错误
                          imgElement.src = "/placeholder.svg?height=300&width=500"; 
                          console.log("图片加载失败，已替换为占位图");
                        }}
                      />
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2 dark:text-white">
                      {safeRender(
                        recipeData?.summary?.metadata?.strMeal || 
                        recipeData?.strMeal || 
                        recipeData?.extractedTitle ||
                        recipeData?.title || 
                        recipeData?.name || 
                        recipeData?.metadata?.strMeal || 
                        recipeData?.detail?.title || 
                        (recipeData?.isBilibili ? "哔哩哔哩食谱" : null), 
                        "菜谱详情"
                      )}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {safeRender(recipeData?.cuisine || recipeData?.metadata?.strArea, "国际料理")}
                    </p>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{typeof recipeData?.cookingTime === 'object' ? JSON.stringify(recipeData?.cookingTime) : 
                          recipeData?.cookingTime || recipeData?.metadata?.all_time || recipeData?.detail?.cookTime || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ChefHat className="h-4 w-4" />
                        <span>{typeof recipeData?.difficulty === 'object' ? JSON.stringify(recipeData?.difficulty) : 
                          recipeData?.difficulty || recipeData?.metadata?.difficulty || recipeData?.detail?.difficulty || "Medium"}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 组件2: 视频播放器和原始视频链接 */}
                  <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm dark:border dark:border-gray-700 w-full">
                    {/* 内嵌视频播放器 */}
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                      {recipeData?.videoUrl || recipeData?.sourceUrl ? (
                        (() => {
                          const url = recipeData?.videoUrl || recipeData?.sourceUrl || "";
                          const isBilibili = recipeData?.isBilibili === true || url.includes('bilibili.com') || url.includes('b23.tv');
                          
                          // 调试信息
                          console.log("视频播放器信息:", {
                            url,
                            isBilibili,
                            hasBvid: !!recipeData?.bvid,
                            hasAvid: !!recipeData?.avid,
                            videoId: recipeData?.id || "未知"
                          });
                          
                          if (isBilibili) {
                            // 优先使用从数据中提取的bvid或avid
                            if (recipeData?.bvid) {
                              console.log("使用预处理提取的BV号:", recipeData.bvid);
                              return (
                                <iframe
                                  src={`https://player.bilibili.com/player.html?bvid=${recipeData.bvid}&high_quality=1&danmaku=0`}
                                  className="w-full h-full"
                                  allowFullScreen
                                  loading="lazy"
                                  referrerPolicy="strict-origin-when-cross-origin"
                                ></iframe>
                              );
                            } else if (recipeData?.avid) {
                              // 移除可能的'av'前缀
                              const aid = recipeData.avid.replace(/^av/i, '');
                              console.log("使用预处理提取的AV号:", aid);
                              return (
                                <iframe
                                  src={`https://player.bilibili.com/player.html?aid=${aid}&high_quality=1&danmaku=0`}
                                  className="w-full h-full"
                                  allowFullScreen
                                  loading="lazy"
                                  referrerPolicy="strict-origin-when-cross-origin"
                                ></iframe>
                              );
                            }
                            
                            // 如果没有预处理提取的ID，从URL中提取
                            // B站视频处理
                            let bvid = "";
                            let aid = "";
                            
                            // 尝试各种方式提取视频ID
                            const bvMatch = url.match(/\/(BV[a-zA-Z0-9]+)/i);
                            const avMatch = url.match(/\/(av\d+)/i);
                            
                            if (bvMatch && bvMatch[1]) {
                              bvid = bvMatch[1];
                              console.log("从URL成功提取BV号:", bvid);
                              
                              // 直接使用完整的BV号
                              return (
                                <iframe
                                  src={`https://player.bilibili.com/player.html?bvid=${bvid}&high_quality=1&danmaku=0`}
                                  className="w-full h-full"
                                  allowFullScreen
                                  loading="lazy"
                                  referrerPolicy="strict-origin-when-cross-origin"
                                ></iframe>
                              );
                            } else if (avMatch && avMatch[1]) {
                              aid = avMatch[1].replace(/^av/i, '');
                              console.log("从URL成功提取AV号:", aid);
                              
                              return (
                                <iframe
                                  src={`https://player.bilibili.com/player.html?aid=${aid}&high_quality=1&danmaku=0`}
                                  className="w-full h-full"
                                  allowFullScreen
                                  loading="lazy"
                                  referrerPolicy="strict-origin-when-cross-origin"
                                ></iframe>
                              );
                            } else {
                              // 尝试其他方式
                              const pathParts = url.split('/');
                              const lastPart = pathParts[pathParts.length - 1]?.split('?')[0];
                              
                              if (lastPart && /^BV/i.test(lastPart)) {
                                console.log("从URL最后部分提取BV号:", lastPart);
                                return (
                                  <iframe
                                    src={`https://player.bilibili.com/player.html?bvid=${lastPart}&high_quality=1&danmaku=0`}
                                    className="w-full h-full"
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                  ></iframe>
                                );
                              }
                              
                              // 尝试使用ID字段作为BV号
                              if (recipeData?.id && /^BV/i.test(recipeData.id)) {
                                console.log("使用ID字段作为BV号:", recipeData.id);
                                return (
                                  <iframe
                                    src={`https://player.bilibili.com/player.html?bvid=${recipeData.id}&high_quality=1&danmaku=0`}
                                    className="w-full h-full"
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                  ></iframe>
                                );
                              }
                              
                              // 尝试最后使用videoId字段
                              if (recipeData?.videoId) {
                                if (/^BV/i.test(recipeData.videoId)) {
                                  console.log("使用videoId字段作为BV号:", recipeData.videoId);
                                  return (
                                    <iframe
                                      src={`https://player.bilibili.com/player.html?bvid=${recipeData.videoId}&high_quality=1&danmaku=0`}
                                      className="w-full h-full"
                                      allowFullScreen
                                      loading="lazy"
                                      referrerPolicy="strict-origin-when-cross-origin"
                                    ></iframe>
                                  );
                                } else if (/^\d+$/.test(recipeData.videoId) || /^av\d+$/i.test(recipeData.videoId)) {
                                  const aidValue = recipeData.videoId.replace(/^av/i, '');
                                  console.log("使用videoId字段作为AV号:", aidValue);
                                  return (
                                    <iframe
                                      src={`https://player.bilibili.com/player.html?aid=${aidValue}&high_quality=1&danmaku=0`}
                                      className="w-full h-full"
                                      allowFullScreen
                                      loading="lazy"
                                      referrerPolicy="strict-origin-when-cross-origin"
                                    ></iframe>
                                  );
                                }
                              }
                              
                              console.warn("无法提取B站视频ID，显示提示信息");
                              // 无法提取ID时显示提示
                              return (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 p-4 text-center">
                                  <PlayCircle className="h-16 w-16 text-gray-300 dark:text-gray-500 mb-4" />
                                  <p className="text-gray-500 dark:text-gray-400">无法播放视频，请点击下方按钮访问原始视频</p>
                                  <p className="text-xs text-gray-400 mt-2">{url}</p>
                                </div>
                              );
                            }
                          } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
                            // YouTube视频处理
                            let embedUrl = url;
                            
                            if (url.includes('watch?v=')) {
                              embedUrl = url.replace('watch?v=', 'embed/').split('&')[0];
                            } else if (url.includes('youtu.be/')) {
                              const videoId = url.split('youtu.be/')[1]?.split('?')[0];
                              if (videoId) {
                                embedUrl = `https://www.youtube.com/embed/${videoId}`;
                              }
                            }
                            
                            console.log("YouTube嵌入URL:", embedUrl);
                            
                            return (
                              <iframe
                                src={embedUrl}
                                className="w-full h-full"
                                allowFullScreen
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                loading="lazy"
                                referrerPolicy="strict-origin-when-cross-origin"
                              ></iframe>
                            );
                          } else {
                            // 未知视频类型
                            console.warn("未知视频类型:", url);
                            return (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                <PlayCircle className="h-16 w-16 text-gray-300 dark:text-gray-500" />
                              </div>
                            );
                          }
                        })()
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                          <PlayCircle className="h-16 w-16 text-gray-300 dark:text-gray-500" />
                        </div>
                      )}
                    </div>
                    
                    <a 
                      href={processedUrl || recipeData?.videoUrl || recipeData?.sourceUrl} 
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
                    {/* 专门处理各种数据源的视频摘要 */}
                    {recipeData?.videoSummary ? safeRender(recipeData.videoSummary) :
                     recipeData?.metadata?.videoSummary ? safeRender(recipeData.metadata.videoSummary) :
                     recipeData?.summary?.metadata?.videoSummary ? safeRender(recipeData.summary.metadata.videoSummary) :
                     recipeData?.summary ? (typeof recipeData.summary === 'string' ? recipeData.summary : safeRender(recipeData.summary)) :
                     recipeData?.description ? safeRender(recipeData.description) :
                     recipeData?.data?.summary ? safeRender(recipeData.data.summary) :
                     recipeData?.data?.description ? safeRender(recipeData.data.description) :
                     recipeData?.data?.metadata?.videoSummary ? safeRender(recipeData.data.metadata.videoSummary) :
                     recipeData?.detail?.descriptionText ? safeRender(recipeData.detail.descriptionText) :
                     "视频分析中..."}
                  </p>
                  
                  {/* 添加标签显示 */}
                  {(recipeData?.tags || recipeData?.detail?.tags) && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(Array.isArray(recipeData?.tags) ? recipeData?.tags : 
                        Array.isArray(recipeData?.detail?.tags) ? recipeData?.detail?.tags : []).map((tag: any, idx: number) => (
                        <Badge key={idx} variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                          {safeRender(tag)}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {recipeData?.steps && Array.isArray(recipeData.steps) && recipeData.steps.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h3 className="font-medium mb-2 dark:text-white">Key Steps</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm dark:text-gray-300">
                        {recipeData.steps.map((step: any, index: number) => (
                          <div key={index}>
                            {index + 1}. {safeRender(step.title || step.name || step.text)} {step.time ? `- ${safeRender(step.time)} min` : ''}
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
                        {(() => {
                          // 食材名称去重辅助函数，用于比较两个食材是否相同
                          const isSameIngredient = (ing1: any, ing2: any): boolean => {
                            if (typeof ing1 === 'string' && typeof ing2 === 'string') {
                              // 两个都是字符串，直接比较(忽略大小写，去除前后空格)
                              return ing1.trim().toLowerCase() === ing2.trim().toLowerCase();
                            } else if (typeof ing1 === 'object' && ing1 !== null && typeof ing2 === 'object' && ing2 !== null) {
                              // 两个都是对象，比较name属性(忽略大小写，去除前后空格)
                              const name1 = (ing1.name || "").trim().toLowerCase();
                              const name2 = (ing2.name || "").trim().toLowerCase();
                              return name1 === name2 && name1 !== "";
                            }
                            return false;
                          };
                          
                          // 处理并去重食材列表
                          const deduplicateIngredients = (ingredients: any[]): any[] => {
                            const result: any[] = [];
                            
                            ingredients.forEach(ing => {
                              // 检查是否已经存在相同食材
                              const exists = result.some(existingIng => isSameIngredient(ing, existingIng));
                              if (!exists) {
                                result.push(ing);
                              }
                            });
                            
                            return result;
                          };
                          
                          // 哔哩哔哩特殊数据格式
                          if (recipeData?.isBilibili && recipeData?.steps && Array.isArray(recipeData.steps)) {
                            const allIngredients: any[] = [];
                            
                            // 遍历步骤，提取每个步骤的配料
                            for (const step of recipeData.steps) {
                              if (step.ingredients && Array.isArray(step.ingredients)) {
                                for (const ingredient of step.ingredients) {
                                  if (typeof ingredient === 'string') {
                                    allIngredients.push(ingredient);
                                  } else if (ingredient && typeof ingredient === 'object') {
                                    allIngredients.push(ingredient);
                                  }
                                }
                              }
                            }
                            
                            // 去重食材
                            const uniqueIngredients = deduplicateIngredients(allIngredients);
                            
                            if (uniqueIngredients.length > 0) {
                              return uniqueIngredients.map((ingredient, index) => {
                                if (typeof ingredient === 'string') {
                                  return <li key={`str-${index}`}>{ingredient}</li>;
                                } else {
                                  const name = ingredient.name || "";
                                  const quantity = ingredient.quantity || "";
                                  return (
                                    <li key={`obj-${index}`}>
                                      {name}{quantity ? ` - ${quantity}` : ''}
                                    </li>
                                  );
                                }
                              });
                            }
                          }
                          
                          // 处理常规食材列表并去重
                          if (recipeData?.steps && Array.isArray(recipeData.steps)) {
                            const allIngredients: any[] = [];
                            
                            recipeData.steps.forEach((step: any) => {
                              if (Array.isArray(step.ingredients)) {
                                step.ingredients.forEach((ingredient: any) => {
                                  allIngredients.push(ingredient);
                                });
                              }
                            });
                            
                            // 去重食材
                            const uniqueIngredients = deduplicateIngredients(allIngredients);
                            
                            if (uniqueIngredients.length > 0) {
                              return uniqueIngredients.map((ingredient, idx) => (
                                <li key={idx}>
                                  {typeof ingredient === 'string' ? ingredient : 
                                    safeRender(ingredient.name || '') + (ingredient.quantity ? ` - ${safeRender(ingredient.quantity)}` : '')}
                                </li>
                              ));
                            }
                          }
                          
                          // 检查是否有独立的ingredients字段
                          if (recipeData?.ingredients) {
                            if (Array.isArray(recipeData.ingredients)) {
                              // 去重食材
                              const uniqueIngredients = deduplicateIngredients(recipeData.ingredients);
                              
                              return uniqueIngredients.map((ingredient: any, idx: number) => (
                                <li key={idx}>
                                  {typeof ingredient === 'string' ? ingredient : safeRender(ingredient.name || ingredient.text || ingredient)}
                                </li>
                              ));
                            }
                            
                            if (typeof recipeData.ingredients === 'string') {
                              // 字符串形式的食材列表，按逗号分割并去重
                              const ingredientsArray = recipeData.ingredients
                                .split(',')
                                .map((item: string) => item.trim())
                                .filter((item: string, index: number, self: string[]) => 
                                  self.findIndex((i: string) => i.toLowerCase() === item.toLowerCase()) === index
                                );
                                
                              return ingredientsArray.map((item: string, idx: number) => (
                                <li key={idx}>{item}</li>
                              ));
                            }
                            
                            if (typeof recipeData.ingredients === 'object') {
                              // 对象形式的食材，转换为数组并去重
                              const ingredientsArray = Object.entries(recipeData.ingredients)
                                .map(([key, value]: [string, any]) => `${key}: ${safeRender(value)}`);
                                
                              // 去重(简单字符串比较)
                              const uniqueIngredients = Array.from(new Set(ingredientsArray));
                                
                              return uniqueIngredients.map((item, idx: number) => (
                                <li key={idx}>{item}</li>
                              ));
                            }
                          }
                          
                          // 检查detail.ingredients
                          if (recipeData?.detail?.ingredients && Array.isArray(recipeData.detail.ingredients)) {
                            // 去重食材
                            const uniqueIngredients = deduplicateIngredients(recipeData.detail.ingredients);
                            
                            return uniqueIngredients.map((ingredient: any, idx: number) => (
                              <li key={idx}>
                                {typeof ingredient === 'string' ? ingredient : safeRender(ingredient.name || ingredient.text || ingredient)}
                              </li>
                            ));
                          }
                          
                          // 如果都没有找到可用的配料信息，显示加载中
                          return <li>加载中...</li>;
                        })()}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2 dark:text-white">{t("video.preparationSteps")}</h3>
                      <ol className="list-decimal list-inside text-gray-600 dark:text-gray-300">
                        {(() => {
                          // 哔哩哔哩特殊处理
                          if (recipeData?.isBilibili && recipeData?.steps && Array.isArray(recipeData.steps)) {
                            return recipeData.steps.map((step: any, stepIndex: number) => (
                              <li key={stepIndex} className="mb-2">
                                <span className="font-medium">
                                  {step.title || `步骤 ${step.step_number || stepIndex + 1}`}
                                </span>
                                {step.time ? ` (${step.time})` : ''}
                                <ul className="list-disc list-inside ml-4 mt-1">
                                  {Array.isArray(step.instructions) ? 
                                    step.instructions.map((instruction: any, idx: number) => (
                                      <li key={idx} className="text-sm">{safeRender(instruction)}</li>
                                    )) : 
                                    typeof step.instructions === 'string' ? 
                                      <li className="text-sm">{step.instructions}</li> : 
                                      null
                                  }
                                </ul>
                              </li>
                            ));
                          }
                          
                          // 现有逻辑保持不变
                          if (recipeData?.steps && Array.isArray(recipeData.steps)) {
                            return recipeData.steps.map((step: any, stepIndex: number) => (
                              <li key={stepIndex} className="mb-2">
                                <span className="font-medium">{safeRender(step.title)}</span>
                                <ul className="list-disc list-inside ml-4 mt-1">
                                  {Array.isArray(step.instructions) && step.instructions.map((instruction: any, idx: number) => (
                                    <li key={idx} className="text-sm">{safeRender(instruction)}</li>
                                  ))}
                                </ul>
                              </li>
                            ));
                          } else if (recipeData?.instructions) {
                            if (Array.isArray(recipeData.instructions)) {
                              return recipeData.instructions.map((instruction: any, idx: number) => (
                                <li key={idx} className="mb-2">
                                  {safeRender(typeof instruction === 'string' ? instruction : instruction.text || instruction)}
                                </li>
                              ));
                            } else if (typeof recipeData.instructions === 'string') {
                              return recipeData.instructions.split('\n').filter((line: string) => line.trim() !== '').map((line: string, idx: number) => (
                                <li key={idx} className="mb-2">{line.trim()}</li>
                              ));
                            } else {
                              return [];
                            }
                          } else if (recipeData?.detail?.instructions) {
                            if (Array.isArray(recipeData.detail.instructions)) {
                              return recipeData.detail.instructions.map((instruction: any, idx: number) => (
                                <li key={idx} className="mb-2">
                                  {safeRender(typeof instruction === 'string' ? instruction : instruction.text || instruction)}
                                </li>
                              ));
                            } else if (typeof recipeData.detail.instructions === 'string') {
                              return recipeData.detail.instructions.split('\n').filter((line: string) => line.trim() !== '').map((line: string, idx: number) => (
                                <li key={idx} className="mb-2">{line.trim()}</li>
                              ));
                            } else {
                              return [];
                            }
                          } else {
                            return <li>加载中...</li>;
                          }
                        })()}
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
                            <span>{(() => {
                              const value = recipeData?.all_time || 
                                         recipeData?.cookingTime || 
                                         recipeData?.metadata?.all_time || 
                                         recipeData?.detail?.cookTime;
                              return safeRender(value);
                            })()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Difficulty</span>
                            <span>{(() => {
                              const value = recipeData?.difficulty || 
                                         recipeData?.metadata?.difficulty || 
                                         recipeData?.detail?.difficulty;
                              return safeRender(value, "Medium");
                            })()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cooking Method</span>
                            <span>{(() => {
                              const value = recipeData?.cookingMethods || 
                                         recipeData?.cookingMethod || 
                                         recipeData?.metadata?.cookingMethods || 
                                         recipeData?.detail?.cookingMethod;
                              return safeRender(value);
                            })()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cuisine Style</span>
                            <span>{(() => {
                              const value = recipeData?.strArea || 
                                         recipeData?.mealStyle || 
                                         recipeData?.cuisine || 
                                         recipeData?.metadata?.mealStyle || 
                                         recipeData?.metadata?.strArea || 
                                         recipeData?.detail?.cuisine;
                              return safeRender(value, "国际料理");
                            })()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3 dark:text-white">{t("video.dietaryInformation")}</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(() => {
                          // 处理各种格式的标签
                          const tags = recipeData?.strTags || 
                                       recipeData?.metadata?.strTags || 
                                       recipeData?.tags || 
                                       recipeData?.detail?.tags;
                          
                          if (!tags) {
                            return (
                              <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                                未分类
                              </Badge>
                            );
                          }
                          
                          // 字符串格式标签
                          if (typeof tags === 'string') {
                            return tags.split(',').map((tag: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                                {tag.trim()}
                              </Badge>
                            ));
                          }
                          
                          // 数组格式标签
                          if (Array.isArray(tags)) {
                            return tags.map((tag: any, idx: number) => (
                              <Badge key={idx} variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                                {safeRender(tag)}
                              </Badge>
                            ));
                          }
                          
                          // 对象格式标签
                          if (typeof tags === 'object') {
                            return (
                              <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                                {JSON.stringify(tags)}
                              </Badge>
                            );
                          }
                          
                          // 默认情况
                          return (
                            <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                              未分类
                            </Badge>
                          );
                        })()}
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

      {/* 开发模式下的数据结构调试区 */}
      {process.env.NODE_ENV === 'development' && recipeData && (
        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8">
          <details className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <summary className="font-medium cursor-pointer dark:text-white">
              数据结构调试 (仅开发模式可见)
            </summary>
            <div className="mt-4 max-h-[400px] overflow-auto">
              <h4 className="text-sm font-semibold mb-2 dark:text-white">顶级字段:</h4>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {Object.keys(recipeData).map(key => (
                  <div key={key} className="text-xs bg-white dark:bg-gray-700 p-2 rounded">
                    <span className="font-semibold dark:text-gray-300">{key}:</span> 
                    <span className="text-gray-500 dark:text-gray-400">
                      {typeof recipeData[key] === 'object' 
                        ? Array.isArray(recipeData[key]) 
                          ? `Array(${recipeData[key].length})` 
                          : 'Object'
                        : String(recipeData[key]).substring(0, 50) + (String(recipeData[key]).length > 50 ? '...' : '')
                      }
                    </span>
                  </div>
                ))}
              </div>

              <h4 className="text-sm font-semibold mb-2 dark:text-white">原始数据 (前1000字符):</h4>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-xs overflow-auto max-h-[200px] dark:text-gray-300">
                {JSON.stringify(recipeData, null, 2).substring(0, 1000) + '...'}
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  )
} 