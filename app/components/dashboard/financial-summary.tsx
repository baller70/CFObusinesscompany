
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreditCard, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react'
import { formatDistanceToNow, isBefore } from 'date-fns'
import Link from 'next/link'

interface FinancialSummaryProps {
  bills: any[]
  metrics: {
    totalRevenue: number
    pendingInvoices: number
    monthlyExpenses: number
  }
}

export function FinancialSummary({ bills, metrics }: FinancialSummaryProps) {
  const overdueBills = bills.filter(bill => 
    bill.dueDate && isBefore(new Date(bill.dueDate), new Date())
  )

  return (
    <div className="space-y-6">
      {/* Financial Snapshot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Financial Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-green-800">Total Revenue</span>
              </div>
              <span className="text-lg font-bold text-green-700">
                ${metrics.totalRevenue.toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-orange-800">Outstanding</span>
              </div>
              <span className="text-lg font-bold text-orange-700">
                ${metrics.pendingInvoices.toLocaleString()}
              </span>
            </div>
          </div>
          
          <div className="pt-3 border-t">
            <Link href="/dashboard/reports">
              <Button variant="outline" className="w-full" size="sm">
                View Detailed Reports
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Bills */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Bills to Pay
              {overdueBills.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {overdueBills.length} overdue
                </Badge>
              )}
            </span>
            <Link href="/dashboard/expenses/bills">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bills.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No pending bills</p>
            ) : (
              bills.slice(0, 5).map((bill) => {
                const isOverdue = bill.dueDate && isBefore(new Date(bill.dueDate), new Date())
                
                return (
                  <div key={bill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {isOverdue && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {bill.description}
                        </p>
                        {bill.vendor && (
                          <p className="text-xs text-gray-500">
                            {bill.vendor.name}
                          </p>
                        )}
                        {bill.dueDate && (
                          <p className={`text-xs ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                            Due {formatDistanceToNow(new Date(bill.dueDate))}
                            {isOverdue ? ' ago' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        ${bill.amount.toLocaleString()}
                      </p>
                      <Badge 
                        variant={isOverdue ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {bill.status}
                      </Badge>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          
          {bills.length > 0 && (
            <div className="mt-4 pt-3 border-t">
              <Link href="/dashboard/expenses/bills/new">
                <Button className="w-full" size="sm">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add New Bill
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
