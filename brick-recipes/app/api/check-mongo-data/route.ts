import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  // console.log("开始检查MongoDB数据...");
  try {
    // 1. 连接MongoDB
    // console.log("尝试连接MongoDB...");
    const { db } = await connectToDatabase();
    // console.log("MongoDB连接成功，数据库:", db.databaseName);

    // 2. 获取URL参数
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const service = searchParams.get('service');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // console.log("查询参数:", { videoId, service, limit });

    // 3. 构建查询条件
    let query = {};
    if (videoId && service) {
      query = { id: videoId, service };
    } else if (videoId) {
      query = { id: videoId };
    } else if (service) {
      query = { service };
    }

    // 4. 执行查询
    const documents = await db.collection('videotorecipe')
      .find(query)
      .limit(limit)
      .project({ 
        id: 1,
        videoId: 1,
        service: 1,
        processedAt: 1,
        'data.title': 1,
        _id: 0
      })
      .toArray();
    
    // console.log(`查询结果: 找到${documents.length}条记录`);
    
    // 5. 如果没有指定查询条件，获取所有唯一的id和service组合
    let serviceIdPairs = [];
    if (!videoId && !service) {
      const pairs = await db.collection('videotorecipe')
        .aggregate([
          { $project: { _id: 0, id: 1, videoId: 1, service: 1 } },
          { $limit: 100 }
        ])
        .toArray();
      
      serviceIdPairs = pairs;
    }
    
    // 6. 统计每个service的记录数量
    const serviceCounts = await db.collection('videotorecipe')
      .aggregate([
        { $group: { _id: "$service", count: { $sum: 1 } } }
      ])
      .toArray();
    
    // 7. 返回结果
    return NextResponse.json({
      success: true,
      database: db.databaseName,
      collection: 'videotorecipe',
      query,
      count: documents.length,
      documents,
      serviceIdPairs: serviceIdPairs.length > 0 ? serviceIdPairs : undefined,
      serviceCounts
    });
  } catch (error) {
    console.error("检查MongoDB数据失败:", error);
    return NextResponse.json({
      success: false,
      message: `检查失败: ${error instanceof Error ? error.message : String(error)}`
    }, { status: 500 });
  }
} 