import type { Metadata } from 'next'
import './globals.css'
import { DistributedWorker } from '@/components/DistributedWorker'

export const metadata: Metadata = {
// ... existing metadata ...
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
        <DistributedWorker />
        {/* liquidGL scripts - loaded dynamically in components */}
      </body>
    </html>
  )
}

