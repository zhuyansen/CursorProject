# Vercel.json 配置详解 📖

## 📋 配置文件说明

此文档详细解释 `vercel.json` 中各个配置项的作用和用法。

## 🔧 基础配置

```json
{
  "buildCommand": "pnpm build",        // 构建命令：使用 pnpm 包管理器构建项目
  "installCommand": "pnpm install",    // 安装命令：安装依赖包
  "framework": "nextjs",               // 框架类型：Next.js 应用
  "regions": ["iad1", "cle1", "pdx1"]  // 部署地区：美国东部、中部、西部
}
```

### 🌍 Regions（部署地区）说明

| 地区代码 | 位置 | 说明 |
|---------|------|------|
| `iad1` | 美国东部 (弗吉尼亚) | 主要服务北美东海岸用户 |
| `cle1` | 美国中部 (俄亥俄) | 服务美国中部地区 |
| `pdx1` | 美国西部 (俄勒冈) | 服务北美西海岸用户 |

**为什么选择美国地区？**
- 🎯 主要用户群体在北美
- 🚀 更好的服务器性能和稳定性
- 💰 更经济的成本结构

## ⚡ Functions（无服务器函数）配置

```json
{
  "functions": {
    "app/api/**": {
      "maxDuration": 30        // 普通 API 路由最大执行时间：30秒
    },
    "app/api/video-to-recipes/**": {
      "maxDuration": 120       // 视频处理 API 最大执行时间：120秒
    }
  }
}
```

**说明：**
- 视频处理需要更长时间，设置为 120 秒
- 其他 API 路由设置为 30 秒，防止超时

## 🔒 Headers（HTTP 头部）配置

```json
{
  "headers": [
    {
      "source": "/(.*)",      // 匹配所有路径
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"                    // 防止点击劫持攻击
        },
        {
          "key": "X-Content-Type-Options", 
          "value": "nosniff"                       // 防止 MIME 类型嗅探
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"                 // 启用 XSS 保护
        },
        {
          "key": "Referrer-Policy",
          "value": "origin-when-cross-origin"      // 跨域时只发送源站信息
        }
      ]
    },
    {
      "source": "/_next/static/(.*)",            // 匹配 Next.js 静态资源
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"  // 静态资源长期缓存
        }
      ]
    }
  ]
}
```

## 🔄 Redirects（重定向）详解

```json
{
  "redirects": [
    {
      "source": "/www.brickrecipes.ai/(.*)",     // 源路径：匹配 www 子域名
      "destination": "https://brickrecipes.ai/$1", // 目标路径：重定向到主域名
      "permanent": true                          // 永久重定向 (301)
    }
  ]
}
```

### ❓ 什么是 Redirects？

**Redirects** 是 **HTTP 重定向**，浏览器会收到重定向状态码，并自动跳转到新 URL。

**特点：**
- 🔄 浏览器地址栏会改变
- 📊 搜索引擎会更新索引
- ⚡ 有轻微的性能开销（额外的 HTTP 请求）

**使用场景：**
- 域名统一（www → 主域名）
- 旧页面迁移到新 URL
- 强制 HTTPS 跳转

**示例效果：**
```
用户访问：https://www.brickrecipes.ai/menu
↓
浏览器接收：301 Moved Permanently
↓  
自动跳转：https://brickrecipes.ai/menu
浏览器地址栏显示：https://brickrecipes.ai/menu
```

## 🔀 Rewrites（重写）详解

```json
{
  "rewrites": [
    {
      "source": "/sitemap.xml",          // 用户请求的路径
      "destination": "/api/sitemap"      // 实际处理的路径
    }
  ]
}
```

### ❓ 什么是 Rewrites？

**Rewrites** 是 **内部路径重写**，服务器在内部处理请求，用户看不到真实路径。

**特点：**
- 🔒 浏览器地址栏不会改变
- 🎭 对用户完全透明
- ⚡ 没有额外的 HTTP 请求
- 🔧 纯服务器端操作

**使用场景：**
- API 路径美化
- 动态生成静态文件（如 sitemap）
- 代理到不同的服务
- A/B 测试路由

**示例效果：**
```
用户访问：https://brickrecipes.ai/sitemap.xml
↓
服务器内部处理：/api/sitemap 路由
↓
返回：动态生成的 XML 内容
浏览器地址栏显示：https://brickrecipes.ai/sitemap.xml (不变)
```

## 📊 Redirects vs Rewrites 对比

| 特性 | Redirects (重定向) | Rewrites (重写) |
|------|-------------------|----------------|
| **浏览器地址栏** | ✅ 会改变 | ❌ 不会改变 |
| **HTTP 状态码** | 301/302 | 200 |
| **性能开销** | 🔴 有（额外请求） | 🟢 无 |
| **SEO 影响** | ✅ 更新索引 | ❌ 保持原路径 |
| **用户感知** | ✅ 可见跳转 | ❌ 完全透明 |
| **使用场景** | 域名统一、页面迁移 | API 美化、代理 |

## 💡 最佳实践

### 🔄 何时使用 Redirects

```json
// ✅ 好的用例
{
  "source": "/old-page",
  "destination": "/new-page",
  "permanent": true
}

// ✅ 域名统一
{
  "source": "/www.example.com/(.*)",
  "destination": "https://example.com/$1", 
  "permanent": true
}

// ✅ 强制 HTTPS
{
  "source": "http://example.com/(.*)",
  "destination": "https://example.com/$1",
  "permanent": true
}
```

### 🔀 何时使用 Rewrites

```json
// ✅ 好的用例
{
  "source": "/sitemap.xml",
  "destination": "/api/sitemap"
}

// ✅ API 美化
{
  "source": "/blog/:slug",
  "destination": "/api/blog/:slug"
}

// ✅ 代理到外部服务
{
  "source": "/proxy/:path*",
  "destination": "https://external-api.com/:path*"
}
```

## 🎯 当前配置解释

我们的 `vercel.json` 配置：

1. **Redirect `www` → 主域名**
   ```json
   {
     "source": "/www.brickrecipes.ai/(.*)",
     "destination": "https://brickrecipes.ai/$1",
     "permanent": true
   }
   ```
   - 确保所有访问都统一到主域名
   - 有利于 SEO 和品牌一致性

2. **Rewrite sitemap 请求**
   ```json
   {
     "source": "/sitemap.xml", 
     "destination": "/api/sitemap"
   }
   ```
   - 用户访问 `/sitemap.xml` 时，内部调用 API 动态生成
   - 保持标准的 SEO URL 格式

## 🚀 部署后验证

```bash
# 测试重定向
curl -I https://www.brickrecipes.ai
# 应该返回：Location: https://brickrecipes.ai

# 测试重写  
curl https://brickrecipes.ai/sitemap.xml
# 应该返回：动态生成的 XML 内容，地址栏保持 /sitemap.xml
```

---

💡 **提示**：由于 JSON 不支持注释，我们将此说明文档单独维护。在修改 `vercel.json` 时，请同时更新此文档！ 