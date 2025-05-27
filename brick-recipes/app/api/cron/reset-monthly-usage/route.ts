import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '../../../../lib/userService';

export async function POST(request: NextRequest) {
  try {
    // 验证定时任务密钥
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (token !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const userService = new UserService();
    const success = await userService.resetMonthlyUsage();

    if (success) {
      return NextResponse.json({
        success: true,
        message: '月度使用量重置成功',
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json({
        success: false,
        error: '月度使用量重置失败',
      }, { status: 500 });
    }
  } catch (error) {
    console.error('重置月度使用量错误:', error);
    return NextResponse.json({
      success: false,
      error: '服务器内部错误',
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { message: '请使用 POST 方法调用此端点' },
    { status: 405 }
  );
} 