# Stripe支付链接集成指南

本指南将帮助你设置Stripe支付链接并将其集成到BrickRecipes应用中的定价计划页面。

## 步骤1: 创建Stripe账户

如果你还没有Stripe账户，请先访问[Stripe官网](https://stripe.com)注册一个账户。

## 步骤2: 创建支付链接

1. 登录你的Stripe账户
2. 在Stripe控制面板，导航到"产品" -> "支付链接"
3. 点击"创建支付链接"
4. 为每个会员级别（月度会员、年度会员、终身会员）创建一个支付链接：

   ### 月度会员
   - 名称: BrickRecipes月度会员
   - 价格: $9.99 USD
   - 计费: 每月重复计费
   - 填写其他必要信息，然后点击"创建"

   ### 年度会员
   - 名称: BrickRecipes年度会员
   - 价格: $89.99 USD
   - 计费: 每年重复计费
   - 填写其他必要信息，然后点击"创建"

   ### 终身会员
   - 名称: BrickRecipes终身会员
   - 价格: $249 USD
   - 计费: 一次性
   - 填写其他必要信息，然后点击"创建"

5. 创建后，你将获得每个计划的支付链接，通常格式为`https://buy.stripe.com/xxxxx`

## 步骤3: 配置应用环境变量

1. 打开项目根目录下的`.env.local`文件（如果不存在则创建）
2. 添加以下环境变量，填入你在步骤2中获得的支付链接：

```
NEXT_PUBLIC_STRIPE_MONTHLY_PLAN_LINK=https://buy.stripe.com/your_monthly_link
NEXT_PUBLIC_STRIPE_YEARLY_PLAN_LINK=https://buy.stripe.com/your_yearly_link
NEXT_PUBLIC_STRIPE_LIFETIME_PLAN_LINK=https://buy.stripe.com/your_lifetime_link
```

3. 保存文件

## 步骤4: 重启应用

环境变量设置完成后，重启你的Next.js应用：

```bash
npm run dev
```

## 步骤5: 测试支付流程

1. 访问网站的定价计划页面
2. 点击任意会员计划的"立即购买"/"Buy Now"按钮
3. 验证你是否被正确重定向到相应的Stripe结账页面

## 注意事项

- 在开发环境中，可以使用Stripe的测试模式进行测试
- 确保在生产环境中使用正确的生产环境链接
- Stripe支付成功后的重定向URL可以在创建支付链接时设置
- 如需处理支付成功后的用户会员状态更新，需要配置Stripe Webhook(详见Stripe文档)

如需更多帮助，请参考[Stripe官方文档](https://stripe.com/docs)。 