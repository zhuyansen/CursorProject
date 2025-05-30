import { NextRequest, NextResponse } from 'next/server';
import { BIBIGPT_API_ENDPOINT } from '@/config/bilibiligpt';

export async function GET() {
  const checkResults: any = {
    timestamp: new Date().toISOString(),
    service: 'BibiGPT',
    endpoint: BIBIGPT_API_ENDPOINT,
    status: 'unknown',
    details: {}
  };

  try {
    // 1. 首先检查域名可达性
    const domainCheck = await fetch('https://api.bibigpt.co', {
      method: 'HEAD',
      timeout: 10000
    } as any);
    
    checkResults.details.domainReachable = domainCheck.ok;
    checkResults.details.domainStatus = domainCheck.status;

    // 2. 检查API端点的基础响应
    const apiCheck = await fetch(BIBIGPT_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 'ping' }),
      timeout: 15000
    } as any);

    const responseText = await apiCheck.text();
    
    checkResults.details.apiReachable = true;
    checkResults.details.apiStatus = apiCheck.status;
    checkResults.details.apiResponse = responseText.slice(0, 200);
    
    // 3. 分析API状态
    if (apiCheck.status === 404) {
      checkResults.status = 'api_not_found';
      checkResults.message = 'API端点不存在或已更改';
    } else if (apiCheck.status === 200 || apiCheck.status === 400) {
      checkResults.status = 'api_available';
      checkResults.message = 'API服务可用';
    } else if (apiCheck.status >= 500) {
      checkResults.status = 'api_server_error';
      checkResults.message = 'API服务器内部错误';
    } else {
      checkResults.status = 'api_partial';
      checkResults.message = `API响应异常 (${apiCheck.status})`;
    }

  } catch (error: any) {
    checkResults.status = 'connection_failed';
    checkResults.message = '无法连接到BibiGPT服务';
    checkResults.details.error = error.message;
    checkResults.details.apiReachable = false;
  }

  // 4. 生成建议
  let suggestions: string[] = [];
  
  switch (checkResults.status) {
    case 'api_available':
      suggestions = ['服务正常，如有问题请检查请求参数'];
      break;
    case 'api_server_error':
      suggestions = [
        '等待5-10分钟后重试',
        '检查BibiGPT官方状态页面',
        '考虑联系技术支持'
      ];
      break;
    case 'api_not_found':
      suggestions = [
        '检查API密钥配置',
        '确认API端点URL是否正确',
        '联系技术支持确认API版本'
      ];
      break;
    case 'connection_failed':
      suggestions = [
        '检查网络连接',
        '确认防火墙设置',
        '稍后重试'
      ];
      break;
    default:
      suggestions = ['稍后重试或联系技术支持'];
  }

  checkResults.suggestions = suggestions;

  // 根据状态返回适当的HTTP状态码
  const httpStatus = checkResults.status === 'api_available' ? 200 : 503;

  return NextResponse.json(checkResults, { status: httpStatus });
} 