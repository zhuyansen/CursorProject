'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/components/language-provider';
import { useAuth } from '@/components/auth-wrapper';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentSuccessPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const sessionIdParam = searchParams.get('session_id');
    if (sessionIdParam) {
      setSessionId(sessionIdParam);
    }

    // 等待一段时间让webhook处理完成
    const timer = setTimeout(() => {
      setIsProcessing(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [searchParams]);

  useEffect(() => {
    // 5秒后自动跳转到首页
    const redirectTimer = setTimeout(() => {
      router.push('/');
    }, 5000);

    return () => clearTimeout(redirectTimer);
  }, [router]);

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="mb-8">
          {isProcessing ? (
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
          ) : (
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          )}
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {isProcessing 
              ? (language === 'zh' ? '正在处理您的付款...' : 'Processing your payment...')
              : (language === 'zh' ? '付款成功！' : 'Payment Successful!')
            }
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {isProcessing 
              ? (language === 'zh' ? '请稍候，我们正在激活您的会员权益' : 'Please wait while we activate your membership benefits')
              : (language === 'zh' ? '感谢您的购买！您的会员权益已生效。' : 'Thank you for your purchase! Your membership benefits are now active.')
            }
          </p>

          {sessionId && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {language === 'zh' ? '交易ID: ' : 'Transaction ID: '}
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                {sessionId.substring(0, 20)}...
              </code>
            </p>
          )}

          {!isProcessing && (
            <div className="space-y-4">
              <Button 
                onClick={handleGoHome}
                className="w-full bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a] text-white"
              >
                {language === 'zh' ? '返回首页' : 'Go to Homepage'}
              </Button>
              
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {language === 'zh' ? '5秒后将自动跳转到首页...' : 'Automatically redirecting to homepage in 5 seconds...'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 