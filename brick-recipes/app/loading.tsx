import { useLanguage } from "@/components/language-provider";

export default function Loading() {
  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="flex flex-col items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-[#b94a2c] dark:border-gray-700 dark:border-t-[#ff6b47]"></div>
        <span className="mt-4 text-sm text-gray-600 dark:text-gray-400">加载中...</span>
      </div>
    </div>
  );
} 