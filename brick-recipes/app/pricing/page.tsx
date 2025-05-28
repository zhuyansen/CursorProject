"use client";

import PricingPlans from "@/components/pricing-plans";
import { TranslatedText } from "@/components/main-nav";
import { useLanguage } from "@/components/language-provider";
import { useAuth } from "@/components/auth-wrapper";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function PricingPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  
  // 处理认证成功后的支付流程
  useEffect(() => {
    const success = searchParams.get('success');
    const payment = searchParams.get('payment');
    
    if (success === 'true' && payment === 'pending' && user) {
      try {
        const pendingPlanType = localStorage.getItem('pendingPlanType');
        const pendingPlanPeriod = localStorage.getItem('pendingPlanPeriod');
        
        if (pendingPlanType && pendingPlanPeriod) {
          // 清除存储的支付信息
          localStorage.removeItem('pendingPlanType');
          localStorage.removeItem('pendingPlanPeriod');
          
          // 创建checkout session
          const createCheckoutSession = async () => {
            try {
              const response = await fetch('/api/payment/create-checkout-session', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: user.id,
                  plan: pendingPlanType === 'lifetime' ? 'lifetime' : 'premium',
                  period: pendingPlanPeriod,
                  email: user.email,
                  locale: language === 'zh' ? 'zh' : 'en',
                }),
              });

              const result = await response.json();
              
              if (response.ok && result.url) {
                // 重定向到Stripe Checkout
                window.location.href = result.url;
              } else {
                console.error('Failed to create checkout session:', result.error);
                alert(language === 'zh' ? '创建支付会话失败，请重试' : 'Failed to create payment session, please try again');
              }
            } catch (error) {
              console.error('Error creating checkout session:', error);
              alert(language === 'zh' ? '网络错误，请重试' : 'Network error, please try again');
            }
          };

          createCheckoutSession();
        }
      } catch (error) {
        console.error('Error handling payment redirect:', error);
      }
    }
  }, [searchParams, user, language]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-[#f8e3c5] to-[#e6d4b7] dark:from-gray-800 dark:to-gray-700">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            <TranslatedText textKey="pricing.title" />
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            <TranslatedText textKey="pricing.subtitle" />
          </p>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-16">
        <PricingPlans />
      </section>

      {/* Features Comparison */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 dark:text-white">
              {language === "zh" ? "功能对比" : "Feature Comparison"}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {language === "zh" 
                ? "选择最适合您需求的计划，解锁强大的烹饪功能"
                : "Choose the plan that best fits your needs and unlock powerful cooking features"}
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full bg-white dark:bg-gray-900 rounded-lg shadow-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-6 font-semibold dark:text-white">
                    {language === "zh" ? "功能" : "Features"}
                  </th>
                  <th className="text-center p-6 font-semibold dark:text-white">
                    {language === "zh" ? "免费" : "Free"}
                  </th>
                  <th className="text-center p-6 font-semibold text-[#b94a2c] dark:text-[#ff6b47]">
                    {language === "zh" ? "专业版" : "Pro"}
                  </th>
                  <th className="text-center p-6 font-semibold text-[#b94a2c] dark:text-[#ff6b47]">
                    {language === "zh" ? "终身版" : "Lifetime"}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="p-6 dark:text-white">
                    {language === "zh" ? "按食材筛选食谱" : "Filter Recipes by Ingredients"}
                  </td>
                  <td className="text-center p-6">
                    <span className="text-green-500">✓</span>
                  </td>
                  <td className="text-center p-6">
                    <span className="text-green-500">✓</span>
                  </td>
                  <td className="text-center p-6">
                    <span className="text-green-500">✓</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="p-6 dark:text-white">
                    {language === "zh" ? "浏览传统食谱" : "Browse Traditional Recipes"}
                  </td>
                  <td className="text-center p-6">
                    <span className="text-green-500">✓</span>
                  </td>
                  <td className="text-center p-6">
                    <span className="text-green-500">✓</span>
                  </td>
                  <td className="text-center p-6">
                    <span className="text-green-500">✓</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="p-6 dark:text-white">
                    {language === "zh" ? "视频转食谱" : "Video to Recipe Conversion"}
                  </td>
                  <td className="text-center p-6">
                    <span className="text-gray-400">✗</span>
                  </td>
                  <td className="text-center p-6">
                    <span className="text-green-500">✓</span>
                  </td>
                  <td className="text-center p-6">
                    <span className="text-green-500">✓</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="p-6 dark:text-white">
                    {language === "zh" ? "高级筛选功能" : "Advanced Filtering"}
                  </td>
                  <td className="text-center p-6">
                    <span className="text-gray-400">✗</span>
                  </td>
                  <td className="text-center p-6">
                    <span className="text-green-500">✓</span>
                  </td>
                  <td className="text-center p-6">
                    <span className="text-green-500">✓</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="p-6 dark:text-white">
                    {language === "zh" ? "无限制访问" : "Unlimited Access"}
                  </td>
                  <td className="text-center p-6">
                    <span className="text-gray-400">✗</span>
                  </td>
                  <td className="text-center p-6">
                    <span className="text-green-500">✓</span>
                  </td>
                  <td className="text-center p-6">
                    <span className="text-green-500">✓</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-6 dark:text-white">
                    {language === "zh" ? "优先客户支持" : "Priority Support"}
                  </td>
                  <td className="text-center p-6">
                    <span className="text-gray-400">✗</span>
                  </td>
                  <td className="text-center p-6">
                    <span className="text-green-500">✓</span>
                  </td>
                  <td className="text-center p-6">
                    <span className="text-green-500">✓</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 dark:text-white">
              {language === "zh" ? "常见问题" : "Frequently Asked Questions"}
            </h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2 dark:text-white">
                {language === "zh" ? "我可以随时取消订阅吗？" : "Can I cancel my subscription anytime?"}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {language === "zh" 
                  ? "是的，您可以随时取消订阅。取消后，您仍可以使用专业功能直到当前计费周期结束。"
                  : "Yes, you can cancel your subscription at any time. After cancellation, you'll still have access to pro features until the end of your current billing period."}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2 dark:text-white">
                {language === "zh" ? "终身版包含什么？" : "What's included in the Lifetime plan?"}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {language === "zh" 
                  ? "终身版包含所有专业功能的永久访问权限，无需月费或年费，一次性付费即可享受所有功能。"
                  : "The Lifetime plan includes permanent access to all pro features without any monthly or yearly fees. Pay once and enjoy all features forever."}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2 dark:text-white">
                {language === "zh" ? "支持哪些支付方式？" : "What payment methods are supported?"}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {language === "zh" 
                  ? "我们支持所有主要的信用卡和借记卡，包括 Visa、MasterCard、American Express 等。"
                  : "We support all major credit and debit cards including Visa, MasterCard, American Express, and more."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 