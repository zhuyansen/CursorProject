import { NextResponse } from 'next/server';
import redis from '@/config/redis';

export async function GET() {
  try {
    console.log('[API Tags] Getting all available index keys from Redis');
    
    // 获取所有以index:开头的键
    const allKeys = await redis.keys('index:*');
    
    // 分类返回结果
    const result = {
      tags: [] as string[],
      categories: [] as string[],
      ingredients: [] as string[],
      cookingMethods: [] as string[],
      mealStyles: [] as string[],
      other: [] as string[]
    };
    
    // 对键进行分类
    allKeys.forEach(key => {
      if (key.startsWith('index:tag:')) {
        result.tags.push(key.replace('index:tag:', ''));
      } else if (key.startsWith('index:category:')) {
        result.categories.push(key.replace('index:category:', ''));
      } else if (key.startsWith('index:ingredient:')) {
        result.ingredients.push(key.replace('index:ingredient:', ''));
      } else if (key.startsWith('index:cookingMethod:')) {
        result.cookingMethods.push(key.replace('index:cookingMethod:', ''));
      } else if (key.startsWith('index:mealStyle:')) {
        result.mealStyles.push(key.replace('index:mealStyle:', ''));
      } else {
        result.other.push(key);
      }
    });
    
    // 为每个标签获取成员数量
    const tagCounts: Record<string, number> = {};
    for (const tag of result.tags) {
      const count = await redis.scard(`index:tag:${tag}`);
      tagCounts[tag] = count;
    }
    
    console.log('[API Tags] Found tags:', result.tags);
    console.log('[API Tags] Tag counts:', tagCounts);
    
    return NextResponse.json({
      ...result,
      tagCounts
    });
  } catch (error) {
    console.error('[API Tags] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
} 