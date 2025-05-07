"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Language = "en" | "zh"

type LanguageContextType = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
}

const translations = {
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.brickLinkRecipes": "BrickLinkRecipes",
    "nav.menu": "Menu",
    "nav.videoToRecipes": "VideoToRecipes",
    "nav.billing": "Billing",
    "nav.faq": "FAQ",
    "nav.signIn": "Sign In",
    "nav.signUp": "Sign Up",
    "nav.contactUs": "Contact Us",

    // Common buttons
    "button.search": "Search",
    "button.filterByIngredients": "Filter by Ingredients",
    "button.applyFilters": "Apply Filters",
    "button.clearAll": "Clear All",
    "button.viewRecipe": "View Recipe",
    "button.watchVideo": "Watch Video",
    "button.watchFullVideo": "Watch Full Video Tutorial",
    "button.viewFullRecipe": "View Full Recipe Details",
    "button.findRecipes": "Find Recipes",
    "button.analyzeVideo": "Analyze Video",
    "button.analyzing": "Analyzing...",
    "button.watchOriginalVideo": "Watch Original Video",
    "button.subscribe": "Subscribe",
    "button.findByIngredients": "Find by Ingredients",
    "button.browseMenu": "Browse Menu",
    "button.videoToRecipes": "Video to Recipes",
    "button.getStarted": "Get Started",

    // Recipe page
    "recipe.findYourPerfect": "Find Your Perfect Recipe",
    "recipe.buildYourRecipes": "Build Your Recipes, Brick by Brick!",
    "recipe.discoverDelicious":
      "Find recipes by ingredients, explore curated collections, or convert videos into detailed recipes — all in one place",
    "recipe.brickLinkDescription": 
      "Find recipes by ingredients — select what you have, we'll show you what to cook",
    "recipe.menuDescription":
      "Explore our curated collection of traditional recipes with detailed video tutorials",
    "recipe.videoToRecipesDescription":
      "Turn any cooking video into a complete recipe with ingredients, steps and nutrition facts",
    "recipe.searchPlaceholder": "Search for recipes, ingredients, or videos...",
    "recipe.recipeResults": "Recipe Results",
    "recipe.sortBy": "Sort by:",
    "recipe.relevance": "Relevance",
    "recipe.noRecipesFound": "No recipes found",
    "recipe.trySelecting": "Try selecting different ingredients or adjusting your search criteria.",

    // VideoToRecipes
    "video.title": "VideoToRecipes",
    "video.description":
      "Convert cooking videos into detailed recipes with ingredients, instructions, and nutritional information",
    "video.pastePlaceholder": "Paste {platform} video URL here...",
    "video.searchVideoUrl": "Search video URL, create your full recipes details",
    "video.tipTitle": "Video Analysis Tips",
    "video.analyzingVideo": "Analyzing Video",
    "video.pleaseWait":
      "Please wait while we analyze the video content to extract recipe information. This process may take a few moments.",
    "video.identifying": "We're identifying ingredients, cooking methods, and nutritional information...",
    "video.videoSummary": "Video Summary",
    "video.quickRecipeGuide": "Quick Recipe Guide",
    "video.ingredients": "Ingredients",
    "video.preparationSteps": "Preparation Steps",
    "video.nutritionInformation": "Nutrition Information",
    "video.amountPerServing": "Amount Per Serving",
    "video.dietaryInformation": "Dietary Information",
    "video.healthBenefits": "Health Benefits",
    "video.howItWorks": "How It Works",
    "video.supportedVideoTypes": "Supported Video Types",
    "video.linkError": "Link Error",
    "video.invalidYoutubeLink": "Invalid YouTube link. Please provide a valid YouTube video link.",
    "video.invalidBilibiliLink": "Invalid Bilibili link. Please provide a valid Bilibili video link.",
    "video.invalidLink": "Invalid link. Please provide a valid video link.",
    "video.exampleLinkFormats": "Example link formats:",
    "video.processingVideo": "Processing video...",
    "video.extractingRecipe": "Extracting recipe information...",
    "video.wrongPlatformYoutubeToBilibili": "You provided a YouTube link, but Bilibili analysis is selected. Please switch to the YouTube tab or provide a Bilibili link.",
    "video.wrongPlatformBilibiliToYoutube": "You provided a Bilibili link, but YouTube analysis is selected. Please switch to the Bilibili tab or provide a YouTube link.",
    "video.unsupportedPlatform": "This link format is not supported. Please provide a valid YouTube or Bilibili link.",
    "video.confirmButtonText": "OK",
    "video.platformMismatchTitle": "Platform Mismatch",
    "video.platformMismatchMessage": "Please use the correct platform tab for your video link",
    "video.onlyUseYoutubeOnYoutube": "YouTube links can only be analyzed in the YouTube tab",
    "video.onlyUseBilibiliOnBilibili": "Bilibili links can only be analyzed in the Bilibili tab",
    "video.switchToCorrectTab": "Switch to the correct tab or paste a valid link for the current platform",

    // Video tutorials
    "video.tutorialBenefits": "Video Tutorial Benefits",
    "video.seeEveryStep": "See Every Step",
    "video.watchSteps": "Watch exactly how each step should be performed for perfect results",
    "video.timeReferences": "Time References",
    "video.timeReferencesDesc": "Each video includes timestamps for quick reference to specific techniques",
    "video.expertTips": "Expert Tips",
    "video.expertTipsDesc": "Learn professional techniques and cooking secrets from experienced chefs",

    // Menu
    "menu.recipeCategories": "Recipe Categories",
    "menu.browseByCategory":
      "Browse our recipes by category - each with video tutorials, step-by-step instructions, and calorie information",
    "menu.viewRecipes": "View Recipes",
    "menu.exploreRecipes": "Explore Recipes with Video Tutorials",
    "menu.youMightAlsoLike": "You Might Also Like",
    "menu.all": "ALL",
    "menu.eastern": "Eastern",
    "menu.western": "Western",
    "menu.viewAll": "View All",
    "menu.video": "Video",

    // Contact
    "contact.title": "Contact Us",
    "contact.subtitle": "We value your feedback",
    "contact.description": "Please share your suggestions or feedback with us. We may provide membership benefits to valuable contributors and keep you updated with our latest versions.",
    "contact.emailPlaceholder": "Your email",
    "contact.feedbackPlaceholder": "Your feedback or suggestions",
    "contact.submit": "Submit",
    "contact.privacyNotice": "We'll never share your email with anyone else.",
    "contact.submitSuccess": "Thank you for your feedback!",

    // Footer
    "footer.buildYourRecipes": "Build Your Recipes, Brick by Brick!",
    "footer.quickLinks": "Quick Links",
    "footer.support": "Support",
    "footer.subscribe": "Subscribe",
    "footer.getLatest": "Get the latest recipes and updates",
    "footer.emailPlaceholder": "Your email",
    "footer.allRightsReserved": "All rights reserved.",

    // Menu categories
    "category.breakfast": "Breakfast",
    "category.lunch": "Lunch",
    "category.dinner": "Dinner",
    "category.desserts": "Desserts",
    "category.snacks": "Snacks",
    "category.drinks": "Drinks",

    // Video tips
    "video.forBestResults": "For best results",
    "video.tipClearVideo": "Use videos that clearly show the cooking process",
    "video.tipMayTakeTime": "Video analysis may take a few moments to complete",
    "video.tipDetailedVideo": "The more detailed the video, the better the recipe extraction",
    "video.tipCorrectUrl": "Make sure the video URL is correct and publicly accessible",

    // Billing
    "billing.title": "Billing & Subscription",
    "billing.manageSubscription": "Manage your subscription and payment methods",
    "billing.subscription": "Subscription",
    "billing.paymentMethods": "Payment Methods",
    "billing.billingSettings": "Billing Settings",
    "billing.currentPlan": "Current Plan",
    "billing.freePlan": "Free Plan",
    "billing.basicFeatures": "Basic features with limited access",
    "billing.upgradePlan": "Upgrade Plan",
    "billing.choosePlan": "Choose a Plan",
    "billing.monthlyPlan": "Monthly Plan",
    "billing.yearlyPlan": "Yearly Plan",
    "billing.save": "Save",
    "billing.perMonth": "per month",
    "billing.perYear": "per year",
    "billing.continueToPayment": "Continue to Payment",
    "billing.planComparison": "Plan Comparison",
    "billing.features": "Features",
    "billing.free": "Free",
    "billing.monthly": "Monthly",
    "billing.yearly": "Yearly",

    // Billing plan features
    "billing.recipeSearch": "Recipe Search",
    "billing.basic": "Basic",
    "billing.advanced": "Advanced",
    "billing.savedRecipes": "Saved Recipes",
    "billing.unlimited": "Unlimited",
    "billing.createRecipes": "Create Recipes",
    "billing.adFreeExperience": "Ad-Free Experience",
    "billing.mealPlanning": "Meal Planning",
    "billing.prioritySupport": "Priority Support",

    // Billing payment page
    "billing.addNewPaymentMethod": "Add New Payment Method",
    "billing.billingHistory": "Billing History",
    "billing.date": "Date",
    "billing.description": "Description",
    "billing.amount": "Amount",
    "billing.status": "Status",
    "billing.invoice": "Invoice",
    "billing.paid": "Paid",
    "billing.download": "Download",
    "billing.monthlySubscription": "Monthly Subscription",

    // FAQ
    "faq.title": "Find answers to common questions about BrickRecipes",
    "faq.searchPlaceholder": "Search for answers...",
    "faq.gettingStarted": "Getting Started",
    "faq.recipes": "Recipes",
    "faq.account": "Account",
    "faq.billing": "Billing",
    "faq.generalQuestions": "General Questions",
    "faq.whatIsBrickRecipes": "What is BrickRecipes?",
    "faq.isBrickRecipesFree": "Is BrickRecipes free to use?",
    "faq.howDoISearchRecipes": "How do I search for recipes?",
    "faq.canIContributeRecipes": "Can I contribute my own recipes?",
    "faq.howDoVideoTutorialsWork": "How do the video tutorials work?",
    "faq.howDoISaveRecipes": "How do I save recipes to my collection?",
    "faq.accountAndBilling": "Account & Billing",
    "faq.howToCreateAccount": "How do I create an account?",
    "faq.howToUpgradeSubscription": "How do I upgrade my subscription?",
    "faq.canICancelSubscription": "Can I cancel my subscription?",
    "faq.whatPaymentMethodsDoYouAccept": "What payment methods do you accept?",
    "faq.technicalSupport": "Technical Support",
    "faq.howDoIResetPassword": "How do I reset my password?",
    "faq.websiteNotLoadingProperly": "The website is not loading properly. What should I do?",
    "faq.howDoIReportBugOrIssue": "How do I report a bug or issue?",
    "faq.contactSupport": "Contact Support",

    // Video content
    "video.homemadePizzaRecipe": "Homemade Pizza Recipe",
    "video.byChef": "By Chef John",
    "video.views": "views",
    "video.minutes": "minutes",
    "video.howItWorksContent1": "Paste any cooking video URL from YouTube or Bilibili",
    "video.howItWorksContent2": "Our AI analyzes the video for ingredients, instructions, and nutritional information",
    "video.howItWorksContent3": "Get a complete recipe with timestamps and cooking tips",
    "video.supportedVideoTypes1": "YouTube - Any public cooking tutorial or recipe video",
    "video.supportedVideoTypes2": "Bilibili - Cooking shows and recipe demonstrations",
    "video.supportedVideoTypes3": "Direct links to other major video platforms coming soon",
    
    // Recipe details
    "video.doughPreparation": "Dough preparation",
    "video.sauceMaking": "Sauce making",
    "video.doughStretching": "Dough stretching",
    "video.toppingApplication": "Topping application",
    "video.bakingTechniques": "Baking techniques",
    "video.servingSuggestions": "Serving suggestions",
    "video.keyTimestamps": "Key Timestamps",

    // Menu recipe titles and details
    "menu.recipeTitle.brickOvenPancakes": "Brick Oven Pancakes",
    "menu.recipeTitle.brickLayerOmelette": "Brick Layer Omelette",
    "menu.recipeTitle.brickFoundationAvocadoToast": "Brick Foundation Avocado Toast",
    "menu.recipeTitle.brickRoadBreakfastBurrito": "Brick Road Breakfast Burrito",
    "menu.recipeTitle.brickHouseSandwich": "Brick House Sandwich",
    "menu.recipeTitle.brickWallSalad": "Brick Wall Salad",
    "menu.recipeTitle.brickLayerSoup": "Brick Layer Soup",
    "menu.recipeTitle.brickRoadWrap": "Brick Road Wrap",
    "menu.recipeTitle.brickOvenPizza": "Brick Oven Pizza",
    "menu.recipeTitle.brickLayerLasagna": "Brick Layer Lasagna",
    "menu.recipeTitle.brickWallSteak": "Brick Wall Steak",
    "menu.recipeTitle.brickFoundationRisotto": "Brick Foundation Risotto",
    "menu.recipeTitle.brickLayerCake": "Brick Layer Cake",
    "menu.recipeTitle.brickRoadCookies": "Brick Road Cookies",
    "menu.recipeTitle.brickHouseBrownies": "Brick House Brownies",
    "menu.recipeTitle.brickOvenApplePie": "Brick Oven Apple Pie",
    
    "menu.description.breakfast": "Start your day with these delicious breakfast recipes with video tutorials",
    "menu.description.lunch": "Perfect midday meals with step-by-step instructions and calorie information",
    "menu.description.dinner": "Impressive dinner recipes with detailed video guides and nutritional facts",
    "menu.description.desserts": "Sweet treats with precise measurements and video demonstrations",
    "menu.description.snacks": "Quick and easy bites with video tutorials and calorie information",
    "menu.description.drinks": "Refreshing beverages with video guides and nutritional details",
    
    "menu.time": "min",
    "menu.calories": "kcal",

    // Section descriptions
    "section.whyChoose.title": "Why Choose BrickRecipes?",
    "section.whyChoose.description": "Our three powerful features will revolutionize the way you cook, making meal preparation easier, faster, and more enjoyable",
    "section.howItWorks.title": "How It Works",
    "section.howItWorks.description": "Four simple steps to transform your cooking experience with BrickRecipes — each designed to simplify your journey from ingredients to delicious meals",
    "section.pricingPlans.title": "Membership Plans",
    "section.pricingPlans.description": "Choose the plan that matches your cooking needs — from casual home cooks to professional chefs, we have options for everyone",
    "section.faq.title": "Frequently Asked Questions",
    "section.faq.description": "Find answers to common questions about BrickRecipes features, accounts, and services — everything you need to know in one place",

    // Ingredients categories
    "ingredient.category.vegetables": "Vegetables",
    "ingredient.category.meat": "Meat",
    "ingredient.category.cookingMethods": "Cooking Methods",
    "ingredient.category.cuisineStyles": "Cuisine Styles",
    
    // Vegetables
    "ingredient.vegetable.tomato": "Tomato",
    "ingredient.vegetable.onion": "Onion",
    "ingredient.vegetable.pepper": "Pepper",
    "ingredient.vegetable.carrot": "Carrot",
    "ingredient.vegetable.broccoli": "Broccoli",
    "ingredient.vegetable.spinach": "Spinach",
    "ingredient.vegetable.mushroom": "Mushroom",
    "ingredient.vegetable.garlic": "Garlic",
    
    // Meat
    "ingredient.meat.chicken": "Chicken",
    "ingredient.meat.beef": "Beef",
    "ingredient.meat.pork": "Pork",
    "ingredient.meat.fish": "Fish",
    "ingredient.meat.shrimp": "Shrimp",
    "ingredient.meat.lamb": "Lamb",
    
    // Cooking Methods
    "cooking.method.bake": "Bake",
    "cooking.method.fry": "Fry",
    "cooking.method.steam": "Steam",
    "cooking.method.boil": "Boil",
    "cooking.method.grill": "Grill",
    "cooking.method.roast": "Roast",
    
    // Cuisine Styles
    "cuisine.style.chinese": "Chinese",
    "cuisine.style.italian": "Italian",
    "cuisine.style.mexican": "Mexican",
    "cuisine.style.indian": "Indian",
    "cuisine.style.japanese": "Japanese",
    "cuisine.style.american": "American",

    // Hero Stats
    "hero.over": "Over",
    "hero.recipes": "Recipes",
    "hero.join": "Join",
    "hero.users": "Users",

    // Filter categories
    "filter.all": "ALL",
    "filter.eastern": "Eastern",
    "filter.western": "Western",
    
    // Recipe difficulty
    "recipe.difficulty.easy": "Easy",
    "recipe.difficulty.medium": "Medium",
    "recipe.difficulty.hard": "Hard",

    // Recipe nutritional info
    "recipe.calories": "Calories",
    "recipe.protein": "Protein",
    "recipe.carbs": "Carbs",
    "recipe.fat": "Fat",
    "recipe.total": "Total",
    "recipe.servings": "Servings",
    "recipe.difficulty": "Difficulty",
    "recipe.by": "Recipe by",
    "recipe.publishedOn": "Published on",
    "recipe.timeUnit": "min",
    "recipe.calorieUnit": "kcal",

    // New recipe steps
    "recipe.step.prepare": "按要求准备所有食材",
    "recipe.step.follow": "按照视频指导获得最佳效果",
    "recipe.step.cook": "按照推荐的时间和温度烹饪",
    "recipe.step.serve": "上菜并享用美味佳肴！",

    // New nutritional info
    "recipe.nutrition.fat": "脂肪",
    "recipe.nutrition.carbs": "碳水",
    "recipe.nutrition.protein": "蛋白质",
    "recipe.nutrition.calories": "卡路里",
  },
  zh: {
    // Navigation
    "nav.home": "首页",
    "nav.brickLinkRecipes": "砖块食谱",
    "nav.menu": "菜单",
    "nav.videoToRecipes": "视频转食谱",
    "nav.billing": "账单",
    "nav.faq": "常见问题",
    "nav.signIn": "登录",
    "nav.signUp": "注册",
    "nav.contactUs": "联系我们",

    // Common buttons
    "button.search": "搜索",
    "button.filterByIngredients": "按食材筛选",
    "button.applyFilters": "应用筛选",
    "button.clearAll": "清除全部",
    "button.viewRecipe": "查看食谱",
    "button.watchVideo": "观看视频",
    "button.watchFullVideo": "观看完整视频教程",
    "button.viewFullRecipe": "查看完整食谱详情",
    "button.findRecipes": "查找食谱",
    "button.analyzeVideo": "分析视频",
    "button.analyzing": "分析中...",
    "button.watchOriginalVideo": "观看原始视频",
    "button.subscribe": "订阅",
    "button.findByIngredients": "按食材筛选",
    "button.browseMenu": "浏览菜单",
    "button.videoToRecipes": "视频转食谱",
    "button.getStarted": "立即开始",

    // Recipe page
    "recipe.findYourPerfect": "找到您的完美食谱",
    "recipe.buildYourRecipes": "砖块搭建，食谱精彩！",
    "recipe.discoverDelicious": "按食材查找食谱、浏览精选合集，或将视频转为详细食谱 — 一站式解决方案",
    "recipe.brickLinkDescription": 
      "按食材查找食谱——选择您已有的，我们为您推荐适合的菜肴",
    "recipe.menuDescription":
      "探索我们精心策划的传统食谱系列，配有详细的视频教程",
    "recipe.videoToRecipesDescription":
      "将任何烹饪视频转换为完整的食谱，包含食材、步骤和营养成分",
    "recipe.searchPlaceholder": "搜索食谱、食材或视频...",
    "recipe.recipeResults": "食谱结果",
    "recipe.sortBy": "排序方式：",
    "recipe.relevance": "相关性",
    "recipe.noRecipesFound": "未找到食谱",
    "recipe.trySelecting": "尝试选择不同的食材或调整搜索条件。",

    // VideoToRecipes
    "video.title": "视频转食谱",
    "video.description": "将烹饪视频转换为详细的食谱，包含食材、说明和营养信息",
    "video.pastePlaceholder": "在此粘贴{platform}视频链接...",
    "video.searchVideoUrl": "搜索视频链接，创建您的完整食谱详情",
    "video.tipTitle": "视频分析提示",
    "video.analyzingVideo": "正在分析视频",
    "video.pleaseWait": "请稍候，我们正在分析视频内容以提取食谱信息。此过程可能需要几分钟。",
    "video.identifying": "我们正在识别食材、烹饪方法和营养信息...",
    "video.videoSummary": "视频摘要",
    "video.quickRecipeGuide": "快速食谱指南",
    "video.ingredients": "食材",
    "video.preparationSteps": "准备步骤",
    "video.nutritionInformation": "营养信息",
    "video.amountPerServing": "每份含量",
    "video.dietaryInformation": "饮食信息",
    "video.healthBenefits": "健康益处",
    "video.howItWorks": "工作原理",
    "video.supportedVideoTypes": "支持的视频类型",
    "video.linkError": "链接错误",
    "video.invalidYoutubeLink": "无效的YouTube链接。请提供正确的YouTube视频链接。",
    "video.invalidBilibiliLink": "无效的Bilibili链接。请提供正确的Bilibili视频链接。", 
    "video.invalidLink": "无效链接。请提供正确的视频链接。",
    "video.exampleLinkFormats": "示例链接格式：",
    "video.processingVideo": "处理视频中...",
    "video.extractingRecipe": "提取食谱信息中...",
    "video.wrongPlatformYoutubeToBilibili": "您提供了YouTube链接，但当前选择的是Bilibili分析。请切换到YouTube标签页或提供Bilibili链接。",
    "video.wrongPlatformBilibiliToYoutube": "您提供了Bilibili链接，但当前选择的是YouTube分析。请切换到Bilibili标签页或提供YouTube链接。",
    "video.unsupportedPlatform": "不支持此链接格式。请提供有效的YouTube或Bilibili链接。",
    "video.confirmButtonText": "确定",
    "video.platformMismatchTitle": "平台不匹配",
    "video.platformMismatchMessage": "请在正确的平台标签页下分析您的视频链接",
    "video.onlyUseYoutubeOnYoutube": "YouTube链接只能在YouTube标签页下分析",
    "video.onlyUseBilibiliOnBilibili": "Bilibili链接只能在Bilibili标签页下分析",
    "video.switchToCorrectTab": "请切换到正确的标签页或粘贴适用于当前平台的有效链接",

    // Video tutorials
    "video.tutorialBenefits": "视频教程优势",
    "video.seeEveryStep": "查看每一步",
    "video.watchSteps": "观看每一步应该如何精确执行，以获得完美结果",
    "video.timeReferences": "时间参考",
    "video.timeReferencesDesc": "每个视频都包含时间戳，方便快速参考特定技巧",
    "video.expertTips": "专家提示",
    "video.expertTipsDesc": "从经验丰富的厨师那里学习专业技巧和烹饪秘诀",

    // Menu
    "menu.recipeCategories": "Recipe Categories",
    "menu.browseByCategory":
      "Browse our recipes by category - each with video tutorials, step-by-step instructions, and calorie information",
    "menu.viewRecipes": "View Recipes",
    "menu.exploreRecipes": "Explore Recipes with Video Tutorials",
    "menu.youMightAlsoLike": "You Might Also Like",
    "menu.all": "ALL",
    "menu.eastern": "Eastern",
    "menu.western": "Western",
    "menu.viewAll": "View All",
    "menu.video": "Video",

    // Contact
    "contact.title": "联系我们",
    "contact.subtitle": "我们重视您的反馈",
    "contact.description": "请分享您的建议或反馈。我们可能会为有价值的贡献者提供会员权益，并及时向您通报最新版本信息。",
    "contact.emailPlaceholder": "您的邮箱",
    "contact.feedbackPlaceholder": "您的反馈或建议",
    "contact.submit": "提交",
    "contact.privacyNotice": "我们绝不会与任何人分享您的邮箱。",
    "contact.submitSuccess": "感谢您的反馈！",

    // Footer
    "footer.buildYourRecipes": "一砖一瓦构建您的食谱！",
    "footer.quickLinks": "快速链接",
    "footer.support": "支持",
    "footer.subscribe": "订阅",
    "footer.getLatest": "获取最新食谱和更新",
    "footer.emailPlaceholder": "您的邮箱",
    "footer.allRightsReserved": "版权所有。",

    // Menu categories
    "category.breakfast": "早餐",
    "category.lunch": "午餐",
    "category.dinner": "晚餐",
    "category.desserts": "甜点",
    "category.snacks": "小吃",
    "category.drinks": "饮品",

    // Video tips
    "video.forBestResults": "为获得最佳效果",
    "video.tipClearVideo": "使用清晰展示烹饪过程的视频",
    "video.tipMayTakeTime": "视频分析可能需要几分钟才能完成",
    "video.tipDetailedVideo": "视频越详细，食谱提取效果越好",
    "video.tipCorrectUrl": "确保视频URL正确且可公开访问",

    // Billing
    "billing.title": "账单与订阅",
    "billing.manageSubscription": "管理您的订阅和支付方式",
    "billing.subscription": "订阅",
    "billing.paymentMethods": "支付方式",
    "billing.billingSettings": "账单设置",
    "billing.currentPlan": "当前计划",
    "billing.freePlan": "免费计划",
    "billing.basicFeatures": "具有有限访问权限的基本功能",
    "billing.upgradePlan": "升级计划",
    "billing.choosePlan": "选择计划",
    "billing.monthlyPlan": "月付计划",
    "billing.yearlyPlan": "年付计划",
    "billing.save": "节省",
    "billing.perMonth": "每月",
    "billing.perYear": "每年",
    "billing.continueToPayment": "继续付款",
    "billing.planComparison": "计划比较",
    "billing.features": "功能",
    "billing.free": "免费",
    "billing.monthly": "月付",
    "billing.yearly": "年付",

    // Billing plan features
    "billing.recipeSearch": "食谱搜索",
    "billing.basic": "基础",
    "billing.advanced": "高级",
    "billing.savedRecipes": "已保存食谱",
    "billing.unlimited": "无限",
    "billing.createRecipes": "创建食谱",
    "billing.adFreeExperience": "无广告体验",
    "billing.mealPlanning": "膳食计划",
    "billing.prioritySupport": "优先支持",

    // Billing payment page
    "billing.addNewPaymentMethod": "添加新支付方式",
    "billing.billingHistory": "账单历史",
    "billing.date": "日期",
    "billing.description": "描述",
    "billing.amount": "金额",
    "billing.status": "状态",
    "billing.invoice": "发票",
    "billing.paid": "已支付",
    "billing.download": "下载",
    "billing.monthlySubscription": "月度订阅",

    // FAQ
    "faq.title": "查找有关BrickRecipes的常见问题解答",
    "faq.searchPlaceholder": "搜索答案...",
    "faq.gettingStarted": "入门指南",
    "faq.recipes": "食谱",
    "faq.account": "账户",
    "faq.billing": "账单",
    "faq.generalQuestions": "常见问题",
    "faq.whatIsBrickRecipes": "什么是BrickRecipes？",
    "faq.isBrickRecipesFree": "BrickRecipes是免费使用的吗？",
    "faq.howDoISearchRecipes": "如何搜索食谱？",
    "faq.canIContributeRecipes": "我可以贡献自己的食谱吗？",
    "faq.howDoVideoTutorialsWork": "视频教程是如何工作的？",
    "faq.howDoISaveRecipes": "如何将食谱保存到我的收藏中？",
    "faq.accountAndBilling": "账户与账单",
    "faq.howToCreateAccount": "如何创建账户？",
    "faq.howToUpgradeSubscription": "如何升级订阅？",
    "faq.canICancelSubscription": "我可以取消订阅吗？",
    "faq.whatPaymentMethodsDoYouAccept": "您接受哪些支付方式？",
    "faq.technicalSupport": "技术支持",
    "faq.howDoIResetPassword": "如何重置密码？",
    "faq.websiteNotLoadingProperly": "网站加载不正常，我该怎么办？",
    "faq.howDoIReportBugOrIssue": "如何报告错误或问题？",
    "faq.contactSupport": "联系支持",

    // Video content
    "video.homemadePizzaRecipe": "自制披萨食谱",
    "video.byChef": "由厨师John提供",
    "video.views": "观看次数",
    "video.minutes": "分钟",
    "video.howItWorksContent1": "粘贴任何来自YouTube或Bilibili的烹饪视频URL",
    "video.howItWorksContent2": "我们的AI分析视频中的配料、指南和营养信息",
    "video.howItWorksContent3": "获取完整食谱，包含时间戳和烹饪技巧",
    "video.supportedVideoTypes1": "YouTube - 任何公开的烹饪教程或食谱视频",
    "video.supportedVideoTypes2": "Bilibili - 烹饪节目和食谱演示",
    "video.supportedVideoTypes3": "其他主要视频平台的直接链接即将推出",
    
    // Recipe details
    "video.doughPreparation": "面团准备",
    "video.sauceMaking": "制作酱料",
    "video.doughStretching": "拉伸面团",
    "video.toppingApplication": "添加配料",
    "video.bakingTechniques": "烘焙技巧",
    "video.servingSuggestions": "上菜建议",
    "video.keyTimestamps": "关键时间点",

    // Menu recipe titles and details
    "menu.recipeTitle.brickOvenPancakes": "砖炉烤松饼",
    "menu.recipeTitle.brickLayerOmelette": "层叠蛋卷",
    "menu.recipeTitle.brickFoundationAvocadoToast": "基础牛油果吐司",
    "menu.recipeTitle.brickRoadBreakfastBurrito": "早餐卷饼",
    "menu.recipeTitle.brickHouseSandwich": "特色三明治",
    "menu.recipeTitle.brickWallSalad": "层叠沙拉",
    "menu.recipeTitle.brickLayerSoup": "层次浓汤",
    "menu.recipeTitle.brickRoadWrap": "特色卷饼",
    "menu.recipeTitle.brickOvenPizza": "砖炉披萨",
    "menu.recipeTitle.brickLayerLasagna": "层叠千层面",
    "menu.recipeTitle.brickWallSteak": "特制牛排",
    "menu.recipeTitle.brickFoundationRisotto": "基础意大利炖饭",
    "menu.recipeTitle.brickLayerCake": "层叠蛋糕",
    "menu.recipeTitle.brickRoadCookies": "特色曲奇",
    "menu.recipeTitle.brickHouseBrownies": "特制布朗尼",
    "menu.recipeTitle.brickOvenApplePie": "砖炉苹果派",
    
    "menu.description.breakfast": "通过这些美味的早餐食谱和视频教程开始新的一天",
    "menu.description.lunch": "完美的午餐，配有逐步说明和卡路里信息",
    "menu.description.dinner": "令人印象深刻的晚餐食谱，配有详细的视频指南和营养成分",
    "menu.description.desserts": "精确测量和视频演示的甜点",
    "menu.description.snacks": "快速简便的小吃，配有视频教程和卡路里信息",
    "menu.description.drinks": "提神饮品，配有视频指南和营养详情",
    
    "menu.time": "分钟",
    "menu.calories": "卡路里",

    // Section descriptions
    "section.whyChoose.title": "为什么选择砖块食谱？",
    "section.whyChoose.description": "我们的三大核心功能将彻底改变您的烹饪方式，让备餐更轻松、更快捷、更愉悦",
    "section.howItWorks.title": "如何使用",
    "section.howItWorks.description": "通过四个简单步骤，体验砖块食谱带给您的全新烹饪体验 — 每一步都旨在简化您从食材到美味佳肴的旅程",
    "section.pricingPlans.title": "会员计划",
    "section.pricingPlans.description": "选择适合您烹饪需求的会员计划 — 从家庭烹饪爱好者到专业厨师，我们为每个人提供合适的选择",
    "section.faq.title": "常见问题",
    "section.faq.description": "查找关于砖块食谱功能、账户和服务的常见问题解答 — 您需要了解的一切都在这里",

    // Ingredients categories
    "ingredient.category.vegetables": "蔬菜",
    "ingredient.category.meat": "肉类",
    "ingredient.category.cookingMethods": "烹饪方法",
    "ingredient.category.cuisineStyles": "菜系风格",
    
    // Vegetables
    "ingredient.vegetable.tomato": "番茄",
    "ingredient.vegetable.onion": "洋葱",
    "ingredient.vegetable.pepper": "辣椒",
    "ingredient.vegetable.carrot": "胡萝卜",
    "ingredient.vegetable.broccoli": "西兰花",
    "ingredient.vegetable.spinach": "菠菜",
    "ingredient.vegetable.mushroom": "蘑菇",
    "ingredient.vegetable.garlic": "大蒜",
    
    // Meat
    "ingredient.meat.chicken": "鸡肉",
    "ingredient.meat.beef": "牛肉",
    "ingredient.meat.pork": "猪肉",
    "ingredient.meat.fish": "鱼",
    "ingredient.meat.shrimp": "虾",
    "ingredient.meat.lamb": "羊肉",
    
    // Cooking Methods
    "cooking.method.bake": "烘焙",
    "cooking.method.fry": "油炸",
    "cooking.method.steam": "蒸",
    "cooking.method.boil": "煮",
    "cooking.method.grill": "烧烤",
    "cooking.method.roast": "烘烤",
    
    // Cuisine Styles
    "cuisine.style.chinese": "中餐",
    "cuisine.style.italian": "意大利菜",
    "cuisine.style.mexican": "墨西哥菜",
    "cuisine.style.indian": "印度菜",
    "cuisine.style.japanese": "日本料理",
    "cuisine.style.american": "美式料理",

    // Hero Stats
    "hero.over": "超过",
    "hero.recipes": "个食谱",
    "hero.join": "加入",
    "hero.users": "位用户",

    // Filter categories
    "filter.all": "全部",
    "filter.eastern": "东方菜系",
    "filter.western": "西方菜系",
    
    // Recipe difficulty
    "recipe.difficulty.easy": "简单",
    "recipe.difficulty.medium": "中等",
    "recipe.difficulty.hard": "困难",

    // Recipe nutritional info
    "recipe.calories": "卡路里",
    "recipe.protein": "蛋白质",
    "recipe.carbs": "碳水化合物",
    "recipe.fat": "脂肪",
    "recipe.total": "总计",
    "recipe.servings": "份量",
    "recipe.difficulty": "难度",
    "recipe.by": "作者",
    "recipe.publishedOn": "发布于",
    "recipe.timeUnit": "分钟",
    "recipe.calorieUnit": "卡路里",

    // New recipe steps
    "recipe.step.prepare": "按要求准备所有食材",
    "recipe.step.follow": "按照视频指导获得最佳效果",
    "recipe.step.cook": "按照推荐的时间和温度烹饪",
    "recipe.step.serve": "上菜并享用美味佳肴！",

    // New nutritional info
    "recipe.nutrition.fat": "脂肪",
    "recipe.nutrition.carbs": "碳水",
    "recipe.nutrition.protein": "蛋白质",
    "recipe.nutrition.calories": "卡路里",
  },
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key: string) => key,
})

export const useLanguage = () => useContext(LanguageContext)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted to avoid hydration mismatch
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "zh")) {
      setLanguageState(savedLanguage)
    }
    setMounted(true)
  }, [])

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
    localStorage.setItem("language", newLanguage)
    // Force re-render of components that use the language context
    document.documentElement.lang = newLanguage
  }

  const t = (key: string): string => {
    if (!mounted) return key
    return translations[language][key as keyof (typeof translations)[typeof language]] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}
