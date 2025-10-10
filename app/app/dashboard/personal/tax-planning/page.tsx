
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calculator, DollarSign, Calendar } from 'lucide-react'

export default function TaxPlanningPage() {
  const currentYear = new Date().getFullYear()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tax Planning</h1>
        <p className="text-muted-foreground">Plan and optimize your taxes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Tax</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">Tax Year {currentYear}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deductions</CardTitle>
            <Calculator className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">Total deductions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filing Date</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Apr 15</div>
            <p className="text-xs text-muted-foreground">{currentYear}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tax Planning Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Deduction Tracker</h3>
              <p className="text-sm text-muted-foreground">Track all your tax-deductible expenses throughout the year</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Tax Estimator</h3>
              <p className="text-sm text-muted-foreground">Estimate your tax liability based on your income and deductions</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Important Dates</h3>
              <p className="text-sm text-muted-foreground">Never miss a tax deadline with our calendar reminders</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
