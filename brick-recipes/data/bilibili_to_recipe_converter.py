#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import os
import sys
import copy
import math
import pandas as pd
import numpy as np
import re
from pathlib import Path
import logging
from datetime import datetime

# 设置日志记录
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger('recipe_converter')

# 导入营养计算器类
from recipe_nutrition_calculator import RecipeNutritionCalculator
from recipe_nutrition_industry_standard import add_units_to_nutrition_values, calculate_industry_standard_servings

def convert_bilibili_to_recipe(bilibili_data):
    """
    将哔哩哔哩视频数据转换为标准食谱格式
    
    Args:
        bilibili_data: 哔哩哔哩视频数据的JSON对象
    
    Returns:
        dict: 标准食谱格式的JSON对象
    """
    # 初始化标准食谱格式
    recipe = {
        "idMeal": f"B{bilibili_data['id']}",  # 使用B+视频ID作为食谱ID
        "strMeal": bilibili_data['summary']['metadata']['strMeal'],
        "strMealAlternate": None,
        "strCategory": bilibili_data['summary']['metadata'].get('strTags', '').split(',')[0] if 'strTags' in bilibili_data['summary']['metadata'] else None,
        "strArea": bilibili_data['summary']['metadata'].get('strArea', None),
        "strInstructions": "",
        "strMealThumb": bilibili_data['detail'].get('cover', None),
        "strTags": bilibili_data['summary']['metadata'].get('strTags', None),
        "strYoutube": None,
        "strSource": None,
        "strImageSource": None,
        "strCreativeCommonsConfirmed": None,
        "dateModified": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "cookingMethods": bilibili_data['summary']['metadata'].get('cookingMethods', None),
        "mealStyle": bilibili_data['summary']['metadata'].get('mealStyle', None),
        "difficulty": bilibili_data['summary']['metadata'].get('difficulty', None),
        "time": sum([step.get('time', 0) for step in bilibili_data['summary']['steps']]),
        "strBilibili": bilibili_data['sourceUrl'],
        "service": "bilibili",
        "id": bilibili_data['id'],
        "videoSummary": bilibili_data['summary']['metadata'].get('videoSummary', ""),
        "steps": bilibili_data['summary']['steps'],
        "cover": bilibili_data['detail'].get('cover', None)
    }
    
    # 从步骤中提取食材和用量
    ingredients = []
    measures = []
    
    for step in bilibili_data['summary']['steps']:
        for ingredient in step.get('ingredients', []):
            ingredient_name = ingredient.get('name', '').strip()
            ingredient_quantity = ingredient.get('quantity', '').strip()
            
            if ingredient_name and ingredient_name not in ingredients:
                ingredients.append(ingredient_name)
                measures.append(ingredient_quantity)
    
    # 填充食材和用量字段(TheMealDB格式，最多20种)
    for i in range(1, 21):
        if i <= len(ingredients):
            recipe[f"strIngredient{i}"] = ingredients[i-1]
            recipe[f"strMeasure{i}"] = measures[i-1]
        else:
            recipe[f"strIngredient{i}"] = None
            recipe[f"strMeasure{i}"] = None
    
    # 制作食谱说明文本
    instructions = []
    for step in bilibili_data['summary']['steps']:
        step_title = step.get('title', '')
        step_instructions = step.get('instructions', [])
        
        if step_title:
            instructions.append(f"{step_title}:")
        
        for instruction in step_instructions:
            instructions.append(instruction)
        
        instructions.append("")  # 步骤之间添加空行
    
    recipe["strInstructions"] = "\r\n".join(instructions)
    
    # 合并所有食材为一个逗号分隔的字符串
    recipe["ingredients"] = ", ".join([ing for ing in ingredients if ing])
    
    return recipe

def add_precise_nutrition_info(recipe_data, data_dir="fixed_data"):
    """
    使用精确的营养计算方法为食谱添加营养信息
    
    Args:
        recipe_data: 标准食谱格式的JSON对象
        data_dir: 营养数据库目录路径
        
    Returns:
        dict: 添加了精确营养信息的食谱JSON对象
    """
    # 创建营养计算器实例
    try:
        calculator = RecipeNutritionCalculator(data_dir=data_dir)
        
        # 计算营养成分
        print(f"正在为 {recipe_data.get('strMeal')} 计算精确营养信息...")
        result = calculator.calculate_recipe_nutrition(recipe_data, verbose=False)
        
        # 如果营养计算失败，返回原始数据并记录警告
        if not result or not result.get('nutrition') or result.get('total_weight_grams', 0) <= 0:
            logger.warning(f"警告: 无法计算 {recipe_data.get('strMeal')} 的营养成分，将使用模拟数据")
            # 回退到模拟数据
            return add_mock_nutrition_info(recipe_data)
        
        # 获取营养成分和总重量
        nutrition = result['nutrition']
        nutrition_per_serving = result.get('nutrition_per_serving', {})
        total_weight = result.get('total_weight_grams', 0)
        
        # 根据行业标准计算份数
        food_category = get_food_category(recipe_data)
        servings = calculate_industry_standard_servings(total_weight, food_category)
        
        # 添加总重量和份数
        recipe_data['Weight'] = int(total_weight)
        recipe_data['servings'] = servings
        
        # 添加每份营养信息
        recipe_data['NutritionPerServing'] = {}
        
        # 处理营养素数据，添加适当的单位格式
        recipe_data['NutritionPerServing'] = add_units_to_nutrition_values(nutrition_per_serving)
        
        # 将主要营养信息添加到顶层
        if 'NutritionPerServing' in recipe_data:
            main_nutrition_fields = ['Energy', 'Protein', 'Carbohydrate', 'Sugars, total', 
                                     'Fatty acids, total saturated', 'Total Fat', 'Sodium']
            
            for field in main_nutrition_fields:
                if field in recipe_data['NutritionPerServing']:
                    if field == 'Carbohydrate':
                        recipe_data['Carbohydrate Total'] = recipe_data['NutritionPerServing'][field]
                    elif field == 'Fatty acids, total saturated':
                        recipe_data['Saturated'] = recipe_data['NutritionPerServing'][field]
                    elif field == 'Sugars, total':
                        recipe_data['Sugars'] = recipe_data['NutritionPerServing'][field]
                    else:
                        recipe_data[field] = recipe_data['NutritionPerServing'][field]
        
        print(f"营养计算完成。总重量: {total_weight:.1f}g, 份数: {servings}")
        return recipe_data
        
    except Exception as e:
        logger.error(f"营养计算出错: {e}")
        # 出错时回退到模拟数据
        return add_mock_nutrition_info(recipe_data)

def add_mock_nutrition_info(recipe_data):
    """
    当精确计算失败时，为食谱添加模拟营养信息
    
    Args:
        recipe_data: 标准食谱格式的JSON对象
        
    Returns:
        dict: 添加了模拟营养信息的食谱JSON对象
    """
    logger.info("使用模拟数据生成营养信息...")
    
    # 根据食谱类型和食材数量模拟总重量
    ingredients_count = sum(1 for i in range(1, 21) if recipe_data.get(f"strIngredient{i}"))
    
    # 估算每种食材的平均重量: 100g-300g
    avg_ingredient_weight = 150  # 平均每种食材150克
    
    # 估算总重量
    total_weight = ingredients_count * avg_ingredient_weight
    
    # 添加总重量到食谱
    recipe_data['Weight'] = int(total_weight)
    
    # 根据行业标准计算份数
    food_category = get_food_category(recipe_data)
    servings = calculate_industry_standard_servings(total_weight, food_category)
    recipe_data['servings'] = servings
    
    # 每份营养值估算 (基于常见食谱的平均值)
    # 包含参考JSON中的所有营养字段
    nutrition_per_serving = {
        "Energy": 300.0,  # kcal
        "Protein": 15.0,  # g
        "Carbohydrate": 25.0,  # g
        "Sugars, total": 5.0,  # g
        "Fiber, total dietary": 3.0,  # g
        "Total Fat": 15.0,  # g
        "Fatty acids, total saturated": 5.0,  # g
        "Fatty acids, total monounsaturated": 6.0,  # g
        "Fatty acids, total polyunsaturated": 2.0,  # g
        "Cholesterol": 50.0,  # mg
        "Sodium": 500.0,  # mg
        "Potassium": 300.0,  # mg
        "Calcium": 100.0,  # mg
        "Iron": 2.5,  # mg
        "Vitamin A, RAE": 150.0,  # mcg
        "Vitamin C": 20.0,  # mg
        "Vitamin D": 1.0,  # mcg
        "Vitamin E": 2.0,  # mg
        "Vitamin K": 20.0,  # mcg
        "Thiamin": 0.2,  # mg
        "Riboflavin": 0.3,  # mg
        "Niacin": 3.0,  # mg
        "Vitamin B-6": 0.3,  # mg
        "Folate, DFE": 80.0,  # mcg
        "Vitamin B-12": 1.0,  # mcg
        "Water": 150.0,  # g
        
        # 添加完整的营养字段集合
        "Choline, total": 80.0,  # mg
        "22:5 n-3": 0.1,  # g
        "Theobromine": 0.0,  # mg
        "18:0": 1.0,  # g
        "Caffeine": 0.0,  # mg
        "Cryptoxanthin, beta": 5.0,  # mcg
        "18:3": 0.3,  # g
        "20:5 n-3": 0.1,  # g
        "14:0": 0.5,  # g
        "12:0": 0.2,  # g
        "16:1": 0.2,  # g
        "18:2": 2.0,  # g
        "Zinc": 1.5,  # mg
        "18:4": 0.0,  # g
        "22:6 n-3": 0.1,  # g
        "6:0": 0.1,  # g
        "20:1": 0.1,  # g
        "Phosphorus": 250.0,  # mg
        "Carotene, alpha": 50.0,  # mcg
        "Alcohol": 0.0,  # g
        "Retinol": 100.0,  # mcg
        "Vitamin E, added": 0.0,  # g
        "Lutein + zeaxanthin": 80.0,  # mcg
        "4:0": 0.1,  # g
        "16:0": 3.0,  # g
        "Carotene, beta": 250.0,  # mcg
        "Selenium": 30.0,  # mcg
        "18:1": 8.0,  # g
        "20:4": 0.1,  # g
        "Folic acid": 10.0,  # mcg
        "10:0": 0.2,  # g
        "Lycopene": 1500.0,  # mcg
        "Vitamin B-12, added": 0.0,  # mcg
        "Folate, food": 35.0,  # mcg
        "Folate, total": 40.0,  # mcg
        "Copper": 0.2,  # mg
        "8:0": 0.2,  # g
        "22:1": 0.0,  # g
        "Magnesium": 40.0  # mg
    }
    
    # 模拟主要营养素的变化（根据食材数量调整）
    factor = ingredients_count / 8.0  # 基准值：8种食材
    factor = max(0.5, min(2.0, factor))  # 限制因子范围在0.5到2.0之间
    
    # 调整营养值
    for nutrient, value in nutrition_per_serving.items():
        nutrition_per_serving[nutrient] = value * factor
    
    # 使用行业标准添加单位和格式
    recipe_data['NutritionPerServing'] = add_units_to_nutrition_values(nutrition_per_serving)
    
    # 添加主要营养信息到顶层
    recipe_data['Energy'] = recipe_data['NutritionPerServing']['Energy']
    recipe_data['Protein'] = recipe_data['NutritionPerServing']['Protein']
    recipe_data['Total Fat'] = recipe_data['NutritionPerServing']['Total Fat']
    recipe_data['Saturated'] = recipe_data['NutritionPerServing']['Fatty acids, total saturated']
    recipe_data['Carbohydrate Total'] = recipe_data['NutritionPerServing']['Carbohydrate']
    recipe_data['Sugars'] = recipe_data['NutritionPerServing']['Sugars, total']
    recipe_data['Sodium'] = recipe_data['NutritionPerServing']['Sodium']
    
    logger.info(f"模拟营养数据生成完成。总重量: {total_weight:.1f}g, 份数: {servings}")
    return recipe_data

def get_food_category(recipe_data):
    """
    根据食谱信息确定食品类别
    
    Args:
        recipe_data: 食谱数据
        
    Returns:
        str: 食品类别 ("main", "soup", "salad", "dessert")
    """
    # 默认为主菜
    food_category = "main"
    
    # 尝试从类别字段识别
    if 'strCategory' in recipe_data and recipe_data['strCategory']:
        category = recipe_data['strCategory'].lower()
        
        if any(x in category for x in ['soup', '汤']):
            food_category = "soup"
        elif any(x in category for x in ['salad', '沙拉']):
            food_category = "salad"
        elif any(x in category for x in ['dessert', 'sweet', '甜点', '甜品']):
            food_category = "dessert"
    
    # 尝试从菜名识别
    if 'strMeal' in recipe_data and recipe_data['strMeal']:
        meal_name = recipe_data['strMeal'].lower()
        
        if any(x in meal_name for x in ['soup', 'stew', 'broth', '汤', '羹']):
            food_category = "soup"
        elif any(x in meal_name for x in ['salad', '沙拉']):
            food_category = "salad"
        elif any(x in meal_name for x in ['cake', 'dessert', 'sweet', 'cookie', 'pudding', 'ice cream', 
                                          '甜点', '甜品', '蛋糕', '饼干', '冰淇淋']):
            food_category = "dessert"
    
    return food_category

def compare_fields(source_json, target_json):
    """
    比较两个JSON的字段
    
    Args:
        source_json: 源JSON
        target_json: 目标JSON
    
    Returns:
        dict: 包含缺失字段和多余字段的比较结果
    """
    source_fields = set(source_json.keys())
    target_fields = set(target_json.keys())
    
    missing_fields = target_fields - source_fields
    extra_fields = source_fields - target_fields
    
    # 对于嵌套字段的比较（仅针对NutritionPerServing）
    source_nutrition = set(source_json.get('NutritionPerServing', {}).keys())
    target_nutrition = set(target_json.get('NutritionPerServing', {}).keys())
    
    missing_nutrition = target_nutrition - source_nutrition
    extra_nutrition = source_nutrition - target_nutrition
    
    return {
        'missing_fields': list(missing_fields),
        'extra_fields': list(extra_fields),
        'missing_nutrition': list(missing_nutrition),
        'extra_nutrition': list(extra_nutrition)
    }

def main():
    # 设置路径
    base_dir = os.path.dirname(os.path.abspath(__file__))
    bilibili_json = os.path.join(base_dir, "json_file", "example_bilibili.json")
    output_json = os.path.join(base_dir, "json_file", "converted_bilibili_recipe.json")
    reference_json = os.path.join(base_dir, "json_file", "example_recipe_with_video_info.json")
    
    # 检查文件是否存在
    if not os.path.exists(bilibili_json):
        logger.error(f"错误: 找不到文件 {bilibili_json}")
        return
    
    # 加载哔哩哔哩数据
    try:
        with open(bilibili_json, 'r', encoding='utf-8') as f:
            bilibili_data = json.load(f)
    except Exception as e:
        logger.error(f"加载 {bilibili_json} 时出错: {e}")
        return
    
    # 转换为标准食谱格式
    logger.info(f"将 {bilibili_json} 转换为标准食谱格式...")
    recipe_data = convert_bilibili_to_recipe(bilibili_data)
    
    # 尝试添加精确营养信息，失败时使用模拟数据
    logger.info("计算并添加营养信息...")
    try:
        recipe_data = add_precise_nutrition_info(recipe_data)
    except Exception as e:
        logger.error(f"精确营养计算失败: {e}")
        logger.info("回退到模拟营养数据...")
        recipe_data = add_mock_nutrition_info(recipe_data)
    
    # 创建与TheMealDB格式一致的meals数组
    meals_data = {"meals": [recipe_data]}
    
    # 保存转换后的数据
    try:
        with open(output_json, 'w', encoding='utf-8') as f:
            json.dump(meals_data, f, ensure_ascii=False, indent=4)
        logger.info(f"已将转换后的数据保存到 {output_json}")
    except Exception as e:
        logger.error(f"保存 {output_json} 时出错: {e}")
    
    # 与参考JSON进行字段比较
    if os.path.exists(reference_json):
        try:
            with open(reference_json, 'r', encoding='utf-8') as f:
                reference_data = json.load(f)
            
            logger.info("\n比较字段结构...")
            comparison = compare_fields(recipe_data, reference_data)
            
            logger.info("\n字段比较结果:")
            if comparison['missing_fields']:
                logger.info(f"缺少的字段: {comparison['missing_fields']}")
            else:
                logger.info("没有缺少的字段")
                
            if comparison['extra_fields']:
                logger.info(f"额外的字段: {comparison['extra_fields']}")
            else:
                logger.info("没有额外的字段")
                
            if 'NutritionPerServing' in recipe_data and 'NutritionPerServing' in reference_data:
                if comparison['missing_nutrition']:
                    logger.info(f"缺少的营养字段: {comparison['missing_nutrition']}")
                else:
                    logger.info("没有缺少的营养字段")
                    
                if comparison['extra_nutrition']:
                    logger.info(f"额外的营养字段: {comparison['extra_nutrition']}")
                else:
                    logger.info("没有额外的营养字段")
            
        except Exception as e:
            logger.error(f"比较字段时出错: {e}")
    else:
        logger.warning(f"警告: 未找到参考文件 {reference_json}，无法进行字段比较")
    
    logger.info("\n转换完成！")

if __name__ == "__main__":
    main() 