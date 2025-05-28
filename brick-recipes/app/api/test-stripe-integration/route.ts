import { NextRequest, NextResponse } from 'next/server';
import { StripeIntegration } from '../webhooks/stipeIntergration';

export async function POST(request: NextRequest) {
  try {
    console.log('开始测试Stripe集成...');
    
    const { step, email } = await request.json();
    
    const stripeIntegration = new StripeIntegration();
    console.log('StripeIntegration实例创建成功');

    switch (step) {
      case 'check_env':
        console.log('检查环境变量...');
        return NextResponse.json({
          success: true,
          env: {
            STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? '已设置' : '未设置',
            STRIPE_PREMIUM_MONTHLY_PRICE_ID: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || '未设置',
            STRIPE_PREMIUM_YEARLY_PRICE_ID: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || '未设置',
            STRIPE_LIFETIME_PRICE_ID: process.env.STRIPE_LIFETIME_PRICE_ID || '未设置',
            STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? '已设置' : '未设置'
          }
        });

      case 'create_customer':
        console.log('测试创建客户...');
        const customerId = await stripeIntegration.createCustomer('test-user-id', email);
        return NextResponse.json({
          success: !!customerId,
          customerId,
          message: customerId ? '客户创建成功' : '客户创建失败'
        });

      case 'get_or_create_customer':
        console.log('测试获取或创建客户...');
        const customerIdResult = await stripeIntegration.getOrCreateCustomer('test-user-id-2', email);
        return NextResponse.json({
          success: !!customerIdResult,
          customerId: customerIdResult,
          message: customerIdResult ? '客户获取/创建成功' : '客户获取/创建失败'
        });

      case 'full_checkout':
        console.log('测试完整结账流程...');
        const session = await stripeIntegration.createCheckoutSession({
          userId: 'test-user-id-3',
          plan: 'premium',
          period: 'monthly',
          email,
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel'
        });
        
        return NextResponse.json({
          success: !!session,
          sessionId: session?.id,
          sessionUrl: session?.url,
          message: session ? '结账会话创建成功' : '结账会话创建失败'
        });

      default:
        return NextResponse.json({
          success: false,
          message: '无效的测试步骤'
        });
    }

  } catch (error) {
    console.error('Stripe集成测试失败:', error);
    return NextResponse.json({
      error: 'Stripe集成测试失败',
      details: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 