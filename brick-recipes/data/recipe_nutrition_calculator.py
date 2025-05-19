#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pandas as pd
import json
import os
import re
import numpy as np
from pathlib import Path
import logging
import copy

# 设置日志记录
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger('recipe_calculator')

class RecipeNutritionCalculator:
    def __init__(self, data_dir):
        """
        Initialize the nutrition calculator with data files.
        
        Args:
            data_dir (str): Directory containing the FNDDS Excel files
        """
        self.data_dir = data_dir
        
        # Load the Excel files (skip the first row which is a header title)
        print("Loading nutrition data files...")
        
        # File paths
        ingredient_nutrient_path = os.path.join(data_dir, "2021-2023 FNDDS At A Glance - Ingredient Nutrient Values.xlsx")
        portions_weights_path = os.path.join(data_dir, "2021-2023 FNDDS At A Glance - Portions and Weights.xlsx")
        nutrient_values_path = os.path.join(data_dir, "2021-2023 FNDDS At A Glance - FNDDS Nutrient Values.xlsx")
        
        # Load the data files
        self.ingredient_nutrients_df = pd.read_excel(ingredient_nutrient_path, skiprows=1)
        self.portions_weights_df = pd.read_excel(portions_weights_path, skiprows=1)
        self.nutrient_values_df = pd.read_excel(nutrient_values_path, skiprows=1)
        
        # Get lists of all food descriptions for matching
        self.food_descriptions = self.nutrient_values_df['Main food description'].str.lower().tolist()
        self.ingredient_descriptions = self.ingredient_nutrients_df['Ingredient description'].str.lower().unique().tolist()
        
        # Clean column names by removing newlines
        self.clean_columns = {}
        for col in self.nutrient_values_df.columns[4:]:
            clean_col = col.replace('\n', '')
            self.clean_columns[col] = clean_col
        
        # Create a dictionary for units conversion (common recipe units to grams)
        self.unit_conversion = {
            'cup': 'cup',
            'cups': 'cup',
            'tablespoon': 'tablespoon',
            'tablespoons': 'tablespoon',
            'tbsp': 'tablespoon',
            'teaspoon': 'teaspoon',
            'teaspoons': 'teaspoon',
            'tsp': 'teaspoon',
            'ounce': 'ounce',
            'ounces': 'ounce',
            'oz': 'ounce',
            'fluid ounce': 'fl oz',
            'fluid ounces': 'fl oz',
            'fl oz': 'fl oz',
            'pound': 'pound',
            'pounds': 'pound',
            'lb': 'pound',
            'gram': 'g',
            'grams': 'g',
            'g': 'g',
            'kilogram': 'kg',
            'kilograms': 'kg',
            'kg': 'kg',
            'milliliter': 'ml',
            'milliliters': 'ml',
            'ml': 'ml',
            'liter': 'liter',
            'liters': 'liter',
            'l': 'liter',
            'pinch': 'pinch',
            'slice': 'slice',
            'slices': 'slice',
            'piece': 'piece',
            'pieces': 'piece',
            'whole': 'whole',
            'clove': 'clove',
            'cloves': 'clove'
        }
        
        print("Data loaded successfully.")

    def find_closest_food_match(self, ingredient_name, verbose=False):
        """
        在FNDDS数据库中查找与给定食材名称最接近的食品
        
        参数:
            ingredient_name (str): 要查找匹配的食材名称
            verbose (bool): 是否打印详细的匹配信息
            
        返回:
            str: 最接近的食品描述，如果没有找到匹配项则返回None
        """
        # 跳过无效的食材名称
        if not ingredient_name or not isinstance(ingredient_name, str) or len(ingredient_name.strip()) < 3:
            return None
            
        original_name = ingredient_name
        ingredient_name = ingredient_name.lower().strip()
        
        # 设置日志级别
        log_func = logger.info if verbose else logger.debug
        
        # 预处理复杂食材描述，简化为核心食材名称
        # 先定义食材分类字典，然后传递给预处理函数
        # 食材分类系统 - 更详细的食材分类字典，包含更多的关键词和子类别
        ingredient_categories = {
            # 肉类
            'meat': {
                'beef': ['beef', 'steak', 'ribeye', 'sirloin', 'brisket', 'ground beef', 'minced beef', 'burger', 'chuck', 'roast beef'],
                'pork': ['pork', 'ham', 'bacon', 'sausage', 'loin', 'chop', 'tenderloin', 'ground pork', 'minced pork', 'prosciutto', 'pancetta'],
                'lamb': ['lamb', 'mutton', 'chop', 'rack', 'leg of lamb', 'ground lamb', 'minced lamb'],
                'poultry': ['chicken', 'turkey', 'duck', 'goose', 'hen', 'breast', 'thigh', 'wing', 'drumstick', 'ground chicken', 'minced chicken'],
                'game': ['venison', 'rabbit', 'quail', 'pheasant', 'boar', 'bison', 'buffalo'],
                'processed': ['sausage', 'salami', 'pepperoni', 'jerky', 'meatball', 'meatloaf', 'deli meat', 'cured meat']
            },
            
            # 海鲜类
            'seafood': {
                'fish': ['fish', 'salmon', 'tuna', 'cod', 'haddock', 'trout', 'bass', 'tilapia', 'sardine', 'anchovy', 'mackerel', 'halibut', 'snapper', 'mahi mahi', 'swordfish'],
                'shellfish': ['shrimp', 'prawn', 'king prawn', 'crab', 'lobster', 'crawfish', 'crayfish', 'langoustine'],
                'mollusks': ['mussel', 'clam', 'oyster', 'scallop', 'squid', 'octopus', 'calamari'],
                'processed': ['fish stick', 'fish finger', 'fish cake', 'surimi', 'canned tuna', 'canned salmon', 'smoked salmon', 'smoked fish']
            },
            
            # 蔬菜类
            'vegetables': {
                'root': ['carrot', 'potato', 'sweet potato', 'yam', 'turnip', 'radish', 'beet', 'beetroot', 'parsnip', 'rutabaga', 'celeriac'],
                'bulb': ['onion', 'garlic', 'shallot', 'leek', 'spring onion', 'scallion', 'green onion', 'fennel'],
                'leafy_greens': ['lettuce', 'spinach', 'kale', 'chard', 'arugula', 'rocket', 'collard', 'cabbage', 'bok choy', 'watercress', 'endive', 'radicchio'],
                'cruciferous': ['broccoli', 'cauliflower', 'brussels sprout', 'cabbage', 'kale', 'bok choy', 'kohlrabi'],
                'nightshade': ['tomato', 'pepper', 'eggplant', 'aubergine', 'potato', 'chili', 'capsicum', 'bell pepper'],
                'squash': ['zucchini', 'courgette', 'pumpkin', 'butternut squash', 'acorn squash', 'spaghetti squash', 'gourd'],
                'legume': ['bean', 'pea', 'lentil', 'chickpea', 'garbanzo', 'kidney bean', 'black bean', 'pinto bean', 'navy bean', 'edamame', 'soybean'],
                'other': ['cucumber', 'celery', 'asparagus', 'artichoke', 'corn', 'maize', 'mushroom', 'avocado']
            },
            
            # 水果类
            'fruits': {
                'berry': ['strawberry', 'blueberry', 'raspberry', 'blackberry', 'cranberry', 'boysenberry', 'gooseberry', 'elderberry', 'mulberry', 'acai berry'],
                'citrus': ['orange', 'lemon', 'lime', 'grapefruit', 'tangerine', 'mandarin', 'clementine', 'kumquat', 'citron', 'yuzu'],
                'tropical': ['banana', 'pineapple', 'mango', 'papaya', 'kiwi', 'guava', 'passion fruit', 'lychee', 'dragon fruit', 'star fruit', 'durian'],
                'stone': ['peach', 'plum', 'nectarine', 'apricot', 'cherry', 'date', 'olive'],
                'pome': ['apple', 'pear', 'quince'],
                'melon': ['watermelon', 'cantaloupe', 'honeydew', 'melon'],
                'dried': ['raisin', 'prune', 'date', 'fig', 'apricot', 'cranberry', 'currant']
            },
            
            # 乳制品类
            'dairy': {
                'milk': ['milk', 'whole milk', 'skim milk', 'low-fat milk', 'buttermilk', 'condensed milk', 'evaporated milk'],
                'cheese': ['cheese', 'cheddar', 'mozzarella', 'parmesan', 'feta', 'gouda', 'brie', 'camembert', 'blue cheese', 'goat cheese', 'ricotta', 'cottage cheese', 'cream cheese'],
                'cream': ['cream', 'heavy cream', 'whipping cream', 'sour cream', 'creme fraiche', 'half and half'],
                'yogurt': ['yogurt', 'greek yogurt', 'plain yogurt', 'flavored yogurt', 'kefir'],
                'butter': ['butter', 'unsalted butter', 'salted butter', 'clarified butter', 'ghee']
            },
            
            # 谷类和面粉类
            'grains': {
                'rice': ['rice', 'white rice', 'brown rice', 'jasmine rice', 'basmati rice', 'arborio rice', 'wild rice', 'rice flour'],
                'wheat': ['wheat', 'flour', 'all-purpose flour', 'bread flour', 'cake flour', 'whole wheat flour', 'semolina', 'bulgur', 'couscous'],
                'corn': ['corn', 'maize', 'cornmeal', 'polenta', 'grits', 'corn flour', 'cornstarch'],
                'oats': ['oat', 'oatmeal', 'rolled oats', 'steel-cut oats', 'quick oats'],
                'other_grains': ['barley', 'quinoa', 'millet', 'rye', 'buckwheat', 'amaranth', 'spelt', 'farro', 'teff'],
                'pasta': ['pasta', 'spaghetti', 'penne', 'fettuccine', 'linguine', 'macaroni', 'noodle', 'egg noodle', 'rice noodle'],
                'bread': ['bread', 'white bread', 'whole wheat bread', 'rye bread', 'sourdough', 'baguette', 'roll', 'bun', 'pita', 'naan', 'tortilla']
            },
            
            # 调味料和香料
            'seasonings': {
                'herbs': ['basil', 'oregano', 'thyme', 'rosemary', 'parsley', 'cilantro', 'coriander', 'mint', 'dill', 'sage', 'tarragon', 'chive', 'bay leaf', 'marjoram'],
                'spices': ['pepper', 'black pepper', 'white pepper', 'red pepper', 'chili', 'paprika', 'cumin', 'coriander', 'cinnamon', 'nutmeg', 'clove', 'allspice', 'cardamom', 'turmeric', 'ginger', 'saffron', 'fennel seed', 'star anise'],
                'salt': ['salt', 'sea salt', 'kosher salt', 'table salt', 'fleur de sel', 'himalayan salt'],
                'condiments': ['ketchup', 'mustard', 'mayonnaise', 'soy sauce', 'hot sauce', 'worcestershire sauce', 'fish sauce', 'vinegar', 'balsamic vinegar', 'miso', 'tahini']
            },
            
            # 油脂类
            'oils': {
                'vegetable_oils': ['oil', 'olive oil', 'vegetable oil', 'canola oil', 'sunflower oil', 'corn oil', 'peanut oil', 'sesame oil', 'coconut oil', 'avocado oil', 'grapeseed oil', 'walnut oil'],
                'animal_fats': ['butter', 'lard', 'tallow', 'schmaltz', 'duck fat', 'bacon fat', 'ghee'],
                'other_fats': ['margarine', 'shortening', 'cooking spray']
            },
            
            # 坐果和种子类
            'nuts_seeds': {
                'nuts': ['nut', 'almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'hazelnut', 'macadamia', 'brazil nut', 'pine nut', 'chestnut'],
                'seeds': ['seed', 'sesame', 'sunflower', 'pumpkin', 'flax', 'chia', 'hemp', 'poppy seed'],
                'nut_products': ['peanut butter', 'almond butter', 'tahini', 'nut milk', 'almond milk', 'cashew milk']
            },
            
            # 饮料类
            'beverages': {
                'alcoholic': ['wine', 'red wine', 'white wine', 'beer', 'vodka', 'rum', 'whiskey', 'gin', 'tequila', 'brandy', 'liqueur', 'champagne', 'prosecco'],
                'non_alcoholic': ['water', 'juice', 'orange juice', 'apple juice', 'soda', 'coffee', 'tea', 'milk', 'smoothie', 'lemonade', 'iced tea']
            },
            
            # 糖类和甜味料
            'sweeteners': {
                'sugars': ['sugar', 'white sugar', 'brown sugar', 'powdered sugar', 'confectioners sugar', 'cane sugar', 'raw sugar', 'demerara sugar'],
                'syrups': ['syrup', 'maple syrup', 'corn syrup', 'golden syrup', 'agave syrup', 'honey', 'molasses', 'date syrup'],
                'artificial': ['stevia', 'sweetener', 'aspartame', 'sucralose', 'saccharin']
            }
        }
        
        simplified_name, core_ingredients = self.preprocess_ingredient_name(ingredient_name, ingredient_categories)
        if simplified_name != ingredient_name:
            log_func(f"简化食材名称: '{ingredient_name}' -> '{simplified_name}'")
            if core_ingredients:
                log_func(f"提取核心食材: {', '.join(core_ingredients)}")
            ingredient_name = simplified_name
        
        # 食材分类系统 - 更详细的食材分类字典，包含更多的关键词和子类别
        ingredient_categories = {
            # 肉类
            'meat': {
                'beef': ['beef', 'steak', 'ribeye', 'sirloin', 'brisket', 'ground beef', 'minced beef', 'burger', 'chuck', 'roast beef'],
                'pork': ['pork', 'ham', 'bacon', 'sausage', 'loin', 'chop', 'tenderloin', 'ground pork', 'minced pork', 'prosciutto', 'pancetta'],
                'lamb': ['lamb', 'mutton', 'chop', 'rack', 'leg of lamb', 'ground lamb', 'minced lamb'],
                'poultry': ['chicken', 'turkey', 'duck', 'goose', 'hen', 'breast', 'thigh', 'wing', 'drumstick', 'ground chicken', 'minced chicken'],
                'game': ['venison', 'rabbit', 'quail', 'pheasant', 'boar', 'bison', 'buffalo'],
                'processed': ['sausage', 'salami', 'pepperoni', 'jerky', 'meatball', 'meatloaf', 'deli meat', 'cured meat']
            },
            
            # 海鲜类
            'seafood': {
                'fish': ['fish', 'salmon', 'tuna', 'cod', 'haddock', 'trout', 'bass', 'tilapia', 'sardine', 'anchovy', 'mackerel', 'halibut', 'snapper', 'mahi mahi', 'swordfish'],
                'shellfish': ['shrimp', 'prawn', 'king prawn', 'crab', 'lobster', 'crawfish', 'crayfish', 'langoustine'],
                'mollusks': ['mussel', 'clam', 'oyster', 'scallop', 'squid', 'octopus', 'calamari'],
                'processed': ['fish stick', 'fish finger', 'fish cake', 'surimi', 'canned tuna', 'canned salmon', 'smoked salmon', 'smoked fish']
            },
            
            # 蔬菜类
            'vegetables': {
                'root': ['carrot', 'potato', 'sweet potato', 'yam', 'turnip', 'radish', 'beet', 'beetroot', 'parsnip', 'rutabaga', 'celeriac'],
                'bulb': ['onion', 'garlic', 'shallot', 'leek', 'spring onion', 'scallion', 'green onion', 'fennel'],
                'leafy_greens': ['lettuce', 'spinach', 'kale', 'chard', 'arugula', 'rocket', 'collard', 'cabbage', 'bok choy', 'watercress', 'endive', 'radicchio'],
                'cruciferous': ['broccoli', 'cauliflower', 'brussels sprout', 'cabbage', 'kale', 'bok choy', 'kohlrabi'],
                'nightshade': ['tomato', 'pepper', 'eggplant', 'aubergine', 'potato', 'chili', 'capsicum', 'bell pepper'],
                'squash': ['zucchini', 'courgette', 'pumpkin', 'butternut squash', 'acorn squash', 'spaghetti squash', 'gourd'],
                'legume': ['bean', 'pea', 'lentil', 'chickpea', 'garbanzo', 'kidney bean', 'black bean', 'pinto bean', 'navy bean', 'edamame', 'soybean'],
                'other': ['cucumber', 'celery', 'asparagus', 'artichoke', 'corn', 'maize', 'mushroom', 'avocado']
            },
            
            # 水果类
            'fruits': {
                'berry': ['strawberry', 'blueberry', 'raspberry', 'blackberry', 'cranberry', 'boysenberry', 'gooseberry', 'elderberry', 'mulberry', 'acai berry'],
                'citrus': ['orange', 'lemon', 'lime', 'grapefruit', 'tangerine', 'mandarin', 'clementine', 'kumquat', 'citron', 'yuzu'],
                'tropical': ['banana', 'pineapple', 'mango', 'papaya', 'kiwi', 'guava', 'passion fruit', 'lychee', 'dragon fruit', 'star fruit', 'durian'],
                'stone': ['peach', 'plum', 'nectarine', 'apricot', 'cherry', 'date', 'olive'],
                'pome': ['apple', 'pear', 'quince'],
                'melon': ['watermelon', 'cantaloupe', 'honeydew', 'melon'],
                'dried': ['raisin', 'prune', 'date', 'fig', 'apricot', 'cranberry', 'currant']
            },
            
            # 乳制品类
            'dairy': {
                'milk': ['milk', 'whole milk', 'skim milk', 'low-fat milk', 'buttermilk', 'condensed milk', 'evaporated milk'],
                'cheese': ['cheese', 'cheddar', 'mozzarella', 'parmesan', 'feta', 'gouda', 'brie', 'camembert', 'blue cheese', 'goat cheese', 'ricotta', 'cottage cheese', 'cream cheese'],
                'cream': ['cream', 'heavy cream', 'whipping cream', 'sour cream', 'creme fraiche', 'half and half'],
                'yogurt': ['yogurt', 'greek yogurt', 'plain yogurt', 'flavored yogurt', 'kefir'],
                'butter': ['butter', 'unsalted butter', 'salted butter', 'clarified butter', 'ghee']
            },
            
            # 谷类和面粉类
            'grains': {
                'rice': ['rice', 'white rice', 'brown rice', 'jasmine rice', 'basmati rice', 'arborio rice', 'wild rice', 'rice flour'],
                'wheat': ['wheat', 'flour', 'all-purpose flour', 'bread flour', 'cake flour', 'whole wheat flour', 'semolina', 'bulgur', 'couscous'],
                'corn': ['corn', 'maize', 'cornmeal', 'polenta', 'grits', 'corn flour', 'cornstarch'],
                'oats': ['oat', 'oatmeal', 'rolled oats', 'steel-cut oats', 'quick oats'],
                'other_grains': ['barley', 'quinoa', 'millet', 'rye', 'buckwheat', 'amaranth', 'spelt', 'farro', 'teff'],
                'pasta': ['pasta', 'spaghetti', 'penne', 'fettuccine', 'linguine', 'macaroni', 'noodle', 'egg noodle', 'rice noodle'],
                'bread': ['bread', 'white bread', 'whole wheat bread', 'rye bread', 'sourdough', 'baguette', 'roll', 'bun', 'pita', 'naan', 'tortilla']
            },
            
            # 调味料和香料
            'seasonings': {
                'herbs': ['basil', 'oregano', 'thyme', 'rosemary', 'parsley', 'cilantro', 'coriander', 'mint', 'dill', 'sage', 'tarragon', 'chive', 'bay leaf', 'marjoram'],
                'spices': ['pepper', 'black pepper', 'white pepper', 'red pepper', 'chili', 'paprika', 'cumin', 'coriander', 'cinnamon', 'nutmeg', 'clove', 'allspice', 'cardamom', 'turmeric', 'ginger', 'saffron', 'fennel seed', 'star anise'],
                'salt': ['salt', 'sea salt', 'kosher salt', 'table salt', 'fleur de sel', 'himalayan salt'],
                'condiments': ['ketchup', 'mustard', 'mayonnaise', 'soy sauce', 'hot sauce', 'worcestershire sauce', 'fish sauce', 'vinegar', 'balsamic vinegar', 'miso', 'tahini']
            },
            
            # 油脂类
            'oils': {
                'vegetable_oils': ['oil', 'olive oil', 'vegetable oil', 'canola oil', 'sunflower oil', 'corn oil', 'peanut oil', 'sesame oil', 'coconut oil', 'avocado oil', 'grapeseed oil', 'walnut oil'],
                'animal_fats': ['butter', 'lard', 'tallow', 'schmaltz', 'duck fat', 'bacon fat', 'ghee'],
                'other_fats': ['margarine', 'shortening', 'cooking spray']
            },
            
            # 坐果和种子类
            'nuts_seeds': {
                'nuts': ['nut', 'almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'hazelnut', 'macadamia', 'brazil nut', 'pine nut', 'chestnut'],
                'seeds': ['seed', 'sesame', 'sunflower', 'pumpkin', 'flax', 'chia', 'hemp', 'poppy seed'],
                'nut_products': ['peanut butter', 'almond butter', 'tahini', 'nut milk', 'almond milk', 'cashew milk']
            },
            
            # 饮料类
            'beverages': {
                'alcoholic': ['wine', 'red wine', 'white wine', 'beer', 'vodka', 'rum', 'whiskey', 'gin', 'tequila', 'brandy', 'liqueur', 'champagne', 'prosecco'],
                'non_alcoholic': ['water', 'juice', 'orange juice', 'apple juice', 'soda', 'coffee', 'tea', 'milk', 'smoothie', 'lemonade', 'iced tea']
            },
            
            # 糖类和甜味料
            'sweeteners': {
                'sugars': ['sugar', 'white sugar', 'brown sugar', 'powdered sugar', 'confectioners sugar', 'cane sugar', 'raw sugar', 'demerara sugar'],
                'syrups': ['syrup', 'maple syrup', 'corn syrup', 'golden syrup', 'agave syrup', 'honey', 'molasses', 'date syrup'],
                'artificial': ['stevia', 'sweetener', 'aspartame', 'sucralose', 'saccharin']
            }
        }
        
        # 更全面的食材替换字典，包含常见食材的标准名称和同义词
        ingredient_replacements = {
            # 海鲜类
            'prawn': 'shrimp',
            'prawns': 'shrimp',
            'king prawn': 'shrimp',
            'king prawns': 'shrimp',
            'tiger prawn': 'shrimp',
            'tiger prawns': 'shrimp',
            'jumbo prawn': 'shrimp',
            'jumbo prawns': 'shrimp',
            'raw prawn': 'shrimp, raw',
            'raw prawns': 'shrimp, raw',
            'raw king prawn': 'shrimp, raw',
            'raw king prawns': 'shrimp, raw',
            'cooked prawn': 'shrimp, cooked',
            'cooked prawns': 'shrimp, cooked',
            'shelled prawn': 'shrimp',
            'shelled prawns': 'shrimp',
            'peeled prawn': 'shrimp',
            'peeled prawns': 'shrimp',
            'shrimp': 'shrimp',
            'shrimps': 'shrimp',
            'raw shrimp': 'shrimp, raw',
            'cooked shrimp': 'shrimp, cooked',
            'peeled shrimp': 'shrimp',
            'deveined shrimp': 'shrimp',
            
            # 乳制品
            'feta': 'cheese, feta',
            'feta cheese': 'cheese, feta',
            'cubed feta': 'cheese, feta',
            'cubed feta cheese': 'cheese, feta',
            'crumbled feta': 'cheese, feta',
            'crumbled feta cheese': 'cheese, feta',
            'greek feta': 'cheese, feta',
            'greek feta cheese': 'cheese, feta',
            
            'cheddar': 'cheese, cheddar',
            'cheddar cheese': 'cheese, cheddar',
            'grated cheddar': 'cheese, cheddar',
            'grated cheddar cheese': 'cheese, cheddar',
            'shredded cheddar': 'cheese, cheddar',
            'shredded cheddar cheese': 'cheese, cheddar',
            'mild cheddar': 'cheese, cheddar',
            'sharp cheddar': 'cheese, cheddar',
            'mature cheddar': 'cheese, cheddar',
            
            'mozzarella': 'cheese, mozzarella',
            'mozzarella cheese': 'cheese, mozzarella',
            'fresh mozzarella': 'cheese, mozzarella',
            'fresh mozzarella cheese': 'cheese, mozzarella',
            'grated mozzarella': 'cheese, mozzarella',
            'grated mozzarella cheese': 'cheese, mozzarella',
            'shredded mozzarella': 'cheese, mozzarella',
            'shredded mozzarella cheese': 'cheese, mozzarella',
            'buffalo mozzarella': 'cheese, mozzarella',
            
            'parmesan': 'cheese, parmesan',
            'parmesan cheese': 'cheese, parmesan',
            'grated parmesan': 'cheese, parmesan, dry grated',
            'grated parmesan cheese': 'cheese, parmesan, dry grated',
            'shredded parmesan': 'cheese, parmesan',
            'shredded parmesan cheese': 'cheese, parmesan',
            'parmigiano': 'cheese, parmesan',
            'parmigiano reggiano': 'cheese, parmesan',
            'parmigiano-reggiano': 'cheese, parmesan',
            
            'ricotta': 'cheese, ricotta',
            'ricotta cheese': 'cheese, ricotta',
            'whole milk ricotta': 'cheese, ricotta',
            'part-skim ricotta': 'cheese, ricotta',
            
            'cottage cheese': 'cheese, cottage',
            'cream cheese': 'cheese, cream',
            'goat cheese': 'cheese, goat',
            'blue cheese': 'cheese, blue',
            'gorgonzola': 'cheese, blue',
            'roquefort': 'cheese, blue',
            'stilton': 'cheese, blue',
            'brie': 'cheese, brie',
            'camembert': 'cheese, camembert',
            'gouda': 'cheese, gouda',
            'swiss cheese': 'cheese, swiss',
            'gruyere': 'cheese, gruyere',
            'manchego': 'cheese, manchego',
            
            # 油脂
            'oil': 'oil, vegetable',
            'olive oil': 'oil, olive',
            'extra virgin olive oil': 'oil, olive',
            'evoo': 'oil, olive',
            'virgin olive oil': 'oil, olive',
            'light olive oil': 'oil, olive',
            'vegetable oil': 'oil, vegetable',
            'canola oil': 'oil, canola',
            'rapeseed oil': 'oil, canola',
            'sunflower oil': 'oil, sunflower',
            'corn oil': 'oil, corn',
            'peanut oil': 'oil, peanut',
            'groundnut oil': 'oil, peanut',
            'sesame oil': 'oil, sesame',
            'toasted sesame oil': 'oil, sesame',
            'coconut oil': 'oil, coconut',
            'avocado oil': 'oil, avocado',
            'grapeseed oil': 'oil, grapeseed',
            'walnut oil': 'oil, walnut',
            'flaxseed oil': 'oil, flaxseed',
            'palm oil': 'oil, palm',
            
            'butter': 'butter, regular, salted',
            'unsalted butter': 'butter, regular, unsalted',
            'salted butter': 'butter, regular, salted',
            'clarified butter': 'butter, clarified',
            'ghee': 'butter, clarified',
            'margarine': 'margarine, regular',
            'lard': 'lard',
            'shortening': 'shortening, vegetable',
            'vegetable shortening': 'shortening, vegetable',
            
            # 蔬菜
            'garlic': 'garlic, raw',
            'minced garlic': 'garlic, raw',
            'crushed garlic': 'garlic, raw',
            'chopped garlic': 'garlic, raw',
            'garlic clove': 'garlic, raw',
            'garlic cloves': 'garlic, raw',
            'fresh garlic': 'garlic, raw',
            'garlic powder': 'garlic powder',
            
            'onion': 'onion, raw',
            'onions': 'onion, raw',
            'chopped onion': 'onion, raw',
            'diced onion': 'onion, raw',
            'sliced onion': 'onion, raw',
            'minced onion': 'onion, raw',
            'white onion': 'onion, raw',
            'yellow onion': 'onion, raw',
            'red onion': 'onion, raw',
            'sweet onion': 'onion, raw',
            'spring onion': 'onions, green, raw',
            'spring onions': 'onions, green, raw',
            'green onion': 'onions, green, raw',
            'green onions': 'onions, green, raw',
            'scallion': 'onions, green, raw',
            'scallions': 'onions, green, raw',
            'shallot': 'shallot, raw',
            'shallots': 'shallot, raw',
            
            'tomato': 'tomato, raw',
            'tomatoes': 'tomato, raw',
            'chopped tomato': 'tomato, raw',
            'chopped tomatoes': 'tomato, raw',
            'diced tomato': 'tomato, raw',
            'diced tomatoes': 'tomato, raw',
            'sliced tomato': 'tomato, raw',
            'sliced tomatoes': 'tomato, raw',
            'cherry tomato': 'tomato, raw',
            'cherry tomatoes': 'tomato, raw',
            'plum tomato': 'tomato, raw',
            'plum tomatoes': 'tomato, raw',
            'roma tomato': 'tomato, raw',
            'roma tomatoes': 'tomato, raw',
            'sun-dried tomato': 'tomato, sun-dried',
            'sun-dried tomatoes': 'tomato, sun-dried',
            'canned tomato': 'tomatoes, canned',
            'canned tomatoes': 'tomatoes, canned',
            'tinned tomato': 'tomatoes, canned',
            'tinned tomatoes': 'tomatoes, canned',
            'tomato paste': 'tomato paste',
            'tomato puree': 'tomato puree',
            'tomato sauce': 'tomato sauce',
            'passata': 'tomato puree',
            
            'carrot': 'carrot, raw',
            'carrots': 'carrot, raw',
            'chopped carrot': 'carrot, raw',
            'chopped carrots': 'carrot, raw',
            'diced carrot': 'carrot, raw',
            'diced carrots': 'carrot, raw',
            'sliced carrot': 'carrot, raw',
            'sliced carrots': 'carrot, raw',
            'grated carrot': 'carrot, raw',
            'grated carrots': 'carrot, raw',
            'shredded carrot': 'carrot, raw',
            'shredded carrots': 'carrot, raw',
            'baby carrot': 'carrot, raw',
            'baby carrots': 'carrot, raw',
            
            'bell pepper': 'pepper, sweet, raw',
            'bell peppers': 'pepper, sweet, raw',
            'red bell pepper': 'pepper, sweet, red, raw',
            'red bell peppers': 'pepper, sweet, red, raw',
            'green bell pepper': 'pepper, sweet, green, raw',
            'green bell peppers': 'pepper, sweet, green, raw',
            'yellow bell pepper': 'pepper, sweet, yellow, raw',
            'yellow bell peppers': 'pepper, sweet, yellow, raw',
            'orange bell pepper': 'pepper, sweet, orange, raw',
            'orange bell peppers': 'pepper, sweet, orange, raw',
            'capsicum': 'pepper, sweet, raw',
            'red capsicum': 'pepper, sweet, red, raw',
            'green capsicum': 'pepper, sweet, green, raw',
            'yellow capsicum': 'pepper, sweet, yellow, raw',
            'orange capsicum': 'pepper, sweet, orange, raw',
            
            # 香草和调味料
            'parsley': 'parsley, raw',
            'fresh parsley': 'parsley, raw',
            'chopped parsley': 'parsley, raw',
            'freshly chopped parsley': 'parsley, raw',
            'flat-leaf parsley': 'parsley, raw',
            'curly parsley': 'parsley, raw',
            'italian parsley': 'parsley, raw',
            'dried parsley': 'parsley, dried',
            
            'basil': 'basil, raw',
            'fresh basil': 'basil, raw',
            'chopped basil': 'basil, raw',
            'fresh chopped basil': 'basil, raw',
            'basil leaves': 'basil, raw',
            'fresh basil leaves': 'basil, raw',
            'dried basil': 'basil, dried',
            'thai basil': 'basil, raw',
            'holy basil': 'basil, raw',
            
            'cilantro': 'cilantro, raw',
            'fresh cilantro': 'cilantro, raw',
            'chopped cilantro': 'cilantro, raw',
            'fresh chopped cilantro': 'cilantro, raw',
            'cilantro leaves': 'cilantro, raw',
            'coriander leaves': 'cilantro, raw',
            'fresh coriander': 'cilantro, raw',
            'chinese parsley': 'cilantro, raw',
            
            'rosemary': 'rosemary, raw',
            'fresh rosemary': 'rosemary, raw',
            'dried rosemary': 'rosemary, dried',
            'rosemary sprig': 'rosemary, raw',
            'rosemary sprigs': 'rosemary, raw',
            
            'thyme': 'thyme, raw',
            'fresh thyme': 'thyme, raw',
            'dried thyme': 'thyme, dried',
            'thyme sprig': 'thyme, raw',
            'thyme sprigs': 'thyme, raw',
            
            'oregano': 'oregano, raw',
            'fresh oregano': 'oregano, raw',
            'dried oregano': 'oregano, dried',
            
            'mint': 'mint, raw',
            'fresh mint': 'mint, raw',
            'dried mint': 'mint, dried',
            'mint leaves': 'mint, raw',
            'peppermint': 'mint, raw',
            'spearmint': 'mint, raw',
            
            'sage': 'sage, raw',
            'fresh sage': 'sage, raw',
            'dried sage': 'sage, dried',
            'sage leaves': 'sage, raw',
            
            'dill': 'dill, raw',
            'fresh dill': 'dill, raw',
            'dried dill': 'dill, dried',
            'dill weed': 'dill, raw',
            
            'chive': 'chives, raw',
            'chives': 'chives, raw',
            'fresh chives': 'chives, raw',
            'dried chives': 'chives, dried',
            'chopped chives': 'chives, raw',
            
            'bay leaf': 'bay leaf, dried',
            'bay leaves': 'bay leaf, dried',
            'dried bay leaf': 'bay leaf, dried',
            'dried bay leaves': 'bay leaf, dried',
            
            'black pepper': 'pepper, black',
            'ground black pepper': 'pepper, black',
            'freshly ground black pepper': 'pepper, black',
            'cracked black pepper': 'pepper, black',
            'white pepper': 'pepper, white',
            'ground white pepper': 'pepper, white',
            
            'salt': 'salt, table',
            'table salt': 'salt, table',
            'sea salt': 'salt, sea',
            'kosher salt': 'salt, kosher',
            'fleur de sel': 'salt, sea',
            'himalayan salt': 'salt, himalayan',
            'pink salt': 'salt, himalayan',
            
            # 饮料
            'white wine': 'wine, white',
            'dry white wine': 'wine, white',
            'sweet white wine': 'wine, white',
            'red wine': 'wine, red',
            'dry red wine': 'wine, red',
            'full-bodied red wine': 'wine, red',
            'rose wine': 'wine, rose',
            'rosé wine': 'wine, rose',
            'sparkling wine': 'wine, sparkling',
            'champagne': 'wine, champagne',
            'prosecco': 'wine, prosecco',
            'cooking wine': 'wine, cooking',
            'rice wine': 'wine, rice',
            'mirin': 'wine, rice',
            'sake': 'wine, rice',
            'sherry': 'wine, sherry',
            'port': 'wine, port',
            'marsala': 'wine, marsala',
            'madeira': 'wine, madeira',
            'vermouth': 'wine, vermouth',
            
            # 特殊处理
            'extra virgin': '',
            'virgin': '',
            'freshly': '',
            'fresh': '',
            'frozen': '',
            'dried': '',
            'canned': '',
            'tinned': '',
            'jarred': '',
            'bottled': '',
            'packaged': '',
            'whole': '',
            'half': '',
            'quarter': '',
            'sliced': '',
            'diced': '',
            'chopped': '',
            'minced': '',
            'grated': '',
            'shredded': '',
            'julienned': '',
            'cubed': '',
            'crushed': '',
            'mashed': '',
            'pureed': '',
            'ground': '',
            'crumbled': '',
            'torn': '',
            'peeled': '',
            'skinless': '',
            'boneless': '',
            'skin-on': '',
            'bone-in': '',
            'large': '',
            'medium': '',
            'small': '',
            'baby': '',
            'mini': '',
            'giant': '',
            'ripe': '',
            'unripe': '',
            'overripe': '',
            'green': '',
            'red': '',
            'yellow': '',
            'orange': '',
            'purple': '',
            'black': '',
            'white': '',
            'brown': '',
            'pink': '',
            'golden': '',
            'dark': '',
            'light': '',
            'mild': '',
            'hot': '',
            'spicy': '',
            'sweet': '',
            'sour': '',
            'bitter': '',
            'salty': '',
            'savory': '',
            'umami': '',
            'organic': '',
            'free-range': '',
            'grass-fed': '',
            'wild-caught': '',
            'farm-raised': '',
            'homemade': '',
            'store-bought': '',
            'commercial': '',
            'premium': '',
            'quality': '',
            'lean': '',
            'fatty': '',
            'fat-free': '',
            'low-fat': '',
            'full-fat': '',
            'reduced-fat': '',
            'unsalted': '',
            'salted': '',
            'sweetened': '',
            'unsweetened': '',
            'roasted': '',
            'toasted': '',
            'grilled': '',
            'broiled': '',
            'baked': '',
            'fried': '',
            'deep-fried': '',
            'pan-fried': '',
            'stir-fried': '',
            'sauteed': '',
            'sautéed': '',
            'boiled': '',
            'steamed': '',
            'poached': '',
            'braised': '',
            'stewed': '',
            'smoked': '',
            'cured': '',
            'pickled': '',
            'fermented': '',
            'marinated': '',
            'seasoned': '',
            'spiced': '',
            'flavored': '',
            'infused': '',
            'stuffed': '',
            'filled': '',
            'topped': '',
            'garnished': '',
            'mixed': '',
            'blended': '',
            'combined': '',
            'prepared': '',
            'ready-to-use': '',
            'ready-to-eat': '',
            'instant': '',
            'quick': '',
            'slow': '',
            'overnight': '',
            'day-old': ''
        }
        
        # 尝试直接替换
        if ingredient_name in ingredient_replacements:
            replacement = ingredient_replacements[ingredient_name]
            logger.info(f"直接替换: '{ingredient_name}' -> '{replacement}'")
            ingredient_name = replacement
        else:
            # 尝试部分替换
            for key, value in ingredient_replacements.items():
                if key in ingredient_name:
                    ingredient_name = ingredient_name.replace(key, value)
                    logger.info(f"部分替换: '{key}' -> '{value}' in '{original_name}'")
                    break
        
        # 确定食材的主类别和子类别
        main_category = None
        sub_category = None
        category_keywords = []
        
        # 首先确定主类别
        for category, subcategories in ingredient_categories.items():
            # 收集所有关键词以进行简单检查
            all_keywords = []
            for subcat, keywords in subcategories.items():
                all_keywords.extend(keywords)
            
            # 检查是否包含任何关键词
            for keyword in all_keywords:
                if keyword in ingredient_name:
                    main_category = category
                    category_keywords.append(keyword)
                    break
            
            if main_category:
                # 如果找到主类别，尝试确定子类别
                for subcat, keywords in subcategories.items():
                    for keyword in keywords:
                        if keyword in ingredient_name:
                            sub_category = subcat
                            if keyword not in category_keywords:
                                category_keywords.append(keyword)
                            break
                    if sub_category:
                        break
                break
        
        if main_category:
            if sub_category:
                log_func(f"确定食材类别: '{ingredient_name}' -> {main_category}/{sub_category} (关键词: {', '.join(category_keywords)})")
            else:
                log_func(f"确定食材主类别: '{ingredient_name}' -> {main_category} (关键词: {', '.join(category_keywords)})")
        else:
            log_func(f"无法确定食材类别: '{ingredient_name}'")
            
        # 将主类别存储为类别信息，以与其他代码兼容
        ingredient_category = main_category
        
        # 定义一个函数来计算匹配分数
        def calculate_match_score(desc, ingredient, category=None, subcategory=None, keywords=None):
            desc_lower = desc.lower()
            score = 0
            
            # 精确匹配得分最高
            if desc_lower == ingredient.lower():
                score += 200  # 提高精确匹配的分数
                
            # 如果食材名称是描述的子字符串，得分较高
            elif ingredient.lower() in desc_lower:
                score += 100  # 提高子字符串匹配的分数
                
                # 如果在开头或结尾，得分更高
                if desc_lower.startswith(ingredient.lower()):
                    score += 30  # 提高开头匹配的分数
                if desc_lower.endswith(ingredient.lower()):
                    score += 15  # 提高结尾匹配的分数
            
            # 如果有关键词匹配，根据匹配关键词数量增加分数
            if keywords:
                for keyword in keywords:
                    if keyword in desc_lower:
                        # 根据关键词长度增加权重，越长的关键词权重越高
                        keyword_weight = min(len(keyword), 10)  # 限制最大权重为10
                        score += 5 * keyword_weight  # 每个关键词匹配加5*权重分
            
            # 如果有类别信息，检查是否匹配类别
            if category and category in ingredient_categories:
                # 收集该类别的所有关键词
                category_keywords = []
                for subcat, kwords in ingredient_categories[category].items():
                    category_keywords.extend(kwords)
                
                # 检查是否包含类别关键词
                for keyword in category_keywords:
                    if keyword in desc_lower:
                        score += 20  # 提高类别匹配的分数
                        break
                
                # 如果有子类别信息，检查是否匹配子类别
                if subcategory and subcategory in ingredient_categories[category]:
                    subcategory_keywords = ingredient_categories[category][subcategory]
                    for keyword in subcategory_keywords:
                        if keyword in desc_lower:
                            score += 30  # 提高子类别匹配的分数
                            break
            
            # 如果是复合食材名称，检查每个单词的匹配情况
            if ' ' in ingredient:
                words = ingredient.split()
                matched_words = 0
                word_weights = {}
                
                # 给每个单词分配权重
                for word in words:
                    # 忽略过短的单词
                    if len(word) <= 2:
                        continue
                        
                    # 检查是否是核心食材关键词
                    is_core_keyword = False
                    for cat, subcats in ingredient_categories.items():
                        for subcat, keywords in subcats.items():
                            if any(keyword == word or word in keyword for keyword in keywords):
                                is_core_keyword = True
                                break
                        if is_core_keyword:
                            break
                    
                    # 根据单词长度和是否是核心关键词分配权重
                    word_weight = len(word)
                    if is_core_keyword:
                        word_weight *= 3  # 核心关键词权重乘3倍
                    word_weights[word] = word_weight
                
                # 计算匹配分数
                for word, weight in word_weights.items():
                    if word in desc_lower:
                        matched_words += 1
                        score += 5 * weight  # 每个单词匹配加5*权重分
                
                # 如果匹配了多个单词，额外加分
                if matched_words >= 2:
                    score += matched_words * 10
                    
                # 如果匹配了所有单词，额外加分
                if matched_words == len(word_weights):
                    score += 50  # 提高完全匹配的分数
            
            # 定义常见纯净食材列表（基于常见食材）
            pure_ingredients = [
                'butter', 'garlic', 'olive oil', 'onion', 'salt', 'eggs', 'water', 'sugar', 
                'potatoes', 'milk', 'flour', 'pepper', 'carrots', 'parsley', 'vegetable oil', 
                'soy sauce', 'rice', 'tomatoes', 'chicken', 'beef', 'pork', 'lamb', 'fish', 'salmon',
                'tuna', 'shrimp', 'cheese', 'cream', 'yogurt', 'lemon', 'lime', 'orange', 'apple',
                'banana', 'berries', 'strawberry', 'blueberry', 'raspberry', 'nuts', 'almonds',
                'walnuts', 'peanuts', 'beans', 'pasta', 'noodles', 'bread', 'wine', 'vinegar',
                'honey', 'maple syrup', 'chocolate', 'vanilla', 'cinnamon', 'cumin', 'basil',
                'oregano', 'thyme', 'rosemary', 'ginger', 'mushrooms', 'avocado', 'cucumber',
                'lettuce', 'spinach', 'kale', 'cabbage', 'broccoli', 'cauliflower', 'corn',
                'peas', 'bell pepper', 'chili', 'bacon', 'ham', 'sausage', 'tofu', 'quinoa'
            ]
            
            # 优先匹配纯净食材（不含复杂关键词）
            complex_indicators = ['mixed', 'with', 'and', 'in', 'or', 'plus', 'topped', 'stuffed', 'filled', 'coated', 'breaded', 'battered']
            if not any(indicator in desc_lower for indicator in complex_indicators):
                score += 25  # 显著提高纯净食材的分数
                
            # 检查是否是常见纯净食材
            for pure in pure_ingredients:
                # 如果描述以纯净食材开头，且长度不超过纯净食材的两倍，认为是纯净描述
                if desc_lower.startswith(pure) and len(desc_lower) < len(pure) * 2.5:
                    score += 100  # 纯净食材描述加高分
                    break
                # 如果描述完全匹配纯净食材
                elif desc_lower == pure:
                    score += 150  # 完全匹配纯净食材加更高分
                    break
            
            # 惩罚复杂描述（包含多个逗号的描述通常是复合食材）
            comma_count = desc_lower.count(',')
            if comma_count > 1:
                score -= comma_count * 30  # 每多一个逗号减分
                
            # 优先匹配原始食材（raw）
            if 'raw' in desc_lower:
                score += 15  # 提高原始食材的分数
                
            # 如果是油类特殊处理
            if 'oil' in ingredient.lower() and 'oil' in desc_lower:
                score += 50  # 特别处理油类食材
                
            # 如果是香料和调味料特殊处理
            if any(spice in ingredient.lower() for spice in ['pepper', 'salt', 'spice', 'herb', 'seasoning']):
                if any(spice in desc_lower for spice in ['pepper', 'salt', 'spice', 'herb', 'seasoning']):
                    score += 100  # 显著提高香料和调味料的分数
                    
                    # 直接匹配盐类
                    if 'salt' in ingredient.lower():
                        if desc_lower == 'salt, table' or desc_lower.startswith('salt,'):
                            score += 200  # 直接匹配盐类加更高分
                        # 惩罚含有cheese的盐类匹配
                        if 'cheese' in desc_lower:
                            score -= 300  # 强烈惩罚将盐匹配到奶酪
                    
                    # 直接匹配胡椒类
                    if 'pepper' in ingredient.lower() and 'black' in ingredient.lower():
                        if desc_lower == 'pepper, black' or desc_lower.startswith('pepper, black'):
                            score += 200  # 直接匹配黑胡椒加更高分
                        # 惩罚含有bell pepper或hot pepper的匹配
                        if 'bell pepper' in desc_lower or 'hot pepper' in desc_lower or 'sweet pepper' in desc_lower:
                            score -= 300  # 强烈惩罚将黑胡椒匹配到辣椒
                    
            return score
        
        # 先检查精确食材数据库中是否有匹配
        precise_ingredient_db = {
            # 调味料和香料
            'salt': 'salt, table',
            'sea salt': 'salt, table',
            'table salt': 'salt, table',
            'kosher salt': 'salt, table',
            'himalayan salt': 'salt, table',
            'fleur de sel': 'salt, table',
            'salt flakes': 'salt, table',
            'pinch of salt': 'salt, table',
            'pinch of sea salt': 'salt, table',
            'black pepper': 'pepper, black',
            'ground black pepper': 'pepper, black',
            'freshly ground black pepper': 'pepper, black',
            'cracked black pepper': 'pepper, black',
            'ground pepper': 'pepper, black',
            'pepper': 'pepper, black',  # 默认将pepper视为黑胡椒
            'white pepper': 'pepper, white',
            'ground white pepper': 'pepper, white',
            
            # 乳制品
            'butter': 'butter, nfs',
            'unsalted butter': 'butter, nfs',
            'salted butter': 'butter, regular, salted',
            'clarified butter': 'butter, nfs',
            'ghee': 'butter, nfs',
            'heavy cream': 'cream, heavy',
            'whipping cream': 'cream, heavy',
            'sour cream': 'cream, sour',
            'cream': 'cream, nfs',
            
            # 其他常见食材
            'olive oil': 'olive oil',
            'extra virgin olive oil': 'olive oil',
            'garlic': 'garlic, raw',
            'minced garlic': 'garlic, raw',
            'onion': 'onions, raw',
            'chopped onion': 'onions, raw',
            'tomato': 'tomatoes, raw',
            'chopped tomatoes': 'tomatoes, raw',
            'parsley': 'parsley, raw',
            'fresh parsley': 'parsley, raw',
            'chopped parsley': 'parsley, raw',
            'freshly chopped parsley': 'parsley, raw'
        }
        
        # 检查精确食材数据库
        for key, value in precise_ingredient_db.items():
            if ingredient_name.lower() == key.lower() or ingredient_name.lower().startswith(key.lower() + ' ') or ingredient_name.lower().endswith(' ' + key.lower()):
                # 确保这个精确匹配存在于食品描述中
                if value in self.food_descriptions:
                    log_func(f"使用精确食材数据库匹配: '{ingredient_name}' -> '{value}'")
                    return value
        
        # 尝试精确匹配
        exact_matches = [desc for desc in self.food_descriptions if desc.lower() == ingredient_name.lower()]
        if exact_matches:
            log_func(f"找到精确匹配: '{ingredient_name}' -> '{exact_matches[0]}'")
            return exact_matches[0]
        
        # 如果没有精确匹配，对所有可能的匹配进行评分
        potential_matches = []
        
        # 收集所有可能的匹配
        for desc in self.food_descriptions:
            # 计算匹配分数
            score = calculate_match_score(
                desc, 
                ingredient_name, 
                main_category, 
                sub_category, 
                category_keywords
            )
            
            # 只考虑分数超过10的匹配
            if score > 10:
                potential_matches.append((desc, score))
        
        # 按分数降序排序
        if potential_matches:
            potential_matches.sort(key=lambda x: x[1], reverse=True)
            best_match = potential_matches[0][0]
            best_score = potential_matches[0][1]
            
            # 打印前3个最佳匹配（如果有的话）
            if len(potential_matches) > 1 and verbose:
                log_func(f"前3个最佳匹配结果:")
                for i, (match, score) in enumerate(potential_matches[:3], 1):
                    log_func(f"  {i}. '{match}' (分数: {score})")
            
            log_func(f"找到最佳匹配: '{ingredient_name}' -> '{best_match}' (分数: {best_score})")
            return best_match
        
        # 如果仍然没有匹配，尝试使用其他常见食材匹配
        other_common_ingredients = {
            
            # 肉类
            'beef': 'beef, ground, raw',
            'steak': 'beef, steak, raw',
            'ground beef': 'beef, ground, raw',
            'minced beef': 'beef, ground, raw',
            'pork': 'pork, raw',
            'ham': 'ham, sliced, regular',
            'bacon': 'pork bacon, raw',
            'chicken': 'chicken, meat only, raw',
            'chicken breast': 'chicken, breast, meat only, raw',
            'turkey': 'turkey, meat only, raw',
            'lamb': 'lamb, raw',
            'duck': 'duck, meat only, raw',
            'sausage': 'sausage, pork, raw',
            
            # 海鲜类
            'fish': 'fish, nfs',
            'salmon': 'salmon, raw',
            'tuna': 'tuna, raw',
            'cod': 'cod, raw',
            'shrimp': 'shrimp, raw',
            'prawn': 'shrimp, nfs',
            'king prawn': 'shrimp, nfs',
            'crab': 'crab, raw',
            'lobster': 'lobster, raw',
            'mussel': 'mussel, raw',
            'clam': 'clam, raw',
            'oyster': 'oyster, raw',
            'scallop': 'scallop, raw',
            'squid': 'squid, raw',
            'octopus': 'octopus, raw',
            
            # 蔬菜类
            'vegetable': 'vegetables, nfs',
            'carrot': 'carrot, raw',
            'potato': 'potato, raw',
            'onion': 'onion, raw',
            'chopped onion': 'onion, raw',
            'garlic': 'garlic, raw',
            'minced garlic': 'garlic, raw',
            'tomato': 'tomato, raw',
            'chopped tomatoes': 'tomato, raw',
            'pepper': 'pepper, sweet, raw',
            'bell pepper': 'pepper, sweet, raw',
            'lettuce': 'lettuce, raw',
            'spinach': 'spinach, raw',
            'broccoli': 'broccoli, raw',
            'cauliflower': 'cauliflower, raw',
            'cabbage': 'cabbage, raw',
            'zucchini': 'zucchini, raw',
            'eggplant': 'eggplant, raw',
            'cucumber': 'cucumber, with peel, raw',
            'celery': 'celery, raw',
            'corn': 'corn, raw',
            'pea': 'peas, green, raw',
            'bean': 'beans, string, green, raw',
            'lentil': 'lentils, raw',
            
            # 水果类
            'fruit': 'fruit, nfs',
            'apple': 'apple, raw',
            'banana': 'banana, raw',
            'orange': 'orange, raw',
            'lemon': 'lemon, raw',
            'lime': 'lime, raw',
            'grape': 'grapes, raw',
            'strawberry': 'strawberries, raw',
            'blueberry': 'blueberries, raw',
            'raspberry': 'raspberries, raw',
            'blackberry': 'blackberries, raw',
            'melon': 'melon, nfs, raw',
            'watermelon': 'watermelon, raw',
            'pineapple': 'pineapple, raw',
            'mango': 'mango, raw',
            'peach': 'peach, raw',
            'pear': 'pear, raw',
            'plum': 'plum, raw',
            'cherry': 'cherries, raw',
            'kiwi': 'kiwi fruit, raw',
            
            # 乳制品类
            'milk': 'milk, nfs',
            'cheese': 'cheese, nfs',
            'feta': 'cheese, feta',
            'feta cheese': 'cheese, feta',
            'cubed feta cheese': 'cheese, feta',
            'cheddar': 'cheese, cheddar',
            'mozzarella': 'cheese, mozzarella',
            'parmesan': 'cheese, parmesan',
            'yogurt': 'yogurt, plain',
            'cream': 'cream, nfs',
            'heavy cream': 'cream, heavy',
            'whipping cream': 'cream, heavy',
            'sour cream': 'cream, sour',
            'butter': 'butter, nfs',
            'unsalted butter': 'butter, nfs',
            'salted butter': 'butter, regular, salted',
            'clarified butter': 'butter, nfs',
            'ghee': 'butter, nfs',
            
            # 谷类和面粉类
            'flour': 'flour, wheat, white, all purpose',
            'rice': 'rice, white, nfs',
            'pasta': 'pasta, nfs',
            'bread': 'bread, white',
            'oat': 'oats, raw',
            'cereal': 'cereal, nfs',
            'wheat': 'wheat, nfs',
            'barley': 'barley, raw',
            'quinoa': 'quinoa, raw',
            'noodle': 'noodles, egg, raw',
            
            # 调味料和香料
            'salt': 'salt, table',
            'pepper': 'pepper, black',
            'spice': 'spices, nfs',
            'herb': 'herbs, nfs',
            'basil': 'basil, fresh',
            'oregano': 'oregano, fresh',
            'thyme': 'thyme, fresh',
            'rosemary': 'rosemary, fresh',
            'parsley': 'parsley, fresh',
            'freshly chopped parsley': 'parsley, raw',
            'cilantro': 'cilantro, fresh',
            'coriander': 'coriander, fresh',
            'cumin': 'cumin, ground',
            'paprika': 'paprika',
            'cinnamon': 'cinnamon, ground',
            'nutmeg': 'nutmeg, ground',
            'ginger': 'ginger root, raw',
            'turmeric': 'turmeric, ground',
            
            # 油脂类
            'oil': 'oil, vegetable, nfs',
            'olive oil': 'oil, olive',
            'vegetable oil': 'oil, vegetable, nfs',
            'canola oil': 'oil, canola',
            'sunflower oil': 'oil, sunflower',
            'sesame oil': 'oil, sesame',
            'coconut oil': 'oil, coconut',
            'margarine': 'margarine, regular',
            'lard': 'lard',
            'shortening': 'shortening, vegetable',
            
            # 坐果和种子类
            'nut': 'nuts, nfs',
            'seed': 'seeds, nfs',
            'almond': 'almonds, raw',
            'walnut': 'walnuts, raw',
            'pecan': 'pecans, raw',
            'cashew': 'cashews, raw',
            'pistachio': 'pistachios, raw',
            'peanut': 'peanuts, raw',
            'sesame': 'sesame seeds, raw',
            'sunflower': 'sunflower seeds, raw',
            'pumpkin': 'pumpkin seeds, raw',
            'flax': 'flaxseeds, raw',
            'chia': 'chia seeds, raw',
            
            # 饮料类
            'water': 'water, nfs',
            'juice': 'juice, nfs',
            'soda': 'soft drink, nfs',
            'coffee': 'coffee, brewed',
            'tea': 'tea, brewed',
            'wine': 'wine, nfs',
            'white wine': 'wine, white',
            'red wine': 'wine, red',
            'beer': 'beer, nfs',
            'milk': 'milk, nfs',
            'smoothie': 'smoothie, nfs',
            
            # 糖类和甜味料
            'sugar': 'sugar, white, granulated or lump',
            'honey': 'honey',
            'syrup': 'syrup, nfs',
            'maple': 'syrup, maple',
            'molasses': 'molasses',
            'agave': 'agave syrup',
            'stevia': 'sweetener, stevia',
            'sweetener': 'sweetener, nfs'
        }
        
        # 尝试在精确食材数据库中查找匹配
        for key, value in precise_ingredient_db.items():
            if ingredient_name.lower() == key.lower() or key.lower() in ingredient_name.lower():
                log_func(f"使用精确食材数据库匹配: '{ingredient_name}' -> '{value}'")
                return value
        
        # 如果仍然没有匹配，尝试根据类别进行默认匹配
        if main_category:
            default_matches = {
                'meat': {
                    'beef': 'beef, ground, raw',
                    'pork': 'pork, raw',
                    'lamb': 'lamb, raw',
                    'poultry': 'chicken, meat only, raw',
                    'game': 'venison, raw',
                    'processed': 'sausage, pork, raw',
                    'default': 'meat, nfs'
                },
                'seafood': {
                    'fish': 'fish, nfs',
                    'shellfish': 'shrimp, nfs',
                    'mollusks': 'mussel, raw',
                    'processed': 'fish, processed, nfs',
                    'default': 'seafood, nfs'
                },
                'vegetables': {
                    'root': 'potato, raw',
                    'bulb': 'onion, raw',
                    'leafy_greens': 'spinach, raw',
                    'cruciferous': 'broccoli, raw',
                    'nightshade': 'tomato, raw',
                    'squash': 'zucchini, raw',
                    'legume': 'beans, string, green, raw',
                    'other': 'vegetables, nfs',
                    'default': 'vegetables, nfs'
                },
                'fruits': {
                    'berry': 'strawberries, raw',
                    'citrus': 'orange, raw',
                    'tropical': 'banana, raw',
                    'stone': 'peach, raw',
                    'pome': 'apple, raw',
                    'melon': 'watermelon, raw',
                    'dried': 'raisins',
                    'default': 'fruit, nfs'
                },
                'dairy': {
                    'milk': 'milk, nfs',
                    'cheese': 'cheese, nfs',
                    'cream': 'cream, nfs',
                    'yogurt': 'yogurt, plain',
                    'butter': 'butter, regular, salted',
                    'default': 'dairy, nfs'
                },
                'grains': {
                    'rice': 'rice, white, nfs',
                    'wheat': 'flour, wheat, white, all purpose',
                    'corn': 'corn, raw',
                    'oats': 'oats, raw',
                    'other_grains': 'grains, nfs',
                    'pasta': 'pasta, nfs',
                    'bread': 'bread, white',
                    'default': 'grains, nfs'
                },
                'seasonings': {
                    'herbs': 'herbs, nfs',
                    'spices': 'spices, nfs',
                    'salt': 'salt, table',
                    'condiments': 'condiments, nfs',
                    'default': 'seasonings, nfs'
                },
                'oils': {
                    'vegetable_oils': 'oil, vegetable, nfs',
                    'animal_fats': 'butter, regular, salted',
                    'other_fats': 'shortening, vegetable',
                    'default': 'oil, nfs'
                },
                'nuts_seeds': {
                    'nuts': 'nuts, nfs',
                    'seeds': 'seeds, nfs',
                    'nut_products': 'peanut butter',
                    'default': 'nuts, nfs'
                },
                'beverages': {
                    'alcoholic': 'wine, nfs',
                    'non_alcoholic': 'water, nfs',
                    'default': 'beverages, nfs'
                },
                'sweeteners': {
                    'sugars': 'sugar, white, granulated or lump',
                    'syrups': 'syrup, nfs',
                    'artificial': 'sweetener, nfs',
                    'default': 'sugar, nfs'
                }
            }
            
            # 如果有子类别信息，使用子类别默认匹配
            if main_category in default_matches:
                if sub_category and sub_category in default_matches[main_category]:
                    default_match = default_matches[main_category][sub_category]
                    log_func(f"使用子类别默认匹配: '{ingredient_name}' -> '{default_match}' ({main_category}/{sub_category})")
                    return default_match
                # 如果没有子类别信息或子类别不存在，使用主类别默认匹配
                else:
                    default_match = default_matches[main_category]['default']
                    log_func(f"使用主类别默认匹配: '{ingredient_name}' -> '{default_match}' ({main_category})")
                    return default_match
        
        # 没有找到匹配项
        if verbose:
            logger.warning(f"未找到食材匹配: '{original_name}'")
        else:
            logger.debug(f"未找到食材匹配: '{original_name}'")
        return None

    def find_portion_weight(self, food_description, portion_description):
        """
        Find the weight in grams for a given food and portion.
        
        Args:
            food_description (str): The food description
            portion_description (str): The portion description (e.g., "1 cup")
            
        Returns:
            float: Weight in grams
        """
        # Filter for the specific food
        food_portions = self.portions_weights_df[
            self.portions_weights_df['Main food description'].str.lower() == food_description.lower()
        ]
        
        if food_portions.empty:
            return None
        
        # Try to find the exact portion match
        for unit in self.unit_conversion.values():
            if unit in portion_description.lower():
                matches = food_portions[
                    food_portions['Portion description'].str.lower().str.contains(unit, na=False)
                ]
                if not matches.empty:
                    # Return the first matching portion weight
                    return matches.iloc[0]['Portion weight\n(g)']
        
        # If no specific match found, try to use a default portion
        # First try "1 cup" as it's common
        cup_match = food_portions[
            food_portions['Portion description'].str.lower().str.contains('cup', na=False)
        ]
        if not cup_match.empty:
            return cup_match.iloc[0]['Portion weight\n(g)']
        
        # Then try a medium-sized portion or any available portion
        medium_match = food_portions[
            food_portions['Portion description'].str.lower().str.contains('medium', na=False)
        ]
        if not medium_match.empty:
            return medium_match.iloc[0]['Portion weight\n(g)']
        
        # Just return the first available portion if nothing else matches
        return food_portions.iloc[0]['Portion weight\n(g)']

    def convert_to_grams(self, amount, unit, food_description):
        """
        将给定的数量和单位转换为克。
        
        参数:
            amount (float): 原始单位的数量
            unit (str): 计量单位
            food_description (str): 食品描述，用于查找特定密度
            
        返回:
            float: 克数
        """
        # 常见计量单位到克的转换
        unit_to_gram = {
            # 重量单位
            'g': 1.0,
            'kg': 1000.0,
            'oz': 28.35,  # 1盎司 = 28.35克
            'lb': 453.59, # 1磅 = 453.59克
            
            # 体积单位 (假设密度为1g/ml)
            'ml': 1.0,
            'l': 1000.0,
            'cup': 240.0,  # 1杯 = 240毫升
            'tbsp': 15.0,  # 1汤匙 = 15毫升
            'tsp': 5.0,    # 1茶匙 = 5毫升
            'fl_oz': 30.0, # 1液体盎司 = 30毫升
            'pint': 473.0, # 1員脑 = 473毫升
            'quart': 946.0, # 1夸脑 = 946毫升
            'gallon': 3785.0, # 1加仑 = 3785毫升
            
            # 其他常见计量
            'pinch': 0.5,  # 一捏约为0.5克
            'dash': 0.5,   # 一点约为0.5克
            'clove': 5.0,  # 一瓣大蒜约为5克
            'bunch': 100.0, # 一束约为100克
            'handful': 30.0, # 一把约为30克
            'sprig': 5.0,  # 一小枝约为5克
            'slice': 30.0, # 一片约为30克
            'piece': 50.0, # 一块约为50克
            'whole': 150.0, # 一整个约为150克
            'tin': 400.0,  # 一罐约为400克
            'can': 400.0,  # 一罐约为400克
            'pack': 200.0, # 一包约为200克
        }
        
        # 根据食品类型的密度调整
        food_density_adjustments = {
            # 液体食品
            'milk': 1.03,  # 牛奶密度约为1.03g/ml
            'cream': 1.0,  # 奶油密度约为1g/ml
            'oil': 0.92,   # 油密度约为0.92g/ml
            'wine': 1.0,   # 葡萄酒密度约为1g/ml
            'juice': 1.05,  # 果汁密度约为1.05g/ml
            'water': 1.0,   # 水密度为1g/ml
            'soup': 1.05,   # 汤密度约为1.05g/ml
            
            # 固体食品
            'flour': 0.55,  # 面粉密度约为0.55g/ml
            'sugar': 0.85,  # 糖密度约为0.85g/ml
            'rice': 0.75,   # 米密度约为0.75g/ml
            'salt': 1.2,    # 盐密度约为1.2g/ml
        }
        
        # 规范化单位
        unit = unit.lower()
        
        # 首先检查我们是否有直接的单位转换
        if unit in unit_to_gram:
            # 应用密度调整（如果适用）
            density_factor = 1.0
            food_description_lower = food_description.lower()
            
            # 检查食品描述是否包含需要密度调整的关键词
            for food_type, density in food_density_adjustments.items():
                if food_type in food_description_lower:
                    density_factor = density
                    break
            
            # 如果是体积单位，应用密度调整
            volume_units = ['ml', 'l', 'cup', 'tbsp', 'tsp', 'fl_oz', 'pint', 'quart', 'gallon']
            if unit in volume_units:
                return amount * unit_to_gram[unit] * density_factor
            else:
                return amount * unit_to_gram[unit]
        
        # 如果单位在我们的映射中不存在，尝试使用FNDDS数据库
        if unit in self.unit_conversion:
            normalized_unit = self.unit_conversion[unit]
        else:
            normalized_unit = unit
        
        # 创建组合分量描述
        portion_desc = f"1 {normalized_unit}"
        
        # 从数据库中查找1单位的重量
        unit_weight = self.find_portion_weight(food_description, portion_desc)
        
        if unit_weight is not None:
            return amount * unit_weight
        
        # 如果我们无法确定转换，使用默认值
        logger.warning(f"警告: 无法将 {amount} {unit} 的 {food_description} 转换为克。使用 100g 作为默认值。")
        return 100.0

    def get_nutrient_values(self, food_description, weight_in_grams):
        """
        Get all nutrient values for a given food, adjusted for weight.
        
        Args:
            food_description (str): The food description to look up
            weight_in_grams (float): The weight in grams
            
        Returns:
            dict: Dictionary of nutrient values
        """
        # Find the food in the nutrient values dataframe
        food_match = self.nutrient_values_df[
            self.nutrient_values_df['Main food description'].str.lower() == food_description.lower()
        ]
        
        if food_match.empty:
            print(f"Warning: No nutrient data found for {food_description}")
            return {}
        
        # Get the row with the nutrient values
        nutrient_row = food_match.iloc[0]
        
        # Create a dictionary with all nutrients and their values
        nutrient_dict = {}
        for col in self.nutrient_values_df.columns[4:]:
            # Get the value and adjust it for the actual weight used in the recipe
            raw_value = nutrient_row[col]
            # The values in the database are per 100g, so adjust accordingly
            adjusted_value = (raw_value / 100) * weight_in_grams
            
            # Use the clean column name (without newlines)
            clean_col = self.clean_columns[col]
            nutrient_dict[clean_col] = adjusted_value
        
        return nutrient_dict

    def preprocess_ingredient_name(self, ingredient_name, ingredient_categories):
        """
        预处理食材名称，简化复杂食材描述
        
        参数:
            ingredient_name (str): 原始食材名称
            ingredient_categories (dict): 食材分类字典
            
        返回:
            tuple: (简化后的食材名称, 核心食材列表)
        """
        # 如果已经是简单名称，直接返回
        if len(ingredient_name.split()) <= 2:
            return ingredient_name, [ingredient_name]
        
        # 要移除的常见修饰词和计量单位
        modifiers_to_remove = [
            # 数量和计量单位
            r'\d+', r'\(\d+[a-z]*\)', r'\d+[a-z]+', r'cup', r'cups', r'tablespoon', r'tablespoons', 
            r'teaspoon', r'teaspoons', r'tbsp', r'tsp', r'oz', r'ounce', r'ounces', r'pound', r'pounds', 
            r'gram', r'grams', r'g', r'kg', r'ml', r'liter', r'liters', r'l', r'pinch', r'dash',
            # 容器和包装
            r'tin', r'can', r'jar', r'packet', r'pack', r'package', r'container', r'box', r'bottle',
            # 状态修饰词
            r'fresh', r'frozen', r'canned', r'dried', r'dry', r'raw', r'cooked', r'boiled', r'steamed',
            r'roasted', r'baked', r'fried', r'grilled', r'smoked', r'cured', r'pickled', r'preserved',
            # 大小和形状
            r'large', r'medium', r'small', r'tiny', r'big', r'huge', r'whole', r'half', r'quarter',
            r'sliced', r'diced', r'chopped', r'minced', r'grated', r'shredded', r'ground', r'mashed',
            r'cubed', r'julienned', r'crushed', r'crumbled', r'torn', r'broken', r'split', r'halved',
            # 其他修饰词
            r'optional', r'to taste', r'as needed', r'approximately', r'about', r'roughly', r'or so',
            r'extra', r'virgin', r'pure', r'natural', r'organic', r'free-range', r'grass-fed', r'wild',
            r'farm-raised', r'homemade', r'store-bought', r'commercial', r'premium', r'quality',
            r'skinless', r'boneless', r'skin-on', r'bone-in', r'lean', r'fatty', r'fat-free', r'low-fat',
            r'full-fat', r'reduced-fat', r'unsalted', r'salted', r'sweetened', r'unsweetened',
            r'finely', r'coarsely', r'thinly', r'thickly', r'freshly', r'lightly', r'heavily'
        ]
        
        # 常见的连接词和介词
        connectors = [r',', r'and', r'or', r'with', r'without', r'plus', r'of', r'for', r'from', r'in', r'on', r'as']
        
        # 复制原始名称以便处理
        processed_name = ingredient_name
        
        # 移除括号内的内容，如 "1 (400g) tin"
        processed_name = re.sub(r'\([^)]*\)', '', processed_name)
        
        # 将逗号替换为空格，以便处理
        processed_name = processed_name.replace(',', ' ')
        
        # 分词并过滤掉修饰词和连接词
        words = processed_name.split()
        filtered_words = []
        for word in words:
            # 检查是否是要移除的修饰词
            should_remove = False
            for modifier in modifiers_to_remove + connectors:
                if re.fullmatch(modifier, word):
                    should_remove = True
                    break
            if not should_remove:
                filtered_words.append(word)
        
        # 如果没有剩余单词，返回原始名称
        if not filtered_words:
            return ingredient_name, [ingredient_name]
        
        # 使用食材分类字典来识别核心食材
        core_ingredients = []
        for word in filtered_words:
            # 检查是否是核心食材
            for category, subcategories in ingredient_categories.items():
                for subcat, keywords in subcategories.items():
                    if any(keyword == word or keyword in word for keyword in keywords):
                        core_ingredients.append(word)
                        break
                if word in core_ingredients:
                    break
        
        # 特殊食材处理
        # 如果是盐，直接返回“salt”
        if 'salt' in ingredient_name.lower():
            return 'salt', ['salt']
        
        # 如果是黑胡椒，直接返回“pepper”
        if 'pepper' in ingredient_name.lower() and ('black' in ingredient_name.lower() or 'ground' in ingredient_name.lower()):
            return 'pepper', ['pepper']
        
        # 如果是黄油，直接返回“butter”
        if 'butter' in ingredient_name.lower():
            return 'butter', ['butter']
        
        # 如果没有识别到核心食材，使用所有过滤后的单词
        if not core_ingredients:
            core_ingredients = filtered_words
        
        # 组合核心食材为简化名称
        simplified_name = ' '.join(core_ingredients)
        
        return simplified_name, core_ingredients

    def parse_measurement(self, measurement_str):
        """
        解析食材的计量单位和数量
        
        参数:
            measurement_str (str): 计量字符串，如"500g", "1 (400g) tin", "pinch"
            
        返回:
            tuple: (数量, 单位)
        """
        if not measurement_str or not isinstance(measurement_str, str) or measurement_str.strip() == '':
            return 1.0, 'piece'  # 如果没有计量，默认为1件
        
        # 清理字符串
        original_str = measurement_str
        measurement_str = measurement_str.strip().lower()
        
        # 常见计量单位映射到标准单位
        unit_conversions = {
            # 重量单位
            'g': 'g',
            'gram': 'g',
            'grams': 'g',
            'kg': 'kg',
            'kilogram': 'kg',
            'kilograms': 'kg',
            'oz': 'oz',
            'ounce': 'oz',
            'ounces': 'oz',
            'lb': 'lb',
            'pound': 'lb',
            'pounds': 'lb',
            
            # 体积单位
            'ml': 'ml',
            'milliliter': 'ml',
            'milliliters': 'ml',
            'millilitre': 'ml',
            'millilitres': 'ml',
            'l': 'l',
            'liter': 'l',
            'liters': 'l',
            'litre': 'l',
            'litres': 'l',
            'cup': 'cup',
            'cups': 'cup',
            'tbsp': 'tbsp',
            'tablespoon': 'tbsp',
            'tablespoons': 'tbsp',
            'tsp': 'tsp',
            'teaspoon': 'tsp',
            'teaspoons': 'tsp',
            'fl oz': 'fl_oz',
            'fluid ounce': 'fl_oz',
            'fluid ounces': 'fl_oz',
            'pint': 'pint',
            'pints': 'pint',
            'quart': 'quart',
            'quarts': 'quart',
            'gallon': 'gallon',
            'gallons': 'gallon',
            
            # 其他常见计量
            'pinch': 'pinch',
            'pinches': 'pinch',
            'dash': 'dash',
            'dashes': 'dash',
            'tin': 'tin',
            'tins': 'tin',
            'can': 'can',
            'cans': 'can',
            'pack': 'pack',
            'packs': 'pack',
            'package': 'pack',
            'packages': 'pack',
            'bunch': 'bunch',
            'bunches': 'bunch',
            'clove': 'clove',
            'cloves': 'clove',
            'slice': 'slice',
            'slices': 'slice',
            'piece': 'piece',
            'pieces': 'piece',
            'whole': 'whole',
            'wholes': 'whole',
            'sprig': 'sprig',
            'sprigs': 'sprig',
            'handful': 'handful',
            'handfuls': 'handful',
            
            # 特殊表达方式
            'to taste': 'to_taste',
            'to serve': 'to_serve',
            'as needed': 'as_needed',
            'as required': 'as_needed',
            'optional': 'optional',
            'zest of 1': 'zest',
            'zest of one': 'zest',
            'juice of 1': 'juice',
            'juice of one': 'juice',
            'chopped': 'chopped',
            'minced': 'minced',
            'crushed': 'crushed',
            'beaten': 'beaten',
            'to cover': 'to_cover',
            'for garnish': 'garnish',
            'for decoration': 'garnish',
            'for serving': 'to_serve',
            'a few': 'few',
            'a little': 'little',
            'a handful': 'handful',
            'a pinch': 'pinch',
            'a dash': 'dash',
            'one': 'one',
            'two': 'two',
            'three': 'three',
            'four': 'four',
            'five': 'five',
            'ear': 'ear',
            'stalk': 'stalk',
            'stalks': 'stalk',
            'leaf': 'leaf',
            'leaves': 'leaf',
            'pod': 'pod',
            'pods': 'pod',
            'knob': 'knob',
        }
        
        # 常见计量单位的近似重量
        unit_weights = {
            'pinch': 0.5,  # 一捏约为0.5克
            'dash': 0.5,   # 一点约为0.5克
            'tsp': 5.0,    # 一茶匙约为5克
            'tbsp': 15.0,  # 一汤匙约为15克
            'cup': 240.0,  # 一杯约为240毫升
            'fl_oz': 30.0, # 一液体盎司约为30毫升
            'pint': 473.0, # 一員脑约为473毫升
            'quart': 946.0, # 一夸脑约为946毫升
            'gallon': 3785.0, # 一加仑约为3785毫升
            'clove': 5.0,  # 一瓣大蒜约为5克
            'bunch': 100.0, # 一束约为100克
            'handful': 30.0, # 一把约为30克
            'sprig': 5.0,  # 一小枝约为5克
            'slice': 30.0, # 一片约为30克
            'piece': 50.0, # 一块约为50克
            'whole': 150.0, # 一整个约为150克
            
            # 特殊表达方式的默认值
            'to_taste': 2.0,  # “按照口味”默认为2克
            'to_serve': 5.0,  # “供应”默认为5克
            'as_needed': 10.0, # “根据需要”默认为10克
            'optional': 5.0,  # “可选”默认为5克
            'zest': 5.0,      # “皮屑”默认为5克
            'juice': 30.0,    # “果汁”默认为30克
            'chopped': 30.0,  # “切碎的”默认为30克
            'minced': 15.0,   # “切碎的”默认为15克
            'crushed': 10.0,  # “压碎的”默认为10克
            'beaten': 50.0,   # “打发的”默认为50克
            'to_cover': 100.0, # “覆盖”默认为100克
            'garnish': 5.0,   # “装饰”默认为5克
            'few': 10.0,      # “几个”默认为10克
            'little': 5.0,    # “一点”默认为5克
            'one': 1.0,       # “一个”默认为1个
            'two': 2.0,       # “两个”默认为2个
            'three': 3.0,     # “三个”默认为3个
            'four': 4.0,      # “四个”默认为4个
            'five': 5.0,      # “五个”默认为5个
            'ear': 200.0,     # “一穴”默认为200克
            'stalk': 50.0,    # “一根”默认为50克
            'leaf': 5.0,      # “一叶”默认为5克
            'pod': 10.0,      # “一豆荷”默认为10克
            'knob': 30.0,     # “一块”默认为30克
        }
        
        # 处理复合计量单位，如 "1 (400g) tin"
        # 尝试提取括号中的重量
        weight_in_brackets = re.search(r'\((\d+)\s*([a-z]+)\)', measurement_str)
        if weight_in_brackets:
            amount = float(weight_in_brackets.group(1))
            unit = weight_in_brackets.group(2)
            
            # 检查单位是否有效
            if unit in unit_conversions:
                unit = unit_conversions[unit]
                return amount, unit
        
        # 处理直接连接的数字和单位，如 "500g", "250ml"
        direct_unit_match = re.match(r'^(\d+)\s*([a-z]+)$', measurement_str)
        if direct_unit_match:
            amount = float(direct_unit_match.group(1))
            unit = direct_unit_match.group(2)
            
            # 检查单位是否有效
            if unit in unit_conversions:
                unit = unit_conversions[unit]
                return amount, unit
        
        # 处理有空格的数字和单位，如 "2 cups" 或 "2 1/2 cups"
        spaced_unit_match = re.match(r'^([\d\s.\/]+)\s+(.+)$', measurement_str)
        if spaced_unit_match:
            amount_str = spaced_unit_match.group(1).strip()
            unit = spaced_unit_match.group(2).strip()
            
            # 处理分数，如 "1/2"
            if '/' in amount_str:
                if ' ' in amount_str:  # 混合数字，如 "2 1/2"
                    whole, fraction = amount_str.split(' ', 1)
                    num, denom = fraction.split('/')
                    amount = float(whole) + float(num) / float(denom)
                else:  # 简单分数，如 "1/2"
                    num, denom = amount_str.split('/')
                    amount = float(num) / float(denom)
            else:
                amount = float(amount_str)
            
            # 检查单位是否有效
            if unit in unit_conversions:
                unit = unit_conversions[unit]
                return amount, unit
        
        # 处理特殊情况，如"pinch"或"dash"或描述性短语
        if measurement_str in unit_conversions:
            return 1.0, unit_conversions[measurement_str]
        
        # 检查是否包含特殊表达方式
        for special_phrase, standard_unit in unit_conversions.items():
            if ' ' in special_phrase and special_phrase in measurement_str:
                return 1.0, standard_unit
        
        # 处理数字开头的特殊表达方式，如"2 to taste"
        number_with_special_phrase = re.match(r'^(\d+)\s+(.+)$', measurement_str)
        if number_with_special_phrase:
            amount = float(number_with_special_phrase.group(1))
            phrase = number_with_special_phrase.group(2)
            
            if phrase in unit_conversions:
                return amount, unit_conversions[phrase]
            
            # 检查是否包含特殊表达方式
            for special_phrase, standard_unit in unit_conversions.items():
                if ' ' in special_phrase and special_phrase in phrase:
                    return amount, standard_unit
        
        # 处理常见的描述性短语
        descriptive_phrases = {
            'to taste': 'to_taste',
            'to serve': 'to_serve',
            'as needed': 'as_needed',
            'as required': 'as_needed',
            'optional': 'optional',
            'for garnish': 'garnish',
            'for decoration': 'garnish',
            'for serving': 'to_serve',
            'adjust to taste': 'to_taste',
            'zest of 1': 'zest',
            'zest of one': 'zest',
            'juice of 1': 'juice',
            'juice of one': 'juice',
            'juice of 1/2': 'juice',
            'juice of half': 'juice',
            'zest and juice of 1': 'zest_and_juice',
            'tied in a knot': 'piece',
            'one sheet': 'sheet',
            'one ear': 'ear',
            '适量': 'as_needed',  # 适量 (中文“适量”)
            '少许': 'little',     # 少许 (中文“少许”)
            '少量': 'little',     # 少量 (中文“少量”)
        }
        
        # 大小写不敏感地检查描述性短语
        lower_measurement = measurement_str.lower()
        for phrase, unit in descriptive_phrases.items():
            if phrase.lower() in lower_measurement:
                return 1.0, unit
        
        # 处理数量词
        quantity_words = {
            'one': 1.0,
            'two': 2.0,
            'three': 3.0,
            'four': 4.0,
            'five': 5.0,
            'a few': 3.0,
            'few': 3.0,
            'a couple': 2.0,
            'couple': 2.0,
            'several': 4.0,
        }
        
        for word, amount in quantity_words.items():
            if measurement_str.startswith(word):
                # 提取单位（如果有）
                unit_part = measurement_str[len(word):].strip()
                if unit_part:
                    for unit_name, standard_unit in unit_conversions.items():
                        if unit_part.startswith(unit_name):
                            return amount, standard_unit
                return amount, 'piece'  # 默认单位
        
        # 如果只有数字，假设为克
        if measurement_str.isdigit():
            return float(measurement_str), 'g'
        
        # 如果无法解析，默认为1件，但记录原始计量单位以便分析
        logger.warning(f"警告: 无法解析计量单位: {original_str}. 使用默认值 1 piece.")
        return 1.0, 'piece'

    def extract_ingredients_from_recipe(self, recipe_json, verbose=True):
        """
        从食谱JSON中提取食材列表。
        
        参数:
            recipe_json (dict): 食谱JSON数据
            verbose (bool): 是否打印详细信息
            
        返回:
            list: 食材列表，可能是元组列表(ingredient, measure)或字典列表
        """
        # 从食谱中提取食材
        try:
            # 提取食谱数据
            if isinstance(recipe_json, dict):
                if 'meals' in recipe_json and isinstance(recipe_json['meals'], list) and recipe_json['meals']:
                    recipe = recipe_json['meals'][0]  # 使用第一个食谱
                else:
                    recipe = recipe_json
            else:
                logger.error("无效的食谱数据格式")
                return []
                
            # 初始化食材列表
            ingredients = []
            
            # 判断食谱数据结构并提取食材
            if 'ingredients' in recipe and isinstance(recipe['ingredients'], list):
                # 自定义食材列表格式
                ingredients = recipe['ingredients']
                logger.info(f"从自定义格式提取到 {len(ingredients)} 种食材")
            else:
                # TheMealDB 格式的食谱
                logger.info("从TheMealDB格式提取食材")
                
                # 提取食材及计量单位
                extracted_ingredients = []
                for i in range(1, 21):  # TheMealDB格式最多攔20种食材
                    ingredient_key = f'strIngredient{i}'
                    measure_key = f'strMeasure{i}'
                    
                    # 检查密钥是否存在且值不为空
                    if ingredient_key in recipe and recipe[ingredient_key]:
                        ingredient_name = recipe[ingredient_key]
                        if isinstance(ingredient_name, str) and ingredient_name.strip() and ingredient_name.lower() != 'null':
                            ingredient_name = ingredient_name.strip()
                            # 获取计量信息
                            measure = recipe.get(measure_key, '')
                            measure_str = str(measure).strip() if measure else ''
                            
                            # 添加到食材列表
                            extracted_ingredients.append((ingredient_name, measure_str))
                
                # 将提取的食材分配给ingredients列表
                ingredients = extracted_ingredients
                logger.info(f"从TheMealDB格式提取到 {len(ingredients)} 种食材")
            
            # 打印提取的食材信息
            if verbose and ingredients:
                logger.info("\n提取的食材列表:")
                for i, ing in enumerate(ingredients, 1):
                    if isinstance(ing, tuple) and len(ing) >= 2:
                        logger.info(f"  {i}. {ing[0]} - {ing[1]}")
                    elif isinstance(ing, dict) and 'name' in ing and 'measure' in ing:
                        logger.info(f"  {i}. {ing['name']} - {ing['measure']}")
                    elif isinstance(ing, str):
                        logger.info(f"  {i}. {ing}")
            
            # 如果没有找到食材，返回空结果
            if not ingredients:
                logger.warning("没有找到有效食材")
                return []
                
            return ingredients
                
        except (KeyError, IndexError, AttributeError) as e:
            logger.error(f"从食谱中提取食材时出错: {e}")
            return []
    def calculate_recipe_nutrition(self, recipe_json, verbose=True):
        """
        计算食谱的营养成分。
        
        参数:
            recipe_json (dict): 包含食材和计量的食谱JSON
            verbose (bool): 是否打印匹配统计信息
            
        返回:
            dict: 包含完整营养信息、每100g营养信息和匹配统计的字典
        """
        # 初始化匹配统计
        self.matching_stats = {
            'total_ingredients': 0,
            'matched_ingredients': 0,
            'unmatched_ingredients': 0,
            'matches': [],
            'non_matches': []
        }
        
        # 提取食材列表
        ingredients_list = self.extract_ingredients_from_recipe(recipe_json, verbose)
        
        if not ingredients_list:
            return None
            
        # 初始化营养成分字典和总重量
        nutrition = {}
        total_weight_grams = 0
        matched_count = 0
        total_ingredients = len(ingredients_list)
        
        # 验证输入
        if not isinstance(recipe_json, dict):
            if isinstance(recipe_json, str):
                try:
                    recipe_json = json.loads(recipe_json)
                except json.JSONDecodeError:
                    logger.error("错误: 提供的JSON字符串无效")
                    return {'nutrition': {}, 'stats': self.matching_stats}
            else:
                logger.error("错误: recipe_json必须是字典或有效的JSON字符串")
                return {'nutrition': {}, 'stats': self.matching_stats}
        
        # 提取食谱信息
        recipe_name = recipe_json.get('strMeal', 'Unknown Recipe')
        recipe_category = recipe_json.get('strCategory', 'Unknown')
        recipe_area = recipe_json.get('strArea', 'Unknown')
        
        if verbose:
            print(f"\n计算营养成分: {recipe_name}")
            print(f"菜系: {recipe_area}")
            print(f"类别: {recipe_category}\n")
        
        # 提取食材列表
        ingredients = self.extract_ingredients_from_recipe(recipe_json, verbose)
        if not ingredients:
            return {'nutrition': {}, 'nutrition_per_100g': {}, 'stats': self.matching_stats, 'total_weight_grams': 0}
        
        # 计算食材数量
        self.matching_stats['total_ingredients'] = len(ingredients)
        
        # 处理每个食材
        for ingredient in ingredients:
            if not ingredient or not isinstance(ingredient, (str, tuple, dict)) or (isinstance(ingredient, str) and not ingredient.strip()):
                continue
            
            # 提取食材名称和计量
            ingredient_name = ''
            measurement = ''
            
            if isinstance(ingredient, tuple) and len(ingredient) >= 2:
                ingredient_name, measurement = ingredient
            elif isinstance(ingredient, dict) and 'name' in ingredient and 'measure' in ingredient:
                ingredient_name = ingredient['name']
                measurement = ingredient['measure']
            elif isinstance(ingredient, str):
                ingredient_name = ingredient
            
            # 预处理食材名称
            # 使用默认的食材分类字典
            if hasattr(self, 'ingredient_categories'):
                ingredient_name, _ = self.preprocess_ingredient_name(ingredient_name, self.ingredient_categories)
            else:
                # 如果没有食材分类字典，简单清理食材名称
                ingredient_name = ingredient_name.strip().lower()
            
            # 如果食材名称为空，跳过
            if not ingredient_name:
                continue
            
            # 解析计量单位
            amount, unit = self.parse_measurement(measurement)
            
            # 查找最接近的食物匹配
            food_match = self.find_closest_food_match(ingredient_name, verbose=verbose)
            
            if not food_match:
                # 没有找到匹配
                if verbose:
                    print(f"未找到匹配: {ingredient_name}")
                continue
            
            # 找到匹配
            matched_count += 1
            
            # 转换为克
            weight_in_grams = self.convert_to_grams(amount, unit, food_match)
            
            # 累加总重量
            total_weight_grams += weight_in_grams
            
            # 获取营养成分
            nutrient_values = self.get_nutrient_values(food_match, weight_in_grams)
            
            # 累加营养成分
            for nutrient, value in nutrient_values.items():
                if nutrient in nutrition:
                    nutrition[nutrient] += value
                else:
                    nutrition[nutrient] = value
                    
            if verbose:
                print(f"匹配成功: '{ingredient_name}' → '{food_match}'")
            
        
        # 计算每100g的营养成分
        nutrition_per_100g = {}
        if total_weight_grams > 0:
            for nutrient, value in nutrition.items():
                nutrition_per_100g[nutrient] = (value / total_weight_grams) * 100
        
        # 估算份数 - 根据总重量估算
        # 合理范围内的份数，最少2份，最多8份
        # 小份食物或小量食谱给予较少份数，大份食物给予较多份数
        if total_weight_grams < 300:
            servings = 2
        elif total_weight_grams < 600:
            servings = 3
        elif total_weight_grams < 900:
            servings = 4
        elif total_weight_grams < 1200:
            servings = 5
        elif total_weight_grams < 1500:
            servings = 6
        else:
            servings = 8  # 最大份数限制为8
        
        # 计算每份的营养成分
        nutrition_per_serving = {}
        if servings > 0:
            for nutrient, value in nutrition.items():
                nutrition_per_serving[nutrient] = value / servings
        
        # 计算匹配率
        match_rate = (matched_count / total_ingredients) * 100 if total_ingredients > 0 else 0
        
        # 打印匹配统计
        if verbose:
            print(f"\n匹配统计:\n  总食材数: {total_ingredients}\n  成功匹配: {matched_count}\n  匹配率: {match_rate:.1f}%")
            print(f"\n总重量: {total_weight_grams:.1f}g")
            print(f"估计份数: {servings}")
        
        # 返回结果
        return {
            'nutrition': nutrition,
            'nutrition_per_100g': nutrition_per_100g,
            'nutrition_per_serving': nutrition_per_serving,
            'total_weight_grams': total_weight_grams,
            'match_rate': match_rate if total_ingredients > 0 else 0,
            'matched_count': matched_count,
            'total_ingredients': total_ingredients,
            'servings': servings
        }
    def print_nutrition_facts(self, result_dict):
        """
        打印营养成分信息。
        
        Args:
            result_dict (dict): Dictionary with nutritional information and total weight
        """
        # 检查是否有营养信息
        if not result_dict:
            print("No nutritional information available.")
            return
        
        # 获取营养成分字典
        if 'nutrition' in result_dict:
            nutrition_dict = result_dict['nutrition']
        else:
            nutrition_dict = result_dict  # 兼容直接传入营养字典的情况
        
        print(f"Energy (kcal): {nutrition_dict.get('Energy (kcal)', 0):.1f}")
        print(f"Total Fat (g): {nutrition_dict.get('Total Fat (g)', 0):.1f}")
        print(f"  Saturated Fat (g): {nutrition_dict.get('Fatty acids, total saturated (g)', 0):.1f}")
        print(f"  Trans Fat (g): {nutrition_dict.get('Fatty acids, total trans (g)', 0):.1f}")
        print(f"Cholesterol (mg): {nutrition_dict.get('Cholesterol (mg)', 0):.1f}")
        print(f"Sodium (mg): {nutrition_dict.get('Sodium (mg)', 0):.1f}")
        print(f"Total Carbohydrate (g): {nutrition_dict.get('Carbohydrate (g)', 0):.1f}")
        print(f"  Dietary Fiber (g): {nutrition_dict.get('Fiber, total dietary (g)', 0):.1f}")
        print(f"  Sugars (g): {nutrition_dict.get('Sugars, total (g)', 0):.1f}")
        print(f"Protein (g): {nutrition_dict.get('Protein (g)', 0):.1f}")
        print(f"Vitamin D (mcg): {nutrition_dict.get('Vitamin D (D2 + D3) (mcg)', 0):.1f}")
        print(f"Calcium (mg): {nutrition_dict.get('Calcium (mg)', 0):.1f}")
        print(f"Iron (mg): {nutrition_dict.get('Iron (mg)', 0):.1f}")
        print(f"Potassium (mg): {nutrition_dict.get('Potassium (mg)', 0):.1f}")
        print(f"Vitamin K (mcg): {nutrition_dict.get('Vitamin K (mcg)', 0):.1f}")
        print(f"Thiamin (mg): {nutrition_dict.get('Thiamin (mg)', 0):.1f}")
        print(f"Riboflavin (mg): {nutrition_dict.get('Riboflavin (mg)', 0):.1f}")
        print(f"Niacin (mg): {nutrition_dict.get('Niacin (mg)', 0):.1f}")
        print(f"Vitamin B6 (mg): {nutrition_dict.get('Vitamin B-6 (mg)', 0):.1f}")
        print(f"Folate (mcg DFE): {nutrition_dict.get('Folate, DFE (mcg)', 0):.1f}")
        print(f"Vitamin B12 (mcg): {nutrition_dict.get('Vitamin B-12 (mcg)', 0):.1f}")
        print(f"Choline (mg): {nutrition_dict.get('Choline, total (mg)', 0):.1f}")
        print(f"Calcium (mg): {nutrition_dict.get('Calcium (mg)', 0):.1f}")
        print(f"Iron (mg): {nutrition_dict.get('Iron (mg)', 0):.1f}")
        print(f"Magnesium (mg): {nutrition_dict.get('Magnesium (mg)', 0):.1f}")
        print(f"Phosphorus (mg): {nutrition_dict.get('Phosphorus (mg)', 0):.1f}")
        print(f"Potassium (mg): {nutrition_dict.get('Potassium (mg)', 0):.1f}")
        print(f"Zinc (mg): {nutrition_dict.get('Zinc(mg)', 0):.1f}")
        print(f"Copper (mg): {nutrition_dict.get('Copper (mg)', 0):.1f}")
        print(f"Selenium (mcg): {nutrition_dict.get('Selenium (mcg)', 0):.1f}")
        
        # 如果有每100g的营养成分，打印它们
        if 'nutrition_per_100g' in result_dict and result_dict['nutrition_per_100g'] and total_weight_grams > 0:
            nutrition_per_100g = result_dict['nutrition_per_100g']
            
            print("\n===== NUTRITION FACTS (PER 100g) =====")
            print(f"Energy (kcal): {nutrition_per_100g.get('Energy (kcal)', 0):.1f}")
            print(f"Total Fat (g): {nutrition_per_100g.get('Total Fat (g)', 0):.1f}")
            print(f"  Saturated Fat (g): {nutrition_per_100g.get('Fatty acids, total saturated (g)', 0):.1f}")
            print(f"  Monounsaturated Fat (g): {nutrition_per_100g.get('Fatty acids, total monounsaturated (g)', 0):.1f}")
            print(f"  Polyunsaturated Fat (g): {nutrition_per_100g.get('Fatty acids, total polyunsaturated (g)', 0):.1f}")
            print(f"Cholesterol (mg): {nutrition_per_100g.get('Cholesterol (mg)', 0):.1f}")
            print(f"Sodium (mg): {nutrition_per_100g.get('Sodium (mg)', 0):.1f}")
            print(f"Total Carbohydrate (g): {nutrition_per_100g.get('Carbohydrate (g)', 0):.1f}")
            print(f"  Dietary Fiber (g): {nutrition_per_100g.get('Fiber, total dietary (g)', 0):.1f}")
            print(f"  Sugars (g): {nutrition_per_100g.get('Sugars, total (g)', 0):.1f}")
            print(f"Protein (g): {nutrition_per_100g.get('Protein (g)', 0):.1f}")
        
        print("\nNote: Values are for the entire recipe. The per 100g values represent the nutritional content per 100g of the total recipe weight.")


def test_ingredient_matching(calculator, test_ingredients):
    """测试食材匹配算法的准确性
    
    参数:
        calculator: RecipeNutritionCalculator实例
        test_ingredients: 要测试的食材列表
    """
    print("\n===== 食材匹配测试 =====")
    print("原始食材名称 -> 匹配结果")
    print("-" * 50)
    
    results = {}
    for ingredient in test_ingredients:
        match = calculator.find_closest_food_match(ingredient, verbose=True)
        results[ingredient] = match
        print(f"{ingredient:<30} -> {match if match else 'No match found'}")
    
    return results

def test_problematic_ingredients(calculator):
    """测试之前有问题的食材匹配"""
    problematic_ingredients = [
        "raw king prawns",      # 之前匹配到"strawberry milk"
        "olive oil",           # 之前匹配到"popcorn, popped in oil"
        "chopped onion",       # 之前匹配到"strawberry milk"
        "freshly chopped parsley", # 之前匹配到"pork bacon"
        "white wine",          # 之前匹配到"white sauce or gravy"
        "chopped tomatoes",    # 之前匹配到"strawberry milk"
        "minced garlic",       # 之前匹配到"strawberry milk"
        "cubed feta cheese"    # 之前匹配到"cheese, feta"
    ]
    
    print("\n===== 问题食材匹配测试 =====")
    return test_ingredient_matching(calculator, problematic_ingredients)

def test_common_ingredients(calculator):
    """测试常见食材匹配"""
    common_ingredients = [
        "chicken breast",
        "ground beef",
        "salmon fillet",
        "brown rice",
        "whole wheat flour",
        "spinach leaves",
        "broccoli florets",
        "red bell pepper",
        "cheddar cheese",
        "greek yogurt",
        "honey",
        "maple syrup",
        "soy sauce",
        "balsamic vinegar",
        "coconut milk",
        "almond flour",
        "chia seeds",
        "walnuts"
    ]
    
    print("\n===== 常见食材匹配测试 =====")
    return test_ingredient_matching(calculator, common_ingredients)

def test_complex_ingredients(calculator):
    """测试复杂食材名称匹配"""
    complex_ingredients = [
        "1 (400g) tin chopped tomatoes",
        "2 tablespoons extra virgin olive oil",
        "500g skinless chicken breast fillets",
        "1 large onion, finely diced",
        "3 cloves of garlic, minced",
        "1 red bell pepper, diced",
        "fresh basil leaves, torn",
        "1/4 cup fresh parsley, chopped",
        "1 cup (250ml) heavy cream",
        "2 tablespoons unsalted butter",
        "1/2 cup grated parmesan cheese",
        "pinch of sea salt",
        "freshly ground black pepper"
    ]
    
    # 创建营养计算器实例
    data_dir = "fixed_data"
    calculator = RecipeNutritionCalculator(data_dir=data_dir)
    
    # 测试食材匹配
    # Skip ingredient matching tests for now
    
    # 测试食谱营养计算
    try:
        recipe_file_path = 'fixed_data/all_recipes.json'
        if not os.path.exists(recipe_file_path):
            print(f"文件 {recipe_file_path} 不存在。")
            return
            
        with open(recipe_file_path, 'r', encoding='utf-8') as f:
            recipes_data = json.load(f)
        
        if not recipes_data.get('meals'):
            print("在JSON文件中未找到食谱。")
            return
            
        # 选择第一个食谱
        recipe = recipes_data['meals'][0]
        recipe_name = recipe.get('strMeal', 'Unknown Recipe')
        recipe_area = recipe.get('strArea', 'Unknown')
        recipe_category = recipe.get('strCategory', 'Unknown')
        
        print(f"\n计算营养成分: {recipe_name}")
        print(f"菜系: {recipe_area}")
        print(f"类别: {recipe_category}")
        
        # 提取食材列表
        ingredients = []
        for i in range(1, 21):
            ingredient_key = f'strIngredient{i}'
            measure_key = f'strMeasure{i}'
            
            if ingredient_key in recipe and recipe[ingredient_key] and recipe[ingredient_key].strip():
                ingredient = recipe[ingredient_key].strip()
                measure = recipe.get(measure_key, '').strip()
                ingredients.append((ingredient, measure))
        
        # 显示食材列表
        print("\n食材列表:")
        for i, (ingredient, measure) in enumerate(ingredients, 1):
            print(f"  {i}. {ingredient} - {measure}")
        
        # 计算营养成分
        print("\n计算营养成分...")
        result = calculator.calculate_recipe_nutrition(recipe, verbose=True)
        
        # 如果结果为空，返回
        if not result or not result.get('nutrition'):
            print("无法计算营养成分。")
            return
            
        # 获取营养成分和匹配统计
        nutrition = result['nutrition']
        stats = result.get('stats', {})
        
        # 计算总重量
        total_weight = 0
        
        # 从匹配统计中获取匹配的食材
        if 'matches' in stats:
            for match in stats['matches']:
                ingredient_name, food_match = match
                # 找到该食材的计量
                for ingredient, measurement in ingredients:
                    if ingredient == ingredient_name:
                        amount, unit = calculator.parse_measurement(measurement)
                        weight_in_grams = calculator.convert_to_grams(amount, unit, food_match)
                        total_weight += weight_in_grams
                        break
        
        # 打印总营养成分
        print(f"\n===== NUTRITION FACTS (TOTAL RECIPE) =====")
        print(f"Total Weight: {total_weight:.1f}g")
        calculator.print_nutrition_facts(nutrition)
        
        # 计算每100g的营养成分
        if total_weight > 0:
            nutrition_per_100g = {}
            for nutrient, value in nutrition.items():
                nutrition_per_100g[nutrient] = (value / total_weight) * 100
                
            # 打印每100g的营养成分
            print("\n===== NUTRITION FACTS (PER 100g) =====")
            calculator.print_nutrition_facts(nutrition_per_100g)
        else:
            print("\n无法计算每100g的营养成分，因为总重量为0。")
    
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


def process_recipes():
    """
    处理所有食谱并计算营养成分
    """
    # 创建营养计算器实例
    data_dir = "fixed_data"
    calculator = RecipeNutritionCalculator(data_dir=data_dir)
    
    # 加载食谱数据
    try:
        input_file_path = 'update_all_recipes_urls_fixed.json'
        output_file_path = 'recipes_with_nutrition_updated.json'
        
        if not os.path.exists(input_file_path):
            print(f"文件 {input_file_path} 不存在。")
            return
            
        with open(input_file_path, 'r', encoding='utf-8') as f:
            recipes_data = json.load(f)
        
        if not recipes_data.get('meals'):
            print("在JSON文件中未找到食谱。")
            return
        
        # 创建结果数据结构
        result_data = {"meals": []}
        total_recipes = len(recipes_data['meals'])
        
        # 处理每个食谱
        for i, recipe in enumerate(recipes_data['meals'], 1):
            recipe_name = recipe.get('strMeal', 'Unknown Recipe')
            print(f"\n处理食谱 [{i}/{total_recipes}]: {recipe_name}")
            
            # 深拷贝食谱数据，以便我们可以添加营养信息
            recipe_copy = copy.deepcopy(recipe)
            
            # 计算营养成分
            try:
                result = calculator.calculate_recipe_nutrition(recipe, verbose=False)
                
                if result and result.get('nutrition') and result.get('total_weight_grams', 0) > 0:
                    # 获取营养成分和总重量
                    nutrition = result['nutrition']
                    nutrition_per_serving = result.get('nutrition_per_serving', {})
                    total_weight = result.get('total_weight_grams', 0)
                    servings = result.get('servings', 4)  # 默认4份
                    
                    # 添加营养信息到食谱
                    recipe_copy['Weight'] = int(total_weight)
                    
                    # 添加份数
                    recipe_copy['servings'] = servings
                    
                    # 初始化主要营养素字段，用于后面添加到顶层
                    main_nutrients = {
                        'Energy': 0,
                        'Protein': 0,
                        'Total Fat': 0,
                        'Saturated': 0,
                        'Carbohydrate Total': 0,
                        'Sugars': 0,
                        'Sodium': 0
                    }
                    
                    # 添加每份营养信息
                    recipe_copy['NutritionPerServing'] = {}
                    
                    # 处理营养素数据
                    for nutrient, value in nutrition_per_serving.items():
                        # 处理字段名称 - 移除单位标签
                        clean_name = nutrient
                        if '(' in clean_name and ')' in clean_name:
                            clean_name = clean_name.split('(')[0].strip()
                        
                        # 特殊处理某些营养素
                        if 'Energy' in nutrient and 'dietary fiber' in nutrient:
                            # 将能量从千焦转换为卡路里，并取整数
                            cal_value = int(value / 4.184) if value else 0
                            recipe_copy['NutritionPerServing']['Energy'] = f"{cal_value}"
                            main_nutrients['Energy'] = cal_value
                        elif nutrient == 'Carbohydrate, by difference':
                            recipe_copy['NutritionPerServing']['Carbohydrate'] = f"{value:.1f}"
                            main_nutrients['Carbohydrate Total'] = float(value)
                        elif nutrient == 'Fatty acids, total saturated':
                            recipe_copy['NutritionPerServing']['Fatty acids, total saturated'] = f"{value:.1f}"
                            main_nutrients['Saturated'] = float(value)
                        elif nutrient == 'Protein':
                            recipe_copy['NutritionPerServing']['Protein'] = f"{value:.1f}"
                            main_nutrients['Protein'] = float(value)
                        elif nutrient == 'Total Fat':
                            recipe_copy['NutritionPerServing']['Total Fat'] = f"{value:.1f}"
                            main_nutrients['Total Fat'] = float(value)
                        elif nutrient == 'Sugars, total':
                            recipe_copy['NutritionPerServing']['Sugars, total'] = f"{value:.1f}"
                            main_nutrients['Sugars'] = float(value)
                        elif nutrient == 'Sodium':
                            recipe_copy['NutritionPerServing']['Sodium'] = f"{value:.1f}"
                            main_nutrients['Sodium'] = float(value)
                        else:
                            # 对于其他营养素，保留小数点后一位
                            if isinstance(value, (int, float)):
                                recipe_copy['NutritionPerServing'][clean_name] = f"{value:.1f}"
                            else:
                                recipe_copy['NutritionPerServing'][clean_name] = value
                    
                    # 将主要营养素添加到顶层
                    recipe_copy['Energy'] = f"{main_nutrients['Energy']} cal"
                    recipe_copy['Protein'] = f"{main_nutrients['Protein']:.1f} g"
                    recipe_copy['Total Fat'] = f"{main_nutrients['Total Fat']:.1f} g"
                    recipe_copy['Saturated'] = f"{main_nutrients['Saturated']:.1f} g"
                    recipe_copy['Carbohydrate Total'] = f"{main_nutrients['Carbohydrate Total']:.1f} g"
                    recipe_copy['Sugars'] = f"{main_nutrients['Sugars']:.1f} g"
                    recipe_copy['Sodium'] = f"{main_nutrients['Sodium']:.1f} mg"
                    
                    print(f"成功计算 {recipe_name} 的营养成分")
                else:
                    print(f"无法计算 {recipe_name} 的营养成分")
            except Exception as e:
                print(f"处理 {recipe_name} 时出错: {e}")
                # 继续处理下一个食谱
            
            # 添加处理后的食谱到结果
            result_data['meals'].append(recipe_copy)
        
        # 保存结果到文件
        with open(output_file_path, 'w', encoding='utf-8') as f:
            json.dump(result_data, f, ensure_ascii=False, indent=4)
            
        print(f"\n处理完成。已将结果保存到 {output_file_path}")
    
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

def main():
    """
    主函数
    """
    process_recipes()

if __name__ == "__main__":
    main()
