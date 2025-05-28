import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    
    // 检查所有认证相关的cookies
    const authCookies = {
      accessToken: cookieStore.get('sb-bqkzeajvxcsrlmxxizye-auth-token')?.value,
      refreshToken: cookieStore.get('sb-bqkzeajvxcsrlmxxizye-auth-token.1')?.value,
      allCookies: Object.fromEntries(
        Array.from(cookieStore.getAll()).map(cookie => [cookie.name, cookie.value])
      )
    };

    // 创建客户端用于检查当前session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 创建admin客户端用于检查用户数据
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const diagnosis = {
      cookies: authCookies,
      sessionInfo: null as any,
      userFromToken: null as any,
      authUsers: null as any,
      dbUsers: null as any,
      issue: null as string | null,
      solution: null as string | null
    };

    // 检查当前session
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      diagnosis.sessionInfo = {
        hasSession: !!sessionData.session,
        user: sessionData.session?.user || null,
        error: sessionError?.message || null
      };

      if (sessionData.session?.user) {
        diagnosis.userFromToken = {
          id: sessionData.session.user.id,
          email: sessionData.session.user.email,
          emailConfirmed: sessionData.session.user.email_confirmed_at,
          createdAt: sessionData.session.user.created_at
        };
      }
    } catch (error) {
      diagnosis.sessionInfo = {
        error: `Session check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }

    // 检查auth.users表中的所有用户
    try {
      const { data: authUsersData } = await adminSupabase.auth.admin.listUsers();
      diagnosis.authUsers = {
        count: authUsersData.users.length,
        users: authUsersData.users.map(user => ({
          id: user.id,
          email: user.email,
          emailConfirmed: user.email_confirmed_at,
          createdAt: user.created_at,
          lastSignIn: user.last_sign_in_at
        }))
      };
    } catch (error) {
      diagnosis.authUsers = {
        error: `Auth users check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }

    // 检查数据库users表中的用户
    try {
      const { data: dbUsersData, error: dbError } = await adminSupabase
        .from('users')
        .select('id, plan, created_at, updated_at')
        .limit(10);
      
      diagnosis.dbUsers = {
        count: dbUsersData?.length || 0,
        users: dbUsersData || [],
        error: dbError?.message || null
      };
    } catch (error) {
      diagnosis.dbUsers = {
        error: `DB users check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }

    // 诊断问题
    if (diagnosis.sessionInfo?.user && diagnosis.authUsers?.users) {
      const tokenUserId = diagnosis.sessionInfo.user.id;
      const authUserExists = diagnosis.authUsers.users.some((user: any) => user.id === tokenUserId);
      
      if (!authUserExists) {
        diagnosis.issue = 'JWT token contains user ID that does not exist in auth.users table';
        diagnosis.solution = 'Clear authentication session and require re-login';
      } else if (!diagnosis.sessionInfo.user.email_confirmed_at) {
        diagnosis.issue = 'User exists but email is not confirmed';
        diagnosis.solution = 'Resend email confirmation or manually confirm email';
      } else {
        diagnosis.issue = 'Authentication state appears to be valid';
        diagnosis.solution = 'No action needed';
      }
    } else if (diagnosis.sessionInfo?.error?.includes('User from sub claim in JWT does not exist')) {
      diagnosis.issue = 'Stale JWT token with non-existent user ID';
      diagnosis.solution = 'Clear all authentication cookies and sessions';
    }

    return NextResponse.json({
      diagnosis,
      recommendations: {
        clearSession: 'Call /api/clear-auth-session to clear stale authentication',
        resendConfirmation: 'Use /api/test-auth-redirect to test email confirmation',
        forceReauth: 'Redirect user to sign-in page with fresh state'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('认证状态诊断错误:', error);
    return NextResponse.json(
      { 
        error: '认证状态诊断失败', 
        details: error instanceof Error ? error.message : 'Unknown error' 
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