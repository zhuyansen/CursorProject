import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Document } from 'mongodb';

export async function GET() {
  console.log("开始测试视频分析流程...");
  try {
    // 1. 连接MongoDB
    console.log("尝试连接MongoDB...");
    const { db } = await connectToDatabase();
    console.log("MongoDB连接成功");

    // 2. 查询已有视频数据
    const videos = await db.collection('videotorecipe')
      .find({})
      .limit(5)
      .toArray();
    
    console.log(`找到 ${videos.length} 条视频记录`);
    
    // 构造返回的简化数据
    const simplifiedVideos = videos.map((video: Document) => ({
      videoId: video.videoId,
      service: video.service,
      videoUrl: video.videoUrl,
      processedAt: video.processedAt,
      hasData: video.data ? true : false,
      dataSize: video.data ? JSON.stringify(video.data).length : 0
    }));
    
    // 3. 返回测试结果
    return NextResponse.json({
      success: true,
      message: "视频分析流程测试完成",
      connectionStatus: "成功连接到MongoDB",
      databaseName: db.databaseName,
      videosCount: videos.length,
      videos: simplifiedVideos,
      connectionInfo: {
        uri: process.env.MONGODB_URI || "使用默认URI"
      }
    });
  } catch (error) {
    console.error("视频分析流程测试失败:", error);
    return NextResponse.json({
      success: false,
      message: `测试失败: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 