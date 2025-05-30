'use client'

import React, { useState, useEffect } from 'react'
import { getAllABTests, getABTestConfig, resetABTestData } from '@/hooks/useABTest'

interface ConversionData {
  testName: string
  variant: string
  conversionType: string
  timestamp: string
}

export function ABTestDashboard() {
  const [conversions, setConversions] = useState<ConversionData[]>([])
  const [activeTests, setActiveTests] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    // 加载转化数据
    const savedConversions = localStorage.getItem('ab_conversions')
    if (savedConversions) {
      setConversions(JSON.parse(savedConversions))
    }

    // 获取活跃测试
    const allTests = getAllABTests()
    const active = Object.keys(allTests).filter(testName => 
      allTests[testName].enabled && localStorage.getItem(`ab_test_${testName}`)
    )
    setActiveTests(active)
  }

  const getTestResults = (testName: string) => {
    const config = getABTestConfig(testName)
    if (!config) return null

    const testConversions = conversions.filter(c => c.testName === testName)
    const userVariant = localStorage.getItem(`ab_test_${testName}`)
    
    const results = config.variants.map(variant => {
      const variantConversions = testConversions.filter(c => c.variant === variant)
      return {
        variant,
        conversions: variantConversions.length,
        isUserVariant: variant === userVariant
      }
    })

    return {
      testName,
      traffic: config.traffic,
      enabled: config.enabled,
      userVariant,
      results
    }
  }

  const clearData = () => {
    if (confirm('确定要清除所有AB测试数据吗？这将重置您的测试分组。')) {
      resetABTestData()
      setConversions([])
      setActiveTests([])
      window.location.reload()
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">AB测试仪表板</h1>
        <button
          onClick={clearData}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          清除数据
        </button>
      </div>

      {/* 当前用户状态 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">当前用户状态</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-600">用户ID:</span>
            <span className="ml-2 font-mono">{localStorage.getItem('ab_user_id') || '未生成'}</span>
          </div>
          <div>
            <span className="text-blue-600">参与测试数:</span>
            <span className="ml-2 font-bold">{activeTests.length}</span>
          </div>
        </div>
      </div>

      {/* 活跃实验 */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">活跃实验</h2>
        
        {Object.entries(getAllABTests()).map(([testName, config]) => {
          const results = getTestResults(testName)
          const userVariant = localStorage.getItem(`ab_test_${testName}`)
          
          return (
            <div key={testName} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{testName}</h3>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    config.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {config.enabled ? '运行中' : '已停止'}
                  </span>
                  <span className="text-sm text-gray-600">
                    流量: {(config.traffic * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* 用户分组信息 */}
              {userVariant && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <span className="text-yellow-800 font-medium">
                    您当前被分配到: 
                    <span className="ml-2 px-2 py-1 bg-yellow-200 rounded text-sm">
                      {userVariant}
                    </span>
                  </span>
                </div>
              )}

              {/* 变体列表 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {config.variants.map(variant => {
                  const variantConversions = conversions.filter(c => 
                    c.testName === testName && c.variant === variant
                  ).length

                  return (
                    <div key={variant} className={`border rounded p-3 ${
                      variant === userVariant ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                    }`}>
                      <div className="font-medium">{variant}</div>
                      <div className="text-sm text-gray-600">转化次数: {variantConversions}</div>
                      {variant === userVariant && (
                        <div className="text-xs text-blue-600 mt-1">当前变体</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* 转化事件历史 */}
      {conversions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">转化事件历史</h2>
          <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
            {conversions.slice(-20).reverse().map((conversion, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                <div>
                  <span className="font-medium">{conversion.testName}</span>
                  <span className="mx-2 text-gray-500">→</span>
                  <span className="text-blue-600">{conversion.variant}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(conversion.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">使用说明</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 每个用户会被随机分配到某个实验变体，分配结果保存在本地存储中</li>
          <li>• 用户在同一个实验中始终看到相同的变体，确保实验的一致性</li>
          <li>• 转化事件会自动记录到Google Analytics和百度统计</li>
          <li>• 清除数据将重置所有实验分组，用户将重新参与分组</li>
        </ul>
      </div>
    </div>
  )
} 