import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/components/language-provider"
import { MainNav } from "@/components/main-nav"
import { MainFooter } from "@/components/main-footer"
import { DynamicHtmlLang } from "@/components/dynamic-html-lang"

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
            <DynamicHtmlLang />
            <div className="flex flex-col min-h-screen">
              <MainNav />
              <main className="flex-1 w-full">
                {children}
              </main>
              <MainFooter />
            </div>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
export const metadata = {
  generator: 'v0.dev'
};

