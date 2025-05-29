/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    // 确保Stripe支付链接环境变量可用
    STRIPE_MONTHLY_PLAN_LINK: process.env.STRIPE_MONTHLY_PLAN_LINK,
    STRIPE_YEARLY_PLAN_LINK: process.env.STRIPE_YEARLY_PLAN_LINK,
    STRIPE_LIFETIME_MEMBER_PLAN_LINK: process.env.STRIPE_LIFETIME_MEMBER_PLAN_LINK,
  },
  images: {
    unoptimized: false,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.us-east-1.amazonaws.com',
        pathname: '/brickrecipes.ai/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
}

export default nextConfig
