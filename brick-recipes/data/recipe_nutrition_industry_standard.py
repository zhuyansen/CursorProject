#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import pandas as pd
import math

def calculate_industry_standard_servings(total_weight_grams, food_category="main"):
    """
    Calculate servings based on industry standard portion sizes
    
    Args:
        total_weight_grams: Total weight of the recipe in grams
        food_category: Category of food (main, soup, salad, dessert, etc.)
        
    Returns:
        Number of servings based on industry standards
    """
    if food_category == "main":
        # Standard portion for main dishes: ~200g per serving
        servings = total_weight_grams / 200
    elif food_category == "soup":
        # Standard portion for soups: ~300g per serving
        servings = total_weight_grams / 300
    elif food_category == "salad":
        # Standard portion for salads: ~125g per serving
        servings = total_weight_grams / 125
    elif food_category == "dessert":
        # Standard portion for desserts: ~100g per serving
        servings = total_weight_grams / 100
    else:
        # Default to main dish calculation
        servings = total_weight_grams / 200
    
    # Round to nearest integer and ensure minimum of 1 serving
    servings = max(1, round(servings))
    
    # Cap at reasonable maximum (12 servings)
    servings = min(12, servings)
    
    return servings

def add_units_to_nutrition_values(nutrition_dict):
    """
    Add appropriate units to nutrition values
    
    Args:
        nutrition_dict: Dictionary of nutrition values
        
    Returns:
        Dictionary with units added to values
    """
    units = {
        "Energy": "kcal",
        "Protein": "g",
        "Carbohydrate": "g",
        "Sugars, total": "g",
        "Fiber, total dietary": "g",
        "Total Fat": "g",
        "Fatty acids, total saturated": "g",
        "Fatty acids, total monounsaturated": "g",
        "Fatty acids, total polyunsaturated": "g",
        "Cholesterol": "mg",
        "Sodium": "mg",
        "Potassium": "mg",
        "Calcium": "mg",
        "Iron": "mg",
        "Magnesium": "mg",
        "Phosphorus": "mg",
        "Zinc": "mg",
        "Copper": "mg",
        "Selenium": "μg",
        "Vitamin A, RAE": "μg",
        "Vitamin C": "mg",
        "Vitamin D": "μg",
        "Vitamin E": "mg",
        "Vitamin K": "μg",
        "Thiamin": "mg",
        "Riboflavin": "mg",
        "Niacin": "mg",
        "Vitamin B-6": "mg",
        "Folate, total": "μg",
        "Folate, food": "μg",
        "Folate, DFE": "μg",
        "Folic acid": "μg",
        "Vitamin B-12": "μg",
        "Vitamin B-12, added": "μg",
        "Choline, total": "mg",
        "Retinol": "μg",
        "Carotene, alpha": "μg",
        "Carotene, beta": "μg",
        "Cryptoxanthin, beta": "μg",
        "Lycopene": "μg",
        "Lutein + zeaxanthin": "μg",
        "Caffeine": "mg",
        "Theobromine": "mg",
        "Alcohol": "g",
        "Water": "g"
    }
    
    result = {}
    for nutrient, value in nutrition_dict.items():
        if nutrient in units:
            # Format numeric values with appropriate precision
            if nutrient == "Energy":
                # Convert kcal to kJ (1 kcal = 4.184 kJ) and display both
                kcal_value = int(float(value))
                kj_value = int(kcal_value * 4.184)  # Convert to kJ and round to integer
                formatted_value = f"{kj_value} kJ ({kcal_value} cal)"
            elif units[nutrient] == "g":
                # Grams with 1 decimal place
                formatted_value = f"{float(value):.1f} {units[nutrient]}"
            elif units[nutrient] == "mg":
                # Milligrams with 1 decimal place
                formatted_value = f"{float(value):.1f} {units[nutrient]}"
            elif units[nutrient] == "μg":
                # Micrograms with 1 decimal place
                formatted_value = f"{float(value):.1f} {units[nutrient]}"
            else:
                formatted_value = f"{value} {units[nutrient]}"
            
            result[nutrient] = formatted_value
        else:
            # For nutrients without defined units, try to determine appropriate unit
            try:
                # Assume it's a numeric value and add a default unit
                if ':' in nutrient:  # Fatty acid ratios
                    formatted_value = f"{float(value):.1f} g"
                elif nutrient.startswith(('Water', 'Alcohol')):
                    formatted_value = f"{float(value):.1f} g"
                elif nutrient.startswith(('Caffeine', 'Theobromine')):
                    formatted_value = f"{float(value):.1f} mg"
                else:
                    # Default to g for unknown nutrients
                    formatted_value = f"{float(value):.1f} g"
                result[nutrient] = formatted_value
            except (ValueError, TypeError):
                # If not a numeric value, keep as is
                result[nutrient] = value
    
    return result

def update_recipes_with_industry_standard():
    """
    Update recipes with industry standard serving sizes and properly formatted nutrition values
    """
    # Load the JSON file
    input_file = 'recipes_with_nutrition_updated.json'
    output_file = 'recipes_with_nutrition_industry_standard.json'
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Process each recipe
    for recipe in data['meals']:
        # Skip recipes without weight or nutrition information
        if 'Weight' not in recipe or 'NutritionPerServing' not in recipe:
            continue
        
        total_weight = recipe['Weight']
        
        # Determine food category based on recipe category
        food_category = "main"  # Default
        if 'strCategory' in recipe:
            category = recipe['strCategory'].lower()
            if 'soup' in category:
                food_category = "soup"
            elif 'salad' in category:
                food_category = "salad"
            elif 'dessert' in category or 'sweet' in category:
                food_category = "dessert"
        
        # Calculate servings based on industry standards
        recipe['servings'] = calculate_industry_standard_servings(total_weight, food_category)
        
        # Add units to nutrition values in NutritionPerServing
        if 'NutritionPerServing' in recipe:
            nutrition_with_units = add_units_to_nutrition_values(recipe['NutritionPerServing'])
            recipe['NutritionPerServing'] = nutrition_with_units
            
            # Add top-level nutrition fields with proper units
            # These map to specific fields in NutritionPerServing
            nutrition_mapping = {
                'Energy': 'Energy',
                'Protein': 'Protein',
                'Total Fat': 'Total Fat',
                'Saturated': 'Fatty acids, total saturated',
                'Carbohydrate Total': 'Carbohydrate',
                'Sugars': 'Sugars, total',
                'Sodium': 'Sodium'
            }
            
            for top_field, source_field in nutrition_mapping.items():
                if source_field in recipe['NutritionPerServing']:
                    # For Energy, we need to use the same format with kJ and cal
                    if top_field == 'Energy' and source_field == 'Energy':
                        # Get the Energy value from NutritionPerServing
                        recipe[top_field] = recipe['NutritionPerServing'][source_field]
                    else:
                        recipe[top_field] = recipe['NutritionPerServing'][source_field]
    
    # Save the updated data
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    
    print(f"Updated recipes with industry standard servings and formatted nutrition values in {output_file}")

if __name__ == "__main__":
    update_recipes_with_industry_standard()
