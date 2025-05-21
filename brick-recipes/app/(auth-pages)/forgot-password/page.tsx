"use client";

import { forgotPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { TranslatedText } from "@/components/main-nav";

export default function ForgotPassword() {
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
      setMessage({ success: t('auth.resetLinkSent') });
      setIsSuccess(true);
    } else if (error) {
      if (error === "Email is required") {
        setMessage({ error: t('auth.emailRequired') });
      } else if (error === "Could not reset password") {
        setMessage({ error: t('auth.resetPasswordError') });
      } else {
        setMessage({ error: decodeURIComponent(error) });
      }
    }
  }, [searchParams, t, language]);

  if (isSuccess) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-center">
            <TranslatedText textKey="auth.forgotPassword" />
          </h2>
          {message && <FormMessage message={message} />}
          <div className="mt-6 text-center">
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
      <h1 className="text-2xl font-medium"><TranslatedText textKey="auth.forgotPassword" /></h1>
      <p className="text-sm text text-foreground">
        <TranslatedText textKey="auth.resetInstructions" />{" "}
        <Link className="text-primary underline" href="/sign-in">
          <TranslatedText textKey="auth.signIn" />
        </Link>
      </p>
      <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
        <Label htmlFor="email"><TranslatedText textKey="auth.email" /></Label>
        <Input name="email" placeholder="you@example.com" required />
        <SubmitButton
          formAction={forgotPasswordAction}
          pendingText={t('auth.sendingResetLink')}
        >
          <TranslatedText textKey="auth.sendResetLink" />
        </SubmitButton>
        {message && <FormMessage message={message} />}
        <Button asChild variant="outline">
          <Link href="/sign-in"><TranslatedText textKey="auth.backToSignIn" /></Link>
        </Button>
      </div>
    </form>
  );
} 