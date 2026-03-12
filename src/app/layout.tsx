import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Gaon Gully - Retail & Wholesale Marketplace',
    template: '%s | Gaon Gully',
  },
  description: 'Shop the best products at retail and wholesale prices. Quality goods, fast delivery, secure payments.',
  keywords: ['ecommerce', 'wholesale', 'retail', 'online shopping', 'India', 'Gaon Gully'],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'Gaon Gully',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { background: '#363636', color: '#fff' },
              success: { style: { background: '#16a34a' } },
              error: { style: { background: '#dc2626' } },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
