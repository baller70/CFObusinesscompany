
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  CreditCard, 
  Building2, 
  TrendingDown, 
  AlertCircle,
  CheckCircle,
  Clock,
  Calculator,
  FileText,
  Target
} from 'lucide-react'
import { format, differenceInMonths } from 'date-fns'
import { toast } from 'sonner'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

export default function DebtsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedStrategy, setSelectedStrategy] = useState('avalanche')

  // Mock debt data
  const mockDebts = [
    {
      id: '1',
      name: 'Business Line of Credit',
      type: 'LINE_OF_CREDIT',
      creditor: 'First National Bank',
      originalAmount: 100000,
      currentBalance: 75000,
      monthlyPayment: 2500,
      interestRate: 8.5,
      minimumPayment: 1500,
      dueDate: new Date('2025-12-31'),
      status: 'ACTIVE',
      priority: 'HIGH',
      paymentHistory: [
        { date: new Date('2024-11-01'), amount: 2500, principal: 1800, interest: 700 },
        { date: new Date('2024-10-01'), amount: 2500, principal: 1750, interest: 750 }
      ]
    },
    {
      id: '2',
      name: 'Equipment Loan',
      type: 'TERM_LOAN',
      creditor: 'Equipment Finance Corp',
      originalAmount: 50000,
      currentBalance: 32000,
      monthlyPayment: 1200,
      interestRate: 6.5,
      minimumPayment: 1200,
      dueDate: new Date('2026-08-15'),
      status: 'ACTIVE',
      priority: 'MEDIUM',
      paymentHistory: [
        { date: new Date('2024-11-01'), amount: 1200, principal: 950, interest: 250 },
        { date: new Date('2024-10-01'), amount: 1200, principal: 925, interest: 275 }
      ]
    },
    {
      id: '3',
      name: 'Business Credit Card',
      type: 'CREDIT_CARD',
      creditor: 'Chase Business',
      originalAmount: 25000,
      currentBalance: 8500,
      monthlyPayment: 850,
      interestRate: 18.99,
      minimumPayment: 250,
      dueDate: new Date('2024-12-15'),
      status: 'ACTIVE',
      priority: 'HIGH',
      paymentHistory: [
        { date: new Date('2024-11-01'), amount: 850, principal: 650, interest: 200 },
        { date: new Date('2024-10-01'), amount: 850, principal: 625, interest: 225 }
      ]
    },
    {
      id: '4',
      name: 'Commercial Mortgage',
      type: 'MORTGAGE',
      creditor: 'Regional Bank',
      originalAmount: 300000,
      currentBalance: 245000,
      monthlyPayment: 2800,
      interestRate: 5.25,
      minimumPayment: 2800,
      dueDate: new Date('2034-06-01'),
      status: 'ACTIVE',
      priority: 'LOW',
      paymentHistory: [
        { date: new Date('2024-11-01'), amount: 2800, principal: 1750, interest: 1050 },
        { date: new Date('2024-10-01'), amount: 2800, principal: 1725, interest: 1075 }
      ]
    },
    {
      id: '5',
      name: 'SBA Loan',
      type: 'SBA_LOAN',
      creditor: 'Community Bank',
      originalAmount: 75000,
      currentBalance: 15000,
      monthlyPayment: 1500,
      interestRate: 4.5,
      minimumPayment: 900,
      dueDate: new Date('2025-03-30'),
      status: 'ACTIVE',
      priority: 'MEDIUM',
      paymentHistory: [
        { date: new Date('2024-11-01'), amount: 1500, principal: 1400, interest: 100 },
        { date: new Date('2024-10-01'), amount: 1500, principal: 1395, interest: 105 }
      ]
    }
  ]

  const itemsPerPage = 3
  const totalPages = Math.ceil(mockDebts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentDebts = mockDebts.slice(startIndex, startIndex + itemsPerPage)

  const totalDebt = mockDebts.reduce((sum, debt) => sum + debt.currentBalance, 0)
  const totalMonthlyPayments = mockDebts.reduce((sum, debt) => sum + debt.monthlyPayment, 0)
  const highestInterestRate = Math.max(...mockDebts.map(debt => debt.interestRate))
  const averageInterestRate = mockDebts.reduce((sum, debt) => sum + debt.interestRate, 0) / mockDebts.length

  const getDebtTypeIcon = (type: string) => {
    switch (type) {
      case 'CREDIT_CARD':
        return <CreditCard className="h-5 w-5 text-blue-500" />
      case 'LINE_OF_CREDIT':
        return <Building2 className="h-5 w-5 text-green-500" />
      case 'TERM_LOAN':
      case 'SBA_LOAN':
        return <FileText className="h-5 w-5 text-purple-500" />
      case 'MORTGAGE':
        return <Building2 className="h-5 w-5 text-orange-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <Badge className="bg-red-100 text-red-800">High Priority</Badge>
      case 'MEDIUM':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Priority</Badge>
      case 'LOW':
        return <Badge className="bg-green-100 text-green-800">Low Priority</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const calculatePayoffTime = (balance: number, payment: number, rate: number) => {
    const monthlyRate = rate / 100 / 12
    const months = Math.log(1 + (balance * monthlyRate) / payment) / Math.log(1 + monthlyRate)
    return Math.ceil(months)
  }

  const generatePaymentPlan = () => {
    toast.success('AI payment optimization plan generated! Check your email for details.')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Debt Management</h1>
          <p className="text-gray-600 mt-1">Track and optimize your debt repayment strategy</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline"
            onClick={generatePaymentPlan}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Generate Payment Plan
          </Button>
          <Button
            onClick={() => {
              toast.info('Add debt form would open here')
              // In a real app, this would open add debt form
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Debt
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Debt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${totalDebt.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Across {mockDebts.length} accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Monthly Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${totalMonthlyPayments.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Current obligations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Highest Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {highestInterestRate}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Priority for payoff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {averageInterestRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Weighted average</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" onClick={() => toast.info('Overview of all your debts with current balances and payment details')}>Debt Overview</TabsTrigger>
          <TabsTrigger value="strategy" onClick={() => toast.info('Choose your debt payoff strategy - avalanche, snowball, or custom approach')}>Payoff Strategy</TabsTrigger>
          <TabsTrigger value="calculator" onClick={() => toast.info('Calculate payoff times, interest savings, and payment scenarios')}>Debt Calculator</TabsTrigger>
          <TabsTrigger value="history" onClick={() => toast.info('Track your payment history and see your progress over time')}>Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Current Debts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {currentDebts.map((debt) => {
                  const payoffMonths = calculatePayoffTime(debt.currentBalance, debt.monthlyPayment, debt.interestRate)
                  const progressPercentage = ((debt.originalAmount - debt.currentBalance) / debt.originalAmount) * 100

                  return (
                    <div key={debt.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          {getDebtTypeIcon(debt.type)}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{debt.name}</h3>
                            <p className="text-sm text-gray-600">{debt.creditor}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {getPriorityBadge(debt.priority)}
                          <Badge variant="outline">{debt.type.replace('_', ' ')}</Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <div className="text-sm text-gray-600">Current Balance</div>
                          <div className="text-lg font-bold text-red-600">
                            ${debt.currentBalance.toLocaleString()}
                          </div>
                        </div>
                        
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm text-gray-600">Monthly Payment</div>
                          <div className="text-lg font-bold text-blue-600">
                            ${debt.monthlyPayment.toLocaleString()}
                          </div>
                        </div>
                        
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-sm text-gray-600">Interest Rate</div>
                          <div className="text-lg font-bold text-orange-600">
                            {debt.interestRate}%
                          </div>
                        </div>
                        
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-sm text-gray-600">Payoff Time</div>
                          <div className="text-lg font-bold text-green-600">
                            {payoffMonths} months
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Payoff Progress</span>
                          <span className="text-sm font-bold text-gray-900">
                            {progressPercentage.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Original: ${debt.originalAmount.toLocaleString()}</span>
                          <span>Remaining: ${debt.currentBalance.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toast.info(`Viewing details for ${debt.name}`)}
                        >
                          View Details
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toast.success(`Payment recorded for ${debt.name}`)}
                        >
                          Record Payment
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toast.info(`Editing ${debt.name}`)}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              <div className="mt-6 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage > 1) setCurrentPage(currentPage - 1)
                        }}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {[...Array(totalPages)].map((_, index) => (
                      <PaginationItem key={index}>
                        <PaginationLink 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage(index + 1)
                          }}
                          isActive={currentPage === index + 1}
                          className="cursor-pointer"
                        >
                          {index + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                        }}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategy">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payoff Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Choose Your Strategy
                    </label>
                    <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="avalanche">Debt Avalanche (Highest Interest First)</SelectItem>
                        <SelectItem value="snowball">Debt Snowball (Smallest Balance First)</SelectItem>
                        <SelectItem value="custom">Custom Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      {selectedStrategy === 'avalanche' ? 'Debt Avalanche Strategy' : 
                       selectedStrategy === 'snowball' ? 'Debt Snowball Strategy' : 
                       'Custom Strategy'}
                    </h4>
                    <p className="text-sm text-blue-700">
                      {selectedStrategy === 'avalanche' ? 
                        'Pay minimums on all debts, then put extra money toward the highest interest rate debt first. This saves the most money in interest.' :
                       selectedStrategy === 'snowball' ? 
                        'Pay minimums on all debts, then put extra money toward the smallest balance first. This provides psychological wins.' :
                       'Create your own custom payoff order based on your priorities and situation.'}
                    </p>
                  </div>

                  <Button 
                    className="w-full"
                    onClick={() => toast.success('Payoff strategy updated!')}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Apply Strategy
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Strategy Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">18 months</div>
                    <div className="text-sm text-green-700">Estimated debt-free date</div>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">$24,500</div>
                    <div className="text-sm text-blue-700">Total interest savings</div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Recommended Order:</h4>
                    {mockDebts
                      .sort((a, b) => selectedStrategy === 'avalanche' ? b.interestRate - a.interestRate : a.currentBalance - b.currentBalance)
                      .slice(0, 3)
                      .map((debt, index) => (
                        <div key={debt.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">
                            {index + 1}. {debt.name}
                          </span>
                          <span className="text-sm font-medium">
                            {selectedStrategy === 'avalanche' ? `${debt.interestRate}%` : `$${debt.currentBalance.toLocaleString()}`}
                          </span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calculator">
          <Card>
            <CardHeader>
              <CardTitle>Debt Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calculator className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Debt Calculator</h3>
                <p className="text-gray-600 mb-4">Calculate payoff times, interest savings, and payment scenarios</p>
                <Button onClick={() => toast.info('Opening debt calculator...')}>
                  <Calculator className="h-4 w-4 mr-2" />
                  Open Calculator
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Payment History</h3>
                <p className="text-gray-600 mb-4">Track your debt payment history and progress over time</p>
                <Button onClick={() => toast.info('Loading payment history...')}>
                  <FileText className="h-4 w-4 mr-2" />
                  View History
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
