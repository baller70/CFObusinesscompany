
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calculator, DollarSign, Calendar, TrendingUp, Loader2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

export default function TaxPlanningPage() {
  const [loading, setLoading] = useState(true)
  const [taxData, setTaxData] = useState<any>(null)
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    fetchTaxData()
  }, [])

  const fetchTaxData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/personal/tax-planning/calculate')
      if (response.ok) {
        const data = await response.json()
        setTaxData(data)
      }
    } catch (error) {
      console.error('Error fetching tax data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tax Planning</h1>
          <p className="text-muted-foreground">Plan and optimize your taxes</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const effectiveTaxRate = taxData?.effectiveTaxRate || 0
  const progressColor = effectiveTaxRate > 30 ? 'bg-red-500' : effectiveTaxRate > 20 ? 'bg-yellow-500' : 'bg-green-500'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tax Planning</h1>
          <p className="text-muted-foreground">Plan and optimize your taxes for {currentYear}</p>
        </div>
        <Button onClick={fetchTaxData} variant="outline">
          <Calculator className="h-4 w-4 mr-2" />
          Recalculate
        </Button>
      </div>

      {taxData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gross Income</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${taxData.income.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Tax Year {currentYear}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
                <Calculator className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${taxData.deductions.used.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {taxData.deductions.used > taxData.deductions.standard ? 'Itemized' : 'Standard'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estimated Tax</CardTitle>
                <DollarSign className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">${taxData.estimatedTax.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Federal income tax</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quarterly Payment</CardTitle>
                <Calendar className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${taxData.quarterlyEstimate.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Per quarter</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tax Rate Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Effective Tax Rate</span>
                  <span className="text-sm font-medium">{effectiveTaxRate}%</span>
                </div>
                <Progress value={parseFloat(effectiveTaxRate)} className="h-2" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Taxable Income</p>
                  <p className="text-2xl font-bold">${taxData.taxableIncome.toLocaleString()}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">After-Tax Income</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${(taxData.income - taxData.estimatedTax).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deduction Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Standard Deduction</p>
                    <p className="text-sm text-muted-foreground">Single filer</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${taxData.deductions.standard.toLocaleString()}</p>
                    {taxData.deductions.used === taxData.deductions.standard && (
                      <Badge variant="outline" className="mt-1">Used</Badge>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Itemized Deductions</p>
                    <p className="text-sm text-muted-foreground">Sum of eligible deductions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${taxData.deductions.itemized.toLocaleString()}</p>
                    {taxData.deductions.used === taxData.deductions.itemized && (
                      <Badge variant="outline" className="mt-1">Used</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-3 p-4 bg-muted rounded-lg">
                  <p className="font-medium text-sm">Itemized Deduction Details:</p>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Charitable Contributions</span>
                    <span className="font-medium">${taxData.deductions.charitable.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mortgage Interest</span>
                    <span className="font-medium">${taxData.deductions.mortgageInterest.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Student Loan Interest</span>
                    <span className="font-medium">${taxData.deductions.studentLoanInterest.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Healthcare Expenses</span>
                    <span className="font-medium">${taxData.deductions.healthcareExpenses.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quarterly Estimated Tax Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Q1 Payment</p>
                    <Badge variant="outline">April 15</Badge>
                  </div>
                  <p className="text-2xl font-bold">${taxData.quarterlyEstimate.toLocaleString()}</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Q2 Payment</p>
                    <Badge variant="outline">June 15</Badge>
                  </div>
                  <p className="text-2xl font-bold">${taxData.quarterlyEstimate.toLocaleString()}</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Q3 Payment</p>
                    <Badge variant="outline">Sept 15</Badge>
                  </div>
                  <p className="text-2xl font-bold">${taxData.quarterlyEstimate.toLocaleString()}</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Q4 Payment</p>
                    <Badge variant="outline">Jan 15</Badge>
                  </div>
                  <p className="text-2xl font-bold">${taxData.quarterlyEstimate.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> These calculations are estimates based on 2024 federal tax brackets for single filers. 
              Actual tax liability may vary based on your specific situation. Consult with a tax professional for personalized advice.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  )
}
