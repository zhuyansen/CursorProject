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

  // 获取用户计划配置
  const fetchUserPlan = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user plan');
      }

      const userData = await response.json();
      setUserPlan(userData.user);
      
      // 保存到localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('userPlan', JSON.stringify(userData.user));
      }
    } catch (err) {
      console.error('获取用户计划失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
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
      console.error('检查使用限制错误:', err);
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
      console.error('增加使用量错误:', err);
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
      console.error('检查和处理使用量错误:', err);
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
      // 先尝试从localStorage获取
      if (typeof window !== 'undefined') {
        const cachedPlan = localStorage.getItem('userPlan');
        if (cachedPlan) {
          try {
            setUserPlan(JSON.parse(cachedPlan));
          } catch (err) {
            console.error('解析缓存的用户计划失败:', err);
          }
        }
      }
      
      // 然后从服务器获取最新数据
      fetchUserPlan();
    } else {
      setUserPlan(null);
      setLoading(false);
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