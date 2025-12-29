import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Oxygen - TikTok Clone',
  description: 'A modern, addictive TikTok clone with AI-powered recommendations',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white antialiased">
        {children}
      </body>
    </html>
  )
}

