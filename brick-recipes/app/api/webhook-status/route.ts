import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const status = {
      ngrokUrl: 'https://666e-122-238-128-243.ngrok-free.app',
      webhookEndpoint: '/api/webhooks/stripe',
      fullWebhookUrl: 'https://666e-122-238-128-243.ngrok-free.app/api/webhooks/stripe',
      environment: {
        STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      webhookEvents: [
        'checkout.session.completed',
        'customer.subscription.created', 
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed'
      ],
      testCard: '4242424242424242',
      timestamp: new Date().toISOString(),
      instructions: [
        '1. 确保ngrok隧道正在运行: ngrok http 3007',
        '2. 在Stripe Dashboard中配置webhook URL',
        '3. 选择上述webhook事件',
        '4. 复制webhook签名密钥到环境变量',
        '5. 使用测试页面进行真实支付测试'
      ]
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('获取webhook状态错误:', error);
    return NextResponse.json(
      { error: '获取状态失败', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 