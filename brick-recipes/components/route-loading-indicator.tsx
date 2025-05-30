"use client";

import { useState, useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function RouteLoadingIndicatorContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  
  // 监听路由变化
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    // 路由变化开始时显示加载指示器
    const handleStart = () => {
      setIsLoading(true);
      // 设置超时，防止加载时间过长
      timeout = setTimeout(() => setIsLoading(false), 5000);
    };
    
    // 路由变化完成时隐藏加载指示器
    const handleComplete = () => {
      clearTimeout(timeout);
      setIsLoading(false);
    };
    
    // 模拟路由变化开始
    handleStart();
    
    // 监听路径和查询参数变化，完成后隐藏加载指示器
    const timer = setTimeout(() => {
      handleComplete();
    }, 500);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(timeout);
    };
  }, [pathname, searchParams]);
  
  if (!isLoading) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent overflow-hidden">
      <div className="h-full bg-[#b94a2c] dark:bg-[#ff6b47] animate-route-loading"></div>
    </div>
  );
}

export function RouteLoadingIndicator() {
  return (
    <Suspense fallback={null}>
      <RouteLoadingIndicatorContent />
    </Suspense>
  );
} 