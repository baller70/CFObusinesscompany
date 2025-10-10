'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Plus, Tag, TrendingUp, TrendingDown, DollarSign, Percent, Edit, Trash2, Search, Filter } from 'lucide-react'
import { CategoryActions } from '@/components/categories/category-actions'
import Link from 'next/link'
import { toast } from 'sonner'

export default function CategoriesPage() {
  const { data: session, status } = useSession() || {}
  
  if (status === 'loading') return <div className="p-6">Loading...</div>
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Mock data for demonstration
  const mockCategories = [
    {
      id: '1',
      name: 'Professional Services',
      type: 'INCOME',
      description: 'Revenue from consulting and professional services',
      color: '#10B981',
      isActive: true,
      budgetLimit: null,
      taxDeductible: false,
      transactions: [
        { amount: 15000 },
        { amount: 8500 },
        { amount: 12000 }
      ],
      _count: { transactions: 3 }
    },
    {
      id: '2',
      name: 'Rent & Utilities',
      type: 'EXPENSE',
      description: 'Office rent, electricity, internet, and utilities',
      color: '#EF4444',
      isActive: true,
      budgetLimit: 3000,
      taxDeductible: true,
      transactions: [
        { amount: -2500 },
        { amount: -2500 },
        { amount: -2600 }
      ],
      _count: { transactions: 3 }
    },
    {
      id: '3',
      name: 'Technology',
      type: 'EXPENSE',
      description: 'Software subscriptions, hardware, and tech equipment',
      color: '#F59E0B',
      isActive: true,
      budgetLimit: 2000,
      taxDeductible: true,
      transactions: [
        { amount: -450 },
        { amount: -3200 },
        { amount: -800 }
      ],
      _count: { transactions: 3 }
    },
    {
      id: '4',
      name: 'Marketing',
      type: 'EXPENSE',
      description: 'Advertising, campaigns, and promotional expenses',
      color: '#8B5CF6',
      isActive: true,
      budgetLimit: 1500,
      taxDeductible: true,
      transactions: [
        { amount: -1200 },
        { amount: -800 }
      ],
      _count: { transactions: 2 }
    },
    {
      id: '5',
      name: 'Travel & Entertainment',
      type: 'EXPENSE',
      description: 'Business travel, meals, and client entertainment',
      color: '#06B6D4',
      isActive: true,
      budgetLimit: 1000,
      taxDeductible: true,
      transactions: [
        { amount: -850 },
        { amount: -650 }
      ],
      _count: { transactions: 2 }
    },
    {
      id: '6',
      name: 'Equipment',
      type: 'EXPENSE',
      description: 'Office furniture, computers, and equipment purchases',
      color: '#84CC16',
      isActive: true,
      budgetLimit: 5000,
      taxDeductible: true,
      transactions: [
        { amount: -3200 }
      ],
      _count: { transactions: 1 }
    },
    {
      id: '7',
      name: 'Consulting Revenue',
      type: 'INCOME',
      description: 'Income from consulting projects',
      color: '#059669',
      isActive: true,
      budgetLimit: null,
      taxDeductible: false,
      transactions: [
        { amount: 8500 },
        { amount: 12500 }
      ],
      _count: { transactions: 2 }
    },
    {
      id: '8',
      name: 'Office Supplies',
      type: 'EXPENSE',
      description: 'Stationery, printer supplies, and office materials',
      color: '#F97316',
      isActive: true,
      budgetLimit: 500,
      taxDeductible: true,
      transactions: [
        { amount: -150 },
        { amount: -200 }
      ],
      _count: { transactions: 2 }
    },
    {
      id: '9',
      name: 'Legal & Professional',
      type: 'EXPENSE',
      description: 'Legal fees, accounting services, and professional consultations',
      color: '#7C3AED',
      isActive: true,
      budgetLimit: 2000,
      taxDeductible: true,
      transactions: [
        { amount: -1500 }
      ],
      _count: { transactions: 1 }
    },
    {
      id: '10',
      name: 'Insurance',
      type: 'EXPENSE',
      description: 'Business insurance premiums and coverage',
      color: '#DC2626',
      isActive: false,
      budgetLimit: 1200,
      taxDeductible: true,
      transactions: [],
      _count: { transactions: 0 }
    }
  ]

  const incomeCategories = mockCategories.filter(cat => cat.type === 'INCOME')
  const expenseCategories = mockCategories.filter(cat => cat.type === 'EXPENSE')
  const activeCategories = mockCategories.filter(cat => cat.isActive).length
  const totalCategories = mockCategories.length

  const getTotalAmount = (category: any) => {
    return category.transactions.reduce((sum: number, t: any) => sum + t.amount, 0)
  }

  const getBudgetUsage = (category: any) => {
    if (!category.budgetLimit || category.type === 'INCOME') return null
    const spent = Math.abs(getTotalAmount(category))
    const percentage = (spent / category.budgetLimit) * 100
    return { spent, percentage, limit: category.budgetLimit }
  }

  const getBudgetColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100'
    if (percentage >= 75) return 'text-orange-600 bg-orange-100'
    if (percentage >= 50) return 'text-gray-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">Organize and manage your income and expense categories</p>
        </div>
        <Link href="/dashboard/categories/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Category
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalCategories}</div>
            <p className="text-xs text-gray-500 mt-1">{activeCategories} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Income Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{incomeCategories.length}</div>
            <p className="text-xs text-gray-500 mt-1">Revenue streams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expenseCategories.length}</div>
            <p className="text-xs text-gray-500 mt-1">Cost centers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Budgeted Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {mockCategories.filter(cat => cat.budgetLimit).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">With budget limits</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Categories</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="budget">Budget Tracking</TabsTrigger>
        </TabsList>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search categories..."
                  className="pl-10"
                />
              </div>
              <Button 
                variant="outline"
                onClick={() => {
                  toast.info('Category filters: Type (Income/Expense), Status (Active/Inactive), Budget Status (Over/Under Budget), Tax Deductible status')
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockCategories.map((category) => {
              const totalAmount = getTotalAmount(category)
              const budgetUsage = getBudgetUsage(category)

              return (
                <Card key={category.id} className={`hover:shadow-lg transition-shadow ${!category.isActive ? 'opacity-60' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: category.color }}
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900">{category.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={category.type === 'INCOME' ? 'default' : 'destructive'}>
                              {category.type.toLowerCase()}
                            </Badge>
                            {!category.isActive && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                            {category.taxDeductible && (
                              <Badge variant="outline" className="text-xs">Tax Deductible</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-gray-600 text-sm mb-4">{category.description}</p>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Amount:</span>
                        <span className={`font-semibold ${
                          category.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {category.type === 'INCOME' ? '+' : ''}${Math.abs(totalAmount).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Transactions:</span>
                        <span className="font-medium">{category._count.transactions}</span>
                      </div>

                      {budgetUsage && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Budget Usage:</span>
                            <span className={`font-semibold px-2 py-1 rounded-full text-xs ${
                              getBudgetColor(budgetUsage.percentage)
                            }`}>
                              {budgetUsage.percentage.toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                budgetUsage.percentage >= 90 ? 'bg-red-500' :
                                budgetUsage.percentage >= 75 ? 'bg-orange-500' :
                                budgetUsage.percentage >= 50 ? 'bg-gray-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(budgetUsage.percentage, 100)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>${budgetUsage.spent.toLocaleString()} spent</span>
                            <span>${budgetUsage.limit.toLocaleString()} budget</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <CategoryActions categoryName={category.name} />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="income">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {incomeCategories.map((category) => {
              const totalAmount = getTotalAmount(category)

              return (
                <Card key={category.id} className="bg-green-50 border-green-200 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        <Badge className="bg-green-100 text-green-800 mt-1">Income</Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-gray-600 text-sm mb-4">{category.description}</p>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Revenue:</span>
                        <span className="font-bold text-green-600 text-lg">
                          +${totalAmount.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Transactions:</span>
                        <span className="font-medium">{category._count.transactions}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Average per Transaction:</span>
                        <span className="font-medium">
                          ${category._count.transactions > 0 ? (totalAmount / category._count.transactions).toLocaleString() : '0'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-green-200">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const newWindow = window.open('', '_blank', 'width=800,height=600')
                          if (newWindow) {
                            newWindow.document.write(`
                              <html>
                                <head>
                                  <title>Transactions - ${category.name}</title>
                                  <style>
                                    body { font-family: Arial, sans-serif; margin: 20px; }
                                    .transaction { padding: 10px; margin: 5px 0; border: 1px solid #ddd; border-radius: 5px; }
                                  </style>
                                </head>
                                <body>
                                  <h1>Transactions for ${category.name}</h1>
                                  <p><strong>Category Type:</strong> ${category.type}</p>
                                  <p><strong>Total Amount:</strong> +$${totalAmount.toLocaleString()}</p>
                                  <h3>Recent Transactions (${category._count.transactions})</h3>
                                  ${category.transactions.map((trans, idx) => 
                                    `<div class="transaction">Transaction ${idx + 1}: $${trans.amount.toLocaleString()}</div>`
                                  ).join('')}
                                  <p style="margin-top: 20px; color: #666;">This shows a sample of transactions for this category.</p>
                                </body>
                              </html>
                            `)
                            newWindow.document.close()
                          } else {
                            toast.info(`Viewing transactions for ${category.name} category`)
                          }
                        }}
                      >
                        View Transactions
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          toast.info(`Opening ${category.name} category for editing - you can modify name, description, color, and budget settings.`)
                        }}
                      >
                        Edit Category
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="expenses">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {expenseCategories.map((category) => {
              const totalAmount = Math.abs(getTotalAmount(category))
              const budgetUsage = getBudgetUsage(category)

              return (
                <Card key={category.id} className="bg-red-50 border-red-200 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="destructive">Expense</Badge>
                          {category.taxDeductible && (
                            <Badge variant="outline" className="text-xs bg-blue-50">Tax Deductible</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-gray-600 text-sm mb-4">{category.description}</p>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Spent:</span>
                        <span className="font-bold text-red-600 text-lg">
                          ${totalAmount.toLocaleString()}
                        </span>
                      </div>

                      {budgetUsage && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Budget Remaining:</span>
                            <span className={`font-medium ${
                              budgetUsage.percentage >= 90 ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              ${(budgetUsage.limit - budgetUsage.spent).toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                budgetUsage.percentage >= 90 ? 'bg-red-500' :
                                budgetUsage.percentage >= 75 ? 'bg-orange-500' :
                                budgetUsage.percentage >= 50 ? 'bg-gray-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(budgetUsage.percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Transactions:</span>
                        <span className="font-medium">{category._count.transactions}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-red-200">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const newWindow = window.open('', '_blank', 'width=800,height=600')
                          if (newWindow) {
                            newWindow.document.write(`
                              <html>
                                <head>
                                  <title>Expense Transactions - ${category.name}</title>
                                  <style>
                                    body { font-family: Arial, sans-serif; margin: 20px; }
                                    .transaction { padding: 10px; margin: 5px 0; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 5px; }
                                    .budget-info { background: #f0f9ff; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                                  </style>
                                </head>
                                <body>
                                  <div class="budget-info">
                                    <h1>Expense Transactions - ${category.name}</h1>
                                    <p><strong>Total Spent:</strong> $${totalAmount.toLocaleString()}</p>
                                    ${budgetUsage ? `
                                      <p><strong>Budget:</strong> $${budgetUsage.limit.toLocaleString()}</p>
                                      <p><strong>Remaining:</strong> $${(budgetUsage.limit - budgetUsage.spent).toLocaleString()}</p>
                                      <p><strong>Usage:</strong> ${budgetUsage.percentage.toFixed(0)}%</p>
                                    ` : ''}
                                  </div>
                                  <h3>Recent Transactions (${category._count.transactions})</h3>
                                  ${category.transactions.map((trans, idx) => 
                                    `<div class="transaction">Expense ${idx + 1}: -$${Math.abs(trans.amount).toLocaleString()}</div>`
                                  ).join('')}
                                  <p style="margin-top: 20px; color: #666;">This shows expense transactions for this category.</p>
                                </body>
                              </html>
                            `)
                            newWindow.document.close()
                          } else {
                            toast.info(`Viewing expense transactions for ${category.name}`)
                          }
                        }}
                      >
                        View Transactions
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const budgetUsage = getBudgetUsage(category)
                          if (budgetUsage) {
                            toast.info(`Current budget: $${budgetUsage.limit.toLocaleString()} | Used: ${budgetUsage.percentage.toFixed(0)}% | Remaining: $${(budgetUsage.limit - budgetUsage.spent).toLocaleString()}`)
                          } else {
                            toast.info(`Opening budget editor for ${category.name} - set spending limits and alerts.`)
                          }
                        }}
                      >
                        Edit Budget
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="budget">
          <Card>
            <CardHeader>
              <CardTitle>Budget Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCategories
                  .filter(cat => cat.budgetLimit && cat.type === 'EXPENSE')
                  .map((category) => {
                    const budgetUsage = getBudgetUsage(category)!
                    
                    return (
                      <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                            <h4 className="font-semibold text-gray-900">{category.name}</h4>
                            <Badge className={getBudgetColor(budgetUsage.percentage)}>
                              {budgetUsage.percentage.toFixed(0)}% used
                            </Badge>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              ${budgetUsage.spent.toLocaleString()} / ${budgetUsage.limit.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">
                              ${(budgetUsage.limit - budgetUsage.spent).toLocaleString()} remaining
                            </div>
                          </div>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full ${
                              budgetUsage.percentage >= 90 ? 'bg-red-500' :
                              budgetUsage.percentage >= 75 ? 'bg-orange-500' :
                              budgetUsage.percentage >= 50 ? 'bg-gray-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(budgetUsage.percentage, 100)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                          <span>{category._count.transactions} transactions</span>
                          {budgetUsage.percentage >= 90 && (
                            <Badge variant="destructive" className="text-xs">
                              Budget Alert
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
