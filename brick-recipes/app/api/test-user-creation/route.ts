import { NextRequest, NextResponse } from 'next/server';
import { createUserIfNotExists } from '../webhooks/userCreationHelper';
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

    console.log('开始测试用户创建辅助函数...');
    
    // 生成测试用户ID
    const userId = randomUUID();
    console.log('生成的测试用户ID:', userId);

    // 测试用户创建
    console.log('调用createUserIfNotExists...');
    const result = await createUserIfNotExists(userId, email);
    console.log('用户创建结果:', result);

    if (!result) {
      throw new Error('用户创建失败');
    }

    return NextResponse.json({
      success: true,
      message: '用户创建辅助函数测试成功',
      data: {
        userId,
        email,
        created: result,
      },
    });

  } catch (error) {
    console.error('用户创建测试失败:', error);
    return NextResponse.json(
      { 
        error: '用户创建测试失败', 
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