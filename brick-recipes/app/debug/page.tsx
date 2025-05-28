"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"

interface TagData {
  tags: string[]
  categories: string[]
  ingredients: string[]
  cookingMethods: string[]
  mealStyles: string[]
  other: string[]
  tagCounts: Record<string, number>
}

export default function DebugPage() {
  const [tagData, setTagData] = useState<TagData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t } = useLanguage()

  const loadTags = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/tags')
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }
      const data = await response.json()
      setTagData(data)
    } catch (err) {
      console.error('Error loading tags:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTags()
  }, [])

  // 排序标签，按照计数降序
  const sortedTags = tagData?.tags
    ? [...tagData.tags].sort((a, b) => (tagData.tagCounts[b] || 0) - (tagData.tagCounts[a] || 0))
    : []

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Redis 数据调试</h1>
      
      <div className="mb-4">
        <Button 
          onClick={loadTags}
          disabled={loading}
          className="mr-2"
        >
          {loading ? t("common.loading") : "刷新数据"}
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {tagData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 标签列表 */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-bold mb-3">标签 (idx:strTags:*)</h2>
            <p className="text-sm text-gray-500 mb-3">总计: {sortedTags.length} 个标签</p>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">标签名</th>
                    <th className="text-right py-2">食谱数量</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTags.map(tag => (
                    <tr key={tag} className="border-b hover:bg-gray-50">
                      <td className="py-2">{tag}</td>
                      <td className="text-right py-2">{tagData.tagCounts[tag] || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* 分类列表 */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-bold mb-2">分类 (idx:categories:*)</h2>
            <p className="text-sm text-gray-500 mb-3">总计: {tagData.categories.length} 个分类</p>
            <ul className="list-disc pl-5 max-h-96 overflow-y-auto">
              {tagData.categories.map(category => (
                <li key={category} className="py-1">{category}</li>
              ))}
            </ul>
          </div>
          
          {/* 配料列表 */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-bold mb-2">配料 (idx:ingredient:*)</h2>
            <p className="text-sm text-gray-500 mb-3">总计: {tagData.ingredients.length} 个配料</p>
            <ul className="list-disc pl-5 max-h-96 overflow-y-auto">
              {tagData.ingredients.map(ingredient => (
                <li key={ingredient} className="py-1">{ingredient}</li>
              ))}
            </ul>
          </div>
          
          {/* 烹饪方法列表 */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-bold mb-2">烹饪方法 (idx:cookingMethods:*)</h2>
            <p className="text-sm text-gray-500 mb-3">总计: {tagData.cookingMethods.length} 个方法</p>
            <ul className="list-disc pl-5 max-h-96 overflow-y-auto">
              {tagData.cookingMethods.map(method => (
                <li key={method} className="py-1">{method}</li>
              ))}
            </ul>
          </div>
          
          {/* 菜系风格列表 */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-bold mb-2">菜系风格 (idx:mealStyle:*)</h2>
            <p className="text-sm text-gray-500 mb-3">总计: {tagData.mealStyles.length} 个风格</p>
            <ul className="list-disc pl-5 max-h-96 overflow-y-auto">
              {tagData.mealStyles.map(style => (
                <li key={style} className="py-1">{style}</li>
              ))}
            </ul>
          </div>
          
          {/* 其他键列表 */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-bold mb-2">其他键</h2>
            <p className="text-sm text-gray-500 mb-3">总计: {tagData.other.length} 个键</p>
            <ul className="list-disc pl-5 max-h-96 overflow-y-auto">
              {tagData.other.map(key => (
                <li key={key} className="py-1 break-all">{key}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
} 