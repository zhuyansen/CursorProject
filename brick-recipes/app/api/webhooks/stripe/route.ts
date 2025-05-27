import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { StripeIntegration } from '../stipeIntergration';

export async function POST(request: NextRequest) {
  try {
    // 获取请求体
    const body = await request.text();
    
    // 获取Stripe签名
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');
    
    // 添加调试信息
    console.log('=== Webhook调试信息 ===');
    console.log('Body length:', body.length);
    console.log('Signature:', signature);
    console.log('Webhook secret from env:', process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 20) + '...');
    console.log('Headers:', Object.fromEntries(headersList.entries()));
    
    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // 创建StripeIntegration实例并处理webhook
    const stripeIntegration = new StripeIntegration();
    const result = await stripeIntegration.handleWebhook(body, signature);

    if (!result.success) {
      console.error('Webhook processing failed:', result.message);
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: result.message },
      { status: 200 }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 