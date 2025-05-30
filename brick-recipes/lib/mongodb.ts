import { MongoClient } from 'mongodb'

// MongoDB连接信息 - 尝试不同连接方式
// 1. 不带认证的连接
// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://128.1.47.79:27017/videotorecipe'

// 2. 带认证但不指定authSource
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://jason:Chatbot520@128.1.47.79:27017/videotorecipe'

// 3. 带认证指定authSource
// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://jason:Chatbot520@128.1.47.79:27017/videotorecipe?authSource=admin'

const MONGODB_DB = process.env.MONGODB_DB || 'videotorecipe'

// MongoDB连接选项
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}

// 在开发环境中缓存MongoDB客户端和数据库连接
let cachedClient: MongoClient | null = null
let cachedDb: any = null

if (!MONGODB_URI) {
  throw new Error('请设置MONGODB_URI环境变量')
}

/**
 * 连接到MongoDB数据库
 * @returns {Promise<{ client: MongoClient, db: any }>} MongoDB客户端和数据库连接
 */
export async function connectToDatabase() {
  try {
    // 如果已有缓存的连接，则使用缓存
    if (cachedClient && cachedDb) {
      // console.log("使用缓存的MongoDB连接");
      return { client: cachedClient, db: cachedDb }
    }

    // console.log("尝试连接MongoDB:", MONGODB_URI);
    // 如果没有连接，则建立新连接
    const client = new MongoClient(MONGODB_URI, options)
    await client.connect()
    const db = client.db(MONGODB_DB)
    // console.log("MongoDB连接成功! 数据库:", MONGODB_DB);

    // 设置缓存
    cachedClient = client
    cachedDb = db

    return { client, db }
  } catch (error) {
    console.error("MongoDB连接失败:", error);
    throw error;
  }
} 