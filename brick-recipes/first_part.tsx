"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, ChevronDown, Clock, Flame, PlayCircle, ChefHat, X, Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/language-provider"
import { cn } from "@/lib/utils"

// Mock data for ingredients
const ingredients = {
  vegetables: [
    { id: "potato", name: "Potato", zhName: "土豆", emoji: "🥔" },
    { id: "carrot", name: "Carrot", zhName: "胡萝卜", emoji: "🥕" },
    { id: "cabbage", name: "Cabbage", zhName: "卷心菜", emoji: "🥬" },
    { id: "radish", name: "White Radish", zhName: "白萝卜", emoji: "🥬" },
    { id: "broccoli", name: "Broccoli", zhName: "西兰花", emoji: "🥦" },
    { id: "tomato", name: "Tomato", zhName: "番茄", emoji: "🍅" },
    { id: "celery", name: "Celery", zhName: "芹菜", emoji: "🥬" },
    { id: "cucumber", name: "Cucumber", zhName: "黄瓜", emoji: "🥒" },
    { id: "onion", name: "Onion", zhName: "洋葱", emoji: "🧅" },
    { id: "spinach", name: "Spinach", zhName: "菠菜", emoji: "🥬" },
    { id: "mushroom", name: "Mushroom", zhName: "蘑菇", emoji: "🍄" },
    { id: "eggplant", name: "Eggplant", zhName: "茄子", emoji: "🍆" },
    { id: "tofu", name: "Tofu", zhName: "豆腐", emoji: "🧊" },
    { id: "chinese-cabbage", name: "Chinese Cabbage", zhName: "白菜", emoji: "🥬" },
    { id: "lettuce", name: "Lettuce", zhName: "生菜", emoji: "🥬" },
  ],
  meat: [
    { id: "pork-belly", name: "Pork Belly", zhName: "五花肉", emoji: "🥓" },
    { id: "sausage", name: "Sausage", zhName: "香肠", emoji: "🌭" },
    { id: "ham", name: "Ham", zhName: "火腿", emoji: "🍖" },
    { id: "chicken", name: "Chicken", zhName: "鸡肉", emoji: "🍗" },
    { id: "pork", name: "Pork", zhName: "猪肉", emoji: "🍖" },
    { id: "egg", name: "Egg", zhName: "鸡蛋", emoji: "🥚" },
    { id: "shrimp", name: "Shrimp", zhName: "虾", emoji: "🦐" },
    { id: "beef", name: "Beef", zhName: "牛肉", emoji: "🥩" },
    { id: "bone", name: "Bone", zhName: "骨头", emoji: "🦴" },
    { id: "fish", name: "Fish", zhName: "鱼", emoji: "🐟" },
  ],
  cookingMethods: [
    { id: "stir-fry", name: "Stir Fry", zhName: "炒", emoji: "🍳" },
    { id: "stew", name: "Stew", zhName: "炖", emoji: "🍲" },
    { id: "boil", name: "Boil", zhName: "煮", emoji: "♨️" },
    { id: "deep-fry", name: "Deep Fry", zhName: "炸", emoji: "🍤" },
    { id: "steam", name: "Steam", zhName: "蒸", emoji: "🍚" },
    { id: "bake", name: "Bake", zhName: "烤", emoji: "🔥" },
    { id: "pan-fry", name: "Pan Fry", zhName: "煎", emoji: "🔍" },
  ],
  cuisineStyles: [
    { id: "eastern", name: "Eastern Food", zhName: "东方菜系", description: "Discover traditional Asian recipes", zhDescription: "探索传统亚洲美食" },
    { id: "western", name: "Western Food", zhName: "西方菜系", description: "Explore European and American cuisine", zhDescription: "体验欧美烹饪风格" },
  ],
}

// Mock data for recipe results
const mockRecipes = [
  {
    id: 1,
    title: "Brick Oven Pizza",
    image: "/placeholder.svg?height=200&width=300",
    time: "30 min",
    calories: "320 kcal",
    difficulty: "Easy",
    tags: ["Italian", "Dinner"],
    videoUrl: "https://example.com/video1",
    ingredients: ["Flour", "Tomato", "Cheese", "Olive Oil"],
  },
  {
    id: 2,
    title: "Brick House Burger",
    image: "/placeholder.svg?height=200&width=300",
    time: "25 min",
    calories: "450 kcal",
    difficulty: "Medium",
    tags: ["American", "Lunch"],
    videoUrl: "https://example.com/video2",
    ingredients: ["Beef", "Onion", "Lettuce", "Tomato"],
  },
  {
    id: 3,
    title: "Brick Layer Lasagna",
    image: "/placeholder.svg?height=200&width=300",
    time: "60 min",
    calories: "520 kcal",
    difficulty: "Medium",
    tags: ["Italian", "Dinner"],
    videoUrl: "https://example.com/video3",
    ingredients: ["Pasta", "Tomato", "Beef", "Cheese"],
  },
  {
    id: 4,
    title: "Brick Road Tacos",
    image: "/placeholder.svg?height=200&width=300",
    time: "20 min",
    calories: "280 kcal",
    difficulty: "Easy",
    tags: ["Mexican", "Lunch"],
    videoUrl: "https://example.com/video4",
    ingredients: ["Tortilla", "Chicken", "Onion", "Cilantro"],
  },
  {
    id: 5,
    title: "Brick Foundation Salad",
    image: "/placeholder.svg?height=200&width=300",
    time: "15 min",
    calories: "180 kcal",
    difficulty: "Easy",
    tags: ["Healthy", "Lunch"],
    videoUrl: "https://example.com/video5",
    ingredients: ["Lettuce", "Tomato", "Cucumber", "Olive Oil"],
  },
  {
    id: 6,
    title: "Brick Wall Steak",
    image: "/placeholder.svg?height=200&width=300",
    time: "40 min",
    calories: "520 kcal",
    difficulty: "Hard",
    tags: ["American", "Dinner"],
    videoUrl: "https://example.com/video6",
    ingredients: ["Beef", "Butter", "Garlic", "Rosemary"],
  },
]

// Mock video summaries
const videoSummaries = {
  1: "This video demonstrates how to make a perfect brick oven pizza at home. The chef shows techniques for stretching dough, applying sauce evenly, and achieving a crispy crust without a specialized oven.",
  2: "Learn how to make juicy burgers that don't shrink. This tutorial covers meat selection, proper seasoning, and cooking temperatures for the perfect burger.",
  3: "A step-by-step guide to creating authentic Italian lasagna with homemade sauce. The video includes tips for preventing soggy layers and achieving the perfect cheese pull.",
  4: "Quick and easy taco recipe with authentic Mexican flavors. The chef shares secrets for marinating meat and making fresh salsa that complements the dish.",
  5: "This tutorial shows how to create restaurant-quality salads at home. Learn about ingredient pairing, homemade dressings, and beautiful presentation techniques.",
  6: "Master the art of cooking the perfect steak with this detailed guide. The video covers selecting cuts, seasoning methods, and achieving your desired doneness.",
}

