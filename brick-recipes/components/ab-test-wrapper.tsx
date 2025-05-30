'use client'

import React from 'react'
import { useABTest } from '@/hooks/useABTest'

interface ABTestWrapperProps {
  testName: string
  children: {
    [variantName: string]: React.ReactNode
  }
  fallback?: React.ReactNode
  onVariantRender?: (variant: string) => void
}

export function ABTestWrapper({ 
  testName, 
  children, 
  fallback = null,
  onVariantRender 
}: ABTestWrapperProps) {
  const { variant, isLoading, trackConversion } = useABTest(testName)

  React.useEffect(() => {
    if (!isLoading && onVariantRender) {
      onVariantRender(variant)
    }
  }, [variant, isLoading, onVariantRender])

  if (isLoading) {
    return <>{fallback}</>
  }

  // 为子组件添加trackConversion函数
  const childElement = children[variant] || children.control || fallback
  
  if (React.isValidElement(childElement)) {
    return React.cloneElement(childElement, {
      // @ts-ignore - 动态添加trackConversion属性
      trackConversion,
      'data-ab-test': testName,
      'data-ab-variant': variant
    })
  }

  return <>{childElement}</>
}

// 简化版本的AB测试组件，用于简单的二选一场景
export function SimpleABTest({
  testName,
  control,
  variant,
  fallback = null
}: {
  testName: string
  control: React.ReactNode
  variant: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <ABTestWrapper testName={testName} fallback={fallback}>
      {{
        control,
        variant_a: variant
      }}
    </ABTestWrapper>
  )
}

// 专门用于按钮测试的组件
export function ABTestButton({
  testName,
  variants,
  className = '',
  onClick,
  ...props
}: {
  testName: string
  variants: {
    [variantName: string]: {
      text: string
      className?: string
      style?: React.CSSProperties
    }
  }
  className?: string
  onClick?: (variant: string) => void
  [key: string]: any
}) {
  const { variant, trackConversion } = useABTest(testName)
  
  const variantConfig = variants[variant] || variants.control
  
  if (!variantConfig) {
    return null
  }

  const handleClick = () => {
    trackConversion('click')
    onClick?.(variant)
  }

  return (
    <button
      className={`${className} ${variantConfig.className || ''}`}
      style={variantConfig.style}
      onClick={handleClick}
      data-ab-test={testName}
      data-ab-variant={variant}
      {...props}
    >
      {variantConfig.text}
    </button>
  )
} 