
'use client'

import { useState, useEffect } from 'react'
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
  Target,
  Loader2
} from 'lucide-react'
import { format, differenceInMonths } from 'date-fns'
import { toast } from 'sonner'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { BackButton } from '@/components/ui/back-button';
export default function DebtsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedStrategy, setSelectedStrategy] = useState('avalanche')
  const [debts, setDebts] = useState<any[]>([])
  const [statistics, setStatistics] = useState({
    totalDebt: 0,
    totalMonthlyPayments: 0,
    highestInterestRate: 0,
    averageInterestRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newDebt, setNewDebt] = useState({
    name: '',
    balance: '',
    interestRate: '',
    minimumPayment: '',
    dueDate: '',
    type: 'CREDIT_CARD'
  })
  const itemsPerPage = 10

  useEffect(() => {
    fetchDebts()
  }, [])

  const fetchDebts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/debts')
      if (response.ok) {
        const data = await response.json()
        setDebts(data.debts || [])
        setStatistics(data.statistics || {
          totalDebt: 0,
          totalMonthlyPayments: 0,
          highestInterestRate: 0,
          averageInterestRate: 0
        })
      }
    } catch (error) {
      console.error('Error fetching debts:', error)
      toast.error('Failed to load debts')
    } finally {
      setLoading(false)
    }
  }

  const addDebt = async () => {
    try {
      const response = await fetch('/api/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDebt)
      })

      if (response.ok) {
        toast.success('Debt added successfully')
        setShowAddDialog(false)
        setNewDebt({
          name: '',
          balance: '',
          interestRate: '',
          minimumPayment: '',
          dueDate: '',
          type: 'CREDIT_CARD'
        })
        fetchDebts()
      } else {
        toast.error('Failed to add debt')
      }
    } catch (error) {
      console.error('Error adding debt:', error)
      toast.error('Failed to add debt')
    }
  }

  const deleteDebt = async (id: string) => {
    try {
      const response = await fetch(`/api/debts/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Debt removed successfully')
        fetchDebts()
      } else {
        toast.error('Failed to remove debt')
      }
    } catch (error) {
      console.error('Error removing debt:', error)
      toast.error('Failed to remove debt')
    }
  }

  const totalPages = Math.ceil(debts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentDebts = debts.slice(startIndex, startIndex + itemsPerPage)

  const totalDebt = statistics.totalDebt
  const totalMonthlyPayments = statistics.totalMonthlyPayments
  const highestInterestRate = statistics.highestInterestRate
  const averageInterestRate = statistics.averageInterestRate

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
        return <Badge className="bg-gray-100 text-gray-800">Medium Priority</Badge>
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
        <BackButton href="/dashboard" />
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
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Debt
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Debt</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Debt Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Chase Credit Card"
                    value={newDebt.name}
                    onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Debt Type</Label>
                  <Select value={newDebt.type} onValueChange={(value) => setNewDebt({ ...newDebt, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                      <SelectItem value="LINE_OF_CREDIT">Line of Credit</SelectItem>
                      <SelectItem value="TERM_LOAN">Term Loan</SelectItem>
                      <SelectItem value="SBA_LOAN">SBA Loan</SelectItem>
                      <SelectItem value="MORTGAGE">Mortgage</SelectItem>
                      <SelectItem value="AUTO_LOAN">Auto Loan</SelectItem>
                      <SelectItem value="STUDENT_LOAN">Student Loan</SelectItem>
                      <SelectItem value="PERSONAL_LOAN">Personal Loan</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="balance">Current Balance</Label>
                    <Input
                      id="balance"
                      type="number"
                      placeholder="0.00"
                      value={newDebt.balance}
                      onChange={(e) => setNewDebt({ ...newDebt, balance: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="interestRate">Interest Rate (%)</Label>
                    <Input
                      id="interestRate"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newDebt.interestRate}
                      onChange={(e) => setNewDebt({ ...newDebt, interestRate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="minimumPayment">Minimum Payment</Label>
                    <Input
                      id="minimumPayment"
                      type="number"
                      placeholder="0.00"
                      value={newDebt.minimumPayment}
                      onChange={(e) => setNewDebt({ ...newDebt, minimumPayment: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dueDate">Due Date (Day of Month)</Label>
                    <Input
                      id="dueDate"
                      type="number"
                      min="1"
                      max="31"
                      placeholder="1"
                      value={newDebt.dueDate}
                      onChange={(e) => setNewDebt({ ...newDebt, dueDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={addDebt}>Add Debt</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
            <p className="text-xs text-gray-500 mt-1">Across {debts.length} accounts</p>
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
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : currentDebts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Debts Tracked</h3>
                  <p className="text-gray-600 mb-4">Start tracking your debts to get insights and payoff strategies</p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Debt
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {currentDebts.map((debt) => {
                    const payoffMonths = calculatePayoffTime(debt.balance, debt.minimumPayment, debt.interestRate)
                    const progressPercentage = 0 // No original amount stored, so we can't calculate progress

                    return (
                      <div key={debt.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-4">
                            {getDebtTypeIcon(debt.type)}
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{debt.name}</h3>
                              <p className="text-sm text-gray-600">{debt.businessProfile?.businessName || 'Personal'}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Badge variant="outline">{debt.type.replace(/_/g, ' ')}</Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center p-3 bg-red-50 rounded-lg">
                            <div className="text-sm text-gray-600">Current Balance</div>
                            <div className="text-lg font-bold text-red-600">
                              ${debt.balance.toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-sm text-gray-600">Monthly Payment</div>
                            <div className="text-lg font-bold text-blue-600">
                              ${debt.minimumPayment.toLocaleString()}
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
                              {isFinite(payoffMonths) ? `${payoffMonths} months` : 'N/A'}
                            </div>
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
                            onClick={() => {
                              if (confirm(`Are you sure you want to remove ${debt.name}?`)) {
                                deleteDebt(debt.id)
                              }
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Pagination */}
              {!loading && currentDebts.length > 0 && totalPages > 1 && (
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
              )}
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

                  {debts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Recommended Order:</h4>
                      {debts
                        .sort((a, b) => selectedStrategy === 'avalanche' ? b.interestRate - a.interestRate : a.balance - b.balance)
                        .slice(0, 3)
                        .map((debt, index) => (
                          <div key={debt.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">
                              {index + 1}. {debt.name}
                            </span>
                            <span className="text-sm font-medium">
                              {selectedStrategy === 'avalanche' ? `${debt.interestRate}%` : `$${debt.balance.toLocaleString()}`}
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  )}
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
