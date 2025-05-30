"use client";

import { signOutAction } from "@/app/actions";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useAuth } from "./auth-wrapper";
import { useLanguage } from "./language-provider";
import { TranslatedText } from "./main-nav";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function HeaderAuth() {
  const { user, isLoading, signOut } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  
  // 使用 useEffect 确保仅在客户端渲染
  useEffect(() => {
    setIsClient(true);
    // console.log("HeaderAuth: isLoading =", isLoading, "user =", user?.email);
  }, [isLoading, user]);
  
  // 在客户端加载之前或状态加载中时，显示一个空的占位符
  if (!isClient || isLoading) {
    return (
      <div className="h-8 w-20 animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
    );
  }
  
  // Don't include auth pages in redirect
  const shouldRedirect = !['/sign-in', '/sign-up', '/forgot-password'].includes(pathname);
  const signInHref = shouldRedirect ? `/sign-in?redirect=${encodeURIComponent(pathname)}` : '/sign-in';

  if (!hasEnvVars) {
    return (
      <>
        <div className="flex gap-4 items-center">
          <div>
            <Badge
              variant={"default"}
              className="font-normal pointer-events-none"
            >
              <TranslatedText textKey="auth.updateSupabaseConfig" />
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              size="sm"
              variant={"outline"}
              disabled
              className="opacity-75 cursor-none pointer-events-none"
            >
              <Link href="/sign-in"><TranslatedText textKey="nav.signIn" /></Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant={"default"}
              disabled
              className="opacity-75 cursor-none pointer-events-none"
            >
              <Link href="/sign-up"><TranslatedText textKey="nav.signUp" /></Link>
            </Button>
          </div>
        </div>
      </>
    );
  }
  
  // 用户已登录，显示用户信息和登出按钮
  if (user) {
    // console.log("HeaderAuth: Rendering logged in state for", user.email);
    return (
      <div className="flex items-center gap-4">
        {t('auth.hello')}, {user.email}!
        <Button 
          onClick={() => signOut()} 
          variant={"outline"}
          className="hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <TranslatedText textKey="auth.signOut" />
        </Button>
      </div>
    );
  }
  
  // 用户未登录，显示登录和注册按钮
  // console.log("HeaderAuth: Rendering logged out state");
  return (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"} className="dark:border-gray-700 dark:text-gray-200">
        <Link href={signInHref}><TranslatedText textKey="nav.signIn" /></Link>
      </Button>
      <Button asChild size="sm" variant={"default"} className="bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a]">
        <Link href="/sign-up"><TranslatedText textKey="nav.signUp" /></Link>
      </Button>
    </div>
  );
} 