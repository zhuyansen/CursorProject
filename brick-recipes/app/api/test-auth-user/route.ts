import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

    console.log('开始测试Auth用户创建...');
    
    // 创建Supabase客户端（使用服务角色密钥）
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 生成随机密码
    const password = randomUUID();
    console.log('生成的临时密码:', password.substring(0, 8) + '...');

    // 尝试创建Auth用户
    console.log('创建Auth用户...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 自动确认邮箱
    });

    if (authError) {
      console.error('Auth用户创建失败:', authError);
      throw new Error(`Auth用户创建失败: ${authError.message}`);
    }
    
    console.log('Auth用户创建成功:', authData.user?.id);
    const userId = authData.user?.id;

    if (!userId) {
      throw new Error('Auth用户创建成功但未返回用户ID');
    }

    // 现在尝试在users表中创建记录
    console.log('在users表中创建用户记录...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId, // 使用Auth用户的ID
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

    if (userError) {
      console.error('用户记录创建失败:', userError);
      // 清理Auth用户
      await supabase.auth.admin.deleteUser(userId);
      throw new Error(`用户记录创建失败: ${userError.message}`);
    }
    console.log('用户记录创建成功:', userData);

    // 清理测试数据
    console.log('清理测试数据...');
    await supabase.from('users').delete().eq('id', userId);
    await supabase.auth.admin.deleteUser(userId);
    console.log('测试数据清理完成');

    return NextResponse.json({
      success: true,
      message: 'Auth用户和用户记录创建测试成功',
      data: {
        authUserId: userId,
        email,
        userData,
      },
    });

  } catch (error) {
    console.error('Auth用户测试失败:', error);
    return NextResponse.json(
      { 
        error: 'Auth用户测试失败', 
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