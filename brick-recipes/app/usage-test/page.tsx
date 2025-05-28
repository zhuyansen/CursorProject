'use client';

import { useState, useEffect } from 'react';
import { useUserPlan } from '@/hooks/useUserPlan';
import { useAuth } from '@/components/auth-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';

export default function UsageTestPage() {
  const { user } = useAuth();
  const { 
    userPlan, 
    loading, 
    error, 
    checkUsageLimit, 
    incrementUsage, 
    checkAndHandleUsage,
    getPlanConfig 
  } = useUserPlan();
  
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isTestingBrick, setIsTestingBrick] = useState(false);
  const [isTestingVideo, setIsTestingVideo] = useState(false);

  const { t } = useLanguage();

  const addTestResult = (test: string, result: any, success: boolean) => {
    setTestResults(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      test,
      result,
      success
    }]);
  };

  const testBrickUsage = async () => {
    setIsTestingBrick(true);
    try {
      // 测试检查使用限制
      const usageCheck = await checkUsageLimit('brick');
      addTestResult('检查Brick使用限制', usageCheck, usageCheck.allowed);

      if (usageCheck.allowed) {
        // 测试增加使用量
        const incrementResult = await incrementUsage('brick');
        addTestResult('增加Brick使用量', incrementResult, true);
      }
    } catch (err) {
      addTestResult('Brick测试失败', err, false);
    }
    setIsTestingBrick(false);
  };

  const testVideoUsage = async () => {
    setIsTestingVideo(true);
    try {
      // 测试检查使用限制
      const usageCheck = await checkUsageLimit('video');
      addTestResult('检查Video使用限制', usageCheck, usageCheck.allowed);

      if (usageCheck.allowed) {
        // 测试增加使用量
        const incrementResult = await incrementUsage('video');
        addTestResult('增加Video使用量', incrementResult, true);
      }
    } catch (err) {
      addTestResult('Video测试失败', err, false);
    }
    setIsTestingVideo(false);
  };

  const testBrickWithHandler = async () => {
    await checkAndHandleUsage(
      'brick',
      '食谱筛选',
      () => {
        addTestResult('Brick处理器测试', '成功执行回调', true);
      }
    );
  };

  const testVideoWithHandler = async () => {
    await checkAndHandleUsage(
      'video',
      '视频分析',
      () => {
        addTestResult('Video处理器测试', '成功执行回调', true);
      }
    );
  };

  const addVideoUsageBulk = async () => {
    try {
      const result = await incrementUsage('video', 50);
      addTestResult('批量增加Video使用量(+50)', result, true);
    } catch (err) {
      addTestResult('批量增加Video使用量失败', err, false);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              需要登录
            </CardTitle>
            <CardDescription>
              请先登录以测试用户计划管理系统
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">用户计划管理系统测试</h1>
        <p className="text-gray-600">测试用户使用量限制和管理功能</p>
      </div>

      {/* 用户信息 */}
      <Card>
        <CardHeader>
          <CardTitle>用户信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>用户ID:</strong> {user.id}</p>
              <p><strong>邮箱:</strong> {user.email}</p>
            </div>
            <div>
              <p><strong>加载状态:</strong> {loading ? t("common.loading") : '已加载'}</p>
              {error && <p className="text-red-500"><strong>错误:</strong> {error}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 计划信息 */}
      {userPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              计划信息
              <Badge variant={userPlan.plan === 'free' ? 'secondary' : 'default'}>
                {userPlan.plan.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Brick使用情况</h4>
                <p>当前使用: {userPlan.user_monthly_brick_use || 0}</p>
                <p>月度限制: {userPlan.user_monthly_brick_limit === -1 ? '无限制' : userPlan.user_monthly_brick_limit}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Video使用情况</h4>
                <p>当前使用: {userPlan.user_monthly_video_use || 0}</p>
                <p>月度限制: {userPlan.user_monthly_video_limit === -1 ? '无限制' : userPlan.user_monthly_video_limit}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 计划配置 */}
      {userPlan && (
        <Card>
          <CardHeader>
            <CardTitle>计划配置</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(['free', 'premium', 'lifetime'] as const).map(plan => {
                const config = getPlanConfig(plan);
                const isCurrent = userPlan.plan === plan;
                return (
                  <div key={plan} className={`p-4 border rounded-lg ${isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{config.name}</h4>
                      {isCurrent && <Badge>当前计划</Badge>}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <p>Brick限制: {config.brick_limit === -1 ? '无限制' : config.brick_limit}</p>
                      <p>Video限制: {config.video_limit === -1 ? '无限制' : config.video_limit}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 测试按钮 */}
      <Card>
        <CardHeader>
          <CardTitle>功能测试</CardTitle>
          <CardDescription>测试使用量检查和增加功能</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Brick功能测试</h4>
              <Button 
                onClick={testBrickUsage} 
                disabled={isTestingBrick}
                className="w-full"
              >
                {isTestingBrick ? '测试中...' : '测试Brick使用量'}
              </Button>
              <Button 
                onClick={testBrickWithHandler} 
                variant="outline"
                className="w-full"
              >
                测试Brick处理器
              </Button>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Video功能测试</h4>
              <Button 
                onClick={testVideoUsage} 
                disabled={isTestingVideo}
                className="w-full"
              >
                {isTestingVideo ? '测试中...' : '测试Video使用量'}
              </Button>
              <Button 
                onClick={testVideoWithHandler} 
                variant="outline"
                className="w-full"
              >
                测试Video处理器
              </Button>
              <Button 
                onClick={addVideoUsageBulk} 
                variant="outline"
                className="w-full"
              >
                批量增加Video使用量(+50)
              </Button>
            </div>
          </div>
          <Separator className="my-4" />
          <Button onClick={clearTestResults} variant="outline" className="w-full">
            清除测试结果
          </Button>
        </CardContent>
      </Card>

      {/* 测试结果 */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>测试结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{result.test}</span>
                      <span className="text-xs text-gray-500">{result.timestamp}</span>
                    </div>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 