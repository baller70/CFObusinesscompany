
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { PieChart, TrendingUp, TrendingDown, DollarSign, Calendar, AlertTriangle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Budget {
  id: string
  category: string
  amount: number
  spent: number
  type: string
  businessProfile?: {
    id: string
    name: string
  }
}

interface BudgetSummary {
  totalBudget: number
  totalSpent: number
  totalIncome: number
  remaining: number
  percentUsed: number
}

interface BudgetData {
  budgets: Budget[]
  summary: BudgetSummary
  period: {
    month: number
    year: number
  }
}

function BudgetPageClient() {
  const { data: session } = useSession() || {}
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  const fetchBudgets = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/budgets?month=${selectedMonth}&year=${selectedYear}`)
      if (response.ok) {
        const data = await response.json()
        setBudgetData(data)
      } else {
        console.error('Failed to fetch budgets')
      }
    } catch (error) {
      console.error('Error fetching budgets:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchBudgets()
    }
  }, [session, selectedMonth, selectedYear])

  const getProgressColor = (percentUsed: number) => {
    if (percentUsed >= 100) return 'bg-red-500'
    if (percentUsed >= 80) return 'bg-orange-500'
    return 'bg-green-500'
  }

  const getStatusIcon = (spent: number, budget: number) => {
    const percent = (spent / budget) * 100
    if (percent >= 100) return <AlertTriangle className="h-4 w-4 text-red-500" />
    if (percent >= 80) return <TrendingUp className="h-4 w-4 text-orange-500" />
    return <TrendingDown className="h-4 w-4 text-green-500" />
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader user={session?.user} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading budgets...</p>
          </div>
        </main>
      </div>
    )
  }

  const hasBudgets = budgetData && budgetData.budgets.length > 0
  
  // Identify income vs expense budgets by category name
  const isIncomeCategory = (category: string) => {
    const lower = category.toLowerCase()
    return lower.includes('income') || lower.includes('salary') || lower.includes('revenue')
  }
  
  const incomeBudgets = budgetData?.budgets.filter(b => isIncomeCategory(b.category)) || []
  const expenseBudgets = budgetData?.budgets.filter(b => !isIncomeCategory(b.category)) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session?.user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Budget Planning</h1>
              <p className="text-gray-600 mt-1">
                Track your spending and manage your budgets
              </p>
            </div>
            
            {/* Period Selector */}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((name, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {!hasBudgets ? (
          <div className="text-center py-12">
            <PieChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets for this period</h3>
            <p className="text-gray-600 mb-6">
              Upload bank statements to automatically create budgets based on your transactions.
            </p>
            <Button onClick={() => window.location.href = '/dashboard/bank-statements'}>
              Go to Financial Statements
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Income</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-2xl font-bold text-green-600">
                        +${budgetData?.summary.totalIncome.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Budget</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="text-2xl font-bold text-blue-600">
                        ${budgetData?.summary.totalBudget.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Spent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-2xl font-bold text-red-600">
                        -${budgetData?.summary.totalSpent.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <Progress 
                        value={budgetData?.summary.percentUsed || 0} 
                        className="h-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {budgetData?.summary.percentUsed.toFixed(1)}% of budget used
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Expense Budgets */}
              {expenseBudgets.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Expense Budgets</CardTitle>
                    <CardDescription>Your spending by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {expenseBudgets.map((budget) => {
                        const percentUsed = (budget.spent / budget.amount) * 100
                        const remaining = budget.amount - budget.spent
                        
                        return (
                          <div key={budget.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(budget.spent, budget.amount)}
                                <div>
                                  <h4 className="font-medium">{budget.category}</h4>
                                  {budget.businessProfile && (
                                    <p className="text-xs text-gray-500">{budget.businessProfile.name}</p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">
                                  ${budget.spent.toFixed(2)} / ${budget.amount.toFixed(2)}
                                </p>
                                <p className={`text-xs ${remaining < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                  {remaining < 0 ? 'Over by' : 'Remaining'}: ${Math.abs(remaining).toFixed(2)}
                                </p>
                              </div>
                            </div>
                            <Progress 
                              value={Math.min(percentUsed, 100)} 
                              className={`h-2 ${getProgressColor(percentUsed)}`}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Income Budgets */}
              {incomeBudgets.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Income Sources</CardTitle>
                    <CardDescription>Your income by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {incomeBudgets.map((budget) => (
                        <div key={budget.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-green-900">{budget.category}</h4>
                            {budget.businessProfile && (
                              <p className="text-xs text-green-700">{budget.businessProfile.name}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">${budget.spent.toFixed(2)}</p>
                            <p className="text-xs text-green-700">Expected: ${budget.amount.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Budget Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <h4 className="font-medium text-blue-900 mb-1">50/30/20 Rule</h4>
                      <p className="text-sm text-blue-700">
                        Allocate 50% for needs, 30% for wants, and 20% for savings and debt repayment.
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <h4 className="font-medium text-green-900 mb-1">Track Everything</h4>
                      <p className="text-sm text-green-700">
                        Upload bank statements regularly to keep your budgets accurate.
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
                      <h4 className="font-medium text-purple-900 mb-1">Auto-Generated</h4>
                      <p className="text-sm text-purple-700">
                        Your budgets are automatically created and updated based on your transactions.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function BudgetPage() {
  return <BudgetPageClient />
}
