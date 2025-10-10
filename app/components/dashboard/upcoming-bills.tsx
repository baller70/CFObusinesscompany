
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, Calendar, CreditCard } from 'lucide-react'
import Link from 'next/link'

interface Debt {
  id: string
  name: string
  balance: number
  minimumPayment: number
  dueDate: number
  type: string
  interestRate: number
}

interface UpcomingBillsProps {
  debts: Debt[]
}

export function UpcomingBills({ debts }: UpcomingBillsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getDaysUntilDue = (dueDate: number) => {
    const today = new Date()
    const currentDay = today.getDate()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
    let dueMonth = currentMonth
    let dueYear = currentYear
    
    // If the due date has passed this month, move to next month
    if (dueDate < currentDay) {
      dueMonth += 1
      if (dueMonth > 11) {
        dueMonth = 0
        dueYear += 1
      }
    }
    
    const dueDateObj = new Date(dueYear, dueMonth, dueDate)
    const diffTime = dueDateObj.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  const upcomingBills = debts
    .map(debt => ({
      ...debt,
      daysUntilDue: getDaysUntilDue(debt.dueDate)
    }))
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
    .slice(0, 5)

  const getUrgencyBadge = (daysUntilDue: number) => {
    if (daysUntilDue <= 3) {
      return <Badge variant="destructive">Due Soon</Badge>
    } else if (daysUntilDue <= 7) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Due This Week</Badge>
    } else {
      return <Badge variant="outline">Upcoming</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              UPCOMING BILLS
            </CardTitle>
            <CardDescription>
              Keep track of payment due dates
            </CardDescription>
          </div>
          <Link href="/dashboard/debts">
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {upcomingBills.length === 0 ? (
          <div className="text-center py-6">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-3">No debts tracked yet</p>
            <Link href="/dashboard/debts/new">
              <Button size="sm">Add First Debt</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingBills.map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      {bill.name}
                    </p>
                    {getUrgencyBadge(bill.daysUntilDue)}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Due on {bill.dueDate}{bill.dueDate === 1 ? 'st' : bill.dueDate === 2 ? 'nd' : bill.dueDate === 3 ? 'rd' : 'th'} 
                      ({bill.daysUntilDue === 0 ? 'Today' : `${bill.daysUntilDue} days`})
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(bill.minimumPayment)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {debts.length > 5 && (
              <div className="text-center pt-2">
                <Link href="/dashboard/debts">
                  <Button variant="outline" size="sm">
                    View All Debts
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
