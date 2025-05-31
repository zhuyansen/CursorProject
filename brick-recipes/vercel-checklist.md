# 🚀 Vercel 部署检查清单

## 📋 部署前检查

### ✅ 代码准备
- [ ] 所有 `console.log` 已注释掉
- [ ] 构建无错误：`pnpm build` 成功
- [ ] 代码已推送到 GitHub main 分支
- [ ] `.env.local` 不在 Git 仓库中
- [ ] `.env.example` 包含所有必要变量示例
- [x] **Sitemap 配置正确** (`/sitemap.xml` 可访问)
- [x] **Robots.txt 配置正确** (`/robots.txt` 可访问)

### ✅ 配置文件检查
- [ ] `vercel.json` 配置正确
- [ ] `next.config.mjs` 已优化
- [ ] `package.json` scripts 配置正确
- [ ] 依赖版本兼容

### ✅ 环境变量配置
- [ ] `NEXT_PUBLIC_APP_URL=https://brickrecipes.ai`
- [ ] 所有数据库连接配置正确
- [ ] Stripe 生产环境密钥配置
- [ ] 分析和监控工具配置

## 🔧 Vercel 项目设置

### ✅ 基础设置
- [ ] Framework: Next.js
- [ ] Build Command: `pnpm build`
- [ ] Install Command: `pnpm install`
- [ ] Output Directory: `.next`
- [ ] Node.js Version: 18.x

### ✅ 域名配置
- [ ] 添加主域名：`brickrecipes.ai`
- [ ] 配置 www 重定向：`www.brickrecipes.ai` → `brickrecipes.ai`
- [ ] SSL 证书自动配置
- [ ] DNS 记录正确指向 Vercel

### ✅ 函数配置
- [ ] API 路由最大执行时间设置
- [ ] 视频处理 API 120秒超时
- [ ] 边缘函数地区设置（亚洲优化）

## 🌍 性能优化

### ✅ 缓存策略
- [ ] 静态资源长期缓存
- [ ] API 路由合理缓存
- [ ] 图片优化启用
- [ ] Gzip 压缩启用

### ✅ SEO 配置
- [ ] Meta 标签完整
- [ ] Sitemap 生成
- [ ] robots.txt 配置
- [ ] Open Graph 标签

## 🔒 安全配置

### ✅ 安全头部
- [ ] X-Frame-Options: SAMEORIGIN
- [ ] X-Content-Type-Options: nosniff
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Referrer-Policy 配置
- [ ] CSP 策略配置

### ✅ 环境变量安全
- [ ] 敏感信息不在客户端暴露
- [ ] API 密钥正确配置
- [ ] 数据库连接加密

## 📊 监控配置

### ✅ Vercel Analytics
- [ ] Web Analytics 启用
- [ ] Speed Insights 配置
- [ ] Function Logs 配置
- [ ] Error Tracking 启用

### ✅ 第三方监控
- [ ] Google Analytics 配置
- [ ] 百度统计配置
- [ ] Sentry 错误监控（可选）

## 🧪 测试验证

### ✅ 功能测试
- [ ] 首页加载正常
- [ ] 用户注册/登录功能
- [ ] 支付流程测试
- [ ] 视频转食谱功能
- [ ] API 接口响应正常

### ✅ 性能测试
- [ ] Lighthouse 分数 > 90
- [ ] 首屏加载时间 < 3秒
- [ ] API 响应时间合理
- [ ] 移动端适配良好

### ✅ 兼容性测试
- [ ] 主流浏览器兼容
- [ ] 移动设备兼容
- [ ] 不同网络环境测试

## 🚀 部署后验证

### ✅ 基础验证
- [ ] https://brickrecipes.ai 可访问
- [ ] www 重定向正常
- [ ] SSL 证书有效
- [ ] 所有页面正常加载

### ✅ 功能验证
- [ ] 用户注册流程
- [ ] 支付功能正常
- [ ] 邮件通知正常
- [ ] 数据库连接正常

### ✅ SEO 验证
- [ ] Google Search Console 验证
- [ ] Sitemap 提交
- [ ] 页面索引正常
- [ ] 结构化数据正确

## 📈 上线后监控

### ✅ 实时监控
- [ ] 设置 Vercel 通知
- [ ] 配置报警阈值
- [ ] 监控 API 错误率
- [ ] 观察用户行为数据

### ✅ 定期检查
- [ ] 每日访问日志检查
- [ ] 每周性能报告
- [ ] 每月安全扫描
- [ ] 定期备份验证

## 🆘 故障排查

### ✅ 常见问题解决
- [ ] 构建失败 → 检查依赖和环境变量
- [ ] 404 错误 → 检查路由配置
- [ ] 500 错误 → 查看 Function Logs
- [ ] 性能问题 → 使用 Speed Insights

### ✅ 回滚计划
- [ ] 保留历史部署版本
- [ ] 一键回滚流程
- [ ] 数据库回滚策略
- [ ] 应急联系方式

---

## 🎯 快速部署命令

```bash
# 1. 确保代码准备就绪
pnpm build

# 2. 推送到 GitHub
git add .
git commit -m "chore: 准备 Vercel 部署"
git push origin main

# 3. 在 Vercel 控制台
# - 导入 GitHub 仓库
# - 配置环境变量
# - 设置自定义域名
# - 点击部署

# 4. 验证部署
curl -I https://brickrecipes.ai
```

## ✅ 部署成功标志

当所有检查项都完成时，您的 BrickRecipes.ai 就成功部署到 Vercel 了！

🎉 **恭喜！您的网站现在可以通过 https://brickrecipes.ai 访问了！** 