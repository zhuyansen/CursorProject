/**
 * 此文件已被弃用，请使用 @/lib/mongodb.ts 替代
 */

import { MongoClient } from 'mongodb';

// 使用环境变量定义MongoDB连接字符串
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'brick-recipes';

/**
 * 全局变量用于保存连接的MongoDB数据库实例
 */
let cachedDb: any = null;

/**
 * 获取视频到食谱转换服务的数据库连接
 * @returns {Promise<any>} 数据库连接的Promise
 */
export async function getVideoToRecipeDb() {
  console.warn("警告: 使用了已弃用的config/mongodb.ts，请更新为 @/lib/mongodb");
  
  if (cachedDb) {
    return cachedDb;
  }

  // 连接到MongoDB
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db(MONGODB_DB);
  
  cachedDb = db;
  return db;
}
