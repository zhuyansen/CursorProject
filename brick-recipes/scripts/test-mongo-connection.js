// 测试MongoDB连接的脚本
const { MongoClient } = require('mongodb');

// MongoDB连接信息 - 与lib/mongodb.ts中保持一致
// 带认证但不指定authSource
const MONGODB_URI = 'mongodb://jason:Chatbot520@128.1.47.79:27017/videotorecipe';
const MONGODB_DB = 'videotorecipe';

// MongoDB连接选项
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

async function testMongoConnection() {
  console.log('开始测试MongoDB连接...');
  console.log(`连接URI: ${MONGODB_URI}`);
  console.log(`数据库名: ${MONGODB_DB}`);
  
  let client;
  
  try {
    // 创建连接
    client = new MongoClient(MONGODB_URI, options);
    console.log('尝试连接到MongoDB服务器...');
    
    // 连接数据库
    await client.connect();
    console.log('✅ 成功连接到MongoDB服务器!');
    
    // 获取数据库引用
    const db = client.db(MONGODB_DB);
    console.log(`✅ 成功连接到数据库: ${MONGODB_DB}`);
    
    // 列出所有集合
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('现有集合:', collectionNames);
    
    // 检查videotorecipe集合
    if (collectionNames.includes('videotorecipe')) {
      console.log('✅ videotorecipe集合已存在');
      
      // 查询集合中的文档数量
      const count = await db.collection('videotorecipe').countDocuments();
      console.log(`videotorecipe集合中有 ${count} 个文档`);
      
      // 尝试读取一条记录
      if (count > 0) {
        const sampleDoc = await db.collection('videotorecipe').findOne({});
        console.log('示例文档:', JSON.stringify({
          videoId: sampleDoc.videoId,
          service: sampleDoc.service,
          processedAt: sampleDoc.processedAt,
          hasData: sampleDoc.data ? '有数据' : '无数据'
        }, null, 2));
      }
    } else {
      console.log('❌ videotorecipe集合不存在');
      console.log('正在创建videotorecipe集合...');
      await db.createCollection('videotorecipe');
      console.log('✅ videotorecipe集合已创建');
    }
    
    // 测试写入操作
    console.log('尝试写入测试文档...');
    const testDoc = {
      videoId: 'test-script-id',
      service: 'test-script',
      data: { message: '这是一个测试文档' },
      processedAt: new Date()
    };
    
    const result = await db.collection('videotorecipe').insertOne(testDoc);
    console.log('写入结果:', result);
    console.log(`✅ 测试文档已写入，ID: ${result.insertedId}`);
    
    // 测试查询
    console.log('尝试查询刚插入的文档...');
    const findResult = await db.collection('videotorecipe').findOne({ videoId: 'test-script-id' });
    
    if (findResult) {
      console.log('✅ 查询成功，找到测试文档');
    } else {
      console.log('❌ 查询失败，未找到测试文档');
    }
    
    // 清理测试数据
    console.log('清理测试文档...');
    await db.collection('videotorecipe').deleteOne({ videoId: 'test-script-id' });
    console.log('✅ 测试文档已删除');
    
    console.log('MongoDB连接测试全部成功! ✨');
  } catch (error) {
    console.error('❌ MongoDB连接测试失败:', error);
  } finally {
    // 关闭连接
    if (client) {
      console.log('关闭MongoDB连接...');
      await client.close();
      console.log('MongoDB连接已关闭');
    }
  }
}

// 执行测试
testMongoConnection()
  .then(() => {
    console.log('测试脚本执行完毕');
    process.exit(0);
  })
  .catch(error => {
    console.error('测试脚本执行出错:', error);
    process.exit(1);
  }); 