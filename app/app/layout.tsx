import type { Metadata } from "next";
import { Audiowide, Saira } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const audiowide = Audiowide({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-audiowide',
  display: 'swap',
})

const saira = Saira({ 
  subsets: ['latin'],
  variable: '--font-saira',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "CFO Business - Comprehensive Business Accounting",
  description: "Complete business accounting solution for invoicing, payroll, project management, and financial reporting",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${audiowide.variable} ${saira.variable}`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}