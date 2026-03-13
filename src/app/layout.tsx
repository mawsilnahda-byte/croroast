import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CROroast — AI CRO Audit for Shopify & WooCommerce',
  description: 'Get a brutal, honest AI audit of your product page in 30 seconds. Find your conversion killers. Make more money.',
  keywords: 'CRO audit, conversion rate optimization, Shopify optimization, WooCommerce optimization, landing page audit, AI audit',
  metadataBase: new URL('https://croroast.vercel.app'),
  openGraph: {
    title: 'CROroast — AI CRO Audit for Shopify & WooCommerce',
    description: 'Get a brutal, honest AI audit of your product page in 30 seconds. Find your conversion killers. Make more money.',
    url: 'https://croroast.vercel.app',
    siteName: 'CROroast',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CROroast — AI CRO Audit for Shopify & WooCommerce',
    description: 'Get a brutal, honest AI audit of your product page in 30 seconds. Find your conversion killers. Make more money.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔥</text></svg>"
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
