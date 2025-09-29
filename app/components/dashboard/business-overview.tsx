
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react'

interface BusinessOverviewProps {
  metrics: {
    totalRevenue: number
    pendingInvoices: number
    monthlyExpenses: number
    activeProjects: number
    totalCustomers: number
    totalVendors: number
  }
}

export function BusinessOverview({ metrics }: BusinessOverviewProps) {
  const profitMargin = metrics.totalRevenue > 0 
    ? ((metrics.totalRevenue - metrics.monthlyExpenses) / metrics.totalRevenue) * 100 
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Business Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-green-800">Cash Flow</p>
                <p className="text-2xl font-bold text-green-700">
                  ${(metrics.totalRevenue - metrics.monthlyExpenses).toLocaleString()}
                </p>
              </div>
              <div className="text-green-600">
                {metrics.totalRevenue > metrics.monthlyExpenses ? (
                  <TrendingUp className="h-8 w-8" />
                ) : (
                  <TrendingDown className="h-8 w-8" />
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-blue-800">Profit Margin</p>
                <p className="text-2xl font-bold text-blue-700">
                  {profitMargin.toFixed(1)}%
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Customers</span>
                <span className="font-semibold">{metrics.totalCustomers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Vendors</span>
                <span className="font-semibold">{metrics.totalVendors}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Projects in Progress</span>
                <span className="font-semibold">{metrics.activeProjects}</span>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Revenue Growth</span>
                  <span className="text-sm text-green-600 font-medium">+12.5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Customer Retention</span>
                  <span className="text-sm text-blue-600 font-medium">94.2%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
