import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: '缺少必需参数: email' },
        { status: 400 }
      );
    }

    console.log('测试邮箱确认重定向配置...');
    
    // 创建 Supabase 客户端
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
    const password = Math.random().toString(36).substring(2, 15);
    
    // 尝试创建测试用户（这将触发邮箱确认）
    console.log('创建测试用户并发送确认邮件...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // 不自动确认，需要邮箱确认
    });

    if (authError) {
      console.error('测试用户创建失败:', authError);
      return NextResponse.json({
        success: false,
        error: authError.message,
        suggestion: '如果是 "User already registered" 错误，说明该邮箱已被使用，请尝试其他邮箱'
      });
    }
    
    console.log('测试用户创建成功:', authData.user?.id);
    
    // 立即删除测试用户（清理）
    if (authData.user?.id) {
      console.log('清理测试用户...');
      await supabase.auth.admin.deleteUser(authData.user.id);
      console.log('测试用户已清理');
    }

    return NextResponse.json({
      success: true,
      message: '测试邮箱确认邮件已发送！请检查您的邮箱。',
      instructions: [
        '1. 检查您的邮箱（包括垃圾邮件文件夹）',
        '2. 点击确认链接',
        '3. 验证链接是否正确指向您的应用域名',
        '4. 如果链接仍然指向 localhost:3000，说明 Supabase 配置还未更新'
      ],
      expectedDomain: process.env.NEXT_PUBLIC_APP_URL,
      testEmail: email,
    });

  } catch (error) {
    console.error('邮箱确认测试失败:', error);
    return NextResponse.json(
      { 
        error: '邮箱确认测试失败', 
        details: error instanceof Error ? error.message : 'Unknown error',
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