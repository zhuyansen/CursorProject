import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/components/language-provider"
import { MainNav } from "@/components/main-nav"
import { MainFooter } from "@/components/main-footer"
import { DynamicHtmlLang } from "@/components/dynamic-html-lang"
import AuthWrapper from "@/components/auth-wrapper"
import { RouteLoadingIndicator } from "@/components/route-loading-indicator"
import { Suspense } from "react"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/BrickRecipes.png" />
        <meta name="color-scheme" content="light dark" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>BrickRecipes</title>
      </head>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <LanguageProvider>
            <AuthWrapper>
              <DynamicHtmlLang />
              <RouteLoadingIndicator />
              <div className="flex flex-col min-h-screen">
                <MainNav />
                <main className="flex-1 w-full">
                  <Suspense fallback={<div className="p-4 flex justify-center items-center min-h-[50vh]">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-[#b94a2c] dark:border-gray-700 dark:border-t-[#ff6b47]"></div>
                  </div>}>
                    {children}
                  </Suspense>
                </main>
                <MainFooter />
              </div>
            </AuthWrapper>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
export const metadata = {
  generator: 'v0.dev'
};

