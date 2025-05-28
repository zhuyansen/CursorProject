import { NextRequest, NextResponse } from 'next/server';
import { StripeIntegration } from '../webhooks/stipeIntergration';

export async function GET() {
  try {
    const stripeIntegration = new StripeIntegration();
    
    // 测试不同的计划和周期组合
    const testCases = [
      { plan: 'premium' as const, period: 'monthly' as const },
      { plan: 'premium' as const, period: 'yearly' as const },
      { plan: 'lifetime' as const, period: 'one_time_purchase' as const },
    ];

    const results = testCases.map(({ plan, period }) => {
      // 使用反射来访问私有方法
      const priceId = (stripeIntegration as any).getPriceId(plan, period);
      return {
        plan,
        period,
        priceId,
        isValid: !!priceId,
      };
    });

    // 检查环境变量
    const envVars = {
      STRIPE_PREMIUM_MONTHLY_PRICE_ID: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
      STRIPE_PREMIUM_YEARLY_PRICE_ID: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
      STRIPE_LIFETIME_PRICE_ID: process.env.STRIPE_LIFETIME_PRICE_ID,
    };

    return NextResponse.json({
      results,
      envVars,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('价格ID测试错误:', error);
    return NextResponse.json(
      { error: '价格ID测试失败', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { message: '请使用 GET 方法调用此端点' },
    { status: 405 }
  );
} 