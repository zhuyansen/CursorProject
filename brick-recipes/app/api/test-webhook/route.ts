import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // 获取请求体
    const body = await request.text();
    
    // 获取所有headers
    const headersList = await headers();
    const allHeaders = Object.fromEntries(headersList.entries());
    
    // 返回调试信息
    return NextResponse.json({
      success: true,
      debug: {
        bodyLength: body.length,
        bodyPreview: body.substring(0, 200) + '...',
        headers: allHeaders,
        environment: {
          hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
          hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
          webhookSecretPreview: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 15) + '...',
        },
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Webhook测试端点已就绪',
    usage: 'POST请求到此端点以查看调试信息',
    currentConfig: {
      hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      webhookSecretPreview: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 15) + '...',
    }
  });
} 