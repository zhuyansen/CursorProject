import { NextRequest, NextResponse } from 'next/server';
import { recipeRedisClient } from '@/config/redis'; // 使用菜谱专用的Redis客户端 (db=1)

// 重试函数
async function retryRedisConnection(maxRetries = 3, delay = 500) {
  for (let i = 0; i < maxRetries; i++) {
    if (recipeRedisClient && recipeRedisClient.status === 'ready') {
      return true;
    }
    
    console.log(`[API/get-recipe-by-id] Recipe Redis (DB1) not ready, retrying (${i+1}/${maxRetries})...`);
    // 等待一段时间后重试
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // 每次重试增加延迟时间
    delay *= 1.5;
  }
  
  return false;
}

export async function GET(request: NextRequest) {
  // 尝试重新连接Redis
  if (!recipeRedisClient || recipeRedisClient.status !== 'ready') {
    console.log('[API/get-recipe-by-id] Recipe Redis client (DB1) not ready, attempting to reconnect...');
    const redisReady = await retryRedisConnection();
    
    if (!redisReady) {
      console.error('[API/get-recipe-by-id] Recipe Redis client (DB1) not available after retries.');
      return NextResponse.json({ 
        message: 'Recipe database service is not available. Please try again later.',
        retryable: true 
      }, { status: 503 });
    }
  }

  const searchParams = request.nextUrl.searchParams;
  const recipeId = searchParams.get('id');

  if (!recipeId) {
    return NextResponse.json({ message: 'Recipe ID is required' }, { status: 400 });
  }

  try {
    const recipeKey = `recipe:${recipeId}`;
    console.log(`[API/get-recipe-by-id] Attempting to GET key: ${recipeKey} from Recipe DB`);
    
    // 添加超时处理
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Redis operation timed out')), 5000)
    );
    
    const recipeDataString = await Promise.race([
      recipeRedisClient.get(recipeKey),
      timeoutPromise
    ]) as string | null;

    if (!recipeDataString) {
      console.log(`[API/get-recipe-by-id] Recipe not found in Recipe DB for key: ${recipeKey}`);
      return NextResponse.json({ message: 'Recipe not found' }, { status: 404 });
    }

    console.log(`[API/get-recipe-by-id] Found data in Recipe DB for key: ${recipeKey}`);
    
    // 尝试解析 JSON，如果失败则返回错误
    let recipeData;
    try {
      recipeData = JSON.parse(recipeDataString);
    } catch (parseError) {
      console.error(`[API/get-recipe-by-id] Failed to parse JSON from Recipe DB for key ${recipeKey}:`, parseError, "Data:", recipeDataString);
      return NextResponse.json({ message: 'Invalid recipe data format in storage.' }, { status: 500 });
    }
    
    // --- BEGIN: Process ingredients field ---
    if (recipeData && typeof recipeData.ingredients === 'string') {
      console.log(`[API/get-recipe-by-id] ingredients for ${recipeId} is a string: "${recipeData.ingredients}". Converting to array.`);
      recipeData.ingredients = recipeData.ingredients.split(/,\s*|\s*,\s*/).map((s: string) => s.trim()).filter((s: string) => s);
      console.log(`[API/get-recipe-by-id] ingredients AFTER conversion:`, recipeData.ingredients);
    } else if (recipeData && recipeData.ingredients !== undefined && !Array.isArray(recipeData.ingredients)) {
      console.warn(`[API/get-recipe-by-id] ingredients for ${recipeId} is neither a string nor an array. Type: ${typeof recipeData.ingredients}. Setting to empty array.`);
      recipeData.ingredients = [];
    } else if (recipeData && Array.isArray(recipeData.ingredients)) {
      // If it's already an array, ensure all elements are trimmed strings and filter out empty ones
      console.log(`[API/get-recipe-by-id] ingredients for ${recipeId} is already an array. Trimming and filtering.`);
      recipeData.ingredients = recipeData.ingredients.map((s: any) => typeof s === 'string' ? s.trim() : s).filter((s: any) => s);
    } else if (recipeData && recipeData.ingredients === undefined) {
        console.log(`[API/get-recipe-by-id] ingredients field is undefined for ${recipeId}. Setting to empty array.`);
        recipeData.ingredients = [];
    }
    // --- END: Process ingredients field ---
    
    return NextResponse.json(recipeData, { status: 200 });

  } catch (error: any) {
    console.error(`[API/get-recipe-by-id] Error fetching from Recipe DB for ID ${recipeId}:`, error);
    // 避免将详细的内部错误暴露给客户端，但记录它们
    let errorMessage = 'Internal Server Error';
    let retryable = false;
    
    if (error.message && error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Could not connect to Recipe database service.';
      retryable = true;
    } else if (error.message && error.message.includes('timed out')) {
      errorMessage = 'Recipe database operation timed out.';
      retryable = true;
    }
    // 根据需要添加更多具体的错误消息处理

    return NextResponse.json({ 
      message: errorMessage, 
      retryable,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 });
  }
} 