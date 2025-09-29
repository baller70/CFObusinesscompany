
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Plus, 
  FileText, 
  Users, 
  Receipt, 
  FolderOpen,
  UserPlus,
  Building2,
  Calculator
} from 'lucide-react'

export function QuickActions() {
  const actions = [
    {
      title: 'Create Invoice',
      description: 'Generate a new invoice for a customer',
      href: '/dashboard/invoices/new',
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      title: 'Add Customer',
      description: 'Add a new customer to your database',
      href: '/dashboard/contacts/customers/new',
      icon: UserPlus,
      color: 'bg-green-500'
    },
    {
      title: 'Record Expense',
      description: 'Log a business expense or bill',
      href: '/dashboard/expenses/new',
      icon: Receipt,
      color: 'bg-orange-500'
    },
    {
      title: 'New Project',
      description: 'Start tracking a new project',
      href: '/dashboard/projects/new',
      icon: FolderOpen,
      color: 'bg-purple-500'
    },
    {
      title: 'Add Vendor',
      description: 'Register a new vendor or supplier',
      href: '/dashboard/contacts/vendors/new',
      icon: Building2,
      color: 'bg-indigo-500'
    },
    {
      title: 'Import Data',
      description: 'Import transactions or other data',
      href: '/dashboard/import',
      icon: Plus,
      color: 'bg-gray-500'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2 w-full hover:bg-gray-50"
              >
                <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center mb-2`}>
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
