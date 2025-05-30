'use client'

import { useState, useEffect } from 'react'

interface ABTestConfig {
  name: string
  variants: string[]
  traffic: number // 参与测试的流量比例 (0-1)
  enabled: boolean
}

// 默认实验配置
const DEFAULT_EXPERIMENTS: Record<string, ABTestConfig> = {
  homepage_cta_button: {
    name: 'homepage_cta_button',
    variants: ['control', 'variant_a', 'variant_b'],
    traffic: 1.0,
    enabled: true
  },
  pricing_display: {
    name: 'pricing_display', 
    variants: ['control', 'variant_a'],
    traffic: 0.5,
    enabled: true
  },
  recipe_card_layout: {
    name: 'recipe_card_layout',
    variants: ['control', 'grid', 'masonry'],
    traffic: 0.3,
    enabled: false
  }
}

export function useABTest(testName: string) {
  const [variant, setVariant] = useState<string>('control')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    function initABTest() {
      try {
        // 检查是否在客户端
        if (typeof window === 'undefined') {
          setVariant('control')
          setIsLoading(false)
          return
        }

        // 获取实验配置
        const config = DEFAULT_EXPERIMENTS[testName]
        
        if (!config || !config.enabled || !config.variants) {
          setVariant('control')
          setIsLoading(false)
          return
        }

        // 获取或生成用户ID
        let userId = localStorage.getItem('ab_user_id')
        if (!userId) {
          userId = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15)
          localStorage.setItem('ab_user_id', userId)
        }

        // 检查是否已经参与过此实验
        const existingVariant = localStorage.getItem(`ab_test_${testName}`)
        if (existingVariant && config.variants.includes(existingVariant)) {
          setVariant(existingVariant)
          setIsLoading(false)
          return
        }

        // 计算用户是否参与实验
        const hash = simpleHash(userId + testName)
        const shouldParticipate = (hash % 100) / 100 < config.traffic

        if (!shouldParticipate) {
          setVariant('control')
          localStorage.setItem(`ab_test_${testName}`, 'control')
          setIsLoading(false)
          return
        }

        // 分配变体
        const variantIndex = hash % config.variants.length
        const selectedVariant = config.variants[variantIndex]
        
        setVariant(selectedVariant)
        localStorage.setItem(`ab_test_${testName}`, selectedVariant)
        
        // 记录实验参与事件到Google Analytics
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'ab_test_participate', {
            'test_name': testName,
            'variant': selectedVariant,
            'user_id': userId,
            'event_category': 'AB_Test',
            'non_interaction': true
          })
        }

        // 记录到百度统计
        if (typeof window !== 'undefined' && window._hmt) {
          window._hmt.push(['_trackEvent', 'AB_Test', 'participate', `${testName}_${selectedVariant}`])
        }
        
      } catch (error) {
        console.error('AB Test Error:', error)
        setVariant('control')
      } finally {
        setIsLoading(false)
      }
    }

    initABTest()
  }, [testName])

  // 记录转化事件
  const trackConversion = (conversionType: string = 'click') => {
    if (typeof window !== 'undefined') {
      // Google Analytics转化跟踪
      if (window.gtag) {
        window.gtag('event', 'ab_test_conversion', {
          'test_name': testName,
          'variant': variant,
          'conversion_type': conversionType,
          'event_category': 'AB_Test'
        })
      }

      // 百度统计转化跟踪
      if (window._hmt) {
        window._hmt.push(['_trackEvent', 'AB_Test', 'conversion', `${testName}_${variant}_${conversionType}`])
      }

      // 保存到本地存储用于分析
      const conversions = JSON.parse(localStorage.getItem('ab_conversions') || '[]')
      conversions.push({
        testName,
        variant,
        conversionType,
        timestamp: new Date().toISOString()
      })
      localStorage.setItem('ab_conversions', JSON.stringify(conversions))
    }
  }

  return { 
    variant, 
    isLoading, 
    trackConversion,
    isParticipating: variant !== 'control' || DEFAULT_EXPERIMENTS[testName]?.variants.includes('control')
  }
}

// 简单哈希函数
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }
  return Math.abs(hash)
}

// 获取实验配置的辅助函数
export function getABTestConfig(testName: string): ABTestConfig | null {
  return DEFAULT_EXPERIMENTS[testName] || null
}

// 获取所有实验配置
export function getAllABTests(): Record<string, ABTestConfig> {
  return DEFAULT_EXPERIMENTS
}

// 重置用户的AB测试数据（用于开发/测试）
export function resetABTestData(): void {
  if (typeof window !== 'undefined') {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('ab_test_') || key === 'ab_user_id' || key === 'ab_conversions'
    )
    keys.forEach(key => localStorage.removeItem(key))
  }
} 