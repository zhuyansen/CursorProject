import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const response = NextResponse.json({
      success: true,
      message: '认证状态已清理',
      clearedCookies: []
    });

    // 获取所有认证相关的cookie名称
    const authCookieNames = [
      'sb-bqkzeajvxcsrlmxxizye-auth-token',
      'sb-bqkzeajvxcsrlmxxizye-auth-token.0',
      'sb-bqkzeajvxcsrlmxxizye-auth-token.1',
      'sb-bqkzeajvxcsrlmxxizye-auth-token.2',
      'sb-bqkzeajvxcsrlmxxizye-auth-token.3',
      'sb-bqkzeajvxcsrlmxxizye-auth-token.4',
      'sb-bqkzeajvxcsrlmxxizye-auth-token.5',
      'sb-bqkzeajvxcsrlmxxizye-auth-token.6',
      'sb-bqkzeajvxcsrlmxxizye-auth-token.7'
    ];

    const clearedCookies: string[] = [];

    // 清理所有认证相关的cookies
    for (const cookieName of authCookieNames) {
      const existingCookie = cookieStore.get(cookieName);
      if (existingCookie) {
        response.cookies.set(cookieName, '', {
          maxAge: 0,
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
        clearedCookies.push(cookieName);
        console.log(`清理cookie: ${cookieName}`);
      }
    }

    // 也检查并清理所有以 sb- 开头的cookies
    const allCookies = cookieStore.getAll();
    for (const cookie of allCookies) {
      if (cookie.name.startsWith('sb-')) {
        response.cookies.set(cookie.name, '', {
          maxAge: 0,
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
        if (!clearedCookies.includes(cookie.name)) {
          clearedCookies.push(cookie.name);
        }
        console.log(`清理额外的Supabase cookie: ${cookie.name}`);
      }
    }

    // 尝试清理服务端session
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      await supabase.auth.signOut();
      console.log('服务端session已清理');
    } catch (error) {
      console.log('服务端session清理失败（这是正常的）:', error);
    }

    const responseData = {
      success: true,
      message: '认证状态已清理',
      clearedCookies,
      instructions: [
        '1. 认证cookies已被清理',
        '2. 请刷新页面以确保更改生效',
        '3. 如果仍有问题，请重新登录',
        '4. 确保在Supabase控制台中正确配置了URL重定向'
      ],
      nextSteps: [
        '访问 /sign-in 重新登录',
        '或者清理浏览器的所有站点数据'
      ]
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('清理认证状态错误:', error);
    return NextResponse.json(
      { 
        error: '清理认证状态失败', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: '请使用 POST 方法调用此端点来清理认证状态' },
    { status: 405 }
  );
} 