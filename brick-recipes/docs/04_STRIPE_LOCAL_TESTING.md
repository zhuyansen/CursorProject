# Stripe本地Webhook测试指南

## 方法1: 使用Stripe CLI（推荐）

### 1. 安装Stripe CLI

#### macOS:
```bash
brew install stripe/stripe-cli/stripe
```

#### Windows:
下载并安装: https://github.com/stripe/stripe-cli/releases

#### Linux:
```bash
# Ubuntu/Debian
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_*_linux_x86_64.tar.gz
tar -xzf stripe_*_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

### 2. 登录Stripe账户
```bash
stripe login
```
这会打开浏览器让您授权CLI访问您的Stripe账户。

### 3. 启动本地webhook监听
```bash
# 监听所有事件并转发到本地服务器
stripe listen --forward-to localhost:3007/api/webhooks/stripe

# 或者只监听特定事件
stripe listen --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.payment_succeeded,invoice.payment_failed --forward-to localhost:3007/api/webhooks/stripe
```

### 4. 获取webhook密钥
运行上述命令后，CLI会显示一个webhook签名密钥，类似：
```
Ready! Your webhook signing secret is whsec_1234567890abcdef...
```

### 5. 更新环境变量
将这个密钥更新到您的 `.env.local` 文件：
```bash
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

### 6. 重启开发服务器
```bash
npm run dev
```

### 7. 测试webhook
现在您可以在Stripe Dashboard中触发事件，或使用CLI触发测试事件：

```bash
# 触发测试的checkout.session.completed事件
stripe trigger checkout.session.completed

# 触发测试的customer.subscription.created事件
stripe trigger customer.subscription.created
```

## 方法2: 使用ngrok

### 1. 安装ngrok
访问 https://ngrok.com/ 注册并下载ngrok

### 2. 启动ngrok隧道
```bash
# 为本地3007端口创建公开隧道
ngrok http 3007
```

### 3. 获取公开URL
ngrok会提供一个类似 `https://abc123.ngrok.io` 的URL

### 4. 在Stripe Dashboard配置webhook
1. 访问 https://dashboard.stripe.com/webhooks
2. 点击 "Add endpoint"
3. 输入URL: `https://abc123.ngrok.io/api/webhooks/stripe`
4. 选择事件类型
5. 保存并获取webhook密钥

### 5. 更新环境变量
```bash
STRIPE_WEBHOOK_SECRET=whsec_从Dashboard获取的密钥
```

## 方法3: 使用localtunnel

### 1. 安装localtunnel
```bash
npm install -g localtunnel
```

### 2. 创建隧道
```bash
lt --port 3007 --subdomain your-app-name
```

### 3. 获取URL并配置
类似ngrok的流程，使用提供的URL配置Stripe webhook

## 测试流程

### 1. 确保本地服务器运行
```bash
cd brick-recipes
npm run dev
# 服务器应该运行在 http://localhost:3007
```

### 2. 启动webhook监听（选择一种方法）
- Stripe CLI: `stripe listen --forward-to localhost:3007/api/webhooks/stripe`
- ngrok: `ngrok http 3007`
- localtunnel: `lt --port 3007`

### 3. 测试支付流程
访问测试页面: http://localhost:3007/test-payment

1. 创建测试用户
2. 点击支付按钮生成结账URL
3. 使用Stripe测试卡号完成支付:
   - 成功: `4242424242424242`
   - 失败: `4000000000000002`
   - 3D Secure: `4000000000003220`

### 4. 验证webhook处理
检查控制台日志和数据库，确认：
- Webhook事件被正确接收
- 用户计划被更新
- 订阅记录被创建

## 常见测试卡号

```
# 成功支付
4242424242424242  # Visa
4000056655665556  # Visa (debit)
5555555555554444  # Mastercard

# 失败支付
4000000000000002  # 通用失败
4000000000009995  # 资金不足
4000000000009987  # 卡被拒绝

# 3D Secure
4000000000003220  # 需要验证
4000000000003238  # 验证失败
```

## 调试技巧

### 1. 查看Stripe CLI日志
```bash
stripe listen --forward-to localhost:3007/api/webhooks/stripe --log-level debug
```

### 2. 查看本地服务器日志
控制台会显示webhook处理的详细信息

### 3. 使用Stripe Dashboard
访问 https://dashboard.stripe.com/webhooks 查看webhook发送状态

### 4. 测试特定webhook事件
```bash
# 测试订阅创建
stripe trigger customer.subscription.created

# 测试支付成功
stripe trigger invoice.payment_succeeded

# 测试支付失败
stripe trigger invoice.payment_failed
```

## 故障排除

### 问题1: Webhook签名验证失败
**解决方案**: 确保 `STRIPE_WEBHOOK_SECRET` 与CLI显示的密钥一致

### 问题2: 端口冲突
**解决方案**: 更改端口或终止占用端口的进程
```bash
# 查找占用端口的进程
lsof -i :3007
# 终止进程
kill -9 <PID>
```

### 问题3: ngrok/localtunnel连接不稳定
**解决方案**: 使用Stripe CLI，它更稳定可靠

### 问题4: 事件未触发
**解决方案**: 检查Stripe Dashboard中的事件日志，确认事件类型配置正确 