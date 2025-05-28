import { useState, useCallback } from 'react';
import { PlanType, SubscriptionPeriod } from '../lib/userService';

interface PaymentHookResult {
  loading: boolean;
  error: string | null;
  createCheckoutSession: (params: {
    userId: string;
    plan: PlanType;
    period: SubscriptionPeriod;
    email: string;
    locale?: string;
  }) => Promise<{ url: string } | null>;
  createPortalSession: (userId: string) => Promise<{ url: string } | null>;
  getUserStatus: (userId: string) => Promise<any>;
  checkUsage: (params: {
    userId: string;
    usageType: 'brick' | 'video';
    amount?: number;
  }) => Promise<any>;
}

export const usePayment = (): PaymentHookResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckoutSession = useCallback(async (params: {
    userId: string;
    plan: PlanType;
    period: SubscriptionPeriod;
    email: string;
    locale?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payment/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '创建支付会话失败');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建支付会话失败';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createPortalSession = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payment/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '创建客户门户会话失败');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建客户门户会话失败';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserStatus = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/user/status?userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '获取用户状态失败');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取用户状态失败';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkUsage = useCallback(async (params: {
    userId: string;
    usageType: 'brick' | 'video';
    amount?: number;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '检查使用量失败');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '检查使用量失败';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createCheckoutSession,
    createPortalSession,
    getUserStatus,
    checkUsage,
  };
}; 