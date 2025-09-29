
"use client"

import { ReactNode } from 'react'
import { DashboardHeader } from './dashboard-header'

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
  user?: any
}

export function DashboardLayout({ 
  children, 
  title = "Dashboard", 
  subtitle,
  user 
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(title || subtitle) && (
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
        )}
        
        {children}
      </main>
    </div>
  )
}
