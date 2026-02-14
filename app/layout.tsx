import type { Metadata } from 'next'
import './globals.css'
import PageViewTracker from '@/components/PageViewTracker'

export const metadata: Metadata = {
  title: 'FreshBite - Fresh Dish Reviews',
  description: 'See only fresh reviews that matter. Dish quality changes daily.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <PageViewTracker />
        {children}
      </body>
    </html>
  )
}
