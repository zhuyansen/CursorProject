# BrickRecipes.ai 部署指南

## 🚀 Vercel 部署（推荐）

### 1. 准备工作

#### 1.1 环境要求
- Node.js 18+ 
- pnpm 包管理器
- GitHub 账户
- Vercel 账户

#### 1.2 代码准备
```bash
# 确保代码已推送到 GitHub
git add .
git commit -m "准备部署"
git push origin master
```

### 2. Vercel 部署步骤

#### 2.1 连接 GitHub
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 选择 GitHub 仓库：`zhuyansen/CursorProject`
4. 选择 `brick-recipes` 目录作为根目录

#### 2.2 项目配置
```bash
# 框架预设
Framework Preset: Next.js

# 构建设置
Build Command: pnpm build
Output Directory: .next
Install Command: pnpm install

# 根目录
Root Directory: brick-recipes
```

### 3. 环境变量配置

在 Vercel 项目设置 → Environment Variables 中添加以下变量：

#### 3.1 Supabase 配置
```bash
NEXT_PUBLIC_SUPABASE_URL=你的_supabase_项目_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_supabase_匿名_密钥
SUPABASE_SERVICE_ROLE_KEY=你的_supabase_服务_角色_密钥
```

#### 3.2 Stripe 配置
```bash
STRIPE_SECRET_KEY=你的_stripe_密钥
STRIPE_WEBHOOK_SECRET=你的_stripe_webhook_密钥

# Stripe 支付链接
STRIPE_MONTHLY_PLAN_LINK=你的_月度_支付_链接
STRIPE_YEARLY_PLAN_LINK=你的_年度_支付_链接
STRIPE_LIFETIME_MEMBER_PLAN_LINK=你的_终身_支付_链接

# Stripe 价格 ID
STRIPE_MONTHLY_PRICE_ID=你的_月度_价格_id
STRIPE_YEARLY_PRICE_ID=你的_年度_价格_id
STRIPE_LIFETIME_MEMBER_PRICE_ID=你的_终身_价格_id
STRIPE_PREMIUM_MONTHLY_PRICE_ID=你的_高级_月度_价格_id
STRIPE_PREMIUM_YEARLY_PRICE_ID=你的_高级_年度_价格_id
STRIPE_LIFETIME_PRICE_ID=你的_终身_价格_id
```

#### 3.3 其他配置
```bash
# 定时任务密钥
CRON_SECRET=生成_一个_随机_密钥

# 分析和跟踪
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=你的_ga_id
NEXT_PUBLIC_BAIDU_ANALYTICS_ID=你的_百度_统计_id
GOOGLE_SITE_VERIFICATION=你的_谷歌_验证_码

# 生产环境
NODE_ENV=production
```

### 4. 域名配置

#### 4.1 添加自定义域名
1. 在 Vercel 项目设置中，进入 "Domains" 页面
2. 添加域名：`brickrecipes.ai`
3. 添加 www 重定向：`www.brickrecipes.ai` → `brickrecipes.ai`

#### 4.2 DNS 配置
在您的域名提供商处设置：

```bash
# CNAME 记录（推荐）
Type: CNAME
Name: @
Value: cname.vercel-dns.com

Type: CNAME
Name: www  
Value: cname.vercel-dns.com
```

### 5. 部署验证

#### 5.1 检查部署状态
1. 在 Vercel Dashboard 查看部署日志
2. 确认所有环境变量已正确设置
3. 测试网站功能：
   - 用户注册/登录
   - 视频转食谱功能
   - 支付流程
   - API 接口

#### 5.2 性能优化
- 启用 Vercel Analytics
- 配置 Speed Insights
- 设置错误监控

### 6. 持续部署

#### 6.1 自动部署
每次推送到 `master` 分支，Vercel 会自动：
1. 检测代码变更
2. 构建项目
3. 运行测试
4. 部署到生产环境

#### 6.2 预览部署
```bash
# 创建功能分支进行预览
git checkout -b feature/new-feature
git push origin feature/new-feature
# Vercel 会自动创建预览链接
```

## 🔒 安全注意事项

### 1. 环境变量安全
- ❌ 永远不要在代码中硬编码 API 密钥
- ✅ 使用 Vercel 环境变量管理敏感信息
- ✅ 定期轮换 API 密钥

### 2. Git 安全
- ❌ 不要提交包含密钥的文件
- ✅ 使用 `.gitignore` 排除敏感文件
- ✅ 定期检查 Git 历史记录

### 3. 生产环境
- ✅ 使用生产环境的 Stripe 密钥
- ✅ 启用 HTTPS
- ✅ 配置安全头部

## 📊 监控和维护

### 1. 日志监控
```bash
# 查看 Vercel 日志
vercel logs <project-name>

# 查看实时部署状态
vercel ls
```

### 2. 性能监控
- Vercel Analytics：页面性能
- Speed Insights：加载速度
- Error Tracking：错误追踪

### 3. 定期维护
- 更新依赖包
- 监控 API 使用量
- 备份数据库
- 检查安全漏洞

## 🆘 故障排除

### 常见问题
1. **构建失败**：检查依赖版本和环境变量
2. **API 错误**：验证密钥配置和网络连接
3. **域名问题**：确认 DNS 设置和 SSL 证书

### 支持资源
- [Vercel 文档](https://vercel.com/docs)
- [Next.js 文档](https://nextjs.org/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Stripe 文档](https://stripe.com/docs)

---

🎉 **部署完成后，您的网站将在 `https://brickrecipes.ai` 上线！** 