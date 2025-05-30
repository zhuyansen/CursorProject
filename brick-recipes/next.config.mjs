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
    NEXT_PUBLIC_STRIPE_BREAKFAST_LINK: process.env.NEXT_PUBLIC_STRIPE_BREAKFAST_LINK,
    NEXT_PUBLIC_STRIPE_LUNCH_LINK: process.env.NEXT_PUBLIC_STRIPE_LUNCH_LINK,
    NEXT_PUBLIC_STRIPE_DINNER_LINK: process.env.NEXT_PUBLIC_STRIPE_DINNER_LINK,
    NEXT_PUBLIC_STRIPE_DESSERT_LINK: process.env.NEXT_PUBLIC_STRIPE_DESSERT_LINK,
    NEXT_PUBLIC_STRIPE_SNACK_LINK: process.env.NEXT_PUBLIC_STRIPE_SNACK_LINK
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
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  compress: true,
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  },
}

export default nextConfig
