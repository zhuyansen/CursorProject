import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

export async function POST(request: Request) {
  try {
    // 解析请求体
    const body = await request.json()
    const { service, videoId } = body

    // 验证必要的参数
    if (!service || !videoId) {
      console.error('缺少必要参数: service或videoId')
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    console.log(`尝试从MongoDB查询视频缓存: service=${service}, id=${videoId}`)

    try {
      // 连接到MongoDB
      const { db } = await connectToDatabase()
      console.log('MongoDB连接成功，数据库名:', db.databaseName)
      
      try {
        // 首先查询videoCache集合(专用缓存集合)
        console.log('开始查询videoCache集合...')
        const cacheCollection = db.collection('videoCache')
        
        // 记录查询条件
        console.log('videoCache查询条件:', { service, id: videoId })
        
        const cachedData = await cacheCollection.findOne({ 
          service: service, 
          id: videoId
        })
        
        console.log('videoCache查询结果:', cachedData ? '找到数据' : '未找到数据')
        
        if (cachedData) {
          console.log('在videoCache集合中找到缓存数据')
          return NextResponse.json({ 
            success: true, 
            data: cachedData.data,
            source: 'videoCache'
          })
        }
      } catch (cacheError) {
        console.error('查询videoCache集合时出错:', cacheError)
        // 继续尝试查询videotorecipe集合
      }

      try {
        // 如果videoCache没有，查询videotorecipe集合(主数据集合)
        console.log('在videoCache集合中未找到数据，尝试查询videotorecipe集合')
        const recipeCollection = db.collection('videotorecipe')
        
        // 尝试所有可能的查询组合
        console.log('尝试所有可能的查询组合...')
        
        // 1. 使用id字段查询
        console.log('尝试查询方式1: { service, id }')
        let recipeData = await recipeCollection.findOne({ 
          service: service, 
          id: videoId
        })
        
        // 2. 使用videoId字段查询
        if (!recipeData) {
          console.log('尝试查询方式2: { service, videoId }')
          recipeData = await recipeCollection.findOne({
            service: service,
            videoId: videoId
          })
        }
        
        // 3. 只使用id字段查询(不使用service)
        if (!recipeData) {
          console.log('尝试查询方式3: 仅使用id')
          recipeData = await recipeCollection.findOne({
            id: videoId
          })
        }
        
        // 4. 只使用videoId字段查询(不使用service)
        if (!recipeData) {
          console.log('尝试查询方式4: 仅使用videoId')
          recipeData = await recipeCollection.findOne({
            videoId: videoId
          })
        }
        
        // 5. 使用id字段但service小写
        if (!recipeData) {
          console.log('尝试查询方式5: { service小写, id }')
          recipeData = await recipeCollection.findOne({
            service: service.toLowerCase(),
            id: videoId
          })
        }
        
        // 6. 使用videoId字段但service小写
        if (!recipeData) {
          console.log('尝试查询方式6: { service小写, videoId }')
          recipeData = await recipeCollection.findOne({
            service: service.toLowerCase(),
            videoId: videoId
          })
        }
        
        // 输出所有videotorecipe中的文档的关键字段查看
        if (!recipeData) {
          console.log('未通过任何方式找到匹配数据，列出集合中的所有数据:')
          const allDocs = await recipeCollection
            .find({}, { projection: { id: 1, videoId: 1, service: 1, _id: 0 } })
            .limit(10)
            .toArray()
          console.log('集合中的文档样本:', allDocs)
        }
        
        // 如果找到了数据
        if (recipeData) {
          console.log('在videotorecipe集合中找到数据')
          // 返回完整数据，确保不丢失任何字段
          return NextResponse.json({ 
            success: true, 
            data: recipeData,
            source: 'videotorecipe'
          })
        }
        
        // 都没找到
        console.log('未找到匹配的视频数据')
        return NextResponse.json({ 
          success: false, 
          error: '未找到匹配的视频数据' 
        }, { status: 404 })
      } catch (recipeError) {
        console.error('查询videotorecipe集合时出错:', recipeError)
        throw recipeError // 重新抛出以便捕获详细错误
      }
    } catch (dbError) {
      console.error('数据库操作失败:', dbError)
      return NextResponse.json({ 
        success: false, 
        error: `数据库操作失败: ${dbError instanceof Error ? dbError.message : String(dbError)}` 
      }, { status: 500 })
    }
  } catch (error) {
    // 捕获所有其他错误
    console.error('查询缓存时出错:', error)
    return NextResponse.json({
      success: false, 
      error: '服务器内部错误',
      details: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : String(error)
    }, { status: 500 })
  }
} 