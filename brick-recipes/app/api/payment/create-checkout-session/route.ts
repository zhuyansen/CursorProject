import { NextRequest, NextResponse } from 'next/server';
import { StripeIntegration } from '../../webhooks/stipeIntergration';
import { PlanType, SubscriptionPeriod } from '../../../../lib/userService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, plan, period, email } = body;

    // 验证必需参数
    if (!userId || !plan || !period || !email) {
      return NextResponse.json(
        { error: '缺少必需参数: userId, plan, period, email' },
        { status: 400 }
      );
    }

    // 验证计划类型
    const validPlans: PlanType[] = ['premium', 'lifetime'];
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: '无效的计划类型' },
        { status: 400 }
      );
    }

    // 验证订阅期间
    const validPeriods: SubscriptionPeriod[] = ['monthly', 'yearly', 'one_time_purchase'];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: '无效的订阅期间' },
        { status: 400 }
      );
    }

    // 创建StripeIntegration实例
    const stripeIntegration = new StripeIntegration();

    // 获取或创建Stripe客户
    const customerId = await stripeIntegration.getOrCreateCustomer(userId, email);
    if (!customerId) {
      return NextResponse.json(
        { error: '无法创建Stripe客户' },
        { status: 500 }
      );
    }

    // 创建结账会话
    const session = await stripeIntegration.createCheckoutSession({
      userId,
      plan,
      period,
      email,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    });

    if (!session) {
      return NextResponse.json(
        { error: '无法创建结账会话' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('创建结账会话错误:', error);
    return NextResponse.json(
      { error: '内部服务器错误' },
      { status: 500 }
    );
  }
} 