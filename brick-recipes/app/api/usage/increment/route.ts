import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '../../../../lib/userService';

export async function POST(request: NextRequest) {
  try {
    const { userId, usageType, amount = 1 } = await request.json();
    
    if (!userId || !usageType) {
      return NextResponse.json(
        { error: '缺少必需参数' },
        { status: 400 }
      );
    }

    if (!['brick', 'video'].includes(usageType)) {
      return NextResponse.json(
        { error: '无效的使用类型' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount < 1) {
      return NextResponse.json(
        { error: '无效的增加数量' },
        { status: 400 }
      );
    }

    const userService = new UserService();
    const result = await userService.incrementUsage(userId, usageType, amount);

    return NextResponse.json(result);
  } catch (error) {
    console.error('增加使用量错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 