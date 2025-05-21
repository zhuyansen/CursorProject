import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  try {
    // 创建一个响应对象，我们将在其上设置 cookies
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // 直接在 response 对象上设置所有 Supabase 需要的 cookie
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    // 刷新会话 - 这对于确保服务器组件总是有最新的会话状态至关重要
    // 重要：调用 supabase.auth.getSession() 会触发 cookie 的读取和（如果需要）设置
    await supabase.auth.getSession();

    // 只有在访问受保护路径且用户未登录时才重定向
    // 这段代码保留仅用于保护 /protected 路径
    if (request.nextUrl.pathname.startsWith("/protected")) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
      }
    }

    // 返回已修改的响应对象（其中可能包含更新的会话 cookie）
    return response;
  } catch (e) {
    console.error("Middleware error:", e);
    // 在出错时返回一个基础的 NextResponse
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
}; 