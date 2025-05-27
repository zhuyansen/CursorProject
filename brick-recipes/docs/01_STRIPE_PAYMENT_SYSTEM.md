# Stripe 支付系统集成文档

## 概述

本项目集成了完整的 Stripe 支付系统，支持订阅管理、使用量控制、Webhook 事件处理等功能。

## 系统架构

### 核心组件

1. **StripeIntegration** (`app/api/webhooks/stipeIntergration.ts`)
   - 处理 Stripe 支付逻辑
   - 管理 Webhook 事件
   - 处理订阅生命周期

2. **UserService** (`lib/userService.ts`)
   - 用户数据管理
   - 使用量控制
   - 订阅状态管理

3. **支付 API 端点**
   - 创建结账会话
   - 管理客户门户
   - 处理用户状态

## API 端点

### 1. Stripe Webhook
```
POST /api/webhooks/stripe
```
处理来自 Stripe 的 Webhook 事件，包括：
- 支付完成
- 订阅创建/更新/取消
- 支付失败

### 2. 创建支付会话
```
POST /api/payment/create-checkout-session
```
参数：
```json
{
  "userId": "string",
  "plan": "premium" | "lifetime",
  "period": "monthly" | "yearly" | "one_time_purchase",
  "email": "string"
}
```

### 3. 创建客户门户会话
```
POST /api/payment/create-portal-session
```
参数：
```json
{
  "userId": "string"
}
```

### 4. 获取用户状态
```
GET /api/user/status?userId=string
POST /api/user/status (检查/增加使用量)
```

### 5. 定时任务
```
POST /api/cron/check-expired-subscriptions
POST /api/cron/reset-monthly-usage
```

## 使用方法

### 1. 前端支付流程

```typescript
import { usePayment } from '../hooks/usePayment';

function PaymentComponent() {
  const { createCheckoutSession, loading, error } = usePayment();

  const handleSubscribe = async (plan: 'premium' | 'lifetime', period: 'monthly' | 'yearly') => {
    const result = await createCheckoutSession({
      userId: 'user-id',
      plan,
      period,
      email: 'user@example.com'
    });

    if (result?.url) {
      window.location.href = result.url;
    }
  };

  return (
    <button onClick={() => handleSubscribe('premium', 'monthly')}>
      订阅高级版
    </button>
  );
}
```

### 2. 检查使用量限制

```typescript
import { usePayment } from '../hooks/usePayment';

function FeatureComponent() {
  const { checkUsage } = usePayment();

  const handleUseFeature = async () => {
    const result = await checkUsage({
      userId: 'user-id',
      usageType: 'brick',
      amount: 1
    });

    if (result?.success) {
      // 执行功能
    } else {
      // 显示升级提示
    }
  };
}
```

### 3. 获取用户状态

```typescript
import { usePayment } from '../hooks/usePayment';

function UserDashboard() {
  const { getUserStatus } = usePayment();

  useEffect(() => {
    const loadUserStatus = async () => {
      const status = await getUserStatus('user-id');
      console.log('用户状态:', status);
    };

    loadUserStatus();
  }, []);
}
```

## 环境变量配置

确保在 `.env.local` 中配置以下变量：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe 配置
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Stripe 价格 ID
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_id
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_id
STRIPE_LIFETIME_PRICE_ID=price_id

# 定时任务密钥
CRON_SECRET=your_cron_secret
```

## Stripe Dashboard 配置

### 1. 创建产品和价格

在 Stripe Dashboard 中创建以下产品：

1. **高级会员 - 月度**
   - 类型：订阅
   - 计费周期：每月
   - 价格：$9.99

2. **高级会员 - 年度**
   - 类型：订阅
   - 计费周期：每年
   - 价格：$89.99

3. **终身会员**
   - 类型：一次性支付
   - 价格：$249.00

### 2. 配置 Webhook

在 Stripe Dashboard 中配置 Webhook 端点：

- URL: `https://yourdomain.com/api/webhooks/stripe`
- 事件类型：
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

## 数据库表结构

### users 表
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'free',
  user_monthly_brick_limit INTEGER NOT NULL DEFAULT 3,
  user_monthly_brick_use INTEGER NOT NULL DEFAULT 0,
  user_monthly_video_limit INTEGER NOT NULL DEFAULT 3,
  user_monthly_video_use INTEGER NOT NULL DEFAULT 0,
  customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### subscriptions 表
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  plan TEXT NOT NULL,
  period TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 定时任务

### 1. 检查过期订阅
每天运行一次，检查并处理过期的订阅：
```bash
curl -X POST https://yourdomain.com/api/cron/check-expired-subscriptions \
  -H "Authorization: Bearer your_cron_secret"
```

### 2. 重置月度使用量
每月 1 号运行一次，重置所有用户的月度使用量：
```bash
curl -X POST https://yourdomain.com/api/cron/reset-monthly-usage \
  -H "Authorization: Bearer your_cron_secret"
```

## 测试

### 1. 测试支付流程
使用 Stripe 测试卡号：
- 成功支付：`4242 4242 4242 4242`
- 失败支付：`4000 0000 0000 0002`

### 2. 测试 Webhook
使用 Stripe CLI 转发 Webhook 到本地：
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## 注意事项

1. **生产环境配置**
   - 更换为生产环境的 Stripe 密钥
   - 配置真实的 Webhook 端点
   - 设置安全的 CRON_SECRET

2. **错误处理**
   - 所有 API 都有完善的错误处理
   - Webhook 失败会自动重试

3. **安全性**
   - Webhook 签名验证
   - API 密钥验证
   - 用户权限检查

4. **监控**
   - 记录所有支付事件
   - 监控 Webhook 处理状态
   - 定期检查系统健康状况 