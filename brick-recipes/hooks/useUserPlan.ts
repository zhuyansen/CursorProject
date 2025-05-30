import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth-wrapper';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/language-provider';

export interface UserPlan {
  id: string;
  plan: 'free' | 'premium' | 'lifetime';
  user_monthly_brick_limit: number;
  user_monthly_brick_use: number;
  user_monthly_video_limit: number;
  user_monthly_video_use: number;
  created_at: string;
  updated_at: string;
}

export interface UsageCheck {
  allowed: boolean;
  current: number;
  limit: number;
  unlimited: boolean;
  error?: string;
}

export interface PlanConfig {
  name: string;
  brick_limit: number;
  video_limit: number;
  price?: number;
  monthly_price?: number;
  yearly_price?: number;
  features: string[];
}

export interface LimitDialogState {
  isOpen: boolean;
  usageType: 'brick' | 'video';
  featureName: string;
  current: number;
  limit: number;
  onSuccess?: () => void;
}

export const useUserPlan = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { language } = useLanguage();
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limitDialog, setLimitDialog] = useState<LimitDialogState>({
    isOpen: false,
    usageType: 'brick',
    featureName: '',
    current: 0,
    limit: 0
  });

  // 获取用户计划信息
  const fetchUserPlan = useCallback(async () => {
    if (!user?.id) return;
    
    // 防止重复调用
    if (loading) {
      // console.log('[useUserPlan] Already loading, skipping duplicate call');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const maxRetries = 3;
    let currentRetry = 0;
    
    const attemptFetch = async (): Promise<void> => {
      try {
        // console.log(`[useUserPlan] Fetching user plan attempt ${currentRetry + 1}/${maxRetries} for user:`, user.id);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时
        
        const response = await fetch('/api/user/plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch user plan`);
        }

        const userData = await response.json();
        setUserPlan(userData.user);
        
        // 保存到localStorage，并记录缓存时间
        if (typeof window !== 'undefined') {
          localStorage.setItem('userPlan', JSON.stringify(userData.user));
          localStorage.setItem('userPlanCacheTime', Date.now().toString());
        }
        
        // console.log('[useUserPlan] Successfully fetched user plan:', userData.user);
      } catch (err) {
        currentRetry++;
        
        // 如果是超时或网络错误，且还有重试次数，则重试
        if (currentRetry < maxRetries && 
            (err instanceof Error && 
             (err.name === 'AbortError' || 
              err.message.includes('fetch failed') || 
              err.message.includes('network') ||
              err.message.includes('连接') ||
              err.message.includes('timeout')))) {
          
          // console.warn(`[useUserPlan] Attempt ${currentRetry} failed, retrying in ${currentRetry * 1000}ms...`, err.message);
          
          // 指数退避重试
          await new Promise(resolve => setTimeout(resolve, currentRetry * 1000));
          return attemptFetch();
        }
        
        // 所有重试都失败了，或者是非网络错误
        // console.error('[useUserPlan] Failed to fetch user plan after all retries:', err);
        
        // 检查是否有缓存的数据可以使用
        if (typeof window !== 'undefined') {
          const cachedPlan = localStorage.getItem('userPlan');
          if (cachedPlan) {
            try {
              // console.log('[useUserPlan] Using cached user plan due to fetch failure');
              const parsedPlan = JSON.parse(cachedPlan);
              setUserPlan(parsedPlan);
              // 设置一个较温和的错误信息，表示正在使用缓存数据
              setError('网络连接不稳定，正在使用缓存数据');
              return;
            } catch (parseErr) {
              // console.error('[useUserPlan] Failed to parse cached plan:', parseErr);
            }
          }
        }
        
        // 如果没有缓存数据，显示错误
        const errorMessage = err instanceof Error ? err.message : '未知错误';
        setError(errorMessage);
      }
    };
    
    try {
      await attemptFetch();
    } catch (err) {
      // console.error('[useUserPlan] Unexpected error in fetchUserPlan:', err);
      setError('获取用户计划时发生意外错误');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // 检查使用限制
  const checkUsageLimit = useCallback(async (usageType: 'brick' | 'video'): Promise<UsageCheck> => {
    if (!user?.id) {
      return { allowed: false, current: 0, limit: 0, unlimited: false, error: '用户未登录' };
    }

    try {
      const response = await fetch('/api/usage/check-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          usageType,
        }),
      });

      if (!response.ok) {
        throw new Error('检查使用限制失败');
      }

      return await response.json();
    } catch (err) {
      // console.error('检查使用限制错误:', err);
      return { 
        allowed: false, 
        current: 0, 
        limit: 0, 
        unlimited: false, 
        error: err instanceof Error ? err.message : '未知错误' 
      };
    }
  }, [user?.id]);

  // 增加使用量
  const incrementUsage = useCallback(async (usageType: 'brick' | 'video', amount: number = 1) => {
    if (!user?.id) {
      throw new Error('用户未登录');
    }

    try {
      const response = await fetch('/api/usage/increment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          usageType,
          amount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '增加使用量失败');
      }

      const result = await response.json();
      
      // 更新本地状态
      if (userPlan) {
        const updatedPlan = { ...userPlan };
        if (usageType === 'brick') {
          updatedPlan.user_monthly_brick_use = result.new_usage;
        } else {
          updatedPlan.user_monthly_video_use = result.new_usage;
        }
        setUserPlan(updatedPlan);
        
        // 更新localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('userPlan', JSON.stringify(updatedPlan));
        }
      }

      return result;
    } catch (err) {
      // console.error('增加使用量错误:', err);
      throw err;
    }
  }, [user?.id, userPlan]);

  // 检查并处理使用限制 - 显示美观的对话框而不是alert
  const checkAndHandleUsage = useCallback(async (
    usageType: 'brick' | 'video',
    featureName: string,
    onSuccess: () => void
  ) => {
    try {
      const usageCheck = await checkUsageLimit(usageType);
      
      if (!usageCheck.allowed) {
        // 显示限制对话框
        setLimitDialog({
          isOpen: true,
          usageType,
          featureName,
          current: usageCheck.current,
          limit: usageCheck.limit,
          onSuccess
        });
        
        return false;
      }

      // 使用量检查通过，增加使用量并执行成功回调
      await incrementUsage(usageType);
      onSuccess();
      return true;
    } catch (err) {
      // console.error('检查和处理使用量错误:', err);
      // 可以在这里添加错误处理的对话框
      return false;
    }
  }, [checkUsageLimit, incrementUsage]);

  // 关闭限制对话框
  const closeLimitDialog = useCallback(() => {
    setLimitDialog(prev => ({ ...prev, isOpen: false }));
  }, []);

  // 获取计划配置
  const getPlanConfig = useCallback((plan: 'free' | 'premium' | 'lifetime'): PlanConfig => {
    const configs = {
      free: {
        name: language === 'zh' ? '免费用户' : 'Free User',
        brick_limit: 3,
        video_limit: 3,
        price: 0,
        features: language === 'zh' 
          ? ['基础功能', '每月3次食谱筛选', '每月3次视频分析']
          : ['Basic features', '3 recipe filters/month', '3 video analyses/month']
      },
      premium: {
        name: language === 'zh' ? '高级会员' : 'Premium Member',
        brick_limit: -1, // 无限制
        video_limit: 100,
        monthly_price: 9.99,
        yearly_price: 89.99,
        features: language === 'zh' 
          ? ['无限食谱筛选', '每月100次视频分析', '优先支持']
          : ['Unlimited recipe filters', '100 video analyses/month', 'Priority support']
      },
      lifetime: {
        name: language === 'zh' ? '终身会员' : 'Lifetime Member',
        brick_limit: -1,
        video_limit: -1,
        price: 249.00,
        features: language === 'zh' 
          ? ['无限制使用所有功能', '终身更新', '优先支持']
          : ['Unlimited access to all features', 'Lifetime updates', 'Priority support']
      }
    };

    return configs[plan];
  }, [language]);

  // 初始化时获取用户计划
  useEffect(() => {
    if (user?.id) {
      // console.log('[useUserPlan] User ID changed, checking user plan for:', user.id);
      
      // 先尝试从localStorage获取
      if (typeof window !== 'undefined') {
        const cachedPlan = localStorage.getItem('userPlan');
        if (cachedPlan) {
          try {
            const parsedPlan = JSON.parse(cachedPlan);
            // 检查缓存是否是当前用户的，且不超过5分钟
            if (parsedPlan.id === user.id) {
              const cacheTime = localStorage.getItem('userPlanCacheTime');
              const now = Date.now();
              const fiveMinutes = 5 * 60 * 1000;
              
              if (cacheTime && (now - parseInt(cacheTime)) < fiveMinutes) {
                // console.log('[useUserPlan] Using fresh cached user plan');
                setUserPlan(parsedPlan);
                setLoading(false);
                return; // 使用缓存，不需要从服务器获取
              } else {
                // console.log('[useUserPlan] Cached plan expired, fetching from server');
                localStorage.removeItem('userPlan');
              }
            } else {
              // console.log('[useUserPlan] Cached plan is for different user, fetching from server');
              localStorage.removeItem('userPlan');
            }
          } catch (err) {
            // console.error('[useUserPlan] Failed to parse cached plan:', err);
          }
        }
      }
      
      // 从服务器获取最新数据
      fetchUserPlan();
    } else {
      // console.log('[useUserPlan] No user ID, clearing user plan');
      setUserPlan(null);
      setLoading(false);
      // 清除缓存
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userPlan');
        localStorage.removeItem('userPlanCacheTime');
      }
    }
  }, [user?.id, fetchUserPlan]);

  return {
    userPlan,
    loading,
    error,
    fetchUserPlan,
    checkUsageLimit,
    incrementUsage,
    checkAndHandleUsage,
    getPlanConfig,
    limitDialog,
    closeLimitDialog
  };
}; 