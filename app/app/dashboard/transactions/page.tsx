
'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar, Search, Filter, Download, ArrowUpRight, ArrowDownLeft, CreditCard, Building } from 'lucide-react'
import { format } from 'date-fns'
import { TransactionExportFilterButtons, TransactionActions, ExpenseReceiptButton } from '@/components/transactions/transaction-page-client'
import Link from 'next/link'
import { toast } from 'sonner'

export default function TransactionsPage() {
  const { data: session, status } = useSession() || {}
  
  if (status === 'loading') return <div className="p-6">Loading...</div>
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Empty transactions array
  const mockTransactions: any[] = []

  const totalIncome = 0
  const totalExpenses = 0
  const netCashFlow = 0
  const pendingTransactions = 0

  const getTransactionIcon = (type: string, amount: number) => {
    switch (type) {
      case 'INCOME':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      case 'EXPENSE':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />
      case 'TRANSFER':
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />
    }
  }

  const getAccountIcon = (accountType: string) => {
    switch (accountType) {
      case 'CHECKING':
        return <Building className="h-4 w-4 text-blue-600" />
      case 'SAVINGS':
        return <Building className="h-4 w-4 text-green-600" />
      case 'CREDIT_CARD':
        return <CreditCard className="h-4 w-4 text-orange-600" />
      default:
        return <Building className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'default'
      case 'PENDING': return 'secondary'
      case 'FAILED': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-1">Monitor all financial transactions and cash flow</p>
        </div>
        <Link href="/dashboard/transactions/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ArrowDownLeft className="h-5 w-5 text-green-500 mr-2" />
              <div className="text-2xl font-bold text-green-600">
                ${totalIncome.toLocaleString()}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ArrowUpRight className="h-5 w-5 text-red-500 mr-2" />
              <div className="text-2xl font-bold text-red-600">
                ${totalExpenses.toLocaleString()}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Net Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              <span className={netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                ${Math.abs(netCashFlow).toLocaleString()}
              </span>
            </div>
            <p className={`text-xs mt-1 ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netCashFlow >= 0 ? 'Positive' : 'Negative'} cash flow
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingTransactions}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting processing</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Transactions</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="transfers">Transfers</TabsTrigger>
          </TabsList>

          <TransactionExportFilterButtons mockTransactions={mockTransactions} />
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-10"
                />
              </div>
              
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="rent">Rent & Utilities</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="travel">Travel & Entertainment</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="professional">Professional Services</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  <SelectItem value="checking">Business Checking</SelectItem>
                  <SelectItem value="savings">Business Savings</SelectItem>
                  <SelectItem value="credit">Business Credit Card</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {mockTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions yet</h3>
                  <p className="text-gray-600 mb-4">Start tracking your financial transactions by adding your first entry</p>
                  <Link href="/dashboard/transactions/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Transaction
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {mockTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex items-center space-x-2">
                          {getTransactionIcon(transaction.type, transaction.amount)}
                          {getAccountIcon(transaction.account.type)}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h4 className="font-semibold text-gray-900">{transaction.description}</h4>
                            <Badge variant={getStatusColor(transaction.status)}>
                              {transaction.status}
                            </Badge>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(transaction.date, 'MMM d, yyyy')}
                            </div>
                            <span>{transaction.category?.name}</span>
                            <span>{transaction.account.name}</span>
                            {transaction.reference && (
                              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                {transaction.reference}
                              </span>
                            )}
                          </div>

                          {(transaction.customer || transaction.vendor) && (
                            <div className="text-sm text-gray-500 mt-1">
                              {transaction.customer && `From: ${transaction.customer.name}`}
                              {transaction.vendor && `To: ${transaction.vendor.name}`}
                            </div>
                          )}

                          {transaction.tags && transaction.tags.length > 0 && (
                            <div className="flex items-center space-x-1 mt-2">
                              {transaction.tags.map((tag: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.type.charAt(0) + transaction.type.slice(1).toLowerCase()}
                          </div>
                        </div>

                        <TransactionActions transaction={transaction} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ArrowDownLeft className="h-5 w-5 text-green-600 mr-2" />
                Income Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mockTransactions.filter(t => t.type === 'INCOME').length === 0 ? (
                <div className="text-center py-12">
                  <ArrowDownLeft className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No income transactions yet</h3>
                  <p className="text-gray-600 mb-4">Start tracking your income by adding your first transaction</p>
                  <Link href="/dashboard/transactions/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Income
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {mockTransactions.filter(t => t.type === 'INCOME').map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border border-green-200 rounded-lg bg-green-50">
                      <div className="flex items-center space-x-4 flex-1">
                        <ArrowDownLeft className="h-5 w-5 text-green-600" />
                        
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{transaction.description}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>{format(transaction.date, 'MMM d, yyyy')}</span>
                            <span>{transaction.category?.name}</span>
                            {transaction.customer && <span>From: {transaction.customer.name}</span>}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            +${transaction.amount.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">{transaction.account.name}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ArrowUpRight className="h-5 w-5 text-red-600 mr-2" />
                Expense Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mockTransactions.filter(t => t.type === 'EXPENSE').length === 0 ? (
                <div className="text-center py-12">
                  <ArrowUpRight className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No expense transactions yet</h3>
                  <p className="text-gray-600 mb-4">Start tracking your expenses by adding your first transaction</p>
                  <Link href="/dashboard/transactions/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Expense
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {mockTransactions.filter(t => t.type === 'EXPENSE').map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                      <div className="flex items-center space-x-4 flex-1">
                        <ArrowUpRight className="h-5 w-5 text-red-600" />
                        
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{transaction.description}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>{format(transaction.date, 'MMM d, yyyy')}</span>
                            <span>{transaction.category?.name}</span>
                            {transaction.vendor && <span>To: {transaction.vendor.name}</span>}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-bold text-red-600">
                            ${Math.abs(transaction.amount).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">{transaction.account.name}</div>
                        </div>

                        {transaction.receiptUrl && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Simulate receipt download
                              const receiptContent = `Expense Receipt\n\nDate: ${format(transaction.date, 'MMM d, yyyy')}\nDescription: ${transaction.description}\nAmount: $${Math.abs(transaction.amount).toLocaleString()}\nCategory: ${transaction.category?.name || 'N/A'}\nVendor: ${transaction.vendor?.name || 'N/A'}\nAccount: ${transaction.account.name}\nReference: ${transaction.reference || 'N/A'}\n\nThis is a simulated receipt download.`
                              
                              const blob = new Blob([receiptContent], { type: 'text/plain' })
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `expense-receipt-${transaction.reference || transaction.id}.txt`
                              document.body.appendChild(a)
                              a.click()
                              document.body.removeChild(a)
                              URL.revokeObjectURL(url)
                              
                              toast.success('Expense receipt downloaded!')
                            }}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Receipt
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                Transfer Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mockTransactions.filter(t => t.type === 'TRANSFER').length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No transfer transactions yet</h3>
                  <p className="text-gray-600 mb-4">Start tracking your transfers by adding your first transaction</p>
                  <Link href="/dashboard/transactions/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Transfer
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {mockTransactions.filter(t => t.type === 'TRANSFER').map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border border-blue-200 rounded-lg bg-blue-50">
                      <div className="flex items-center space-x-4 flex-1">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{transaction.description}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>{format(transaction.date, 'MMM d, yyyy')}</span>
                            <span>Internal Transfer</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            ${Math.abs(transaction.amount).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">From: {transaction.account.name}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
