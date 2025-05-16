import { NextRequest, NextResponse } from 'next/server';
import { 
  BIBIGPT_API_ENDPOINT, 
  buildBibiGPTRequestOptions, 
  processBibiGPTResponse 
} from '../../../config/bilibiligpt';
import { connectToDatabase } from '@/lib/mongodb';

/**
 * 处理视频分析请求，将视频URL发送到BibiGPT API并返回解析后的食谱数据
 * 同时将数据保存到MongoDB数据库中
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { videoUrl, videoId, service, shouldCache = true } = body;

    if (!videoUrl) {
      return NextResponse.json({ message: '视频URL是必需的' }, { status: 400 });
    }

    // 使用配置文件中的函数构建请求选项
    const options = buildBibiGPTRequestOptions(videoUrl);

    // 调用BibiGPT API
    console.log('[API/video-to-recipes] 发送请求到BibiGPT API:', {
      url: BIBIGPT_API_ENDPOINT,
      videoUrl: videoUrl,
      videoId: videoId,
      service: service,
      options: JSON.stringify(options)
    });
    
    const response = await fetch(BIBIGPT_API_ENDPOINT, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      const errorData = errorText ? JSON.parse(errorText) : null;
      console.error('[API/video-to-recipes] BibiGPT API 请求失败:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        headers: Object.fromEntries(response.headers.entries())
      });
      return NextResponse.json(
        { message: `视频分析失败: ${response.statusText}`, error: errorData }, 
        { status: response.status }
      );
    }

    // 解析API响应
    const data = await response.json();
    
    // 详细记录原始数据结构
    console.log('[API/video-to-recipes] 原始API响应数据结构:', {
      hasData: !!data,
      dataType: typeof data,
      isArray: Array.isArray(data),
      keys: data ? Object.keys(data) : [],
      dataLength: data ? JSON.stringify(data).length : 0
    });
    
    // 使用配置文件中的函数处理响应数据
    const result = processBibiGPTResponse(data);
    
    // 记录处理后的数据结构
    console.log('[API/video-to-recipes] 处理后的数据结构:', {
      hasData: !!result,
      dataType: typeof result,
      isArray: Array.isArray(result),
      keys: result ? Object.keys(result) : [],
      dataLength: result ? JSON.stringify(result).length : 0,
      videoUrl,
      videoId,
      service
    });
    
    // 标准化service和videoId值
    let normalizedService = service;
    let normalizedVideoId = videoId;

    // 确保service是一致的格式(使用原始值)
    console.log("[API/video-to-recipes] 原始参数值:", { 
      service, 
      videoId, 
      serviceType: typeof service, 
      videoIdType: typeof videoId 
    });

    // 构建文档对象，确保字段名正确（使用id而非videoId）
    const recipeDocument = {
      videoUrl,
      id: normalizedVideoId,  // 使用id而非videoId
      service: normalizedService,
      data: result,
      processedAt: new Date()
    };

    // 添加详细日志，检查保存的文档结构
    console.log("[API/video-to-recipes] 准备保存的文档结构:", {
      id: normalizedVideoId,  // 使用id而非videoId
      service: normalizedService,
      hasVideoUrl: !!videoUrl,
      dataSize: result ? JSON.stringify(result).length : 0,
      fields: Object.keys(recipeDocument)
    });
    
    // 如果启用了缓存，将结果保存到MongoDB（videotorecipe集合）
    if (shouldCache && videoId && service) {
      try {
        const cacheDocument = {
          id: videoId,  // 使用id而非videoId
          service,
          videoUrl,
          processedAt: new Date(),
          data: result
        };
        
        console.log(`保存数据到MongoDB缓存: id=${videoId}, service=${service}`, 
          JSON.stringify(Object.keys(result)).slice(0, 100));

        // 使用新的MongoDB连接方法
        const { db } = await connectToDatabase();
        
        // 保存到videotorecipe集合（主数据集合）
        await db.collection('videotorecipe').updateOne(
          { id: videoId, service },  // 查询条件也使用id
          { $set: cacheDocument },
          { upsert: true }
        );
        
        // 同时保存到videoCache集合（专用缓存集合）
        await db.collection('videoCache').updateOne(
          { id: videoId, service },  // 查询条件也使用id
          { $set: { 
            id: videoId,  // 使用id而非videoId
            service,
            processedAt: new Date(),
            data: result
          }},
          { upsert: true }
        );
        
        console.log(`已成功保存到MongoDB：videotorecipe和videoCache集合，使用id字段`);
      } catch (cacheError) {
        console.error('保存到MongoDB缓存失败:', cacheError);
        // 继续处理，不要因为缓存失败而影响API响应
      }
    } else {
      console.log('[API/video-to-recipes] 跳过MongoDB缓存，缺少参数或明确请求不缓存');
    }
    
    // 返回处理后的数据
    return NextResponse.json(result, { status: 200 });
    
  } catch (error: any) {
    console.error('[API/video-to-recipes] 处理请求时出错:', error);
    return NextResponse.json(
      { message: '内部服务器错误', error: error.message }, 
      { status: 500 }
    );
  }
}
