#!/usr/bin/env python
# -*- coding: utf-8 -*-

import redis
import json
import logging
import sys

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class RedisDataTester:
    def __init__(self, host, port, db, password):
        """
        初始化Redis连接
        
        参数:
            host: Redis服务器地址
            port: Redis服务器端口
            db: Redis数据库编号
            password: Redis密码
        """
        self.redis_host = host
        self.redis_port = port
        self.redis_db = db
        self.redis_password = password
        self.redis_client = None
        
        # 连接到Redis
        self.connect_to_redis()
    
    def connect_to_redis(self):
        """
        连接到Redis服务器
        
        返回:
            bool: 连接成功返回True，否则返回False
        """
        try:
            logger.info(f"正在连接到Redis服务器: {self.redis_host}:{self.redis_port} DB:{self.redis_db}")
            self.redis_client = redis.Redis(
                host=self.redis_host,
                port=self.redis_port,
                db=self.redis_db,
                password=self.redis_password,
                decode_responses=True
            )
            self.redis_client.ping()  # 测试连接
            logger.info(f"成功连接到Redis服务器: {self.redis_host}:{self.redis_port} DB:{self.redis_db}")
            return True
        except redis.ConnectionError as e:
            logger.error(f"连接Redis失败: {str(e)}")
            return False
    
    def test_portions_weights(self):
        """测试Portions and Weights数据"""
        logger.info("测试Portions and Weights数据...")
        
        # 获取前10个键
        keys = self.redis_client.keys("portions_weights:*")
        if not keys:
            logger.error("未找到Portions and Weights数据")
            return
        
        logger.info(f"找到 {len(keys)} 条Portions and Weights数据")
        
        # 显示前5条数据
        for i, key in enumerate(keys[:5]):
            data = self.redis_client.hgetall(key)
            logger.info(f"记录 {i+1}:")
            
            # 查找食物描述字段
            food_desc = None
            for field, value in data.items():
                if 'food' in field.lower() and 'description' in field.lower():
                    food_desc = value
                    break
            
            if food_desc:
                logger.info(f"  食物描述: {food_desc}")
            
            # 显示其他几个字段
            fields_to_show = 3
            field_count = 0
            for field, value in data.items():
                if field_count >= fields_to_show:
                    break
                if 'food' in field.lower() and 'description' in field.lower():
                    continue  # 已经显示过了
                logger.info(f"  {field}: {value}")
                field_count += 1
            
            logger.info("  ...")  # 表示还有更多字段
    
    def test_nutrient_values(self):
        """测试FNDDS Nutrient Values数据"""
        logger.info("测试FNDDS Nutrient Values数据...")
        
        # 获取前10个键
        keys = self.redis_client.keys("nutrient_values:*")
        if not keys:
            logger.error("未找到FNDDS Nutrient Values数据")
            return
        
        logger.info(f"找到 {len(keys)} 条FNDDS Nutrient Values数据")
        
        # 显示前5条数据
        for i, key in enumerate(keys[:5]):
            data = self.redis_client.hgetall(key)
            logger.info(f"记录 {i+1}:")
            
            # 查找食材描述和营养素描述字段
            ingredient_desc = None
            nutrient_desc = None
            for field, value in data.items():
                if 'ingredient' in field.lower() and 'description' in field.lower():
                    ingredient_desc = value
                if 'nutrient' in field.lower() and 'description' in field.lower():
                    nutrient_desc = value
            
            if ingredient_desc:
                logger.info(f"  食材描述: {ingredient_desc}")
            if nutrient_desc:
                logger.info(f"  营养素描述: {nutrient_desc}")
            
            # 显示其他几个字段
            fields_to_show = 3
            field_count = 0
            for field, value in data.items():
                if field_count >= fields_to_show:
                    break
                if ('ingredient' in field.lower() and 'description' in field.lower()) or \
                   ('nutrient' in field.lower() and 'description' in field.lower()):
                    continue  # 已经显示过了
                logger.info(f"  {field}: {value}")
                field_count += 1
            
            logger.info("  ...")  # 表示还有更多字段
    
    def test_ingredient_nutrients(self):
        """测试Ingredient Nutrient Values数据"""
        logger.info("测试Ingredient Nutrient Values数据...")
        
        # 获取前10个键
        keys = self.redis_client.keys("ingredient_nutrients:*")
        if not keys:
            logger.error("未找到Ingredient Nutrient Values数据")
            return
        
        logger.info(f"找到 {len(keys)} 条Ingredient Nutrient Values数据")
        
        # 显示前5条数据
        for i, key in enumerate(keys[:5]):
            data = self.redis_client.hgetall(key)
            logger.info(f"记录 {i+1}:")
            
            # 查找食物描述和份量描述字段
            food_desc = None
            portion_desc = None
            for field, value in data.items():
                if 'food' in field.lower() and 'description' in field.lower():
                    food_desc = value
                if 'portion' in field.lower() and 'description' in field.lower():
                    portion_desc = value
            
            if food_desc:
                logger.info(f"  食物描述: {food_desc}")
            if portion_desc:
                logger.info(f"  份量描述: {portion_desc}")
            
            # 显示其他几个字段
            fields_to_show = 3
            field_count = 0
            for field, value in data.items():
                if field_count >= fields_to_show:
                    break
                if ('food' in field.lower() and 'description' in field.lower()) or \
                   ('portion' in field.lower() and 'description' in field.lower()):
                    continue  # 已经显示过了
                logger.info(f"  {field}: {value}")
                field_count += 1
            
            logger.info("  ...")  # 表示还有更多字段
    
    def search_by_food_description(self, search_term):
        """
        根据食物描述搜索数据
        
        参数:
            search_term: 搜索关键词
        """
        logger.info(f"搜索食物描述包含 '{search_term}' 的记录...")
        
        # 在Portions and Weights中搜索
        logger.info("在Portions and Weights中搜索...")
        keys = self.redis_client.keys("portions_weights:*")
        found = 0
        
        for key in keys:
            data = self.redis_client.hgetall(key)
            
            # 查找食物描述字段
            for field, value in data.items():
                if 'food' in field.lower() and 'description' in field.lower() and search_term.lower() in value.lower():
                    logger.info(f"找到匹配记录 - 键: {key}")
                    logger.info(f"  {field}: {value}")
                    found += 1
                    break
            
            if found >= 5:  # 最多显示5条结果
                break
        
        if found == 0:
            logger.info("未找到匹配记录")
    
    def close(self):
        """关闭Redis连接"""
        if self.redis_client:
            logger.info("关闭Redis连接")
            self.redis_client.close()

if __name__ == "__main__":
    # Redis连接信息
    redis_host = '128.1.47.79'
    redis_port = 26739
    redis_db = 3  # 使用DB 3
    redis_password = 'dLmHMtPwjktyYnLt'
    
    # 创建测试器
    tester = RedisDataTester(redis_host, redis_port, redis_db, redis_password)
    
    # 测试三个数据集
    tester.test_portions_weights()
    tester.test_nutrient_values()
    tester.test_ingredient_nutrients()
    
    # 搜索示例
    tester.search_by_food_description("apple")
    
    # 关闭连接
    tester.close()
