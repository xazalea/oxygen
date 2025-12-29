import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Oxygen - TikTok Clone',
  description: 'A modern, addictive TikTok clone with AI-powered recommendations',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#000000',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Oxygen',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-black text-white antialiased">
        {children}
        {/* liquidGL scripts - loaded dynamically in components */}
      </body>
    </html>
  )
}

