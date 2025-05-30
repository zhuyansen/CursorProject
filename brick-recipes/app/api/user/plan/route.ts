import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 健康检查函数
async function checkSupabaseConnection() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // 执行一个简单的查询来检查连接 - 修复SQL语法
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('[Supabase Health Check] Connection test failed:', error);
      return false;
    }
    
    // console.log('[Supabase Health Check] Connection successful');
    return true;
  } catch (error) {
    console.error('[Supabase Health Check] Connection error:', error);
    return false;
  }
}

// 获取用户计划信息
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      console.warn('[/api/user/plan POST] Received request without userId');
      return NextResponse.json(
        { error: '缺少用户ID' },
        { status: 400 }
      );
    }
    // console.log(`[/api/user/plan POST] Received request for userId: ${userId}`);

    // 检查环境变量
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[/api/user/plan POST] Missing Supabase environment variables');
      return NextResponse.json(
        { error: '服务配置错误', details: 'Supabase环境变量未正确配置' },
        { status: 500 }
      );
    }

    // 检查Supabase连接
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      return NextResponse.json(
        { error: '数据库连接失败', details: 'Supabase服务暂时不可用，请稍后重试' },
        { status: 503 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // console.log(`[/api/user/plan POST] Attempting to fetch user plan from Supabase for userId: ${userId}`);
    
    // 设置超时
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('数据库查询超时')), 10000)
    );

    // 获取用户计划信息
    const queryPromise = supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: user, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (error) {
      console.error('[/api/user/plan POST] Error fetching user plan from Supabase:', {
        message: error.message,
        details: error.details || 'No additional details',
        hint: error.hint || 'No hints available',
        code: error.code || 'UNKNOWN_ERROR'
      });
      
      // 根据错误类型返回不同的响应
      let errorMessage = '获取用户计划失败';
      let statusCode = 500;
      
      if (error.code === 'PGRST116') {
        errorMessage = '用户不存在';
        statusCode = 404;
      } else if (error.message?.includes('timeout') || error.message?.includes('数据库查询超时')) {
        errorMessage = '数据库查询超时，请稍后重试';
        statusCode = 504;
      } else if (error.message?.includes('connection') || error.message?.includes('network')) {
        errorMessage = '数据库连接失败，请稍后重试';
        statusCode = 503;
      }
      
      return NextResponse.json(
        { 
          error: errorMessage, 
          details: error.message, 
          code: error.code || 'UNKNOWN_DB_ERROR',
          hint: error.hint || '请检查网络连接或稍后重试'
        },
        { status: statusCode }
      );
    }

    if (!user) {
      console.warn(`[/api/user/plan POST] User not found in Supabase for userId: ${userId}`);
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }
    
    // console.log(`[/api/user/plan POST] Successfully fetched user plan for userId: ${userId}`, user);
    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error('[/api/user/plan POST] Unhandled exception in POST handler:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      name: error?.name || 'Unknown error type'
    });
    
    let errorMessage = '服务器内部错误';
    let statusCode = 500;
    
    if (error?.message?.includes('数据库查询超时')) {
      errorMessage = '数据库查询超时，请稍后重试';
      statusCode = 504;
    } else if (error?.message?.includes('fetch failed') || error?.name === 'TypeError') {
      errorMessage = '网络连接失败，请检查网络连接后重试';
      statusCode = 503;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: error?.message || 'Unknown error',
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: statusCode }
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