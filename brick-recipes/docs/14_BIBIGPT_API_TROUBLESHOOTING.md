# BibiGPT API 故障排除指南

## 问题概述

BibiGPT API 是用于分析 Bilibili 视频并提取食谱信息的外部服务。当前遇到的主要问题是 API 返回 500 Internal Server Error。

## 问题诊断

### 1. 当前状态
- **API 端点**: `https://api.bibigpt.co/api/open/qQYDOv6u47KR`
- **域名状态**: ✅ 可访问 (HTTP 200)
- **API 状态**: ❌ 内部服务器错误 (HTTP 500)
- **错误类型**: 外部服务故障，非本地代码问题

### 2. 测试结果
```bash
# 域名测试
curl -I https://api.bibigpt.co
# 结果: HTTP/1.1 200 OK

# API 端点测试
curl -X POST "https://api.bibigpt.co/api/open/qQYDOv6u47KR" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.bilibili.com/video/BV1example"}'
# 结果: {"errorMessage":"Not correct params"} (HTTP 404)

# 使用正确参数格式测试
curl -X POST "https://api.bibigpt.co/api/open/qQYDOv6u47KR" \
  -H "Content-Type: application/json" \
  -d '{"promptConfig":{"outputLanguage":"en-US","detailLevel":3,"isRefresh":false,"showEmoji":true},"includeDetail":true,"prompt":"test","limitation":{"maxDuration":3600},"url":"https://www.bilibili.com/video/BV1example"}'
# 结果: Internal Server Error (HTTP 500)
```

### 3. 根本原因
BibiGPT 外部服务当前存在内部服务器错误，这不是我们应用程序的问题。

## 已实施的解决方案

### 1. 改进的错误处理 (`/app/api/video-to-recipes/route.ts`)

```typescript
// 添加了详细的错误日志记录
console.log(`[API/video-to-recipes] BibiGPT API 响应状态: ${response.status} ${response.statusText}`);

// 结构化的错误响应
return NextResponse.json({
  success: false,
  error: errorData?.message || response.statusText || '视频分析服务器内部错误',
  message: `外部API返回错误 (${response.status}): ${errorData?.message || response.statusText}`,
  details: errorText.slice(0, 500),
  suggestions: suggestions,
  troubleshooting: {
    status: response.status,
    service: 'BibiGPT',
    timestamp: new Date().toISOString(),
    checkUrl: 'https://api.bibigpt.co'
  }
}, { 
  status: response.status >= 500 ? 503 : response.status
});
```

### 2. API 状态检查端点 (`/app/api/bibigpt-status/route.ts`)

创建了专门的状态检查端点，用于诊断 BibiGPT 服务可用性：

```typescript
// GET /api/bibigpt-status
// 返回详细的服务状态信息和建议
```

### 3. 改进的前端错误显示 (`/app/videotorecipes/page.tsx`)

- 添加了针对不同错误类型的专门提示
- 集成了服务状态检查功能
- 提供了详细的故障排除建议

### 4. 超时和网络错误处理

```typescript
// 使用 AbortController 实现 120 秒超时
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 120000);

const response = await fetch(BIBIGPT_API_ENDPOINT, {
  ...options,
  signal: controller.signal
});
```

## 用户指导

### 当遇到 BibiGPT 错误时：

1. **立即解决方案**:
   - 等待 5-10 分钟后重试
   - 确认视频链接有效且可公开访问
   - 尝试使用其他视频进行测试

2. **检查服务状态**:
   - 访问 `/api/bibigpt-status` 查看详细状态
   - 或在错误对话框中点击"检查BibiGPT服务状态"

3. **替代方案**:
   - 暂时使用 YouTube 视频（如果支持）
   - 等待服务恢复后重试

## 监控和维护

### 1. 状态监控
- 定期检查 `/api/bibigpt-status` 端点
- 监控错误日志中的 BibiGPT 相关错误

### 2. 错误模式识别
- **500 错误**: 外部服务故障
- **404 错误**: API 端点或参数问题
- **429 错误**: 频率限制
- **超时错误**: 网络或服务响应慢

### 3. 升级路径
如果 BibiGPT 服务持续不稳定，考虑：
- 寻找替代的视频分析服务
- 实现本地视频处理能力
- 添加多个服务提供商的支持

## 技术细节

### API 请求格式
```json
{
  "promptConfig": {
    "outputLanguage": "en-US",
    "detailLevel": 3,
    "isRefresh": false,
    "showEmoji": true
  },
  "includeDetail": true,
  "prompt": "[详细的食谱提取提示词]",
  "limitation": {
    "maxDuration": 3600
  },
  "url": "https://www.bilibili.com/video/BV..."
}
```

### 错误响应处理
- 5xx 错误映射为 503 Service Unavailable
- 包含详细的故障排除信息
- 提供用户友好的建议

## 联系支持

如果问题持续存在：
1. 收集错误日志和状态检查结果
2. 记录问题发生的时间和频率
3. 联系技术支持团队
4. 提供具体的视频链接用于测试

---

**最后更新**: 2025-05-30
**状态**: BibiGPT API 当前存在 500 内部服务器错误
**建议**: 等待外部服务恢复，或考虑替代解决方案 