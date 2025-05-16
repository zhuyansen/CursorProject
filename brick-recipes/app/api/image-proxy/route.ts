import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');
  
  if (!imageUrl) {
    return new NextResponse('缺少图片URL', { status: 400 });
  }
  
  try {
    console.log(`图片代理请求: ${imageUrl}`);
    
    const response = await fetch(imageUrl, {
      headers: {
        'Referer': 'https://www.bilibili.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
    });
    
    if (!response.ok) {
      console.error(`代理图片请求失败: ${response.status} ${response.statusText}`);
      return new NextResponse(`获取图片失败: ${response.status}`, { 
        status: response.status 
      });
    }
    
    const imageData = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';
    
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=86400'); // 缓存1天
    
    console.log(`图片代理成功: ${imageUrl}, 类型: ${contentType}, 大小: ${imageData.byteLength} bytes`);
    
    return new NextResponse(imageData, {
      headers,
      status: 200,
    });
  } catch (error) {
    console.error('代理图片失败:', error);
    return new NextResponse(`代理图片失败: ${error instanceof Error ? error.message : '未知错误'}`, { 
      status: 500 
    });
  }
} 