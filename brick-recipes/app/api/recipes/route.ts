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
  // 根据需要添加或调整字段
}

// 辅助函数：将 Redis 哈希的扁平数组转换为对象
const arrayToObject = (arr: (string | null)[]): Record<string, string> => {
  const obj: Record<string, string> = {};
  for (let i = 0; i < arr.length; i += 2) {
    if (arr[i] !== null && arr[i+1] !== null) {
      obj[arr[i] as string] = arr[i+1] as string;
    }
  }
  return obj;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ingredients = searchParams.get('ingredients')?.split(',').filter(Boolean) || [];
    const methods = searchParams.get('methods')?.split(',').filter(Boolean) || [];
    const cuisine = searchParams.get('cuisine'); // 单个菜系
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const searchQuery = searchParams.get('search')?.toLowerCase();
    
    // 分页参数
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    
    // 限制每页最大数量为50
    const limitedPageSize = Math.min(pageSize, 50);
    
    const filterKeys: string[] = [];

    // 根据新的Redis数据结构调整索引键名格式
    ingredients.forEach(ing => filterKeys.push(`index:ingredient:${ing.trim()}`));
    methods.forEach(m => filterKeys.push(`index:cookingMethod:${m.trim()}`));
    if (cuisine) {
      // 确保 Eastern 和 Western 的正确匹配
      const cuisineValue = cuisine.trim();
      console.log(`[API Recipes] Processing cuisine: "${cuisineValue}"`);
      filterKeys.push(`index:mealStyle:${cuisineValue}`);
    }
    tags.forEach(tag => filterKeys.push(`index:tag:${tag.trim()}`));
    console.log('[API Recipes] Filter Keys:', filterKeys);

    // 变量用于存储分页信息
    let totalMatchingRecipes = 0;
    let totalPages = 0;
    let allMatchingIds: string[] = [];
    let sinterDuration = 0;

    // 步骤1: 执行 sinter 获取所有匹配的食谱ID
    if (filterKeys.length > 0) {
      const sinterStartTime = Date.now();
      console.log('[API Recipes] About to call redis.sinter');
      const rawRecipeIds = await redis.sinter(filterKeys);
      sinterDuration = Date.now() - sinterStartTime;
      
      allMatchingIds = rawRecipeIds.map(id => String(id)).sort();
      totalMatchingRecipes = allMatchingIds.length;
      totalPages = Math.ceil(totalMatchingRecipes / limitedPageSize);
      
      console.log(`[API Recipes] redis.sinter finished in ${sinterDuration}ms. Found ${totalMatchingRecipes} matching recipe IDs (${totalPages} pages)`);
      
      // 如果没有匹配的ID，直接返回空结果
      if (totalMatchingRecipes === 0) {
        console.log('[API Recipes] No recipe IDs found after sinter');
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
    } else if (searchQuery) {
      // 如果只有搜索词，尝试获取所有食谱ID
      try {
        console.log('[API Recipes] No filter keys provided but search query exists, getting all recipes');
        const allRecipesIds = await redis.smembers("all_recipes");
        allMatchingIds = allRecipesIds.map(id => String(id)).sort();
        totalMatchingRecipes = allMatchingIds.length;
        totalPages = Math.ceil(totalMatchingRecipes / limitedPageSize);
        
        console.log(`[API Recipes] Found ${totalMatchingRecipes} total recipes for search`);
      } catch (error) {
        console.error('[API Recipes] Error getting all recipes:', error);
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
    } else {
      console.log('[API Recipes] No filter keys or search query provided');
      // 返回空结果
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

    // 步骤2: 使用分页参数提取当前页需要的ID
    const startIndex = (page - 1) * limitedPageSize;
    const endIndex = Math.min(startIndex + limitedPageSize, totalMatchingRecipes);
    let currentPageIds = allMatchingIds.slice(startIndex, endIndex);
    
    console.log(`[API Recipes] Processing page ${page}/${totalPages}: showing IDs ${startIndex + 1}-${endIndex} of ${totalMatchingRecipes}`);

    // 步骤3: 批处理获取当前页食谱的详细信息
    const recipes: Recipe[] = [];
    const batchSize = 5; // 每批处理的数量

    for (let i = 0; i < currentPageIds.length; i += batchSize) {
      const batchIds = currentPageIds.slice(i, i + batchSize);
      const recipeKeys = batchIds.map(id => `recipe:${id}`);
      
      const mgetStart = Date.now();
      const recipeDataStrings = await redis.mget(recipeKeys);
      const mgetDuration = Date.now() - mgetStart;
      
      console.log(`[API Recipes] MGET Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(currentPageIds.length/batchSize)} (${recipeKeys.length} keys) finished in ${mgetDuration}ms`);
      
      recipeDataStrings.forEach((recipeDataStr, index) => {
        const id = batchIds[index];
        
        if (!recipeDataStr) {
          console.warn(`[API Recipes] Recipe details not found for ID: ${id}`);
          return;
        }
        
        try {
          const recipeData = JSON.parse(recipeDataStr);
          
          const formattedRecipe: Recipe = {
            id: recipeData.idMeal || id,
            title: recipeData.strMeal || "",
            image: recipeData.strMealThumb || "",
            time: recipeData.time || "20 min", // 使用固定默认值
            calories: recipeData.Energy || "0 kcal", // 直接使用Energy字段的值
            difficulty: recipeData.difficulty || "Medium", // 使用固定默认值
            tags: Array.isArray(recipeData.tags) ? recipeData.tags : 
                  (recipeData.strTags ? String(recipeData.strTags).split(',').map((t: string) => t.trim()).slice(0, 3) : []),
            videoUrl: recipeData.strYoutube || recipeData.strBilibili || "",
            ingredients: Array.isArray(recipeData.ingredients) ? recipeData.ingredients : 
                         (recipeData.ingredients ? String(recipeData.ingredients).split(',').map((i: string) => i.trim()).slice(0, 4) : []),
          };
          
          // 如果有搜索查询，过滤标题
          if (searchQuery) {
            if (formattedRecipe.title && formattedRecipe.title.toLowerCase().includes(searchQuery)) {
              recipes.push(formattedRecipe);
            }
          } else {
            recipes.push(formattedRecipe);
          }
        } catch (error) {
          console.error(`[API Recipes] Error processing recipe ${id}:`, error);
        }
      });
    }
    
    // 如果有搜索查询，可能会过滤掉一些结果，调整分页信息
    const actualTotalRecipes = searchQuery ? recipes.length + (page - 1) * limitedPageSize : totalMatchingRecipes;
    const actualTotalPages = Math.ceil(actualTotalRecipes / limitedPageSize);

    console.log(`[API Recipes] Returning ${recipes.length} recipes for page ${page}/${actualTotalPages} (total recipes: ${actualTotalRecipes})`);
    
    // 返回当前页数据和分页信息
    return NextResponse.json({
      recipes,
      pagination: {
        page,
        pageSize: limitedPageSize,
        totalRecipes: actualTotalRecipes,
        totalPages: actualTotalPages,
        hasNextPage: page < actualTotalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('[API Recipes] Critical error in GET handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Error fetching recipes', error: errorMessage }, { status: 500 });
  }
}

/*
 * 注意事项:
 * 1. Redis连接管理：当前Redis客户端在模块加载时创建。对于无服务器环境，可能需要更精细的管理。
 * 2. 错误处理：已包含基本的try-catch块。
 * 3. 数据校验和转换：从Redis获取的数据可能需要进一步的校验和类型转换。
 * 4. 搜索查询：当前的文本搜索是在获取初步筛选结果后在应用内存中进行的。
 *    对于大量数据或更高级的搜索需求，应考虑使用Redis的全文搜索功能（如RediSearch）
 *    或专门的搜索引擎。
 * 5. 大小写敏感性：当前实现将保留用户输入的大小写，应确保与Redis中的键匹配。
 * 6. 无筛选条件但有搜索词时，尝试从"all_recipes"集合获取所有食谱ID进行搜索。
 *    需要确保该集合存在且包含正确的食谱ID。
 * 7. 食谱详情字段：如果缺少某些字段，会提供固定的默认值以避免水合作用错误。
 * 8. 依赖：确保项目中已安装 `ioredis`。
 */ 