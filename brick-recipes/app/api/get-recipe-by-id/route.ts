import { NextRequest, NextResponse } from 'next/server';
import redis from '@/config/redis'; // 使用默认的Redis客户端

// 重试函数
async function retryRedisConnection(maxRetries = 3, delay = 500) {
  for (let i = 0; i < maxRetries; i++) {
    if (redis && redis.status === 'ready') {
      return true;
    }
    
    console.log(`[API/get-recipe-by-id] Redis not ready, retrying (${i+1}/${maxRetries})...`);
    // 等待一段时间后重试
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // 每次重试增加延迟时间
    delay *= 1.5;
  }
  
  return false;
}

export async function GET(request: NextRequest) {
  // 尝试重新连接Redis
  if (!redis || redis.status !== 'ready') {
    console.log('[API/get-recipe-by-id] Redis client not ready, attempting to reconnect...');
    const redisReady = await retryRedisConnection();
    
    if (!redisReady) {
      console.error('[API/get-recipe-by-id] Redis client from @/config/redis not available after retries.');
      return NextResponse.json({ 
        message: 'Redis service is not available. Please try again later.',
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
    console.log(`[API/get-recipe-by-id] Attempting to GET key: ${recipeKey}`);
    
    // 添加超时处理
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Redis operation timed out')), 5000)
    );
    
    const recipeDataString = await Promise.race([
      redis.get(recipeKey),
      timeoutPromise
    ]) as string | null;

    if (!recipeDataString) {
      console.log(`[API/get-recipe-by-id] Recipe not found in Redis for key: ${recipeKey}`);
      return NextResponse.json({ message: 'Recipe not found' }, { status: 404 });
    }

    console.log(`[API/get-recipe-by-id] Found data for key: ${recipeKey}`);
    
    // 尝试解析 JSON，如果失败则返回错误
    let recipeData;
    try {
      recipeData = JSON.parse(recipeDataString);
    } catch (parseError) {
      console.error(`[API/get-recipe-by-id] Failed to parse JSON from Redis for key ${recipeKey}:`, parseError, "Data:", recipeDataString);
      return NextResponse.json({ message: 'Invalid recipe data format in storage.' }, { status: 500 });
    }
    
    return NextResponse.json(recipeData, { status: 200 });

  } catch (error: any) {
    console.error(`[API/get-recipe-by-id] Error fetching from Redis for ID ${recipeId}:`, error);
    // 避免将详细的内部错误暴露给客户端，但记录它们
    let errorMessage = 'Internal Server Error';
    let retryable = false;
    
    if (error.message && error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Could not connect to Redis service.';
      retryable = true;
    } else if (error.message && error.message.includes('timed out')) {
      errorMessage = 'Redis operation timed out.';
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