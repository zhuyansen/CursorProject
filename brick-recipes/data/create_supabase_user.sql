-- 创建枚举类型
CREATE TYPE plan_type AS ENUM ('free', 'premium', 'lifetime');
CREATE TYPE subscription_period_type AS ENUM ('monthly', 'yearly', 'one_time_purchase');

-- 创建用户扩展表（与auth.users关联）
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan plan_type DEFAULT 'free' NOT NULL,
  user_monthly_brick_limit INTEGER DEFAULT 3 NOT NULL,
  user_monthly_brick_use INTEGER DEFAULT 0 NOT NULL,
  user_monthly_video_limit INTEGER DEFAULT 3 NOT NULL,
  user_monthly_video_use INTEGER DEFAULT 0 NOT NULL,
  customer_id TEXT UNIQUE, -- Stripe customer ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 创建订阅表
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan plan_type NOT NULL,
  period subscription_period_type NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  stripe_subscription_id TEXT UNIQUE, -- Stripe订阅ID
  stripe_price_id TEXT, -- Stripe价格ID
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 创建使用量重置记录表（用于跟踪每月重置）
CREATE TABLE public.usage_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reset_date DATE NOT NULL,
  brick_usage_reset INTEGER DEFAULT 0,
  video_usage_reset INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  UNIQUE(user_id, reset_date)
);

-- 创建索引
CREATE INDEX idx_users_plan ON public.users(plan);
CREATE INDEX idx_users_customer_id ON public.users(customer_id);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_usage_resets_user_id ON public.usage_resets(user_id);
CREATE INDEX idx_usage_resets_reset_date ON public.usage_resets(reset_date);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 应用更新时间触发器
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON public.subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建用户注册时自动创建用户记录的触发器
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, plan, user_monthly_brick_limit, user_monthly_brick_use, user_monthly_video_limit, user_monthly_video_use)
  VALUES (
    NEW.id, 
    'free', 
    3, -- 免费用户bricklinkrecipes限制
    0, 
    3, -- 免费用户videotorecipes限制
    0
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 创建用户计划更新函数
CREATE OR REPLACE FUNCTION update_user_plan(user_uuid UUID, new_plan plan_type)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users 
  SET 
    plan = new_plan,
    user_monthly_brick_limit = CASE 
      WHEN new_plan = 'free' THEN 3
      WHEN new_plan = 'premium' THEN -1  -- -1表示无限制
      WHEN new_plan = 'lifetime' THEN -1
    END,
    user_monthly_video_limit = CASE 
      WHEN new_plan = 'free' THEN 3
      WHEN new_plan = 'premium' THEN 100
      WHEN new_plan = 'lifetime' THEN -1  -- -1表示无限制
    END
  WHERE id = user_uuid;
END;
$$ language 'plpgsql';

-- 创建使用量重置函数（每月调用）
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS VOID AS $$
DECLARE
  user_record RECORD;
  current_month DATE;
BEGIN
  current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  
  FOR user_record IN SELECT id FROM public.users LOOP
    -- 检查本月是否已经重置过
    IF NOT EXISTS (
      SELECT 1 FROM public.usage_resets 
      WHERE user_id = user_record.id AND reset_date = current_month
    ) THEN
      -- 重置使用量
      UPDATE public.users 
      SET 
        user_monthly_brick_use = 0,
        user_monthly_video_use = 0
      WHERE id = user_record.id;
      
      -- 记录重置
      INSERT INTO public.usage_resets (user_id, reset_date, brick_usage_reset, video_usage_reset)
      VALUES (user_record.id, current_month, 0, 0);
    END IF;
  END LOOP;
END;
$$ language 'plpgsql';

-- 创建检查使用量限制的函数
CREATE OR REPLACE FUNCTION check_usage_limit(user_uuid UUID, usage_type TEXT)
RETURNS JSONB AS $$
DECLARE
  user_data RECORD;
  current_limit INTEGER;
  current_usage INTEGER;
  result JSONB;
BEGIN
  SELECT * INTO user_data FROM public.users WHERE id = user_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'User not found');
  END IF;
  
  IF usage_type = 'brick' THEN
    current_limit := user_data.user_monthly_brick_limit;
    current_usage := user_data.user_monthly_brick_use;
  ELSIF usage_type = 'video' THEN
    current_limit := user_data.user_monthly_video_limit;
    current_usage := user_data.user_monthly_video_use;
  ELSE
    RETURN jsonb_build_object('allowed', false, 'error', 'Invalid usage type');
  END IF;
  
  -- -1表示无限制
  IF current_limit = -1 THEN
    RETURN jsonb_build_object(
      'allowed', true, 
      'current', current_usage, 
      'limit', -1,
      'unlimited', true
    );
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', current_usage < current_limit,
    'current', current_usage,
    'limit', current_limit,
    'unlimited', false
  );
END;
$$ language 'plpgsql';

-- 创建增加使用量的函数
CREATE OR REPLACE FUNCTION increment_usage(user_uuid UUID, usage_type TEXT, amount INTEGER DEFAULT 1)
RETURNS JSONB AS $$
DECLARE
  limit_check JSONB;
  new_usage INTEGER;
BEGIN
  -- 检查限制
  limit_check := check_usage_limit(user_uuid, usage_type);
  
  IF NOT (limit_check->>'allowed')::BOOLEAN THEN
    RETURN jsonb_build_object('success', false, 'message', 'Usage limit exceeded');
  END IF;
  
  -- 增加使用量
  IF usage_type = 'brick' THEN
    UPDATE public.users 
    SET user_monthly_brick_use = user_monthly_brick_use + amount
    WHERE id = user_uuid
    RETURNING user_monthly_brick_use INTO new_usage;
  ELSIF usage_type = 'video' THEN
    UPDATE public.users 
    SET user_monthly_video_use = user_monthly_video_use + amount
    WHERE id = user_uuid
    RETURNING user_monthly_video_use INTO new_usage;
  ELSE
    RETURN jsonb_build_object('success', false, 'message', 'Invalid usage type');
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'new_usage', new_usage,
    'message', 'Usage incremented successfully'
  );
END;
$$ language 'plpgsql';

-- 启用行级安全策略（RLS）
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_resets ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- 用户只能查看和更新自己的数据
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage resets" ON public.usage_resets
  FOR SELECT USING (auth.uid() = user_id);

-- 服务端可以访问所有数据（用于webhook等）
CREATE POLICY "Service role can access all users" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all subscriptions" ON public.subscriptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all usage resets" ON public.usage_resets
  FOR ALL USING (auth.role() = 'service_role');