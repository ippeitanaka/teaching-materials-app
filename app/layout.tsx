import type React from "react"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

// メタデータ部分を更新します
export const metadata = {
  title: "TMC教材作成アシスタント",
  description: "教材作成をAIでもっと簡単に。PDFや画像から穴埋めプリント、まとめシート、課題を自動生成。",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/tmc-logo-new.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: ["/tmc-logo-new.png"],
    apple: [{ url: "/apple-touch-icon.png" }, { url: "/tmc-logo-new.png", sizes: "180x180", type: "image/png" }],
    other: [
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/tmc-logo-new.png", sizes: "512x512", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "TMC教材作成アシスタント",
    statusBarStyle: "default",
    capable: true,
    startupImage: [{ url: "/tmc-logo-new.png" }],
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#f8f8f2",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "https://teaching-materials-app.vercel.app/",
    title: "TMC教材作成アシスタント",
    description: "教材作成をAIでもっと簡単に。PDFや画像から穴埋めプリント、まとめシート、課題を自動生成。",
    images: [
      {
        url: "/tmc-logo-new.png",
        width: 1200,
        height: 630,
        alt: "TMC教材作成アシスタント",
      },
    ],
  },
    generator: 'v0.dev'
}

// head部分も更新します
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/tmc-logo-new.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" href="/tmc-logo-new.png" sizes="180x180" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#f8f8f2" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TMC教材作成アシスタント" />
        <meta name="application-name" content="TMC教材作成アシスタント" />
      </head>
      <body>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
