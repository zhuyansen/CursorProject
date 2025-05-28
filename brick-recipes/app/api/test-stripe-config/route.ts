import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const config = {
      hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
      stripeSecretKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 10) + '...',
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      priceIds: {
        monthlyPremium: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
        yearlyPremium: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
        lifetime: process.env.STRIPE_LIFETIME_PRICE_ID,
      },
    };

    // 测试Stripe连接
    let stripeConnectionStatus = 'unknown';
    try {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      await stripe.balance.retrieve();
      stripeConnectionStatus = 'connected';
    } catch (error) {
      stripeConnectionStatus = 'failed: ' + (error instanceof Error ? error.message : 'Unknown error');
    }

    return NextResponse.json({
      config,
      stripeConnectionStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('配置检查错误:', error);
    return NextResponse.json(
      { error: '配置检查失败', details: error instanceof Error ? error.message : 'Unknown error' },
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