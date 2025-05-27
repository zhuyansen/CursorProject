# Stripe Webhook 故障排除指南

## 常见问题：Webhook签名验证失败

当您看到以下错误时：
```
No signatures found matching the expected signature for payload
```

这通常是由以下原因引起的：

## 解决方案

### 1. 获取正确的Webhook签名密钥

1. 访问 [Stripe Dashboard Webhooks](https://dashboard.stripe.com/test/webhooks)
2. 找到您的ngrok webhook URL配置
3. 点击webhook条目查看详情
4. 在"Signing secret"部分点击"Reveal"
5. 复制完整的签名密钥（以`whsec_`开头）

### 2. 更新环境变量

在`.env.local`文件中更新webhook密钥：
```bash
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret_here
```

### 3. 重新配置ngrok webhook

如果您重新启动了ngrok，URL会改变，需要：

1. 停止当前的ngrok进程
2. 重新启动：`ngrok http 3007`
3. 复制新的URL
4. 在Stripe Dashboard中更新webhook URL
5. 获取新的签名密钥并更新环境变量

### 4. 快速修复脚本

运行以下命令来重新配置：

```bash
# 1. 重启ngrok（在新终端窗口）
ngrok http 3007

# 2. 更新环境变量后重启开发服务器
npm run dev
```

### 5. 验证配置

使用以下curl命令测试webhook状态：
```bash
curl -s "http://localhost:3007/api/webhook-status"
```

### 6. 测试webhook

在Stripe Dashboard中使用"Send test webhook"功能来验证配置。

## 调试信息

当webhook失败时，检查开发服务器日志中的调试信息：
- Body length（请求体长度）
- Signature（签名头）
- Webhook secret（环境变量中的密钥前20个字符）

## 常见错误和解决方案

### 错误：Missing stripe-signature header
**原因：** 请求不是来自Stripe  
**解决：** 确保webhook URL配置正确

### 错误：Invalid signature  
**原因：** 签名密钥不匹配  
**解决：** 按照上述步骤更新签名密钥

### 错误：Timestamp tolerance  
**原因：** 服务器时间不同步  
**解决：** 这通常在本地开发中不是问题

## 生产环境注意事项

1. 在生产环境中使用真实的域名而不是ngrok
2. 使用生产环境的Stripe密钥
3. 配置HTTPS SSL证书
4. 设置适当的请求超时
5. 实现日志监控和告警 