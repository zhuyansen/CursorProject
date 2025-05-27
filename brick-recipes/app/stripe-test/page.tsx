'use client';

import { useState } from 'react';
import { usePayment } from '../../hooks/usePayment';
import { PlanType, SubscriptionPeriod } from '../../lib/userService';

interface TestResults {
  checkoutSession?: any;
  userStatus?: any;
  createUser?: any;
  cronTest?: any;
  usageLimitTest?: any;
  usageIncrementTest?: any;
}

export default function StripeTestPage() {
  const { createCheckoutSession, getUserStatus, loading, error } = usePayment();
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
          <h2 className="text-xl font-semibold mb-4">真实支付测试</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleCheckout('premium', 'monthly')}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50"
            >
              月度订阅 $9.99/月
            </button>
            <button
              onClick={() => handleCheckout('premium', 'yearly')}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50"
            >
              年度订阅 $89.99/年
            </button>
            <button
              onClick={() => handleCheckout('lifetime', 'one_time_purchase')}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50"
            >
              终身会员 $249.00
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            ⚠️ 点击按钮后会打开真实的Stripe结账页面。使用测试卡号完成支付，然后回到这里检查用户状态更新。
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
      </div>
    </div>
  );
} 