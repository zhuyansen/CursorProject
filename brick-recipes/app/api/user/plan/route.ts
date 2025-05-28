import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 获取用户计划信息
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: '缺少用户ID' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 获取用户计划信息
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('获取用户计划错误:', error);
      return NextResponse.json(
        { error: '获取用户计划失败', details: error.message },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('获取用户计划错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 更新用户计划
export async function PUT(request: NextRequest) {
  try {
    const { userId, plan } = await request.json();

    if (!userId || !plan) {
      return NextResponse.json(
        { error: '缺少必需参数' },
        { status: 400 }
      );
    }

    if (!['free', 'premium', 'lifetime'].includes(plan)) {
      return NextResponse.json(
        { error: '无效的计划类型' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 使用数据库函数更新用户计划
    const { error } = await supabase.rpc('update_user_plan', {
      user_uuid: userId,
      new_plan: plan
    });

    if (error) {
      console.error('更新用户计划错误:', error);
      return NextResponse.json(
        { error: '更新用户计划失败', details: error.message },
        { status: 500 }
      );
    }

    // 获取更新后的用户信息
    const { data: updatedUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('获取更新后用户信息错误:', fetchError);
      return NextResponse.json(
        { error: '获取更新后用户信息失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '用户计划更新成功',
      user: updatedUser,
    });
  } catch (error) {
    console.error('更新用户计划错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 