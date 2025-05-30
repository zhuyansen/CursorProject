'use client'

import { ABTestWrapper, SimpleABTest, ABTestButton } from '@/components/ab-test-wrapper'
import { ABTestDashboard } from '@/components/ab-test-dashboard'
import { useABTest } from '@/hooks/useABTest'
import { useState } from 'react'

export default function ABTestDemoPage() {
  const [showDashboard, setShowDashboard] = useState(false)
  const { trackConversion } = useABTest('homepage_cta_button')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        
        {/* 页面标题 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AB测试演示页面
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            这个页面展示了如何在BrickRecipes项目中实施AB测试。
            刷新页面可能会看到不同的变体（取决于实验配置）。
          </p>
        </div>

        {/* 控制面板 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">测试控制面板</h2>
            <button
              onClick={() => setShowDashboard(!showDashboard)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              {showDashboard ? '隐藏' : '显示'}仪表板
            </button>
          </div>
        </div>

        {/* AB测试仪表板 */}
        {showDashboard && (
          <div className="bg-white rounded-lg shadow">
            <ABTestDashboard />
          </div>
        )}

        {/* 示例1：使用ABTestWrapper的多变体测试 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">示例1：首页CTA按钮测试</h2>
          <p className="text-gray-600 mb-6">
            这是一个测试不同CTA按钮设计的实验，包含3个变体。
          </p>
          
          <div className="flex justify-center">
            <ABTestWrapper testName="homepage_cta_button">
              {{
                control: (
                  <button 
                    onClick={() => trackConversion('click')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    开始探索食谱
                  </button>
                ),
                variant_a: (
                  <button 
                    onClick={() => trackConversion('click')}
                    className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transition-all hover:shadow-xl"
                  >
                    立即发现美食 🍽️
                  </button>
                ),
                variant_b: (
                  <button 
                    onClick={() => trackConversion('click')}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg border-2 border-orange-300 transition-all hover:border-orange-400"
                  >
                    🍳 开始烹饪之旅
                  </button>
                )
              }}
            </ABTestWrapper>
          </div>
        </div>

        {/* 示例2：使用SimpleABTest的简单二元测试 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">示例2：定价显示测试</h2>
          <p className="text-gray-600 mb-6">
            这是一个测试不同定价显示方式的简单A/B测试。
          </p>
          
          <div className="flex justify-center">
            <SimpleABTest
              testName="pricing_display"
              control={
                <div className="text-center p-6 border rounded-lg">
                  <div className="text-3xl font-bold text-gray-900">¥29.9/月</div>
                  <div className="text-gray-600 mt-2">Premium会员</div>
                </div>
              }
              variant={
                <div className="text-center p-6 border rounded-lg">
                  <div className="text-gray-500 line-through text-lg">原价 ¥39.9</div>
                  <div className="text-3xl font-bold text-red-500">¥29.9/月</div>
                  <div className="text-gray-600 mt-2">限时优惠 🔥</div>
                </div>
              }
            />
          </div>
        </div>

        {/* 示例3：使用ABTestButton的按钮专用组件 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">示例3：专用按钮测试组件</h2>
          <p className="text-gray-600 mb-6">
            使用专门为按钮设计的AB测试组件，配置更简单。
          </p>
          
          <div className="flex justify-center">
            <ABTestButton
              testName="homepage_cta_button"
              variants={{
                control: {
                  text: '开始探索食谱',
                  className: 'bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors'
                },
                variant_a: {
                  text: '立即发现美食 🍽️',
                  className: 'bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transition-all hover:shadow-xl'
                },
                variant_b: {
                  text: '🍳 开始烹饪之旅',
                  className: 'bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg border-2 border-orange-300 transition-all hover:border-orange-400'
                }
              }}
              onClick={(variant) => {
                console.log(`按钮被点击，变体: ${variant}`)
                alert(`您点击了变体: ${variant}`)
              }}
            />
          </div>
        </div>

        {/* 示例4：布局测试（目前已禁用） */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">示例4：食谱卡片布局测试（已禁用）</h2>
          <p className="text-gray-600 mb-6">
            这个实验目前已禁用，所有用户都会看到控制组版本。
          </p>
          
          <ABTestWrapper testName="recipe_card_layout">
            {{
              control: (
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="border rounded-lg p-4 text-center">
                      <div className="w-full h-24 bg-gray-200 rounded mb-2"></div>
                      <div className="font-medium">传统网格布局 {i}</div>
                    </div>
                  ))}
                </div>
              ),
              grid: (
                <div className="grid grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="border rounded-lg p-6 text-center">
                      <div className="w-full h-32 bg-blue-200 rounded mb-3"></div>
                      <div className="font-medium">大网格布局 {i}</div>
                    </div>
                  ))}
                </div>
              ),
              masonry: (
                <div className="columns-3 gap-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`border rounded-lg p-4 text-center mb-4 break-inside-avoid ${
                      i % 2 === 0 ? 'h-32' : 'h-24'
                    }`}>
                      <div className="w-full h-16 bg-green-200 rounded mb-2"></div>
                      <div className="font-medium">瀑布流 {i}</div>
                    </div>
                  ))}
                </div>
              )
            }}
          </ABTestWrapper>
        </div>

        {/* 使用说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">如何使用AB测试</h2>
          <div className="space-y-3 text-blue-700">
            <div>
              <strong>1. 配置实验:</strong> 在 `hooks/useABTest.ts` 中的 `DEFAULT_EXPERIMENTS` 配置您的实验
            </div>
            <div>
              <strong>2. 使用组件:</strong> 在页面中使用 `ABTestWrapper`、`SimpleABTest` 或 `ABTestButton`
            </div>
            <div>
              <strong>3. 跟踪转化:</strong> 在用户行为发生时调用 `trackConversion()` 函数
            </div>
            <div>
              <strong>4. 查看结果:</strong> 使用 `ABTestDashboard` 组件查看实时结果
            </div>
            <div>
              <strong>5. 分析数据:</strong> 在Google Analytics和百度统计中查看详细数据
            </div>
          </div>
        </div>

        {/* 返回首页按钮 */}
        <div className="text-center">
          <a 
            href="/"
            className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            返回首页
          </a>
        </div>
      </div>
    </div>
  )
} 