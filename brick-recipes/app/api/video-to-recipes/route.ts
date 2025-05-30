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
    // console.log('[API/video-to-recipes] 发送请求到BibiGPT API:', {
    //   url: BIBIGPT_API_ENDPOINT,
    //   videoUrl: videoUrl,
    //   videoId: videoId,
    //   service: service,
    //   options: JSON.stringify(options)
    // });
    
    const response = await fetch(BIBIGPT_API_ENDPOINT, options);
    
    // 日志记录详细的响应信息
    // console.log(`[API/video-to-recipes] BibiGPT API 响应状态: ${response.status} ${response.statusText}`);
    // console.log(`[API/video-to-recipes] BibiGPT API 响应头:`, Object.fromEntries(response.headers.entries()));
    
    // 检查响应状态并进行详细的错误分析
    if (!response.ok) {
      // 尝试解析错误响应
      let errorText = '';
      let errorData: any = null;
      
      try {
        // 安全地获取错误响应文本
        errorText = await response.text();
        // console.log(`[API/video-to-recipes] BibiGPT API 错误响应文本:`, errorText.slice(0, 200));
        
        // 尝试解析为JSON
        if (errorText.trim().startsWith('{') || errorText.trim().startsWith('[')) {
          errorData = JSON.parse(errorText);
        }
      } catch (parseError) {
        // console.error(`[API/video-to-recipes] 无法解析错误响应:`, parseError);
      }
      
      // 记录详细的错误信息
      // console.error(`[API/video-to-recipes] BibiGPT API 请求失败:`, {
      //   status: response.status,
      //   statusText: response.statusText,
      //   errorText: errorText.slice(0, 200) + (errorText.length > 200 ? '...' : ''),
      //   errorData: errorData,
      //   headers: Object.fromEntries(response.headers.entries())
      // });
      
      // 根据错误状态码生成不同的建议
      let suggestions = '';
      if (response.status === 404) {
        suggestions = '请联系技术支持检查API配置，或稍后再试';
      } else if (response.status === 429) {
        suggestions = '请稍等几分钟后重试，或考虑升级到高级套餐';
      } else if (response.status === 401 || response.status === 403) {
        suggestions = '请检查API密钥配置，联系技术支持';
      } else if (response.status >= 500) {
        suggestions = 'BibiGPT服务器临时故障，建议: 1) 稍后重试 2) 检查API状态页面 3) 联系技术支持';
      } else {
        suggestions = '请检查网络连接和视频链接是否有效';
      }
      
      // 返回结构化的错误信息
      return NextResponse.json({
        success: false,
        error: errorData?.message || errorData?.error || response.statusText || '视频分析服务器内部错误',
        message: `外部API返回错误 (${response.status}): ${errorData?.message || response.statusText}`,
        details: errorText.slice(0, 500),
        suggestions: suggestions,
        troubleshooting: {
          status: response.status,
          service: 'BibiGPT',
          timestamp: new Date().toISOString(),
          checkUrl: 'https://api.bibigpt.co'
        }
      }, { 
        status: response.status >= 500 ? 503 : response.status // 5xx错误映射为503 Service Unavailable
      });
    }

    // 解析API响应
    const data = await response.json();
    
    // 详细记录原始数据结构
    // console.log('[API/video-to-recipes] 原始API响应数据结构:', {
    //   hasData: !!data,
    //   dataType: typeof data,
    //   isArray: Array.isArray(data),
    //   keys: data ? Object.keys(data) : [],
    //   dataLength: data ? JSON.stringify(data).length : 0
    // });
    
    // 使用配置文件中的函数处理响应数据
    const result = processBibiGPTResponse(data);
    
    // 记录处理后的数据结构
    // console.log('[API/video-to-recipes] 处理后的数据结构:', {
    //   hasData: !!result,
    //   dataType: typeof result,
    //   isArray: Array.isArray(result),
    //   keys: result ? Object.keys(result) : [],
    //   dataLength: result ? JSON.stringify(result).length : 0,
    //   videoUrl,
    //   videoId,
    //   service
    // });
    
    // 标准化service和videoId值
    let normalizedService = service;
    let normalizedVideoId = videoId;

    // 确保service是一致的格式(使用原始值)
    // console.log("[API/video-to-recipes] 原始参数值:", { 
    //   service, 
    //   videoId, 
    //   serviceType: typeof service, 
    //   videoIdType: typeof videoId 
    // });

    // 构建文档对象，确保字段名正确（使用id而非videoId）
    const recipeDocument = {
      videoUrl,
      id: normalizedVideoId,  // 使用id而非videoId
      service: normalizedService,
      data: result,
      processedAt: new Date()
    };

    // 添加详细日志，检查保存的文档结构
    // console.log("[API/video-to-recipes] 准备保存的文档结构:", {
    //   id: normalizedVideoId,  // 使用id而非videoId
    //   service: normalizedService,
    //   hasVideoUrl: !!videoUrl,
    //   dataSize: result ? JSON.stringify(result).length : 0,
    //   fields: Object.keys(recipeDocument)
    // });
    
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
        
        // console.log(`保存数据到MongoDB缓存: id=${videoId}, service=${service}`, 
        //   JSON.stringify(Object.keys(result)).slice(0, 100));

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
        
        // console.log(`已成功保存到MongoDB：videotorecipe和videoCache集合，使用id字段`);
      } catch (cacheError) {
        console.error('保存到MongoDB缓存失败:', cacheError);
        // 继续处理，不要因为缓存失败而影响API响应
      }
    } else {
      // console.log('[API/video-to-recipes] 跳过MongoDB缓存，缺少参数或明确请求不缓存');
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
