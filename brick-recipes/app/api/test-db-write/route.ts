import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  console.log("开始测试MongoDB写入功能...");
  try {
    // 1. 连接MongoDB
    console.log("尝试连接MongoDB...");
    const { db } = await connectToDatabase();
    console.log("MongoDB连接成功");

    // 2. 准备测试数据
    const testData = {
      videoId: "test-write-" + Date.now(),
      service: "test-service",
      videoUrl: "https://example.com/test-video",
      data: {
        title: "测试视频食谱",
        ingredients: ["测试食材1", "测试食材2"],
        steps: ["步骤1", "步骤2"]
      },
      processedAt: new Date()
    };
    
    console.log("准备写入的测试数据:", testData);
    
    // 3. 执行写入测试
    const result = await db.collection('videotorecipe').insertOne(testData);
    
    console.log("写入结果:", {
      acknowledged: result.acknowledged,
      insertedId: result.insertedId.toString()
    });
    
    // 4. 验证数据是否已写入
    const savedData = await db.collection('videotorecipe').findOne({ videoId: testData.videoId });
    
    const isDataSaved = !!savedData;
    console.log("数据验证:", isDataSaved ? "成功找到保存的数据" : "未找到保存的数据");
    
    // 5. 清理测试数据
    if (isDataSaved) {
      const deleteResult = await db.collection('videotorecipe').deleteOne({ videoId: testData.videoId });
      console.log("测试数据清理结果:", deleteResult.deletedCount > 0 ? "已删除" : "删除失败");
    }
    
    // 6. 返回测试结果
    return NextResponse.json({
      success: true,
      message: "MongoDB写入测试完成",
      testId: testData.videoId,
      writeSucceeded: result.acknowledged,
      verifySucceeded: isDataSaved,
      databaseName: db.databaseName,
      collectionName: 'videotorecipe'
    });
  } catch (error) {
    console.error("MongoDB写入测试失败:", error);
    return NextResponse.json({
      success: false,
      message: `测试失败: ${error instanceof Error ? error.message : String(error)}`,
      errorType: error?.constructor.name,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 