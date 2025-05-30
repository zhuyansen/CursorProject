import { NextRequest, NextResponse } from 'next/server';
import { StripeIntegration } from '../webhooks/stipeIntergration';
import { PlanType, SubscriptionPeriod } from '../../../lib/userService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, period, email, locale } = body;

    // 生成一个新的userId（模拟真实用户ID）
    const userId = 'real-user-' + Math.random().toString(36).substr(2, 9);

    // console.log(`模拟真实支付流程 - UserId: ${userId}, Email: ${email}, Plan: ${plan}, Period: ${period}, Locale: ${locale}`);

    // 验证必需参数
    if (!plan || !period || !email) {
      return NextResponse.json(
        { error: '缺少必需参数: plan, period, email' },
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

    // console.log('开始创建StripeIntegration实例...');

    // 创建StripeIntegration实例
    const stripeIntegration = new StripeIntegration();

    // console.log('StripeIntegration实例创建成功，开始创建checkout session...');

    // 注意：这里不会先创建用户记录，直接创建checkout session
    // 这模拟了真实场景下用户直接支付的情况

    // 创建结账会话
    const session = await stripeIntegration.createCheckoutSession({
      userId,
      plan,
      period,
      email,
      locale, // 传递语言参数
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    });

    if (!session) {
      console.error('创建checkout session失败，session为null');
      return NextResponse.json(
        { error: '无法创建结账会话' },
        { status: 500 }
      );
    }

    // console.log(`Checkout session创建成功: ${session.id}`);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      userId: userId, // 返回生成的userId用于测试
      message: '这是真实支付流程测试，用户记录将在支付成功后自动创建',
    });
  } catch (error) {
    console.error('测试真实支付流程错误:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('错误详情:', errorMessage);
    
    return NextResponse.json(
      { error: '内部服务器错误', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: '请使用 POST 方法调用此端点' },
    { status: 405 }
  );
} 