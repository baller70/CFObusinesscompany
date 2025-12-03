
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
  Calculator,
  Zap
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
    <Card className="card-premium-elevated">
      <CardHeader className="pb-4">
        <CardTitle className="text-subheading text-foreground flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
        <p className="text-small text-muted-foreground">Streamline your workflow with these essential actions</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <Link key={action.href} href={action.href}>
              <Button
                variant="ghost"
                className="h-auto p-5 flex flex-col items-start w-full group hover:bg-primary/5 hover:shadow-md transition-all duration-300 border border-border/50 rounded-xl animate-slide-in-up whitespace-normal text-left"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-left w-full min-w-0">
                  <p className="text-body font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                    {action.title}
                  </p>
                  <p className="text-small text-muted-foreground leading-relaxed whitespace-normal break-words">
                    {action.description}
                  </p>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
