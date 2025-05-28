"use client";

import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { TranslatedText } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@supabase/ssr";

export default function Signup() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<Message | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const { t, language } = useLanguage();
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    // Check for error or success messages in the search params
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const msg = searchParams.get('message');
    
    if (success) {
      // Always use the translation key, regardless of what the server sent
      setMessage({ success: t('auth.signUpSuccess') });
      setIsSuccess(true);
    } else if (error) {
      setMessage({ error: decodeURIComponent(error) });
    } else if (msg) {
      setMessage({ message: decodeURIComponent(msg) });
      setIsSuccess(true);
    }
  }, [searchParams, t, language]);

  // Auto-redirect after successful signup
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isSuccess) {
      if (countdown > 0) {
        timer = setTimeout(() => {
          setCountdown(countdown - 1);
        }, 1000);
      } else {
        // Redirect to sign-in page after countdown finishes
        router.push('/sign-in');
      }
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isSuccess, countdown, router]);

  // Google注册处理函数
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      // 使用环境变量中的APP_URL而不是window.location.origin
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${baseUrl}/auth/callback?redirect_to=/`
        }
      });
      
      if (error) {
        console.error("Google signup error:", error.message);
        setMessage({ error: error.message });
      }
      
      // 成功启动OAuth流程后，用户将被重定向到Google登录页面
      // 不需要处理重定向，因为Supabase会自动处理
      
    } catch (err) {
      console.error("Unexpected error during Google signup:", err);
      setMessage({ error: "谷歌注册过程中发生意外错误" });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-center">
            <TranslatedText textKey="auth.signUp" />
          </h2>
          {message && <FormMessage message={message} />}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {t('auth.redirectingIn').replace('{seconds}', countdown.toString())}
            </p>
            <Link 
              href="/sign-in" 
              className="text-primary underline hover:text-primary/80"
            >
              <TranslatedText textKey="auth.backToSignIn" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form className="flex flex-col min-w-64 max-w-sm mx-auto mt-10">
      <h1 className="text-2xl font-medium"><TranslatedText textKey="auth.signUp" /></h1>
      <p className="text-sm text text-foreground">
        <TranslatedText textKey="auth.hasAccount" />{" "}
        <Link className="text-primary font-medium underline" href="/sign-in">
          <TranslatedText textKey="auth.signIn" />
        </Link>
      </p>
      <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
        <Label htmlFor="email"><TranslatedText textKey="auth.email" /></Label>
        <Input name="email" placeholder="you@example.com" required />
        <Label htmlFor="password"><TranslatedText textKey="auth.password" /></Label>
        <Input
          type="password"
          name="password"
          placeholder={t('auth.passwordPlaceholder')}
          minLength={6}
          required
        />
        <SubmitButton formAction={signUpAction} pendingText={t('auth.signingUp')}>
          <TranslatedText textKey="nav.signUp" />
        </SubmitButton>
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
        
        {/* Google注册按钮 */}
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
            {isGoogleLoading ? t('auth.signingUp') : <TranslatedText textKey="auth.continueWithGoogle" />}
          </span>
        </Button>
      </div>
    </form>
  );
} 