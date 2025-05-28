// lib/userService.ts
import { createClient } from '@supabase/supabase-js';

export type PlanType = 'free' | 'premium' | 'lifetime';
export type SubscriptionPeriod = 'monthly' | 'yearly' | 'one_time_purchase';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'past_due';

export interface User {
  id: string;
  plan: PlanType;
  user_monthly_brick_limit: number;
  user_monthly_brick_use: number;
  user_monthly_video_limit: number;
  user_monthly_video_use: number;
  customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: PlanType;
  period: SubscriptionPeriod;
  start_date: string;
  end_date: string;
  stripe_subscription_id?: string;
  stripe_price_id?: string;
  status: SubscriptionStatus;
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

export interface UsageIncrement {
  success: boolean;
  new_usage?: number;
  message: string;
}

export class UserService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  // 获取用户信息
  async getUser(userId: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  }

  // 更新用户计划
  async updateUserPlan(userId: string, plan: PlanType): Promise<boolean> {
    console.log(`[userService.updateUserPlan] Attempting to update plan for userId: ${userId} to ${plan}`);
    try {
      const { error } = await this.supabase.rpc('update_user_plan', {
        user_uuid: userId,
        new_plan: plan
      });

      if (error) {
        console.error(`[userService.updateUserPlan] Error updating user plan for ${userId} to ${plan}:`, error);
        return false;
      }
      console.log(`[userService.updateUserPlan] Successfully updated plan for userId: ${userId} to ${plan}`);
      return true;
    } catch (error) {
      console.error(`[userService.updateUserPlan] Exception during plan update for ${userId} to ${plan}:`, error);
      return false;
    }
  }

  // 检查使用量限制
  async checkUsageLimit(userId: string, usageType: 'brick' | 'video'): Promise<UsageCheck> {
    try {
      const { data, error } = await this.supabase.rpc('check_usage_limit', {
        user_uuid: userId,
        usage_type: usageType
      });

      if (error) {
        console.error('Error checking usage limit:', error);
        return { allowed: false, current: 0, limit: 0, unlimited: false, error: error.message };
      }

      return data;
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return { allowed: false, current: 0, limit: 0, unlimited: false, error: 'Unknown error' };
    }
  }

  // 增加使用量
  async incrementUsage(userId: string, usageType: 'brick' | 'video', amount: number = 1): Promise<UsageIncrement> {
    try {
      const { data, error } = await this.supabase.rpc('increment_usage', {
        user_uuid: userId,
        usage_type: usageType,
        amount: amount
      });

      if (error) {
        console.error('Error incrementing usage:', error);
        return { success: false, message: error.message };
      }

      return data;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return { success: false, message: 'Unknown error' };
    }
  }

  // 创建订阅
  async createSubscription(subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>): Promise<Subscription | null> {
    console.log(`[userService.createSubscription] Attempting to create subscription record:`, JSON.stringify(subscription, null, 2));
    const { data, error } = await this.supabase
      .from('subscriptions')
      .insert(subscription)
      .select()
      .single();

    if (error) {
      console.error(`[userService.createSubscription] Error creating subscription record:`, error);
      console.error(`[userService.createSubscription] Data attempted for creation:`, JSON.stringify(subscription, null, 2));
      return null;
    }
    console.log(`[userService.createSubscription] Successfully created subscription record:`, JSON.stringify(data, null, 2));
    return data;
  }

  // 获取用户订阅
  async getUserSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data;
  }

  // 更新订阅状态
  async updateSubscriptionStatus(subscriptionId: string, status: SubscriptionStatus): Promise<boolean> {
    const { error } = await this.supabase
      .from('subscriptions')
      .update({ status })
      .eq('id', subscriptionId);

    if (error) {
      console.error('Error updating subscription status:', error);
      return false;
    }

    return true;
  }

  // 根据Stripe订阅ID查找用户
  async getUserByStripeSubscriptionId(stripeSubscriptionId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .single();

    if (error) {
      console.error('Error finding user by stripe subscription ID:', error);
      return null;
    }

    return data?.user_id || null;
  }

  // 根据Stripe客户ID查找用户
  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('id')
      .eq('customer_id', stripeCustomerId)
      .single();

    if (error) {
      console.error('Error finding user by stripe customer ID:', error);
      return null;
    }

    return data?.id || null;
  }

  // 根据邮箱查找用户
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      // 首先通过Auth查找用户
      const { data: authUsers } = await this.supabase.auth.admin.listUsers();
      const authUser = authUsers.users.find(user => user.email === email);
      
      if (!authUser) {
        return null;
      }

      // 然后查找用户记录
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error finding user by email:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  // 更新用户Stripe客户ID
  async updateUserCustomerId(userId: string, customerId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('users')
      .update({ customer_id: customerId })
      .eq('id', userId);

    if (error) {
      console.error('Error updating customer ID:', error);
      return false;
    }

    return true;
  }

  // 重置所有用户的月度使用量（定时任务调用）
  async resetMonthlyUsage(): Promise<boolean> {
    try {
      const { error } = await this.supabase.rpc('reset_monthly_usage');
      
      if (error) {
        console.error('Error resetting monthly usage:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error resetting monthly usage:', error);
      return false;
    }
  }

  // 获取用户统计信息
  async getUserStats(userId: string): Promise<{
    plan: PlanType;
    brick_usage: { current: number; limit: number; unlimited: boolean };
    video_usage: { current: number; limit: number; unlimited: boolean };
  } | null> {
    const user = await this.getUser(userId);
    if (!user) return null;

    return {
      plan: user.plan,
      brick_usage: {
        current: user.user_monthly_brick_use,
        limit: user.user_monthly_brick_limit,
        unlimited: user.user_monthly_brick_limit === -1
      },
      video_usage: {
        current: user.user_monthly_video_use,
        limit: user.user_monthly_video_limit,
        unlimited: user.user_monthly_video_limit === -1
      }
    };
  }

  // 检查订阅是否过期
  async checkExpiredSubscriptions(): Promise<void> {
    const { data: expiredSubscriptions, error } = await this.supabase
      .from('subscriptions')
      .select('id, user_id')
      .eq('status', 'active')
      .lt('end_date', new Date().toISOString());

    if (error) {
      console.error('Error checking expired subscriptions:', error);
      return;
    }

    // 更新过期订阅状态并降级用户
    for (const subscription of expiredSubscriptions) {
      await this.updateSubscriptionStatus(subscription.id, 'expired');
      await this.updateUserPlan(subscription.user_id, 'free');
    }
  }

  // 获取计划配置
  getPlanConfig(plan: PlanType) {
    const configs = {
      free: {
        name: '免费用户',
        brick_limit: 3,
        video_limit: 3,
        price: 0,
        features: ['基础功能']
      },
      premium: {
        name: '高级会员',
        brick_limit: -1, // 无限制
        video_limit: 100,
        monthly_price: 9.99,
        yearly_price: 89.99,
        features: ['无限bricklinkrecipes', '每月100次videotorecipes', '优先支持']
      },
      lifetime: {
        name: '终身会员',
        brick_limit: -1,
        video_limit: -1,
        price: 249.00,
        features: ['无限制使用所有功能', '终身更新', '优先支持']
      }
    };

    return configs[plan];
  }

  // 根据Stripe订阅ID查找订阅记录
  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null> {
    console.log(`[userService.getSubscriptionByStripeId] Attempting to find subscription by stripe_subscription_id: ${stripeSubscriptionId}`);
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .maybeSingle(); // Use maybeSingle() to handle 0 or 1 row without erroring on 0

    if (error) {
      console.error(`[userService.getSubscriptionByStripeId] Error finding subscription by stripe_subscription_id ${stripeSubscriptionId}:`, error);
      return null;
    }
    if (data) {
      console.log(`[userService.getSubscriptionByStripeId] Found existing subscription:`, data);
    } else {
      console.log(`[userService.getSubscriptionByStripeId] No existing subscription found for stripe_subscription_id: ${stripeSubscriptionId}`);
    }
    return data;
  }

  // 更新现有订阅记录
  async updateSubscription(subscriptionDbId: string, subscriptionData: Partial<Omit<Subscription, 'id' | 'created_at' | 'updated_at'>>): Promise<Subscription | null> {
    console.log(`[userService.updateSubscription] Attempting to update subscription with DB ID: ${subscriptionDbId}. Data:`, JSON.stringify(subscriptionData, null, 2));
    // Ensure `updated_at` is set automatically by Supabase or manually if needed
    const dataToUpdate = {
      ...subscriptionData,
      updated_at: new Date().toISOString(), // Explicitly set updated_at
    };

    const { data, error } = await this.supabase
      .from('subscriptions')
      .update(dataToUpdate)
      .eq('id', subscriptionDbId)
      .select()
      .single();

    if (error) {
      console.error(`[userService.updateSubscription] Error updating subscription DB ID ${subscriptionDbId}:`, error);
      return null;
    }
    console.log(`[userService.updateSubscription] Successfully updated subscription DB ID ${subscriptionDbId}:`, data);
    return data;
  }
}