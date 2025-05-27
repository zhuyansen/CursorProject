// lib/stripeIntegration.ts
import Stripe from 'stripe';
import { UserService, PlanType, SubscriptionPeriod } from '../../../lib/userService';

export interface PriceConfig {
  monthly: string;
  yearly: string;
}

export interface ProductConfig {
  premium: PriceConfig;
  lifetime: {
    oneTime: string;
  };
}

export interface CheckoutSessionData {
  userId: string;
  plan: PlanType;
  period: SubscriptionPeriod;
  email: string;
  successUrl: string;
  cancelUrl: string;
}

export interface SubscriptionUpdateData {
  userId: string;
  plan: PlanType;
  period: SubscriptionPeriod;
  stripeSubscriptionId: string;
  stripePriceId: string;
  startDate: Date;
  endDate: Date;
}

export class StripeIntegration {
  private stripe: Stripe;
  private userService: UserService;
  private webhookSecret: string;
  
  // Stripe价格ID配置 - 需要在Stripe Dashboard中创建
  private priceIds: ProductConfig = {
    premium: {
      monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID!,
      yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID!,
    },
    lifetime: {
      oneTime: process.env.STRIPE_LIFETIME_PRICE_ID!,
    }
  };

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    this.userService = new UserService();
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  }

  // 创建Stripe客户
  async createCustomer(userId: string, email: string, name?: string): Promise<string | null> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          userId: userId,
        },
      });

      // 更新用户的customer_id
      await this.userService.updateUserCustomerId(userId, customer.id);
      
      return customer.id;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      return null;
    }
  }

  // 获取或创建Stripe客户
  async getOrCreateCustomer(userId: string, email: string, name?: string): Promise<string | null> {
    // 首先尝试从数据库获取
    const user = await this.userService.getUser(userId);
    if (user?.customer_id) {
      return user.customer_id;
    }

    // 如果没有，创建新客户
    return await this.createCustomer(userId, email, name);
  }

  // 创建结账会话
  async createCheckoutSession(data: CheckoutSessionData): Promise<Stripe.Checkout.Session | null> {
    try {
      const user = await this.userService.getUser(data.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // 获取价格ID
      const priceId = this.getPriceId(data.plan, data.period);
      if (!priceId) {
        throw new Error('Invalid plan or period');
      }

      // 获取或创建客户
      const customerId = await this.getOrCreateCustomer(data.userId, data.email);
      if (!customerId) {
        throw new Error('Failed to create customer');
      }

      const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: data.successUrl,
        cancel_url: data.cancelUrl,
        metadata: {
          userId: data.userId,
          plan: data.plan,
          period: data.period,
        },
      };

      // 根据计划类型设置模式
      if (data.plan === 'lifetime') {
        sessionConfig.mode = 'payment';
      } else {
        sessionConfig.mode = 'subscription';
        sessionConfig.subscription_data = {
          metadata: {
            userId: data.userId,
            plan: data.plan,
            period: data.period,
          },
        };
      }

      const session = await this.stripe.checkout.sessions.create(sessionConfig);
      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return null;
    }
  }

  // 创建客户门户会话
  async createPortalSession(customerId: string, returnUrl: string): Promise<string | null> {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return session.url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      return null;
    }
  }

  // 取消订阅
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      return true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }
  }

  // 立即取消订阅
  async cancelSubscriptionImmediately(subscriptionId: string): Promise<boolean> {
    try {
      await this.stripe.subscriptions.cancel(subscriptionId);
      return true;
    } catch (error) {
      console.error('Error canceling subscription immediately:', error);
      return false;
    }
  }

  // 处理Webhook事件
  async handleWebhook(body: string, signature: string): Promise<{ success: boolean; message: string }> {
    try {
      const event = this.stripe.webhooks.constructEvent(body, signature, this.webhookSecret);

      console.log(`Received webhook event: ${event.type}`);

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      console.error('Webhook error:', error);
      return { success: false, message: 'Webhook processing failed' };
    }
  }

  // 处理结账完成
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    console.log('Processing checkout completed:', session.id);
    
    let userId = session.metadata?.userId;
    let plan = session.metadata?.plan as PlanType;
    let period = session.metadata?.period as SubscriptionPeriod;

    // 如果没有metadata，尝试从customer信息获取用户ID
    if (!userId && session.customer) {
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
      const foundUserId = await this.userService.getUserByStripeCustomerId(customerId);
      if (foundUserId) {
        userId = foundUserId;
      }
    }

    // 如果仍然没有userId，记录警告但继续处理
    if (!userId) {
      console.warn('No userId found for checkout session:', session.id);
      console.warn('Customer:', session.customer);
      return;
    }

    // 如果没有plan信息，尝试从price ID推断
    if (!plan || !period) {
      const lineItems = session.line_items?.data || [];
      if (lineItems.length > 0) {
        const priceId = lineItems[0].price?.id;
        const planInfo = this.getPlanFromPriceId(priceId || '');
        if (planInfo) {
          plan = planInfo.plan;
          period = planInfo.period;
          console.log(`Inferred plan from price ID ${priceId}: ${plan} (${period})`);
        }
      }
    }

    // 如果还是没有plan信息，尝试从subscription获取
    if ((!plan || !period) && session.subscription) {
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price.id;
      const planInfo = this.getPlanFromPriceId(priceId || '');
      if (planInfo) {
        plan = planInfo.plan;
        period = planInfo.period;
        console.log(`Inferred plan from subscription ${subscriptionId}: ${plan} (${period})`);
      }
    }

    if (!plan || !period) {
      console.error('Could not determine plan and period for checkout session:', session.id);
      return;
    }

    console.log(`Processing checkout for user ${userId}, plan: ${plan}, period: ${period}`);

    if (plan === 'lifetime') {
      // 终身会员处理
      await this.handleLifetimePurchase(userId, session);
    }
    // 订阅会员会在subscription.created事件中处理
  }

  // 根据价格ID推断计划类型
  private getPlanFromPriceId(priceId: string): { plan: PlanType; period: SubscriptionPeriod } | null {
    // 检查是否是我们配置的价格ID
    if (priceId === this.priceIds.premium.monthly) {
      return { plan: 'premium', period: 'monthly' };
    }
    if (priceId === this.priceIds.premium.yearly) {
      return { plan: 'premium', period: 'yearly' };
    }
    if (priceId === this.priceIds.lifetime.oneTime) {
      return { plan: 'lifetime', period: 'one_time_purchase' };
    }

    // 如果不是我们的价格ID，记录警告
    console.warn('Unknown price ID:', priceId);
    return null;
  }

  // 处理终身会员购买
  private async handleLifetimePurchase(userId: string, session: Stripe.Checkout.Session): Promise<void> {
    try {
      // 更新用户计划
      await this.userService.updateUserPlan(userId, 'lifetime');

      // 创建订阅记录（终身）
      const endDate = new Date('2099-12-31'); // 设置一个很远的过期日期
      await this.userService.createSubscription({
        user_id: userId,
        plan: 'lifetime',
        period: 'one_time_purchase',
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        stripe_subscription_id: session.id, // 使用session ID
        stripe_price_id: this.priceIds.lifetime.oneTime,
        status: 'active',
      });

      console.log(`Lifetime subscription activated for user: ${userId}`);
    } catch (error) {
      console.error('Error handling lifetime purchase:', error);
    }
  }

  // 处理订阅创建
  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata?.userId;
    const plan = subscription.metadata?.plan as PlanType;
    const period = subscription.metadata?.period as SubscriptionPeriod;

    if (!userId || !plan || !period) {
      console.error('Missing metadata in subscription');
      return;
    }

    try {
      // 更新用户计划
      await this.userService.updateUserPlan(userId, plan);

      // 验证日期值
      const startTimestamp = (subscription as any).current_period_start;
      const endTimestamp = (subscription as any).current_period_end;
      
      if (!startTimestamp || !endTimestamp) {
        console.error('Invalid timestamp values in subscription:', subscription.id);
        return;
      }

      // 安全地转换时间戳
      const startDate = new Date(startTimestamp * 1000);
      const endDate = new Date(endTimestamp * 1000);
      
      // 验证日期对象是否有效
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Invalid dates calculated for subscription:', subscription.id);
        console.error('Start timestamp:', startTimestamp, 'End timestamp:', endTimestamp);
        return;
      }

      // 创建订阅记录
      const priceId = subscription.items.data[0]?.price.id;
      await this.userService.createSubscription({
        user_id: userId,
        plan: plan,
        period: period,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        status: 'active',
      });

      console.log(`Subscription created for user: ${userId}, plan: ${plan}`);
    } catch (error) {
      console.error('Error handling subscription creation:', error);
    }
  }

  // 处理订阅更新
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const userId = await this.userService.getUserByStripeSubscriptionId(subscription.id);
    if (!userId) {
      console.error('User not found for subscription:', subscription.id);
      return;
    }

    try {
      // 更新订阅状态
      let status: 'active' | 'cancelled' | 'expired' | 'past_due' = 'active';
      
      if (subscription.status === 'canceled') {
        status = 'cancelled';
      } else if (subscription.status === 'past_due') {
        status = 'past_due';
      }

      const userSubscription = await this.userService.getUserSubscription(userId);
      if (userSubscription) {
        await this.userService.updateSubscriptionStatus(userSubscription.id, status);
      }

      // 如果订阅被取消，降级用户
      if (status === 'cancelled') {
        await this.userService.updateUserPlan(userId, 'free');
      }

      console.log(`Subscription updated for user: ${userId}, status: ${status}`);
    } catch (error) {
      console.error('Error handling subscription update:', error);
    }
  }

  // 处理订阅删除
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const userId = await this.userService.getUserByStripeSubscriptionId(subscription.id);
    if (!userId) {
      console.error('User not found for subscription:', subscription.id);
      return;
    }

    try {
      // 更新订阅状态为取消
      const userSubscription = await this.userService.getUserSubscription(userId);
      if (userSubscription) {
        await this.userService.updateSubscriptionStatus(userSubscription.id, 'cancelled');
      }

      // 降级用户到免费计划
      await this.userService.updateUserPlan(userId, 'free');

      console.log(`Subscription deleted for user: ${userId}`);
    } catch (error) {
      console.error('Error handling subscription deletion:', error);
    }
  }

  // 处理付款成功
  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    if (!(invoice as any).subscription) return;

    const userId = await this.userService.getUserByStripeSubscriptionId((invoice as any).subscription as string);
    if (!userId) {
      console.error('User not found for subscription:', (invoice as any).subscription);
      return;
    }

    console.log(`Payment succeeded for user: ${userId}`);
    // 可以在这里添加其他逻辑，如发送邮件通知等
  }

  // 处理付款失败
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    if (!(invoice as any).subscription) return;

    const userId = await this.userService.getUserByStripeSubscriptionId((invoice as any).subscription as string);
    if (!userId) {
      console.error('User not found for subscription:', (invoice as any).subscription);
      return;
    }

    try {
      // 更新订阅状态为逾期
      const userSubscription = await this.userService.getUserSubscription(userId);
      if (userSubscription) {
        await this.userService.updateSubscriptionStatus(userSubscription.id, 'past_due');
      }

      console.log(`Payment failed for user: ${userId}`);
      // 可以在这里添加其他逻辑，如发送邮件通知等
    } catch (error) {
      console.error('Error handling payment failure:', error);
    }
  }

  // 获取价格ID
  private getPriceId(plan: PlanType, period: SubscriptionPeriod): string | null {
    switch (plan) {
      case 'premium':
        return period === 'monthly' ? this.priceIds.premium.monthly : this.priceIds.premium.yearly;
      case 'lifetime':
        return this.priceIds.lifetime.oneTime;
      default:
        return null;
    }
  }

  // 获取订阅详情
  async getSubscriptionDetails(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      return null;
    }
  }

  // 预览即将到来的发票
  async previewUpcomingInvoice(customerId: string): Promise<Stripe.Invoice | null> {
    try {
      const invoice = await (this.stripe.invoices as any).retrieveUpcoming({
        customer: customerId,
      });
      return invoice;
    } catch (error) {
      console.error('Error retrieving upcoming invoice:', error);
      return null;
    }
  }

  // 更新订阅价格
  async updateSubscriptionPrice(subscriptionId: string, newPriceId: string): Promise<boolean> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      
      await this.stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
      });

      return true;
    } catch (error) {
      console.error('Error updating subscription price:', error);
      return false;
    }
  }

  // 获取计划价格信息
  getPlanPricing() {
    return {
      premium: {
        monthly: {
          priceId: this.priceIds.premium.monthly,
          amount: 999, // $9.99
          currency: 'usd',
          interval: 'month',
        },
        yearly: {
          priceId: this.priceIds.premium.yearly,
          amount: 8999, // $89.99
          currency: 'usd',
          interval: 'year',
        },
      },
      lifetime: {
        priceId: this.priceIds.lifetime.oneTime,
        amount: 24900, // $249.00
        currency: 'usd',
        interval: 'one_time',
      },
    };
  }

  // 检查并处理过期订阅
  async processExpiredSubscriptions(): Promise<void> {
    try {
      await this.userService.checkExpiredSubscriptions();
      console.log('Expired subscriptions processed');
    } catch (error) {
      console.error('Error processing expired subscriptions:', error);
    }
  }
}