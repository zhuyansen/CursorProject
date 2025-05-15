import { NextRequest, NextResponse } from 'next/server';
import { 
  BIBIGPT_API_ENDPOINT, 
  buildBibiGPTRequestOptions, 
  processBibiGPTResponse 
} from '../../../config/bilibiligpt';
import { getVideoToRecipeDb } from '../../../config/mongodb';

/**
 * 处理视频分析请求，将视频URL发送到BibiGPT API并返回解析后的食谱数据
 * 同时将数据保存到MongoDB数据库中
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { videoUrl } = body;

    if (!videoUrl) {
      return NextResponse.json({ message: '视频URL是必需的' }, { status: 400 });
    }

    // 使用配置文件中的函数构建请求选项
    const options = buildBibiGPTRequestOptions(videoUrl);

    // 调用BibiGPT API
    console.log('[API/video-to-recipes] 发送请求到BibiGPT API:', {
      url: BIBIGPT_API_ENDPOINT,
      videoUrl: videoUrl,
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
    
    // 使用配置文件中的函数处理响应数据
    const processedData = processBibiGPTResponse(data);
    
    // 保存数据到MongoDB数据库
    try {
      const db = await getVideoToRecipeDb();
      const collection = db.collection('videotorecipe');
      
      // 准备要保存的文档 - 直接保存processedData，添加必要的字段
      const documentToSave = {
        ...processedData,
        videoUrl,
        createdAt: new Date()
      };
      
      // 将数据插入到数据库
      const result = await collection.insertOne(documentToSave);
      console.log('[API/video-to-recipes] 数据已保存到MongoDB:', result);
      
      // 在返回的数据中添加数据库ID
      processedData._id = result.insertedId;
    } catch (dbError: any) {
      console.error('[API/video-to-recipes] 保存数据到MongoDB失败:', dbError);
      // 即使数据库保存失败，我们仍然返回API数据，不影响用户体验
    }
    
    // 返回处理后的数据
    return NextResponse.json(processedData, { status: 200 });
    
  } catch (error: any) {
    console.error('[API/video-to-recipes] 处理请求时出错:', error);
    return NextResponse.json(
      { message: '内部服务器错误', error: error.message }, 
      { status: 500 }
    );
  }
}
