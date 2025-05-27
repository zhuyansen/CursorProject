/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // 确保Stripe支付链接环境变量可用
    STRIPE_MONTHLY_PLAN_LINK: process.env.STRIPE_MONTHLY_PLAN_LINK,
    STRIPE_YEARLY_PLAN_LINK: process.env.STRIPE_YEARLY_PLAN_LINK,
    STRIPE_LIFETIME_MEMBER_PLAN_LINK: process.env.STRIPE_LIFETIME_MEMBER_PLAN_LINK,
  },
  // ...其他配置
}

module.exports = nextConfig 