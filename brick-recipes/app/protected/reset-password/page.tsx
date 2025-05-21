"use client";

import { resetPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-wrapper";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { TranslatedText } from "@/components/main-nav";
import Link from "next/link";

export default function ResetPassword() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<Message | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    // Check for error or success messages in the search params
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    
    if (success) {
      // Always use translation key
      setMessage({ success: t('auth.passwordUpdated') });
      setIsSuccess(true);
    } else if (error) {
      // Translate common error messages
      if (error === "Password and confirm password are required") {
        setMessage({ error: t('auth.passwordRequired') });
      } else if (error === "Passwords do not match") {
        setMessage({ error: t('auth.passwordsDoNotMatch') });
      } else if (error === "Password update failed") {
        setMessage({ error: t('auth.passwordUpdateFailed') });
      } else {
        setMessage({ error: decodeURIComponent(error) });
      }
    }

    // Redirect to sign-in if user is not logged in
    if (!isLoading && !user) {
      router.push("/sign-in");
    }
  }, [user, isLoading, router, searchParams, t, language]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-[#b94a2c] dark:border-gray-700 dark:border-t-[#ff6b47]"></div>
          <span className="mt-4 text-sm text-gray-600 dark:text-gray-400">加载中...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // useEffect will handle redirection, return null to avoid flickering
  }

  if (isSuccess) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-center">
            <TranslatedText textKey="auth.resetPassword" />
          </h2>
          {message && <FormMessage message={message} />}
          <div className="mt-6 text-center">
            <Link 
              href="/protected" 
              className="text-primary underline hover:text-primary/80"
            >
              <TranslatedText textKey="auth.userInformation" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form className="flex flex-col min-w-64 max-w-sm mx-auto mt-10">
      <h1 className="text-2xl font-medium"><TranslatedText textKey="auth.resetPassword" /></h1>
      <p className="text-sm text text-foreground mb-8">
        <TranslatedText textKey="auth.enterNewPassword" />
      </p>
      <div className="flex flex-col gap-2 [&>input]:mb-3">
        <Label htmlFor="password"><TranslatedText textKey="auth.password" /></Label>
        <Input
          type="password"
          name="password"
          placeholder={t('auth.newPassword')}
          minLength={6}
          required
        />
        <Label htmlFor="confirmPassword"><TranslatedText textKey="auth.confirmPassword" /></Label>
        <Input
          type="password"
          name="confirmPassword"
          placeholder={t('auth.confirmNewPassword')}
          minLength={6}
          required
        />
        <SubmitButton
          formAction={resetPasswordAction}
          pendingText={t('auth.updatingPassword')}
        >
          <TranslatedText textKey="auth.updatePassword" />
        </SubmitButton>
        {message && <FormMessage message={message} />}
      </div>
    </form>
  );
} 