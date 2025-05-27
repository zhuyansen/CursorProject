import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// `/auth/callback`路由是由SSR包实现的服务器端认证流所必需的。
// 它将认证代码交换为用户的会话。
// https://supabase.com/docs/guides/auth/server-side/nextjs
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = requestUrl.searchParams.get("redirect_to") || "/";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // 构建重定向URL，添加成功参数以便前端处理支付链接
  const redirectUrl = new URL(redirectTo, requestUrl.origin);
  redirectUrl.searchParams.set('success', 'true');

  // URL to redirect to after sign up process completes
  return NextResponse.redirect(redirectUrl.toString());
} 