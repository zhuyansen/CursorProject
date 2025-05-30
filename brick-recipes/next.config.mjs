/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel 优化配置
  output: process.env.VERCEL ? 'standalone' : undefined,
  poweredByHeader: false,
  generateEtags: false,
  
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 外部包配置（从 experimental 移动到这里）
  serverExternalPackages: ['mongodb', 'ioredis'],
  
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
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7天缓存
  },
  
  experimental: {
    optimizeCss: false,
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
      // www 重定向到主域名
      {
        source: '/www.brickrecipes.ai/:path*',
        destination: 'https://brickrecipes.ai/:path*',
        permanent: true,
        has: [
          {
            type: 'host',
            value: 'www.brickrecipes.ai',
          },
        ],
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
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
          }
        ]
      },
      // 静态资源长期缓存
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      // API 路由缓存控制
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate'
          }
        ]
      }
    ]
  },
}

export default nextConfig
