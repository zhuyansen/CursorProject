'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, Clock } from 'lucide-react';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // 倒计时自动跳转
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleGoToPricing = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* 成功图标 */}
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          {/* 标题 */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            支付成功！
          </h1>

          {/* 描述 */}
          <p className="text-gray-600 mb-6">
            感谢您的购买！您的订阅已经激活，现在可以享受所有高级功能了。
          </p>

          {/* 会话ID（如果存在） */}
          {sessionId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">订单ID:</p>
              <p className="text-sm font-mono text-gray-800 break-all">
                {sessionId}
              </p>
            </div>
          )}

          {/* 自动跳转提示 */}
          <div className="flex items-center justify-center text-gray-500 text-sm mb-6">
            <Clock className="w-4 h-4 mr-2" />
            <span>{countdown} 秒后自动跳转到首页页面</span>
          </div>

          {/* 立即跳转按钮 */}
          <button
            onClick={handleGoToPricing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center group"
          >
            <span>立即查看会员权益</span>
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* 额外提示 */}
          <p className="text-xs text-gray-400 mt-4">
            如有任何问题，请联系我们的客服团队
          </p>
        </div>
      </div>
    </div>
  );
} 