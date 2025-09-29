
'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react'
import { format } from 'date-fns'

interface Transaction {
  id: string
  date: Date
  amount: number
  description: string
  merchant: string | null
  category: string
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  categoryRelation?: {
    name: string
    color: string
  } | null
}

interface RecentTransactionsProps {
  transactions: Transaction[]
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount))
  }

  const getTransactionIcon = (type: string) => {
    return type === 'INCOME' ? (
      <ArrowDownRight className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowUpRight className="h-4 w-4 text-red-600" />
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your latest financial activities
            </CardDescription>
          </div>
          <Link href="/dashboard/transactions">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No transactions yet</p>
            <Link href="/dashboard/import">
              <Button>Import Your First Transactions</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.slice(0, 8).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {transaction.merchant || transaction.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-xs text-gray-500">
                        {format(new Date(transaction.date), 'MMM d, yyyy')}
                      </p>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ 
                          borderColor: transaction.categoryRelation?.color || '#6B7280',
                          color: transaction.categoryRelation?.color || '#6B7280'
                        }}
                      >
                        {transaction.categoryRelation?.name || transaction.category}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${
                    transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
              </div>
            ))}
            
            {transactions.length > 8 && (
              <div className="text-center pt-4">
                <Link href="/dashboard/transactions">
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    View {transactions.length - 8} More
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
