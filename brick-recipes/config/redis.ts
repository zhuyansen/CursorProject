import Redis from 'ioredis';

// Redis 连接信息，理想情况下应该从环境变量获取
const redisConfig = {
  host: process.env.REDIS_HOST || '128.1.47.79',
  port: parseInt(process.env.REDIS_PORT || '26740'),
  password: process.env.REDIS_PASSWORD || 'dLmHMtPwjktyYnLt',
};

// 创建默认Redis客户端实例 (db=0)
const redis = new Redis(redisConfig);

// 创建菜谱专用Redis客户端实例 (db=1)
const recipeRedisClient = new Redis({
  ...redisConfig,
  db: 1, // 指定使用 Redis 数据库索引 1
});

// 默认客户端全局错误处理
redis.on('error', (error) => {
  console.error('[Redis:DB0] Connection error:', error);
});

redis.on('connect', () => {
  // console.log('[Redis:DB0] Connected successfully');
});

// 菜谱客户端错误处理
recipeRedisClient.on('error', (error) => {
  console.error('[Redis:DB1] Recipe connection error:', error);
});

recipeRedisClient.on('connect', () => {
  // console.log('[Redis:DB1] Recipe connected successfully');
});

// 导出默认客户端（向后兼容）
export default redis;

// 导出菜谱专用客户端
export { recipeRedisClient }; 