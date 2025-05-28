'use client';

import { useLanguage } from "@/components/language-provider";

export default function Loading() {
  const { t } = useLanguage();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      <span className="mt-4 text-sm text-gray-600 dark:text-gray-400">{t("common.loading")}</span>
    </div>
  );
} 