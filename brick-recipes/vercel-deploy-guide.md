# BrickRecipes.ai Vercel 部署指南 🚀

## 🌟 Vercel 部署优势

- ✅ **零配置部署**：自动检测 Next.js 并优化构建
- ✅ **全球 CDN**：自动分发到全球边缘节点
- ✅ **自动 HTTPS**：免费 SSL 证书和自动续期
- ✅ **Git 集成**：每次 push 自动部署
- ✅ **预览部署**：每个 PR 自动生成预览链接
- ✅ **Serverless 函数**：API 路由自动扩展
- ✅ **分析监控**：内置性能分析和错误跟踪

## 📋 部署前准备

### 1. GitHub 仓库设置
确保您的代码已推送到 GitHub 仓库，并且包含：
- 所有项目文件
- `package.json` 配置正确
- `.env.example` 文件（不包含敏感信息）

### 2. 优化项目配置

#### 更新 `next.config.mjs`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Vercel 优化
  poweredByHeader: false,
  generateEtags: false,
  compress: true,
  
  images: {
    domains: ['images.unsplash.com', 'your-image-domain.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
  
  experimental: {
    optimizeCss: false,
    scrollRestoration: true,
  },
}

export default nextConfig
```

## 🚀 Vercel 部署步骤

### 1. 连接 GitHub 仓库

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 账户登录
3. 点击 "New Project"
4. 选择您的 `brick-recipes` 仓库
5. 点击 "Import"

### 2. 配置项目设置

**Framework Preset**: Next.js (自动检测)
**Root Directory**: `./` (根目录)
**Build Command**: `pnpm build`
**Install Command**: `pnpm install`
**Output Directory**: `.next` (自动设置)

### 3. 环境变量配置

在 Vercel 项目设置中添加以下环境变量：

#### 🔐 生产环境变量

```bash
# 应用配置
NEXT_PUBLIC_APP_URL=https://brickrecipes.ai
NODE_ENV=production

# 数据库配置
REDIS_HOST=128.1.47.79
REDIS_PORT=26740
REDIS_PASSWORD=dLmHMtPwjktyYnLt

MONGODB_URI=mongodb://jason:Chatbot520@128.1.47.79:27017/videotorecipe
MONGODB_DB=videotorecipe

# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://bqkzeajvxcsrlmxxizye.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxa3plYWp2eGNzcmxteHhpenllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2NTAwNDUsImV4cCI6MjA2MzIyNjA0NX0.GqTcvnN7GUb7Xu6ifyxvQIMgueYDahDYUNQ3R_z_3Xo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxa3plYWp2eGNzcmxteHhpenllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzY1MDA0NSwiZXhwIjoyMDYzMjI2MDQ1fQ.HjNpI1QdYRHd2pm-M5CtT2R16p5muMXHqsH5pQiv71k

# Stripe配置 (生产环境)
STRIPE_SECRET_KEY=***REMOVED***
STRIPE_WEBHOOK_SECRET=***REMOVED***

# Stripe 支付链接
STRIPE_MONTHLY_PLAN_LINK=https://buy.stripe.com/9B628qbuL2O1dQn3Hm2VG03
STRIPE_YEARLY_PLAN_LINK=https://buy.stripe.com/bJebJ01UbfANdQn2Di2VG04
STRIPE_LIFETIME_MEMBER_PLAN_LINK=https://buy.stripe.com/9B6eVc7ev4W9h2z1ze2VG02

# Stripe 价格ID
STRIPE_MONTHLY_PRICE_ID=price_1RRU7uC0OZ4h2np2Cq1abw2F
STRIPE_YEARLY_PRICE_ID=price_1RRUB7C0OZ4h2np2xfsGEYr7
STRIPE_LIFETIME_MEMBER_PRICE_ID=price_1RRSkPC0OZ4h2np2DfKLygH6
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_1RRU7uC0OZ4h2np2Cq1abw2F
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_1RRUB7C0OZ4h2np2xfsGEYr7
STRIPE_LIFETIME_PRICE_ID=price_1RRSkPC0OZ4h2np2DfKLygH6

# 定时任务密钥
CRON_SECRET=ems0JqslNbiqeQd1NoDkBvDh44qhdXaS

# 分析和跟踪
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-LSGF24B1MC
NEXT_PUBLIC_BAIDU_ANALYTICS_ID=8cda24519be01bbea43fbe1ae11dbcd2
GOOGLE_SITE_VERIFICATION=pzOmxCysKj_5YOBov6XQDQbLcgYIQAm0czOGXKwDcuI
```

### 4. 域名配置

#### 4.1 添加自定义域名

1. 在 Vercel 项目设置中，进入 "Domains" 页面
2. 添加域名：`brickrecipes.ai`
3. 添加 www 重定向：`www.brickrecipes.ai` → `brickrecipes.ai`

#### 4.2 DNS 配置

在您的域名提供商处设置：

```bash
# A 记录 (指向 Vercel)
Type: A
Name: @
Value: 76.76.19.19

Type: A  
Name: www
Value: 76.76.19.19

# 或者使用 CNAME (推荐)
Type: CNAME
Name: @
Value: cname.vercel-dns.com

Type: CNAME
Name: www  
Value: cname.vercel-dns.com
```

### 5. 优化配置

#### 5.1 创建 `vercel.json`

```json
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["hkg1", "sin1", "nrt1"],
  "functions": {
    "app/api/**": {
      "maxDuration": 30
    },
    "app/api/video-to-recipes/**": {
      "maxDuration": 120
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-Content-Type-Options", 
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/www.brickrecipes.ai/(.*)",
      "destination": "https://brickrecipes.ai/$1", 
      "permanent": true
    }
  ]
}
```

## 🔄 部署和更新流程

### 自动部署
每次推送到 `main` 分支，Vercel 会自动：
1. 检测代码变更
2. 构建项目
3. 运行测试（如果配置）
4. 部署到生产环境
5. 发送部署通知

### 手动部署
```bash
# 本地开发完成后
git add .
git commit -m "feat: 新功能更新"
git push origin main

# Vercel 会自动开始部署
```

### 预览部署
```bash
# 创建功能分支
git checkout -b feature/new-feature

# 开发并推送
git push origin feature/new-feature

# Vercel 会为该分支创建预览部署链接
```

## 📊 监控和分析

### 1. Vercel Analytics
在项目设置中启用：
- **Web Analytics**: 页面性能分析
- **Speed Insights**: 加载速度监控
- **Audience**: 用户行为分析

### 2. 实时监控
```bash
# 查看实时日志
vercel logs <project-name>

# 查看部署状态
vercel ls

# 查看域名状态
vercel domains
```

### 3. 错误追踪
Vercel 自动捕获：
- 构建错误
- 运行时错误
- API 路由错误
- 性能问题

## 🔧 高级配置

### 1. 边缘函数优化
```javascript
// 在需要的 API 路由中添加
export const config = {
  runtime: 'edge',
  regions: ['hkg1', 'sin1'], // 亚洲区域优化
}
```

### 2. 中间件配置
```javascript
// middleware.ts
import { NextResponse } from 'next/server'

export function middleware(request) {
  // 地理位置重定向
  const country = request.geo.country
  
  if (country === 'CN') {
    // 中国用户特殊处理
    return NextResponse.next()
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

### 3. 构建优化
```json
// package.json
{
  "scripts": {
    "build": "next build",
    "build:analyze": "ANALYZE=true next build",
    "start": "next start",
    "dev": "next dev"
  }
}
```

## 💰 成本优化

### Vercel 定价
- **Hobby Plan**: 免费
  - 100GB 带宽/月
  - 100 次 Serverless 函数调用/天
  - 自定义域名

- **Pro Plan**: $20/月
  - 1TB 带宽/月
  - 1000 次 Serverless 函数调用/天
  - 团队协作功能

### 优化建议
1. **静态资源优化**: 使用 Next.js Image 优化
2. **API 缓存**: 合理设置缓存策略
3. **边缘函数**: 减少冷启动时间
4. **代码分割**: 按需加载组件

## 🆚 Vercel vs 自建服务器对比

| 特性 | Vercel | 自建服务器 |
|------|--------|------------|
| **部署难度** | ⭐⭐⭐⭐⭐ 极简 | ⭐⭐ 复杂 |
| **维护成本** | ⭐⭐⭐⭐⭐ 零维护 | ⭐⭐ 需要运维 |
| **性能** | ⭐⭐⭐⭐ 全球CDN | ⭐⭐⭐ 单点部署 |
| **扩展性** | ⭐⭐⭐⭐⭐ 自动扩展 | ⭐⭐⭐ 手动扩展 |
| **成本** | ⭐⭐⭐ 按使用量 | ⭐⭐⭐⭐ 固定成本 |
| **控制力** | ⭐⭐⭐ 有限制 | ⭐⭐⭐⭐⭐ 完全控制 |

## 🎯 推荐方案

### 对于 BrickRecipes.ai 项目，推荐使用 **Vercel**：

✅ **适合场景**:
- 快速上线和迭代
- 团队协作开发
- 全球用户访问
- 希望专注业务逻辑

✅ **优势**:
- 部署简单，几分钟即可上线
- 自动扩展，应对流量高峰
- 全球 CDN 加速
- 零运维成本

## 🚀 快速开始

```bash
# 1. 确保代码推送到 GitHub
git push origin main

# 2. 访问 vercel.com 并连接 GitHub
# 3. 导入 brick-recipes 项目
# 4. 配置环境变量
# 5. 部署！

# 🎉 几分钟后，您的网站就会在 https://brickrecipes.ai 上线！
```

---

🎊 **Vercel 部署让您专注于产品开发，而不是基础设施管理！** 