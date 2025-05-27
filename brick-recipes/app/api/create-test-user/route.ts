import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: '缺少必需参数: userId, email' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 先检查用户是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: '用户已存在',
        user: existingUser,
      });
    }

    // 创建新用户
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        plan: 'free',
        user_monthly_brick_limit: 3,
        user_monthly_brick_use: 0,
        user_monthly_video_limit: 3,
        user_monthly_video_use: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('创建用户错误:', error);
      return NextResponse.json(
        { error: '创建用户失败', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '用户创建成功',
      user: newUser,
    });
  } catch (error) {
    console.error('创建测试用户错误:', error);
    return NextResponse.json(
      { error: '内部服务器错误', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 