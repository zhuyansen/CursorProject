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

    console.log('开始测试Supabase连接和用户创建...');
    
    // 生成测试用户ID
    const userId = randomUUID();
    console.log('生成的测试用户ID:', userId);

    // 测试Supabase连接
    console.log('测试Supabase连接...');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    console.log('Supabase客户端创建成功');

    // 测试数据库连接
    console.log('测试数据库连接...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('数据库连接测试失败:', testError);
      throw new Error(`数据库连接失败: ${testError.message}`);
    }
    console.log('数据库连接测试成功');

    // 测试用户创建
    console.log('测试用户创建...');
    const { data: userData, error: userError } = await supabase
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

    if (userError) {
      console.error('用户创建失败:', userError);
      throw new Error(`用户创建失败: ${userError.message}`);
    }
    console.log('用户创建成功:', userData);

    // 测试用户查询
    console.log('测试用户查询...');
    const { data: queryData, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (queryError) {
      console.error('用户查询失败:', queryError);
      throw new Error(`用户查询失败: ${queryError.message}`);
    }
    console.log('用户查询成功:', queryData);

    // 清理测试数据
    console.log('清理测试数据...');
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.warn('清理测试数据失败:', deleteError);
    } else {
      console.log('测试数据清理成功');
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase连接和用户创建测试成功',
      data: {
        userId,
        email,
        userData,
        queryData,
      },
    });

  } catch (error) {
    console.error('Supabase测试失败:', error);
    return NextResponse.json(
      { 
        error: 'Supabase测试失败', 
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