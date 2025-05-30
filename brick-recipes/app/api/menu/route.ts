import { NextRequest, NextResponse } from 'next/server';
import redis from '@/config/redis';

// 定义食谱对象的接口
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

// 将Redis分类键映射到应用分类
const categoryTagsMap: Record<string, string> = {
  "breakfast": "index:tag:Breakfast",
  "lunch": "index:tag:Lunch", 
  "dinner": "index:tag:Dinner",
  "desserts": "index:tag:Desserts",
  "snacks": "index:tag:Snacks",
  "drinks": "index:tag:Drinks",
  "vegetarian": "index:tag:Vegetarian",
  "seafood": "index:tag:Seafood",
  "soup": "index:tag:Soup",
  "quickmeals": "index:tag:Quick", // 尝试其他可能的标签名
  "holiday": "index:tag:Holidays" // 尝试复数形式
};

const categoryKeysAlternatives: Record<string, string[]> = {
  "quickmeals": ["index:tag:Quick", "index:tag:Quickmeal", "index:tag:Quickmeals", "index:tag:Quick-meal", "index:tag:Fast"],
  "holiday": ["index:tag:Holiday", "index:tag:Holidays", "index:tag:Festival", "index:tag:Celebration"]
};

// 尝试获取Redis中所有标签集合，辅助调试
const logAvailableTags = async () => {
  try {
    // 获取所有以index:tag:开头的键
    const keys = await redis.keys("index:tag:*");
    // console.log("[API Menu] Available tag keys in Redis:", keys);
    return keys;
  } catch (error) {
    console.error("[API Menu] Error getting tag keys:", error);
    return [];
  }
};

export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category')?.toLowerCase();
    
    // 记录当前请求的分类
    // console.log(`[API Menu] Requested category: ${category}`);
    
    // 分页参数
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '8', 10);
    const limit = parseInt(searchParams.get('limit') || '0', 10); // 0表示无限制
    
    // 列出所有可用标签，仅在开发环境执行
    if (process.env.NODE_ENV === 'development') {
      await logAvailableTags();
    }
    
    // 限制每页最大数量为50
    const limitedPageSize = Math.min(pageSize, 50);
    
    if (!category) {
      return NextResponse.json({ 
        message: 'Category parameter is required' 
      }, { status: 400 });
    }
    
    // 获取对应的Redis键
    let categoryKey = categoryTagsMap[category];
    
    // 如果是特殊处理的分类，尝试多种可能的键
    if (!categoryKey && categoryKeysAlternatives[category]) {
      // 尝试备选键
      for (const alternativeKey of categoryKeysAlternatives[category]) {
        // 检查这个键是否存在
        const exists = await redis.exists(alternativeKey);
        if (exists) {
          categoryKey = alternativeKey;
          // console.log(`[API Menu] Found alternative key for ${category}: ${alternativeKey}`);
          break;
        }
      }
    }
    
    if (!categoryKey) {
      // console.log(`[API Menu] Category not supported: ${category}`);
      return NextResponse.json({
        recipes: [],
        pagination: {
          page: 1,
          pageSize: limitedPageSize,
          totalRecipes: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      });
    }
    
    // console.log(`[API Menu] Getting recipes for category: ${category}, using key: ${categoryKey}`);
    
    // 获取分类下的所有食谱ID
    const recipeIds = await redis.smembers(categoryKey);
    
    if (!recipeIds || recipeIds.length === 0) {
      // console.log(`[API Menu] No recipes found for category: ${category}`);
      return NextResponse.json({
        recipes: [],
        pagination: {
          page: 1,
          pageSize: limitedPageSize,
          totalRecipes: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      });
    }

    // 排序食谱ID
    const sortedRecipeIds = recipeIds.sort();
    const totalRecipes = sortedRecipeIds.length;
    // console.log(`[API Menu] Found ${totalRecipes} recipes for category: ${category}`);
    
    // 计算总页数
    const totalPages = Math.ceil(totalRecipes / limitedPageSize);

    // 根据分页参数提取当前页的食谱ID
    let currentPageIds;
    if (limit > 0) {
      // 如果设置了limit，则只获取指定数量的食谱
      currentPageIds = sortedRecipeIds.slice(0, limit);
    } else {
      // 否则按照分页参数获取
      const startIndex = (page - 1) * limitedPageSize;
      const endIndex = Math.min(startIndex + limitedPageSize, totalRecipes);
      currentPageIds = sortedRecipeIds.slice(startIndex, endIndex);
    }
    
    // console.log(`[API Menu] Processing ${currentPageIds.length} recipes for category: ${category}`);
    
    // 批处理获取食谱详情
    const recipes: Recipe[] = [];
    const batchSize = 5; // 每批处理的数量
    
    for (let i = 0; i < currentPageIds.length; i += batchSize) {
      const batchIds = currentPageIds.slice(i, i + batchSize);
      const recipeKeys = batchIds.map(id => `recipe:${id}`);
      
      // console.log(`[API Menu] Fetching batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(currentPageIds.length/batchSize)}`);
      const recipeDataStrings = await redis.mget(recipeKeys);
      
      recipeDataStrings.forEach((recipeDataStr, index) => {
        const id = batchIds[index];
        
        if (!recipeDataStr) {
          console.warn(`[API Menu] Recipe details not found for ID: ${id}`);
          return;
        }
        
        try {
          const recipeData = JSON.parse(recipeDataStr);
          
          const formattedRecipe: Recipe = {
            id: recipeData.idMeal || id,
            title: recipeData.strMeal || "",
            image: recipeData.strMealThumb || "",
            time: recipeData.time || "25 min", // 使用固定默认值
            calories: recipeData.Energy || "0 kcal", // 直接使用Energy字段的值
            difficulty: recipeData.difficulty || "Easy", // 使用固定默认值
            tags: Array.isArray(recipeData.tags) ? recipeData.tags : 
                 (recipeData.strTags ? String(recipeData.strTags).split(',').map((t: string) => t.trim()).slice(0, 3) : []),
            videoUrl: recipeData.strYoutube || recipeData.strBilibili || "",
            ingredients: Array.isArray(recipeData.ingredients) ? recipeData.ingredients : 
                        (recipeData.ingredients ? String(recipeData.ingredients).split(',').map((i: string) => i.trim()).slice(0, 4) : []),
            hasVideo: !!(recipeData.strYoutube || recipeData.strBilibili),
            strArea: recipeData.strArea || ""
          };
          
          recipes.push(formattedRecipe);
        } catch (error) {
          console.error(`[API Menu] Error processing recipe ${id}:`, error);
        }
      });
    }
    
    // 添加模拟的加载延迟（仅在开发环境）
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    // 返回食谱数据和分页信息
    return NextResponse.json({
      recipes,
      pagination: {
        page,
        pageSize: limitedPageSize,
        totalRecipes,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
    
  } catch (error) {
    console.error('[API Menu] Error in GET handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Error fetching menu recipes', error: errorMessage }, { status: 500 });
  }
} 