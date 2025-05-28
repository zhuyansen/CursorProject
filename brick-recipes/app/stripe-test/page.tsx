'use client';

import { useState } from 'react';
import { usePayment } from '../../hooks/usePayment';
import { useLanguage } from '@/components/language-provider';
import { PlanType, SubscriptionPeriod } from '../../lib/userService';

interface TestResults {
  checkoutSession?: any;
  userStatus?: any;
  createUser?: any;
  cronTest?: any;
  usageLimitTest?: any;
  usageIncrementTest?: any;
  realPaymentTest?: any;
}

export default function StripeTestPage() {
  const { createCheckoutSession, getUserStatus, loading, error } = usePayment();
  const { language } = useLanguage();
  const [testResults, setTestResults] = useState<TestResults>({});
  const [userId, setUserId] = useState('b791b5a5-f22d-4929-a928-710e6de2d143');
  const [userEmail, setUserEmail] = useState('test@example.com');

  const generateNewUserId = () => {
    const newUuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    setUserId(newUuid);
  };

  const handleCreateTestUser = async () => {
    try {
      const response = await fetch('/api/create-test-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email: userEmail,
        }),
      });

      const result = await response.json();
      setTestResults((prev: TestResults) => ({
        ...prev,
        createUser: result,
      }));

      if (result.success) {
        alert(`用户创建成功: ${result.message}`);
      } else {
        alert(`用户创建失败: ${result.error}`);
      }
    } catch (error) {
      console.error('创建用户错误:', error);
      alert('创建用户失败');
    }
  };

  const handleCheckout = async (plan: PlanType, period: SubscriptionPeriod) => {
    const result = await createCheckoutSession({
      userId,
      plan,
      period,
      email: userEmail,
      locale: language,
    });

    setTestResults((prev: TestResults) => ({
      ...prev,
      checkoutSession: result,
    }));

    if (result?.url) {
      // 直接跳转到Stripe结账页面
      window.open(result.url, '_blank');
      alert('正在打开Stripe结账页面，请使用测试卡号完成支付！');
    }
  };

  const handleGetUserStatus = async () => {
    const result = await getUserStatus(userId);
    setTestResults((prev: TestResults) => ({
      ...prev,
      userStatus: result,
    }));
  };

  // 定时任务测试
  const handleCronTest = async (type: 'reset-usage' | 'check-expired') => {
    try {
      const endpoint = type === 'reset-usage' 
        ? '/api/cron/reset-monthly-usage'
        : '/api/cron/check-expired-subscriptions';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'ems0JqslNbiqeQd1NoDkBvDh44qhdXaS'}`,
        },
      });

      const result = await response.json();
      setTestResults((prev: TestResults) => ({
        ...prev,
        cronTest: { type, result, timestamp: new Date().toISOString() },
      }));

      if (result.success) {
        alert(`定时任务执行成功: ${result.message}`);
      } else {
        alert(`定时任务执行失败: ${result.error}`);
      }
    } catch (error) {
      console.error('定时任务测试错误:', error);
      alert('定时任务测试失败');
    }
  };

  // 使用限制测试
  const handleUsageLimitTest = async (usageType: 'brick' | 'video') => {
    try {
      const response = await fetch('/api/usage/check-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          usageType,
        }),
      });

      const result = await response.json();
      setTestResults((prev: TestResults) => ({
        ...prev,
        usageLimitTest: { usageType, result, timestamp: new Date().toISOString() },
      }));

      if (result.allowed !== undefined) {
        const status = result.allowed ? '允许使用' : '已达到限制';
        alert(`${usageType}使用检查: ${status} (${result.current}/${result.limit === -1 ? '无限制' : result.limit})`);
      } else {
        alert(`使用限制检查失败: ${result.error}`);
      }
    } catch (error) {
      console.error('使用限制测试错误:', error);
      alert('使用限制测试失败');
    }
  };

  // 使用量增加测试
  const handleUsageIncrementTest = async (usageType: 'brick' | 'video', amount: number = 1) => {
    try {
      const response = await fetch('/api/usage/increment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          usageType,
          amount,
        }),
      });

      const result = await response.json();
      setTestResults((prev: TestResults) => ({
        ...prev,
        usageIncrementTest: { usageType, amount, result, timestamp: new Date().toISOString() },
      }));

      if (result.success) {
        alert(`${usageType}使用量增加成功: 新使用量 ${result.new_usage}`);
      } else {
        alert(`使用量增加失败: ${result.message}`);
      }
    } catch (error) {
      console.error('使用量增加测试错误:', error);
      alert('使用量增加测试失败');
    }
  };

  // 真实支付流程测试（不预先创建用户）
  const handleRealPaymentTest = async (plan: PlanType, period: SubscriptionPeriod) => {
    try {
      const response = await fetch('/api/test-real-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          period,
          email: userEmail,
          locale: language,
        }),
      });

      const result = await response.json();
      setTestResults((prev: TestResults) => ({
        ...prev,
        realPaymentTest: result,
      }));

      if (result.url) {
        // 更新userId为返回的实际userId
        setUserId(result.userId);
        window.open(result.url, '_blank');
        alert(`真实支付测试开始！\n用户ID: ${result.userId}\n${result.message}`);
      } else {
        alert(`真实支付测试失败: ${result.error}`);
      }
    } catch (error) {
      console.error('真实支付测试错误:', error);
      alert('真实支付测试失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Stripe支付真实测试</h1>
        
        {/* 说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">🧪 测试说明</h2>
          <p className="text-blue-700 mb-4">
            这个页面会创建真实的Stripe结账会话，完成支付后会触发webhook更新用户数据。
          </p>
          <div className="text-sm text-blue-600">
            <p><strong>Webhook URL:</strong> https://666e-122-238-128-243.ngrok-free.app/api/webhooks/stripe</p>
            <p><strong>测试卡号:</strong> 4242424242424242</p>
            <p><strong>到期日期:</strong> 任意未来日期 (如 12/34)</p>
            <p><strong>CVC:</strong> 任意3位数字 (如 123)</p>
          </div>
        </div>

        {/* 用户信息 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">测试用户信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户ID (UUID格式)
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户邮箱
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={generateNewUserId}
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg"
            >
              生成新UUID
            </button>
            <button
              onClick={handleCreateTestUser}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"
            >
              创建测试用户
            </button>
            <button
              onClick={handleGetUserStatus}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"
            >
              检查用户状态
            </button>
          </div>
        </div>

        {/* 支付测试 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">💳 支付测试</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <button
              onClick={() => handleCheckout('premium', 'monthly')}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50"
            >
              Premium 月付 ($9.99)
            </button>
            <button
              onClick={() => handleCheckout('premium', 'yearly')}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50"
            >
              Premium 年付 ($89.99)
            </button>
            <button
              onClick={() => handleCheckout('lifetime', 'one_time_purchase')}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50"
            >
              终身会员 ($249.00)
            </button>
          </div>
          <p className="text-sm text-gray-600">
            💡 这些测试需要先创建用户记录，模拟已登录用户的支付流程。
          </p>
        </div>

        {/* 真实支付流程测试 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🚀 真实支付流程测试</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 text-sm">
              <strong>⚠️ 重要说明：</strong>这个测试模拟真实用户支付场景，不会预先创建用户记录。
              用户记录将在支付成功后由webhook自动创建。这正是我们要修复的场景！
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <button
              onClick={() => handleRealPaymentTest('premium', 'monthly')}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50"
            >
              真实测试: Premium 月付
            </button>
            <button
              onClick={() => handleRealPaymentTest('premium', 'yearly')}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50"
            >
              真实测试: Premium 年付
            </button>
            <button
              onClick={() => handleRealPaymentTest('lifetime', 'one_time_purchase')}
              disabled={loading}
              className="bg-green-800 hover:bg-green-900 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50"
            >
              真实测试: 终身会员
            </button>
          </div>
          <p className="text-sm text-gray-600">
            💡 这些测试会生成新的用户ID，不预先创建数据库记录，完全模拟真实支付场景。
          </p>
        </div>

        {/* 定时任务测试 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🕐 定时任务测试</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <button
              onClick={() => handleCronTest('reset-usage')}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50"
            >
              重置月度使用量
            </button>
            <button
              onClick={() => handleCronTest('check-expired')}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50"
            >
              检查过期订阅
            </button>
          </div>
          <p className="text-sm text-gray-600">
            💡 这些定时任务通常由服务器自动执行，这里是手动测试功能。
          </p>
        </div>

        {/* 使用限制测试 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📊 使用限制测试</h2>
          
          {/* 检查使用限制 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">检查使用限制</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleUsageLimitTest('brick')}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"
              >
                检查Brick使用限制
              </button>
              <button
                onClick={() => handleUsageLimitTest('video')}
                disabled={loading}
                className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"
              >
                检查Video使用限制
              </button>
            </div>
          </div>

          {/* 增加使用量 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">增加使用量测试</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => handleUsageIncrementTest('brick', 1)}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 text-sm"
              >
                Brick +1
              </button>
              <button
                onClick={() => handleUsageIncrementTest('brick', 5)}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 text-sm"
              >
                Brick +5
              </button>
              <button
                onClick={() => handleUsageIncrementTest('video', 1)}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 text-sm"
              >
                Video +1
              </button>
              <button
                onClick={() => handleUsageIncrementTest('video', 10)}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 text-sm"
              >
                Video +10
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-yellow-800 font-medium mb-2">📋 使用限制说明</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li><strong>Free用户:</strong> Brick 3次/月, Video 3次/月</li>
              <li><strong>Premium用户:</strong> Brick 无限制, Video 100次/月</li>
              <li><strong>Lifetime用户:</strong> Brick 无限制, Video 无限制</li>
            </ul>
          </div>
        </div>

        {/* 测试步骤 */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-amber-800 mb-4">📋 测试步骤</h2>
          <ol className="list-decimal list-inside space-y-2 text-amber-700">
            <li>点击"创建测试用户"按钮</li>
            <li>点击任一支付按钮打开Stripe结账页面</li>
            <li>使用测试卡号 4242424242424242 完成支付</li>
            <li>支付成功后，Stripe会发送webhook到您的ngrok URL</li>
            <li>回到这个页面，点击"检查用户状态"验证数据更新</li>
            <li>用户计划应该从"free"更新为"premium"或"lifetime"</li>
          </ol>
        </div>

        {/* 错误显示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-medium">错误信息</h3>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* 测试结果 */}
        {Object.keys(testResults).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">测试结果</h2>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}

        {/* 加载状态 */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                <span>处理中...</span>
              </div>
            </div>
          </div>
        )}

        {/* JWT认证错误诊断 */}
        <div className="border-t pt-8 mt-8">
          <h2 className="text-2xl font-bold mb-4 text-orange-600">🔐 JWT认证错误诊断</h2>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-orange-800 mb-3">错误描述</h3>
            <p className="text-orange-700 mb-4">
              <strong>AuthApiError: User from sub claim in JWT does not exist</strong>
            </p>
            <p className="text-orange-700 mb-4">
              这个错误表示JWT令牌中的用户ID在Supabase认证数据库中找不到对应的用户记录。
              通常是由于认证状态不同步或邮箱确认问题导致的。
            </p>
            
            <div className="bg-white rounded-md p-4 border border-orange-300">
              <h4 className="font-semibold text-orange-800 mb-2">常见原因：</h4>
              <ul className="list-disc list-inside text-sm text-orange-700 space-y-1">
                <li>用户记录已被删除但JWT令牌仍然有效</li>
                <li>邮箱确认过程中出现问题导致用户状态不一致</li>
                <li>浏览器中存在过期或无效的认证cookies</li>
                <li>Supabase项目配置变更导致的状态不同步</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">诊断工具</h3>
            <p className="text-blue-700 mb-4">
              使用以下工具来诊断和修复认证状态问题：
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a 
                href="/api/debug-auth-state"
                target="_blank"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-center"
              >
                🔍 检查认证状态
              </a>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/clear-auth-session', { method: 'POST' });
                    const result = await response.json();
                    if (result.success) {
                      alert('认证状态已清理！请刷新页面后重新登录。');
                      window.location.reload();
                    } else {
                      alert('清理失败: ' + result.error);
                    }
                  } catch (error) {
                    alert('清理过程中出现错误');
                  }
                }}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                🧹 清理认证状态
              </button>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-green-800 mb-3">修复步骤</h3>
            <ol className="list-decimal list-inside space-y-2 text-green-700">
              <li>
                <strong>点击 "检查认证状态"</strong> - 查看详细的诊断信息
              </li>
              <li>
                <strong>点击 "清理认证状态"</strong> - 清除所有无效的认证cookies和session
              </li>
              <li>
                <strong>刷新页面</strong> - 确保清理生效
              </li>
              <li>
                <strong>重新登录</strong> - 访问 /sign-in 页面重新登录
              </li>
              <li>
                <strong>确认邮箱</strong> - 如果收到确认邮件，点击链接确认邮箱
              </li>
            </ol>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">⚠️ 如果问题持续存在</h3>
            <ul className="list-disc list-inside space-y-2 text-yellow-700">
              <li>清理浏览器的所有站点数据 (Chrome: 设置 → 隐私和安全 → 清除浏览数据)</li>
              <li>在无痕模式下尝试登录</li>
              <li>检查邮箱确认链接是否指向正确的域名</li>
              <li>确保Supabase项目的URL配置正确</li>
            </ul>
          </div>
        </div>

        {/* 在现有的测试部分之后添加认证配置诊断部分 */}
        <div className="border-t pt-8 mt-8">
          <h2 className="text-2xl font-bold mb-4 text-red-600">🚨 认证配置问题诊断</h2>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-red-800 mb-3">问题描述</h3>
            <p className="text-red-700 mb-4">
              邮箱确认链接指向错误的域名 (http://localhost:3000)，导致用户无法正确确认邮箱。
            </p>
            
            <div className="bg-white rounded-md p-4 border border-red-300">
              <h4 className="font-semibold text-red-800 mb-2">错误链接示例：</h4>
              <code className="text-sm text-red-600 bg-red-100 p-2 rounded block">
                http://localhost:3000/?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired
              </code>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">解决方案</h3>
            <p className="text-blue-700 mb-4">
              需要在 Supabase 控制台中更新认证配置：
            </p>
            
            <ol className="list-decimal list-inside space-y-3 text-blue-700">
              <li>
                <strong>访问 Supabase 控制台：</strong>
                <a 
                  href="https://supabase.com/dashboard/project/bqkzeajvxcsrlmxxizye/auth/url-configuration" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 underline hover:text-blue-800"
                >
                  点击这里直接打开 URL 配置页面 →
                </a>
              </li>
              <li>
                <strong>更新站点 URL (Site URL)：</strong>
                <div className="mt-2 bg-white rounded-md p-3 border border-blue-300">
                  <code className="text-sm text-blue-600">
                    https://666e-122-238-128-243.ngrok-free.app/
                  </code>
                </div>
              </li>
              <li>
                <strong>添加重定向 URLs (Redirect URLs)：</strong>
                <div className="mt-2 bg-white rounded-md p-3 border border-blue-300 space-y-2">
                  <div>
                    <span className="text-sm font-medium">生产环境：</span>
                    <code className="block text-sm text-blue-600">
                      https://666e-122-238-128-243.ngrok-free.app/**
                    </code>
                  </div>
                  <div>
                    <span className="text-sm font-medium">开发环境：</span>
                    <code className="block text-sm text-blue-600">
                      http://localhost:3007/**
                    </code>
                  </div>
                </div>
              </li>
              <li>
                <strong>保存配置</strong> - 点击 "Save" 按钮保存更改
              </li>
            </ol>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">⚠️ 重要提醒</h3>
            <ul className="list-disc list-inside space-y-2 text-yellow-700">
              <li>配置更改后可能需要几分钟才能生效</li>
              <li>现有的邮箱确认链接仍然会失效，需要重新发送</li>
              <li>确保在 Supabase 项目设置中设置的 URL 与环境变量中的完全一致</li>
              <li>开发时使用 localhost:3007，生产时使用 ngrok URL</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-3">✅ 验证配置</h3>
            <p className="text-green-700 mb-3">
              完成上述配置后，可以访问以下链接验证设置是否正确：
            </p>
            <a 
              href="/api/debug-auth-config"
              target="_blank"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              检查认证配置状态
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 