import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CROroast — AI Conversion Audit for Shopify & WooCommerce',
  description: 'Get a brutal, honest AI audit of your e-commerce landing page. Find what\'s killing your conversions in 30 seconds. Fix it. Make more money.',
  keywords: 'CRO audit, conversion rate optimization, Shopify optimization, WooCommerce optimization, landing page audit',
  openGraph: {
    title: 'CROroast — Your Store Is Losing Money. Let\'s Find Out Why.',
    description: 'Paste your URL. Get a brutal AI CRO audit in 30 seconds.',
    type: 'website',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
