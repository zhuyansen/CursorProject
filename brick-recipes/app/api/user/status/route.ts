import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '../../../../lib/userService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: '缺少必需参数: userId' },
        { status: 400 }
      );
    }

    const userService = new UserService();

    // 获取用户基本信息
    const user = await userService.getUser(userId);
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 获取用户统计信息
    const stats = await userService.getUserStats(userId);
    if (!stats) {
      return NextResponse.json(
        { error: '无法获取用户统计信息' },
        { status: 500 }
      );
    }

    // 获取用户订阅信息
    const subscription = await userService.getUserSubscription(userId);

    // 获取计划配置
    const planConfig = userService.getPlanConfig(user.plan);

    return NextResponse.json({
      user: {
        id: user.id,
        plan: user.plan,
        customer_id: user.customer_id,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      stats,
      subscription,
      planConfig,
    });
  } catch (error) {
    console.error('获取用户状态错误:', error);
    return NextResponse.json(
      { error: '内部服务器错误' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, usageType, amount } = body;

    if (!userId || !usageType) {
      return NextResponse.json(
        { error: '缺少必需参数: userId, usageType' },
        { status: 400 }
      );
    }

    const userService = new UserService();

    // 检查使用量限制
    const usageCheck = await userService.checkUsageLimit(userId, usageType);
    
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { 
          error: '使用量已达到限制',
          current: usageCheck.current,
          limit: usageCheck.limit,
          unlimited: usageCheck.unlimited
        },
        { status: 403 }
      );
    }

    // 如果提供了amount参数，增加使用量
    if (amount) {
      const incrementResult = await userService.incrementUsage(userId, usageType, amount);
      return NextResponse.json(incrementResult);
    }

    return NextResponse.json(usageCheck);
  } catch (error) {
    console.error('处理使用量错误:', error);
    return NextResponse.json(
      { error: '内部服务器错误' },
      { status: 500 }
    );
  }
} 