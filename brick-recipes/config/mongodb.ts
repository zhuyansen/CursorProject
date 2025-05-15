/**
 * MongoDB 数据库配置文件
 * 用于连接和操作MongoDB数据库
 */

import { MongoClient, Db } from 'mongodb';

// MongoDB 连接配置
const MONGODB_HOST = '128.1.47.79';
const MONGODB_PORT = 27017;
const MONGODB_USERNAME = 'jason';
const MONGODB_PASSWORD = 'Chatbot520';

// 数据库名称
export const DB_NAMES = {
  DETAIL_RECIPES: 'detailrecipes',
  SIMPLE_RECIPES: 'simplerecipes',
  VIDEO_TO_RECIPE: 'videotorecipe'
};

// 构建MongoDB连接函数，根据不同数据库创建不同的连接URI
function getConnectionUri(dbName: string) {
  return `mongodb://${MONGODB_USERNAME}:${encodeURIComponent(MONGODB_PASSWORD)}@${MONGODB_HOST}:${MONGODB_PORT}/${dbName}?authSource=${dbName}&retryWrites=true&w=majority`;
}

// MongoDB客户端实例
let detailRecipesClient: MongoClient | null = null;
let simpleRecipesClient: MongoClient | null = null;
let videoToRecipeClient: MongoClient | null = null;

let detailRecipesDb: Db | null = null;
let simpleRecipesDb: Db | null = null;
let videoToRecipeDb: Db | null = null;

/**
 * 连接到MongoDB数据库
 * @returns 包含三个数据库连接的对象
 */
export async function connectToDatabase() {
  try {
    // 检查现有连接是否有效
    if (detailRecipesClient && simpleRecipesClient && videoToRecipeClient) {
      // 在新版本的 MongoDB 驱动中，不再使用 isConnected() 方法
      // 可以直接返回现有连接，因为如果连接断开，后续操作会自动重连
      return {
        detailRecipesDb,
        simpleRecipesDb,
        videoToRecipeDb
      };
    }

    // 创建新的MongoDB客户端连接
    detailRecipesClient = new MongoClient(getConnectionUri(DB_NAMES.DETAIL_RECIPES));
    simpleRecipesClient = new MongoClient(getConnectionUri(DB_NAMES.SIMPLE_RECIPES));
    videoToRecipeClient = new MongoClient(getConnectionUri(DB_NAMES.VIDEO_TO_RECIPE));

    await Promise.all([
      detailRecipesClient.connect(),
      simpleRecipesClient.connect(),
      videoToRecipeClient.connect()
    ]);

    console.log('成功连接到MongoDB数据库');

    // 获取数据库实例
    detailRecipesDb = detailRecipesClient.db(DB_NAMES.DETAIL_RECIPES);
    simpleRecipesDb = simpleRecipesClient.db(DB_NAMES.SIMPLE_RECIPES);
    videoToRecipeDb = videoToRecipeClient.db(DB_NAMES.VIDEO_TO_RECIPE);

    return {
      detailRecipesDb,
      simpleRecipesDb,
      videoToRecipeDb
    };
  } catch (error) {
    console.error('连接MongoDB数据库失败:', error);
    throw error;
  }
}

/**
 * 关闭MongoDB数据库连接
 */
export async function closeDatabaseConnection() {
  if (detailRecipesClient) {
    await detailRecipesClient.close();
    detailRecipesClient = null;
    detailRecipesDb = null;
  }

  if (simpleRecipesClient) {
    await simpleRecipesClient.close();
    simpleRecipesClient = null;
    simpleRecipesDb = null;
  }

  if (videoToRecipeClient) {
    await videoToRecipeClient.close();
    videoToRecipeClient = null;
    videoToRecipeDb = null;
  }

  console.log('MongoDB数据库连接已关闭');
}

/**
 * 获取详细食谱数据库
 * @returns 详细食谱数据库实例
 */
export async function getDetailRecipesDb() {
  const { detailRecipesDb } = await connectToDatabase();
  return detailRecipesDb;
}

/**
 * 获取简易食谱数据库
 * @returns 简易食谱数据库实例
 */
export async function getSimpleRecipesDb() {
  const { simpleRecipesDb } = await connectToDatabase();
  return simpleRecipesDb;
}

/**
 * 获取视频转食谱数据库
 * @returns 视频转食谱数据库实例
 */
export async function getVideoToRecipeDb() {
  const { videoToRecipeDb } = await connectToDatabase();
  return videoToRecipeDb;
}
