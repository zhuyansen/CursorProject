import { useAuth } from "@/components/auth-wrapper";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { useCallback } from "react";

export const useAuthGuard = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { language } = useLanguage();

  const requireAuth = useCallback((
    action: () => void,
    options?: {
      redirectPath?: string;
      message?: string;
    }
  ) => {
    if (isLoading) {
      return; // 如果正在加载，不执行任何操作
    }

    if (!user) {
      // 用户未登录，引导登录
      const currentPath = window.location.pathname + window.location.search;
      const redirectPath = options?.redirectPath || currentPath;
      
      // 保存当前页面路径到localStorage，登录后返回
      try {
        localStorage.setItem('authRedirectPath', redirectPath);
        if (options?.message) {
          localStorage.setItem('authMessage', options.message);
        }
      } catch (error) {
        console.error('Error saving redirect path:', error);
      }

      // 重定向到登录页面
      router.push(`/sign-in?redirect=${encodeURIComponent(redirectPath)}&auth=required`);
      return;
    }

    // 用户已登录，执行原始操作
    action();
  }, [user, isLoading, router]);

  const checkAuthWithMessage = useCallback((
    action: () => void,
    featureName: string
  ) => {
    const message = language === "zh" 
      ? `使用${featureName}功能需要登录账户`
      : `Login required to use ${featureName} feature`;
    
    requireAuth(action, { message });
  }, [requireAuth, language]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    requireAuth,
    checkAuthWithMessage
  };
}; 