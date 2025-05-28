import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    console.log('开始查看现有用户记录...');
    
    // 创建Supabase客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 查询现有用户记录
    const { data: users, error } = await supabase
      .from('users')
      .select('id, plan, created_at')
      .limit(5);

    if (error) {
      console.error('查询用户记录失败:', error);
      throw new Error(`查询用户记录失败: ${error.message}`);
    }

    console.log('现有用户记录:', users);

    // 查询Auth用户
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('查询Auth用户失败:', authError);
    } else {
      console.log('Auth用户数量:', authUsers.users.length);
    }

    return NextResponse.json({
      success: true,
      data: {
        users,
        authUsersCount: authUsers?.users.length || 0,
        authUsers: authUsers?.users.slice(0, 3).map(u => ({ id: u.id, email: u.email })) || [],
      },
    });

  } catch (error) {
    console.error('查看用户记录失败:', error);
    return NextResponse.json(
      { 
        error: '查看用户记录失败', 
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { message: '请使用 GET 方法调用此端点' },
    { status: 405 }
  );
} 