# Stripe 支付系统设置指南

## 必须完成的配置步骤

### 1. 获取 Supabase 服务角色密钥

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 选择您的项目
3. 前往 `Settings` > `API`
4. 复制 `service_role` 密钥（**重要：这是私密密钥，不要泄露**）
5. 在 `.env.local` 中更新：
```bash
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
```

### 2. 设置 Supabase 数据库表

在 Supabase SQL 编辑器中执行以下 SQL：

```sql
-- 创建 users 表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'lifetime')),
  user_monthly_brick_limit INTEGER NOT NULL DEFAULT 3,
  user_monthly_brick_use INTEGER NOT NULL DEFAULT 0,
  user_monthly_video_limit INTEGER NOT NULL DEFAULT 3,
  user_monthly_video_use INTEGER NOT NULL DEFAULT 0,
  customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 subscriptions 表
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'premium', 'lifetime')),
  period TEXT NOT NULL CHECK (period IN ('monthly', 'yearly', 'one_time_purchase')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_customer_id ON users(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- 创建更新用户计划的函数
CREATE OR REPLACE FUNCTION update_user_plan(user_uuid UUID, new_plan TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET 
    plan = new_plan,
    user_monthly_brick_limit = CASE 
      WHEN new_plan = 'free' THEN 3
      WHEN new_plan = 'premium' THEN -1  -- 无限制
      WHEN new_plan = 'lifetime' THEN -1  -- 无限制
    END,
    user_monthly_video_limit = CASE 
      WHEN new_plan = 'free' THEN 3
      WHEN new_plan = 'premium' THEN 100
      WHEN new_plan = 'lifetime' THEN -1  -- 无限制
    END,
    updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- 创建检查使用量限制的函数
CREATE OR REPLACE FUNCTION check_usage_limit(user_uuid UUID, usage_type TEXT)
RETURNS JSON AS $$
DECLARE
  user_record users%ROWTYPE;
  current_usage INTEGER;
  usage_limit INTEGER;
  unlimited BOOLEAN;
BEGIN
  SELECT * INTO user_record FROM users WHERE id = user_uuid;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'allowed', false,
      'current', 0,
      'limit', 0,
      'unlimited', false,
      'error', 'User not found'
    );
  END IF;

  IF usage_type = 'brick' THEN
    current_usage := user_record.user_monthly_brick_use;
    usage_limit := user_record.user_monthly_brick_limit;
  ELSIF usage_type = 'video' THEN
    current_usage := user_record.user_monthly_video_use;
    usage_limit := user_record.user_monthly_video_limit;
  ELSE
    RETURN json_build_object(
      'allowed', false,
      'current', 0,
      'limit', 0,
      'unlimited', false,
      'error', 'Invalid usage type'
    );
  END IF;

  unlimited := usage_limit = -1;
  
  RETURN json_build_object(
    'allowed', unlimited OR current_usage < usage_limit,
    'current', current_usage,
    'limit', usage_limit,
    'unlimited', unlimited
  );
END;
$$ LANGUAGE plpgsql;

-- 创建增加使用量的函数
CREATE OR REPLACE FUNCTION increment_usage(user_uuid UUID, usage_type TEXT, amount INTEGER DEFAULT 1)
RETURNS JSON AS $$
DECLARE
  user_record users%ROWTYPE;
  current_usage INTEGER;
  usage_limit INTEGER;
  new_usage INTEGER;
BEGIN
  SELECT * INTO user_record FROM users WHERE id = user_uuid;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'User not found'
    );
  END IF;

  IF usage_type = 'brick' THEN
    current_usage := user_record.user_monthly_brick_use;
    usage_limit := user_record.user_monthly_brick_limit;
    
    -- 检查是否超过限制（-1 表示无限制）
    IF usage_limit != -1 AND current_usage + amount > usage_limit THEN
      RETURN json_build_object(
        'success', false,
        'message', 'Usage limit exceeded'
      );
    END IF;
    
    new_usage := current_usage + amount;
    UPDATE users SET user_monthly_brick_use = new_usage, updated_at = NOW() WHERE id = user_uuid;
    
  ELSIF usage_type = 'video' THEN
    current_usage := user_record.user_monthly_video_use;
    usage_limit := user_record.user_monthly_video_limit;
    
    -- 检查是否超过限制（-1 表示无限制）
    IF usage_limit != -1 AND current_usage + amount > usage_limit THEN
      RETURN json_build_object(
        'success', false,
        'message', 'Usage limit exceeded'
      );
    END IF;
    
    new_usage := current_usage + amount;
    UPDATE users SET user_monthly_video_use = new_usage, updated_at = NOW() WHERE id = user_uuid;
    
  ELSE
    RETURN json_build_object(
      'success', false,
      'message', 'Invalid usage type'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'new_usage', new_usage,
    'message', 'Usage updated successfully'
  );
END;
$$ LANGUAGE plpgsql;

-- 创建重置月度使用量的函数
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET 
    user_monthly_brick_use = 0,
    user_monthly_video_use = 0,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

### 3. 设置定时任务密钥

在 `.env.local` 中设置一个强密码：
```bash
CRON_SECRET=your_strong_random_secret_here_123456789
```

### 4. 配置 Stripe Webhook URL

在 Stripe Dashboard 中：
1. 前往 `Developers` > `Webhooks`
2. 点击 `Add endpoint`
3. 输入端点 URL：`https://yourdomain.com/api/webhooks/stripe`
4. 选择以下事件：
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated` 
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. 保存并复制签名密钥到环境变量

### 5. 验证环境变量

确保您的 `.env.local` 包含所有必需的变量：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://bqkzeajvxcsrlmxxizye.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # 新增！

# Stripe 配置
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe 价格 ID（确保这些与您的 Stripe 产品匹配）
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_1RSxAhCSV4zv93BsH1oNLAlM
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_1RSxB4CSV4zv93BsuYgjYSMV
STRIPE_LIFETIME_PRICE_ID=price_1RSxBLCSV4zv93Bs7CLitSFx

# 定时任务密钥
CRON_SECRET=your_strong_secret  # 新增！
```

### 6. 测试系统

#### 6.1 测试 API 端点

```bash
# 测试获取用户状态（替换为实际的用户ID）
curl "http://localhost:3000/api/user/status?userId=your-user-id"

# 测试创建支付会话
curl -X POST http://localhost:3000/api/payment/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-id",
    "plan": "premium",
    "period": "monthly",
    "email": "test@example.com"
  }'
```

#### 6.2 测试 Webhook（本地开发）

使用 Stripe CLI：
```bash
# 安装 Stripe CLI
npm install -g stripe-cli

# 登录到 Stripe
stripe login

# 转发 webhook 事件到本地
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 7. 部署时的额外步骤

#### 7.1 生产环境配置
- 将所有测试密钥更换为生产密钥
- 更新 Webhook URL 为生产域名
- 设置强密码为 `CRON_SECRET`

#### 7.2 设置定时任务

使用 Vercel Cron Jobs 或其他调度服务：

```javascript
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/check-expired-subscriptions",
      "schedule": "0 2 * * *"  // 每天凌晨2点
    },
    {
      "path": "/api/cron/reset-monthly-usage", 
      "schedule": "0 0 1 * *"  // 每月1号凌晨
    }
  ]
}
```

### 8. 常见问题排查

#### 8.1 Webhook 失败
- 检查 Stripe Webhook 签名密钥
- 确认端点 URL 正确
- 查看服务器日志

#### 8.2 数据库连接错误
- 验证 Supabase 服务角色密钥
- 检查数据库表是否正确创建
- 确认 RLS 策略设置

#### 8.3 支付失败
- 使用 Stripe 测试卡号进行测试
- 检查价格 ID 是否匹配
- 验证客户创建逻辑

### 9. 监控和日志

建议设置以下监控：
- Webhook 处理成功率
- 支付转化率  
- 订阅取消率
- API 响应时间

通过完成以上步骤，您的 Stripe 支付系统应该就能正常工作了！ 