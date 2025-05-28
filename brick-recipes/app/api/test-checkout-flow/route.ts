import { NextRequest, NextResponse } from 'next/server';
import { StripeIntegration } from '../webhooks/stipeIntergration';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: '缺少必需参数: email' },
        { status: 400 }
      );
    }

    console.log('开始详细测试checkout流程...');
    
    // 生成测试用户ID
    const userId = randomUUID();
    console.log('生成的测试用户ID:', userId);

    // 创建StripeIntegration实例
    console.log('创建StripeIntegration实例...');
    const stripeIntegration = new StripeIntegration();
    console.log('StripeIntegration实例创建成功');

    // 测试步骤1: 获取价格ID
    console.log('步骤1: 测试获取价格ID...');
    const priceId = (stripeIntegration as any).getPriceId('premium', 'monthly');
    console.log('价格ID:', priceId);
    if (!priceId) {
      throw new Error('获取价格ID失败');
    }

    // 测试步骤2: 创建或获取客户
    console.log('步骤2: 测试创建或获取客户...');
    const customerId = await stripeIntegration.getOrCreateCustomer(userId, email);
    console.log('客户ID:', customerId);
    if (!customerId) {
      throw new Error('创建或获取客户失败');
    }

    // 测试步骤3: 验证用户记录
    console.log('步骤3: 验证用户记录...');
    const { UserService } = await import('../../../lib/userService');
    const userService = new UserService();
    const user = await userService.getUser(userId);
    console.log('用户记录:', user ? '存在' : '不存在');
    if (!user) {
      throw new Error('用户记录不存在');
    }

    // 测试步骤4: 创建checkout session
    console.log('步骤4: 测试创建checkout session...');
    const checkoutData = {
      userId,
      plan: 'premium' as const,
      period: 'monthly' as const,
      email,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
    };
    
    console.log('Checkout数据:', checkoutData);
    const session = await stripeIntegration.createCheckoutSession(checkoutData);
    console.log('Checkout session:', session ? '创建成功' : '创建失败');
    
    if (!session) {
      throw new Error('创建checkout session失败');
    }

    return NextResponse.json({
      success: true,
      message: '所有步骤都成功完成',
      data: {
        userId,
        customerId,
        priceId,
        sessionId: session.id,
        sessionUrl: session.url,
      },
    });

  } catch (error) {
    console.error('详细测试失败:', error);
    return NextResponse.json(
      { 
        error: '详细测试失败', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: '请使用 POST 方法调用此端点，并提供 email 参数' },
    { status: 405 }
  );
} 