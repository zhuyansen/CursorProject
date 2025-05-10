/**
 * 图片处理工具函数
 * 提供处理图片URL、错误处理和占位图替换的工具函数
 */

// 已知会导致加载问题的S3图片列表及其替代图片
export const problematicImageMap: Record<string, string> = {
  // 直接匹配的路径
  'dishes_en/semi-finished/French_fries/French_fries.jpg': '/food-placeholders/French_fries.jpg',  // 薯条
  'dishes_en/meat_dish/Steak/Steak.jpg': '/food-placeholders/Steak.jpg',  // 牛排
  
  // 常见的加载时间过长的其他图片 - 如需添加更多
  'dishes_en/dessert/Cookies/Cookies.jpg': '/food-placeholders/food-3.jpg', // 饼干
  'dishes_en/vegetables/Salad/Salad.jpg': '/food-placeholders/food-4.jpg',  // 沙拉

  // 如果以后发现更多问题图片，可以在这里添加
  
  // 默认占位图
  'default': '/placeholder.svg'  
};

/**
 * 检查URL是否指向已知的有问题S3图片
 * @param url 图片URL
 * @returns 是否为已知问题图片
 */
export function isProblematicImage(url: string): boolean {
  if (!url) return false;
  
  // 检查URL是否包含任何已知的问题图片路径
  return Object.keys(problematicImageMap).some(path => 
    url.includes(path) && path !== 'default'
  );
}

/**
 * 获取问题图片的替代图片
 * @param url 原始图片URL
 * @returns 替代图片URL
 */
export function getAlternativeImage(url: string): string {
  if (!url) return problematicImageMap['default'];
  
  // 查找匹配的替代图片
  const matchedPath = Object.keys(problematicImageMap).find(path => 
    url.includes(path) && path !== 'default'
  );
  
  // 返回匹配的替代图片或默认占位图
  return matchedPath 
    ? problematicImageMap[matchedPath] 
    : problematicImageMap['default'];
}

/**
 * 随机获取一个食物占位图
 * @returns 随机食物占位图URL
 */
export function getRandomFoodPlaceholder(): string {
  // 生成1-20之间的随机数
  const randomNum = Math.floor(Math.random() * 20) + 1;
  return `/food-placeholders/food-${randomNum}.jpg`;
}

/**
 * 根据图片URL中的关键词选择合适的食物占位图
 * @param url 原始图片URL
 * @returns 根据关键词选择的占位图URL
 */
export function getFoodPlaceholderByKeyword(url: string): string {
  if (!url) return getRandomFoodPlaceholder();
  
  const lowerUrl = url.toLowerCase();
  
  // 根据URL中的关键词选择合适的占位图
  if (lowerUrl.includes('steak') || lowerUrl.includes('beef')) {
    return '/food-placeholders/food-2.jpg'; // 牛排/牛肉
  } else if (lowerUrl.includes('salad') || lowerUrl.includes('vegetable')) {
    return '/food-placeholders/food-4.jpg'; // 沙拉/蔬菜
  } else if (lowerUrl.includes('dessert') || lowerUrl.includes('cookie') || lowerUrl.includes('cake')) {
    return '/food-placeholders/food-3.jpg'; // 甜点/饼干/蛋糕
  } else if (lowerUrl.includes('fries') || lowerUrl.includes('potato')) {
    return '/food-placeholders/food-1.jpg'; // 薯条/土豆
  } else if (lowerUrl.includes('chicken') || lowerUrl.includes('meat')) {
    return '/food-placeholders/food-5.jpg'; // 鸡肉/肉类
  } else if (lowerUrl.includes('soup') || lowerUrl.includes('hot')) {
    return '/food-placeholders/food-6.jpg'; // 汤/热食
  } else if (lowerUrl.includes('fish') || lowerUrl.includes('seafood')) {
    return '/food-placeholders/food-7.jpg'; // 鱼/海鲜
  } else if (lowerUrl.includes('breakfast') || lowerUrl.includes('egg')) {
    return '/food-placeholders/food-8.jpg'; // 早餐/鸡蛋
  }
  
  // 默认随机选择
  return getRandomFoodPlaceholder();
}

/**
 * 智能图片URL处理函数，处理问题图片并返回合适的URL
 * @param url 原始图片URL
 * @returns 处理后的图片URL（替代图片或原始URL）
 */
export function processImageUrl(url: string): string {
  if (!url || url.includes('placeholder')) {
    return problematicImageMap['default'];
  }
  
  try {
    // 检查URL是否为有效的URL格式
    new URL(url);
    
    // 检查是否为已知的S3问题图片
    if (url.includes('s3.us-east-1.amazonaws.com/brickrecipes.ai/')) {
      // 检查是否为已知问题图片
      if (isProblematicImage(url)) {
        console.log(`[ImageUtils] Using alternative image for known problematic image: ${url}`);
        return getAlternativeImage(url);
      }
      
      // 检查URL长度，非常长的URL可能会导致超时
      if (url.length > 500) {
        console.log(`[ImageUtils] URL too long, using food placeholder: ${url}`);
        return getFoodPlaceholderByKeyword(url);
      }
    }
    
    // 返回原始URL
    return url;
  } catch (e) {
    // 无效URL格式，返回默认占位图
    console.error(`[ImageUtils] Invalid image URL: ${url}`, e);
    return problematicImageMap['default'];
  }
} 