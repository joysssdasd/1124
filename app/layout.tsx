import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '交易信息撮合平台',
  description: '专业的交易信息撮合服务平台',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#3b82f6',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={inter.className}>
        <div id="root">
          {children}
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 2000,
              style: {
                background: '#333',
                color: '#fff',
                fontSize: '14px',
                borderRadius: '8px',
              },
            }}
          />
        </div>
      </body>
    </html>
  )
}