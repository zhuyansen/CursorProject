import { NextRequest, NextResponse } from 'next/server';
import { StripeIntegration } from '../../webhooks/stipeIntergration';
import { UserService } from '../../../../lib/userService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: '缺少必需参数: userId' },
        { status: 400 }
      );
    }

    // 获取用户信息
    const userService = new UserService();
    const user = await userService.getUser(userId);

    if (!user || !user.customer_id) {
      return NextResponse.json(
        { error: '用户不存在或没有Stripe客户ID' },
        { status: 404 }
      );
    }

    // 创建StripeIntegration实例
    const stripeIntegration = new StripeIntegration();

    // 创建客户门户会话
    const portalUrl = await stripeIntegration.createPortalSession(
      user.customer_id,
      `${process.env.NEXT_PUBLIC_APP_URL}/pricing`
    );

    if (!portalUrl) {
      return NextResponse.json(
        { error: '无法创建客户门户会话' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: portalUrl,
    });
  } catch (error) {
    console.error('创建客户门户会话错误:', error);
    return NextResponse.json(
      { error: '内部服务器错误' },
      { status: 500 }
    );
  }
} 