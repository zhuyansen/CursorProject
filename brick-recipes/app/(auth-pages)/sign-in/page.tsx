"use client";

import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { TranslatedText } from "@/components/main-nav";
import { useAuth } from "@/components/auth-wrapper";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@supabase/ssr";

export default function Login() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<Message | null>(null);
  const { t, language } = useLanguage();
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  // 始终重定向到首页
  const redirectTo = '/';
  
  // 如果用户已登录，自动重定向
  useEffect(() => {
    if (user) {
      console.log("User already logged in, redirecting to:", redirectTo);
      router.push(redirectTo);
    }
  }, [user, redirectTo, router]);

  useEffect(() => {
    // 检查搜索参数中的错误或成功消息
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const auth = searchParams.get('auth');
    
    // 如果是认证要求的重定向，显示相应消息
    if (auth === 'required') {
      try {
        const authMessage = localStorage.getItem('authMessage');
        if (authMessage) {
          setMessage({ 
            error: authMessage
          });
          localStorage.removeItem('authMessage');
        } else {
          setMessage({ 
            error: language === "zh" ? "请登录以继续使用该功能" : "Please login to continue using this feature"
          });
        }
      } catch (error) {
        console.error('Error reading auth message:', error);
        setMessage({ 
          error: language === "zh" ? "请登录以继续使用该功能" : "Please login to continue using this feature"
        });
      }
    } else if (success) {
      setMessage({ success: decodeURIComponent(success) });
    } else if (error) {
      // 处理常见错误消息和翻译
      if (error.includes("Invalid login credentials")) {
        setMessage({ error: t('auth.invalidCredentials') });
      } else {
        setMessage({ error: decodeURIComponent(error) });
      }
    }
  }, [searchParams, t, language]);

  // 客户端处理登录
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    
    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      
      if (!email || !password) {
        setMessage({ error: t('auth.emailAndPasswordRequired') });
        setIsLoading(false);
        return;
      }
      
      console.log("Attempting login with email:", email);
      
      // 创建 Supabase 客户端
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      // 直接在客户端尝试登录
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Login error:", error.message);
        if (error.message.includes("Invalid login credentials")) {
          setMessage({ error: t('auth.invalidCredentials') });
        } else {
          setMessage({ error: error.message });
        }
        setIsLoading(false);
        return;
      }
      
      // 登录成功
      console.log("Login successful! Session:", !!data.session);
      
      // 检查是否有认证重定向路径
      let finalRedirectPath = redirectTo;
      try {
        const authRedirectPath = localStorage.getItem('authRedirectPath');
        if (authRedirectPath) {
          finalRedirectPath = authRedirectPath;
          localStorage.removeItem('authRedirectPath');
          console.log("Found auth redirect path:", finalRedirectPath);
        }
      } catch (error) {
        console.error('Error checking auth redirect path:', error);
      }
      
      // 检查是否有待处理的支付链接
      try {
        const pendingPaymentLink = localStorage.getItem('pendingPaymentLink');
        const pendingPlanType = localStorage.getItem('pendingPlanType');
        
        if (pendingPaymentLink && pendingPlanType) {
          console.log(`Found pending payment for ${pendingPlanType}, redirecting to:`, pendingPaymentLink);
          
          // 清除localStorage中的待处理链接
          localStorage.removeItem('pendingPaymentLink');
          localStorage.removeItem('pendingPlanType');
          
          // 延迟一下确保登录状态已更新，然后重定向到支付页面
          setTimeout(() => {
            window.open(pendingPaymentLink, '_blank', 'noopener,noreferrer');
            // 同时重定向到最终路径
            window.location.href = finalRedirectPath;
          }, 1000);
          
          return;
        }
      } catch (error) {
        console.error('Error checking pending payment link:', error);
      }
      
      // 没有待处理的支付链接，重定向到最终路径
      window.location.href = finalRedirectPath;
      
    } catch (err) {
      console.error("Unexpected error during login:", err);
      setMessage({ error: "登录过程中发生意外错误" });
      setIsLoading(false);
    }
  };

  // Google登录处理函数
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      // 检查是否有认证重定向路径
      let finalRedirectPath = redirectTo;
      try {
        const authRedirectPath = localStorage.getItem('authRedirectPath');
        if (authRedirectPath) {
          finalRedirectPath = authRedirectPath;
          console.log("Found auth redirect path for Google login:", finalRedirectPath);
        }
      } catch (error) {
        console.error('Error checking auth redirect path:', error);
      }
      
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      // 使用环境变量中的APP_URL而不是window.location.origin
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${baseUrl}/auth/callback?redirect_to=${encodeURIComponent(finalRedirectPath)}`
        }
      });
      
      if (error) {
        console.error("Google login error:", error.message);
        setMessage({ error: error.message });
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Unexpected error during Google login:", err);
      setMessage({ error: "Google登录过程中发生意外错误" });
      setIsLoading(false);
    }
  };

  return (
    <form className="flex-1 flex flex-col min-w-64 mx-auto mt-10 max-w-sm" onSubmit={handleSubmit}>
      <h1 className="text-2xl font-medium"><TranslatedText textKey="auth.signIn" /></h1>
      <p className="text-sm text-foreground">
        <TranslatedText textKey="auth.noAccount" />{" "}
        <Link className="text-foreground font-medium underline" href="/sign-up">
          <TranslatedText textKey="auth.signUp" />
        </Link>
      </p>
      <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
        <Label htmlFor="email"><TranslatedText textKey="auth.email" /></Label>
        <Input name="email" placeholder="you@example.com" required />
        <div className="flex justify-between items-center">
          <Label htmlFor="password"><TranslatedText textKey="auth.password" /></Label>
          <Link
            className="text-xs text-foreground underline"
            href="/forgot-password"
          >
            <TranslatedText textKey="auth.forgotPassword" />
          </Link>
        </div>
        <Input
          type="password"
          name="password"
          placeholder={t('auth.passwordPlaceholder')}
          required
        />
        {/* 隐藏字段用于传递重定向URL */}
        <input type="hidden" name="redirectTo" value={redirectTo} />
        
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a]"
        >
          {isLoading ? t('auth.signingIn') : <TranslatedText textKey="nav.signIn" />}
        </Button>
        
        {message && <FormMessage message={message} />}
        
        {/* 分隔线 */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">
              OR
            </span>
          </div>
        </div>
        
        {/* Google登录按钮 */}
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="flex items-center justify-center gap-2"
        >
          {isGoogleLoading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-opacity-20 border-t-white"></span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
          )}
          <span>
            {isGoogleLoading ? t('auth.signingIn') : <TranslatedText textKey="auth.continueWithGoogle" />}
          </span>
        </Button>
      </div>
    </form>
  );
} 