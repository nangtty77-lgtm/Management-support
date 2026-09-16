import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BizHub — 경영지원 플랫폼',
  description: '통합 경영지원 업무관리 플랫폼',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-content-bg">{children}</body>
    </html>
  )
}
