import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const config = {
      环境变量: {
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NODE_ENV: process.env.NODE_ENV,
      },
      请求信息: {
        origin: request.nextUrl.origin,
        host: request.headers.get('host'),
        protocol: request.nextUrl.protocol,
        pathname: request.nextUrl.pathname,
        url: request.url,
      },
      预期重定向: {
        当前环境: process.env.NODE_ENV,
        应使用URL: process.env.NEXT_PUBLIC_APP_URL,
        Google回调URL: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
      Supabase配置要求: {
        站点URL: process.env.NEXT_PUBLIC_APP_URL,
        重定向URLs: [
          `${process.env.NEXT_PUBLIC_APP_URL}/**`,
          'http://localhost:3007/**',
          'http://localhost:3000/**'
        ],
        Google回调: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`
      }
    };

    return NextResponse.json(config, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: '配置检查失败', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 