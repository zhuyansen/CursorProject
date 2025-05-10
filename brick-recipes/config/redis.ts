import Redis from 'ioredis';

// Redis 连接信息，理想情况下应该从环境变量获取
const redisConfig = {
  host: process.env.REDIS_HOST || '128.1.47.79',
  port: parseInt(process.env.REDIS_PORT || '26739'),
  password: process.env.REDIS_PASSWORD || 'dLmHMtPwjktyYnLt',
};

// 创建单例Redis客户端实例
const redis = new Redis(redisConfig);

// 全局错误处理
redis.on('error', (error) => {
  console.error('[Redis] Connection error:', error);
});

redis.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

export default redis; 