import type { Metadata } from "next"

import "./globals.css"

export const metadata: Metadata = {
  title: "集装箱运输管理系统",
  description: "为集装箱运输团队提供的运营管理控制台。",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
