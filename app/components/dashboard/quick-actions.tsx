
'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Plus, Target, PieChart, CreditCard, BarChart3 } from 'lucide-react'

export function QuickActions() {
  const actions = [
    {
      title: 'Import CSV',
      description: 'Upload bank statements or transactions',
      icon: Upload,
      href: '/dashboard/import',
      color: 'bg-blue-500'
    },
    {
      title: 'Add Transaction',
      description: 'Manually add income or expense',
      icon: Plus,
      href: '/dashboard/transactions/new',
      color: 'bg-green-500'
    },
    {
      title: 'Set Goal',
      description: 'Create savings or debt payoff goal',
      icon: Target,
      href: '/dashboard/goals/new',
      color: 'bg-purple-500'
    },
    {
      title: 'View Analytics',
      description: 'See spending patterns and trends',
      icon: BarChart3,
      href: '/dashboard/analytics',
      color: 'bg-orange-500'
    },
    {
      title: 'Manage Debts',
      description: 'Track and optimize debt payments',
      icon: CreditCard,
      href: '/dashboard/debts',
      color: 'bg-red-500'
    },
    {
      title: 'Budget Planning',
      description: 'Create and manage budgets',
      icon: PieChart,
      href: '/dashboard/budget',
      color: 'bg-indigo-500'
    }
  ]

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {actions.map((action, index) => (
          <Link key={index} href={action.href}>
            <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className={`${action.color} rounded-full p-3 mb-3 group-hover:scale-110 transition-transform duration-200`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
