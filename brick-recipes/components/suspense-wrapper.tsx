"use client"

import { Suspense } from "react"
import { Loader2 } from "lucide-react"

interface SuspenseWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

function DefaultFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  )
}

export function SuspenseWrapper({ children, fallback }: SuspenseWrapperProps) {
  return (
    <Suspense fallback={fallback || <DefaultFallback />}>
      {children}
    </Suspense>
  )
} 