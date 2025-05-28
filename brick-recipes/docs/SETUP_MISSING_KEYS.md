# 缺失环境变量配置指南

## 当前缺失的关键环境变量

### 1. Supabase Service Role Key

**当前状态**: `SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here`

**获取方法**:
1. 访问 [Supabase Dashboard](https://app.supabase.com/project/bqkzeajvxcsrlmxxizye/settings/api)
2. 在 "Project API keys" 部分找到 "service_role" 密钥
3. 复制完整的密钥（以 `eyJ` 开头）
4. 替换 `.env.local` 文件中的 `SUPABASE_SERVICE_ROLE_KEY` 值

### 2. Cron Secret

**当前状态**: `CRON_SECRET=your_cron_secret_key_here`

**设置方法**:
设置一个强密码用于保护定时任务：
```bash
CRON_SECRET=your_super_secure_random_string_here_2024
```

### 3. Webhook URL配置

**当前开发服务器**: `http://localhost:3007`

**需要更新的Stripe webhook URL**:
```
http://localhost:3007/api/webhooks/stripe
```

## 修复步骤

### 步骤1: 更新 .env.local
```bash
# 更新这两个值
SUPABASE_SERVICE_ROLE_KEY=eyJ... (你的实际service_role密钥)
CRON_SECRET=your_super_secure_random_string_here_2024
```

### 步骤2: 设置Stripe Webhook
1. 登录 [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. 点击 "Add endpoint"
3. 输入URL: `http://localhost:3007/api/webhooks/stripe`
4. 选择事件:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 步骤3: 创建数据库表和函数
如果还没创建，需要在Supabase SQL编辑器中执行:
```sql
-- 参考 docs/SETUP_GUIDE.md 中的SQL脚本
```

## 测试验证

完成配置后，可以访问测试页面:
```
http://localhost:3007/test-payment
``` 