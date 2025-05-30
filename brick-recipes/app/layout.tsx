import type { Metadata } from 'next'
import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/components/language-provider"
import { MainNav } from "@/components/main-nav"
import { MainFooter } from "@/components/main-footer"
import { DynamicHtmlLang } from "@/components/dynamic-html-lang"
import AuthWrapper from "@/components/auth-wrapper"
import { RouteLoadingIndicator } from "@/components/route-loading-indicator"
import StructuredData from "@/components/structured-data"
import GoogleAnalytics from "@/components/google-analytics"
import BaiduAnalytics from "@/components/baidu-analytics"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: {
    default: 'BrickRecipes - Smart Recipe Discovery Platform',
    template: '%s | BrickRecipes'
  },
  description: 'Discover recipes by ingredients, browse traditional menus, and convert cooking videos to detailed recipes. Your smart cooking companion for every meal.',
  keywords: [
    'recipes', 'cooking', 'ingredients', 'food', 'meal planning', 
    'traditional recipes', 'video recipes', 'cooking videos',
    '食谱', '烹饪', '食材', '美食', '菜谱'
  ],
  authors: [{ name: 'BrickRecipes Team' }],
  creator: 'BrickRecipes',
  publisher: 'BrickRecipes',
  metadataBase: new URL('https://brickrecipes.ai'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en',
      'zh-CN': '/zh',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://brickrecipes.ai',
    title: 'BrickRecipes - Smart Recipe Discovery Platform',
    description: 'Discover recipes by ingredients, browse traditional menus, and convert cooking videos to detailed recipes.',
    siteName: 'BrickRecipes',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'BrickRecipes - Smart Recipe Discovery Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BrickRecipes - Smart Recipe Discovery Platform',
    description: 'Discover recipes by ingredients, browse traditional menus, and convert cooking videos to detailed recipes.',
    images: ['/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || 'your-google-verification-code',
    other: {
      'msvalidate.01': process.env.BING_SITE_VERIFICATION || 'your-bing-verification-code'
    }
  },
  category: 'food'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/BrickRecipes.png" />
        <meta name="color-scheme" content="light dark" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased flex flex-col">
        <StructuredData type="website" />
        <StructuredData type="breadcrumb" />
        
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID} />
        )}
        
        {/* 百度统计 */}
        {process.env.NEXT_PUBLIC_BAIDU_ANALYTICS_ID && (
          <BaiduAnalytics baiduId={process.env.NEXT_PUBLIC_BAIDU_ANALYTICS_ID} />
        )}
        
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthWrapper>
            <LanguageProvider>
              <DynamicHtmlLang />
              <RouteLoadingIndicator />
              <MainNav />
              <main className="flex-1 w-full">
                <Suspense fallback={null}>
                  {children}
                </Suspense>
              </main>
              <MainFooter />
            </LanguageProvider>
          </AuthWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}

