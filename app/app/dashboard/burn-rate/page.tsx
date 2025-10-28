
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useBusinessProfile } from '@/lib/business-profile-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, TrendingUp, TrendingDown, DollarSign, CreditCard, AlertTriangle, CheckCircle, Sparkles, RefreshCw } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface Account {
  id: string
  accountName?: string
  cardName?: string
  loanName?: string
  currentBalance: number
  creditLimit?: number
  availableCredit?: number
  interestRate?: number
  monthlyPayment?: number
  isActive: boolean
}

interface Analysis {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  summary: string
  recommendations: Array<{
    title: string
    description: string
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
    impact: string
    category: string
  }>
  actionItems: Array<{
    action: string
    timeline: string
    expectedOutcome: string
  }>
  insights: string[]
  runwayMonths?: number | null
}

interface FinancialData {
  totalCash: number
  totalCreditLimit: number
  totalCreditAvailable: number
  totalDebt: number
  monthlyExpenses: number
  monthlyRevenue: number
  burnRate: number
  runwayMonths: number | null
  analysis?: Analysis & {
    id: string
    analysisDate: string
  }
}

export default function BurnRatePage() {
  const { data: session } = useSession() || {}
  const { currentProfile } = useBusinessProfile() || {}
  const [accounts, setAccounts] = useState<{
    bankAccounts: Account[]
    creditCards: Account[]
    loans: Account[]
    homeEquity: Account[]
    lineOfCredit: Account[]
  }>({
    bankAccounts: [],
    creditCards: [],
    loans: [],
    homeEquity: [],
    lineOfCredit: [],
  })
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [accountType, setAccountType] = useState<string>('')
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    if (session?.user) {
      fetchAccounts()
      fetchLatestAnalysis()
    }
  }, [session, currentProfile])

  const fetchAccounts = async () => {
    try {
      const params = new URLSearchParams()
      if (currentProfile?.id) {
        params.append('businessProfileId', currentProfile.id)
      }
      const response = await fetch(`/api/burn-rate/accounts?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAccounts(data)
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLatestAnalysis = async () => {
    try {
      const params = new URLSearchParams()
      if (currentProfile?.id) {
        params.append('businessProfileId', currentProfile.id)
      }
      const response = await fetch(`/api/burn-rate/analyze?${params}`)
      if (response.ok) {
        const data = await response.json()
        setFinancialData(data)
      }
    } catch (error) {
      console.error('Error fetching analysis:', error)
    }
  }

  const runAnalysis = async () => {
    setAnalyzing(true)
    try {
      const response = await fetch('/api/burn-rate/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessProfileId: currentProfile?.id }),
      })

      if (response.ok) {
        const data = await response.json()
        setFinancialData(data)
        toast({
          title: 'Analysis Complete',
          description: 'Your financial outlook has been updated with AI recommendations.',
        })
      } else {
        throw new Error('Failed to analyze')
      }
    } catch (error) {
      console.error('Error running analysis:', error)
      toast({
        title: 'Analysis Failed',
        description: 'Failed to generate financial analysis. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const addAccount = async () => {
    try {
      const response = await fetch('/api/burn-rate/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          accountType,
          businessProfileId: currentProfile?.id,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Account Added',
          description: 'Your account has been added successfully.',
        })
        setDialogOpen(false)
        setFormData({})
        fetchAccounts()
      }
    } catch (error) {
      console.error('Error adding account:', error)
      toast({
        title: 'Error',
        description: 'Failed to add account.',
        variant: 'destructive',
      })
    }
  }

  const totalCash = accounts.bankAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0)
  const totalCreditAvailable = accounts.creditCards.reduce((sum, acc) => sum + (acc.availableCredit || 0), 0) +
                                accounts.lineOfCredit.reduce((sum, acc) => sum + (acc.availableCredit || 0), 0)
  const totalDebt = accounts.creditCards.reduce((sum, acc) => sum + acc.currentBalance, 0) +
                    accounts.loans.reduce((sum, acc) => sum + acc.currentBalance, 0) +
                    accounts.homeEquity.reduce((sum, acc) => sum + acc.currentBalance, 0) +
                    accounts.lineOfCredit.reduce((sum, acc) => sum + acc.currentBalance, 0)

  const getRiskColor = (level?: string) => {
    switch (level) {
      case 'LOW': return 'text-green-600'
      case 'MEDIUM': return 'text-orange-600'
      case 'HIGH': return 'text-orange-700'
      case 'CRITICAL': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getRiskBgColor = (level?: string) => {
    switch (level) {
      case 'LOW': return 'bg-green-100'
      case 'MEDIUM': return 'bg-orange-100'
      case 'HIGH': return 'bg-orange-200'
      case 'CRITICAL': return 'bg-red-100'
      default: return 'bg-gray-100'
    }
  }

  const assetDistribution = [
    { name: 'Cash', value: totalCash, color: '#10b981' },
    { name: 'Credit Available', value: totalCreditAvailable, color: '#3b82f6' },
  ]

  const debtBreakdown = [
    { name: 'Credit Cards', value: accounts.creditCards.reduce((sum, acc) => sum + acc.currentBalance, 0), color: '#f59e0b' },
    { name: 'Loans', value: accounts.loans.reduce((sum, acc) => sum + acc.currentBalance, 0), color: '#ef4444' },
    { name: 'Home Equity', value: accounts.homeEquity.reduce((sum, acc) => sum + acc.currentBalance, 0), color: '#8b5cf6' },
    { name: 'Line of Credit', value: accounts.lineOfCredit.reduce((sum, acc) => sum + acc.currentBalance, 0), color: '#ec4899' },
  ].filter(item => item.value > 0)

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Burn Rate & Financial Outlook</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive financial health analysis with AI-powered recommendations
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runAnalysis} disabled={analyzing}>
            {analyzing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Run AI Analysis
              </>
            )}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Financial Account</DialogTitle>
                <DialogDescription>
                  Add a bank account, credit card, loan, or line of credit to track your financial position.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <Select value={accountType} onValueChange={(value) => { setAccountType(value); setFormData({}); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank Account</SelectItem>
                      <SelectItem value="creditCard">Credit Card</SelectItem>
                      <SelectItem value="loan">Loan</SelectItem>
                      <SelectItem value="homeEquity">Home Equity</SelectItem>
                      <SelectItem value="lineOfCredit">Line of Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {accountType === 'bank' && (
                  <>
                    <div className="space-y-2">
                      <Label>Account Name</Label>
                      <Input
                        placeholder="e.g., Business Checking"
                        value={formData.accountName || ''}
                        onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input
                        placeholder="e.g., Chase"
                        value={formData.bankName || ''}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Type</Label>
                      <Select value={formData.accountType || ''} onValueChange={(value) => setFormData({ ...formData, accountType: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Checking">Checking</SelectItem>
                          <SelectItem value="Savings">Savings</SelectItem>
                          <SelectItem value="Money Market">Money Market</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Current Balance</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.currentBalance || ''}
                        onChange={(e) => setFormData({ ...formData, currentBalance: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </>
                )}

                {accountType === 'creditCard' && (
                  <>
                    <div className="space-y-2">
                      <Label>Card Name</Label>
                      <Input
                        placeholder="e.g., Business Visa"
                        value={formData.cardName || ''}
                        onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Issuer</Label>
                      <Input
                        placeholder="e.g., Chase"
                        value={formData.issuer || ''}
                        onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Credit Limit</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.creditLimit || ''}
                        onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Current Balance</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.currentBalance || ''}
                        onChange={(e) => setFormData({ ...formData, currentBalance: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Interest Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.interestRate || ''}
                        onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </>
                )}

                {accountType === 'loan' && (
                  <>
                    <div className="space-y-2">
                      <Label>Loan Name</Label>
                      <Input
                        placeholder="e.g., Equipment Loan"
                        value={formData.loanName || ''}
                        onChange={(e) => setFormData({ ...formData, loanName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Loan Type</Label>
                      <Select value={formData.loanType || ''} onValueChange={(value) => setFormData({ ...formData, loanType: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Business Loan">Business Loan</SelectItem>
                          <SelectItem value="Personal Loan">Personal Loan</SelectItem>
                          <SelectItem value="Auto Loan">Auto Loan</SelectItem>
                          <SelectItem value="Equipment Loan">Equipment Loan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Lender</Label>
                      <Input
                        placeholder="e.g., Bank of America"
                        value={formData.lender || ''}
                        onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Original Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.originalAmount || ''}
                        onChange={(e) => setFormData({ ...formData, originalAmount: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Current Balance</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.currentBalance || ''}
                        onChange={(e) => setFormData({ ...formData, currentBalance: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Interest Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.interestRate || ''}
                        onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Monthly Payment</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.monthlyPayment || ''}
                        onChange={(e) => setFormData({ ...formData, monthlyPayment: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </>
                )}

                {accountType === 'homeEquity' && (
                  <>
                    <div className="space-y-2">
                      <Label>Account Name</Label>
                      <Input
                        placeholder="e.g., Home Equity Line"
                        value={formData.accountName || ''}
                        onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Lender</Label>
                      <Input
                        placeholder="e.g., Wells Fargo"
                        value={formData.lender || ''}
                        onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Property Value</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.propertyValue || ''}
                        onChange={(e) => setFormData({ ...formData, propertyValue: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mortgage Balance</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.mortgageBalance || ''}
                        onChange={(e) => setFormData({ ...formData, mortgageBalance: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Available Equity</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.availableEquity || ''}
                        onChange={(e) => setFormData({ ...formData, availableEquity: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Credit Limit</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.creditLimit || ''}
                        onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </>
                )}

                {accountType === 'lineOfCredit' && (
                  <>
                    <div className="space-y-2">
                      <Label>Account Name</Label>
                      <Input
                        placeholder="e.g., Business Line of Credit"
                        value={formData.accountName || ''}
                        onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Lender</Label>
                      <Input
                        placeholder="e.g., Chase"
                        value={formData.lender || ''}
                        onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Credit Limit</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.creditLimit || ''}
                        onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Current Balance</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.currentBalance || ''}
                        onChange={(e) => setFormData({ ...formData, currentBalance: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Interest Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.interestRate || ''}
                        onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={addAccount}>Add Account</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cash</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {accounts.bankAccounts.length} {accounts.bankAccounts.length === 1 ? 'account' : 'accounts'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Credit</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${totalCreditAvailable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Credit cards & lines of credit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total outstanding debt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
            {financialData?.analysis?.riskLevel === 'LOW' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className={`h-4 w-4 ${getRiskColor(financialData?.analysis?.riskLevel)}`} />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRiskColor(financialData?.analysis?.riskLevel)}`}>
              {financialData?.analysis?.riskLevel || 'N/A'}
            </div>
            {financialData?.runwayMonths !== null && financialData?.runwayMonths !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                {financialData.runwayMonths > 0 ? `${financialData.runwayMonths.toFixed(1)} months runway` : 'Positive cash flow'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Section */}
      {financialData?.analysis && (
        <Card className={`border-2 ${getRiskBgColor(financialData.analysis.riskLevel)}`}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className={`h-5 w-5 ${getRiskColor(financialData.analysis.riskLevel)}`} />
              <CardTitle>AI Financial Analysis</CardTitle>
            </div>
            <CardDescription>
              Generated on {new Date(financialData.analysis.analysisDate).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Summary</h4>
              <p className="text-sm text-muted-foreground">{financialData.analysis.summary}</p>
            </div>

            {financialData.analysis.insights && financialData.analysis.insights.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Key Insights</h4>
                <ul className="list-disc list-inside space-y-1">
                  {financialData.analysis.insights.map((insight, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">{insight}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asset Distribution</CardTitle>
            <CardDescription>Available financial resources</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assetDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }: any) => `${name}: $${value.toLocaleString()}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {assetDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debt Breakdown</CardTitle>
            <CardDescription>Outstanding liabilities by type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={debtBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                <Bar dataKey="value" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {financialData?.analysis?.recommendations && financialData.analysis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AI Recommendations</CardTitle>
            <CardDescription>Strategic actions to improve your financial position</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {financialData.analysis.recommendations.map((rec, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{rec.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      rec.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                      rec.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                  <div className="text-sm">
                    <span className="font-medium">Expected Impact:</span> {rec.impact}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Items */}
      {financialData?.analysis?.actionItems && financialData.analysis.actionItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Action Items</CardTitle>
            <CardDescription>Specific steps to take for financial health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {financialData.analysis.actionItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{item.action}</p>
                    <p className="text-sm text-muted-foreground">Timeline: {item.timeline}</p>
                    <p className="text-sm text-muted-foreground">Expected: {item.expectedOutcome}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Details Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>View and manage all your financial accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bank" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="bank">Bank Accounts</TabsTrigger>
              <TabsTrigger value="credit">Credit Cards</TabsTrigger>
              <TabsTrigger value="loans">Loans</TabsTrigger>
              <TabsTrigger value="equity">Home Equity</TabsTrigger>
              <TabsTrigger value="loc">Lines of Credit</TabsTrigger>
            </TabsList>

            <TabsContent value="bank" className="space-y-4">
              {accounts.bankAccounts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No bank accounts added yet</p>
              ) : (
                accounts.bankAccounts.map((account) => (
                  <div key={account.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{account.accountName}</h4>
                        <p className="text-sm text-muted-foreground">{(account as any).bankName} - {(account as any).accountType}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          ${account.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="credit" className="space-y-4">
              {accounts.creditCards.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No credit cards added yet</p>
              ) : (
                accounts.creditCards.map((account) => (
                  <div key={account.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{account.cardName}</h4>
                        <p className="text-sm text-muted-foreground">{(account as any).issuer}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">
                          ${account.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          of ${account.creditLimit?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{ width: `${((account.currentBalance / (account.creditLimit || 1)) * 100).toFixed(0)}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Available: ${account.availableCredit?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="loans" className="space-y-4">
              {accounts.loans.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No loans added yet</p>
              ) : (
                accounts.loans.map((account) => (
                  <div key={account.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{account.loanName}</h4>
                        <p className="text-sm text-muted-foreground">{(account as any).loanType} - {(account as any).lender}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-600">
                          ${account.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${account.monthlyPayment?.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo
                        </p>
                      </div>
                    </div>
                    {account.interestRate && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Interest Rate: {account.interestRate}%
                      </p>
                    )}
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="equity" className="space-y-4">
              {accounts.homeEquity.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No home equity accounts added yet</p>
              ) : (
                accounts.homeEquity.map((account) => (
                  <div key={account.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{account.accountName}</h4>
                        <p className="text-sm text-muted-foreground">{(account as any).lender}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-600">
                          ${(account as any).availableEquity?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-muted-foreground">Available Equity</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="loc" className="space-y-4">
              {accounts.lineOfCredit.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No lines of credit added yet</p>
              ) : (
                accounts.lineOfCredit.map((account) => (
                  <div key={account.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{account.accountName}</h4>
                        <p className="text-sm text-muted-foreground">{(account as any).lender}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">
                          ${account.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          of ${account.creditLimit?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${((account.currentBalance / (account.creditLimit || 1)) * 100).toFixed(0)}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Available: ${account.availableCredit?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
