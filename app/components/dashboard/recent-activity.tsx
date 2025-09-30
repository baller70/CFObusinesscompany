
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, FileText, DollarSign, TrendingUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface RecentActivityProps {
  invoices: any[]
  transactions: any[]
}

export function RecentActivity({ invoices, transactions }: RecentActivityProps) {
  // Combine and sort activities
  const activities = [
    ...invoices.map(invoice => ({
      type: 'invoice',
      id: invoice.id,
      title: `Invoice ${invoice.invoiceNumber}`,
      subtitle: invoice.customer?.name || 'Unknown Customer',
      amount: invoice.total,
      status: invoice.status,
      date: new Date(invoice.createdAt),
      icon: FileText
    })),
    ...transactions.slice(0, 5).map(transaction => ({
      type: 'transaction',
      id: transaction.id,
      title: transaction.description,
      subtitle: transaction.merchant || transaction.category,
      amount: transaction.amount,
      status: transaction.type,
      date: new Date(transaction.date),
      icon: transaction.type === 'INCOME' ? TrendingUp : DollarSign
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10)

  const getStatusBadge = (status: string, type: string) => {
    if (type === 'invoice') {
      const colors = {
        DRAFT: 'secondary',
        SENT: 'default',
        VIEWED: 'default',
        PARTIAL: 'default',
        PAID: 'default',
        OVERDUE: 'destructive',
        CANCELLED: 'secondary'
      }
      return <Badge variant={colors[status as keyof typeof colors] as any}>{status}</Badge>
    } else {
      const colors = {
        INCOME: 'default',
        EXPENSE: 'secondary',
        TRANSFER: 'outline'
      }
      return <Badge variant={colors[status as keyof typeof colors] as any}>{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          RECENT ACTIVITY
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No recent activity</p>
          ) : (
            activities.map((activity) => (
              <div key={`${activity.type}-${activity.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <activity.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.subtitle}</p>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(activity.date)} ago
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold text-sm ${
                    activity.type === 'transaction' && activity.status === 'EXPENSE' 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    ${Math.abs(activity.amount).toLocaleString()}
                  </p>
                  {getStatusBadge(activity.status, activity.type)}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
