"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-wrapper";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { TranslatedText } from "@/components/main-nav";

export default function ProtectedPage() {
  const [mounted, setMounted] = useState(false);
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
    if (!isLoading && !user) {
      router.push("/sign-in");
    }
  }, [user, isLoading, router]);

  if (!mounted) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-[#b94a2c] dark:border-gray-700 dark:border-t-[#ff6b47]"></div>
          <span className="mt-4 text-sm text-gray-600 dark:text-gray-400">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // useEffect will handle redirection, return null to avoid flickering
  }

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto p-4 mt-10">
      <h1 className="text-3xl font-bold"><TranslatedText textKey="auth.userInformation" /></h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mt-4 mb-8">
        <TranslatedText textKey="auth.protectedPageDescription" />
      </p>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="font-bold text-2xl mb-4"><TranslatedText textKey="auth.userDetails" /></h2>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
    </div>
  );
} 