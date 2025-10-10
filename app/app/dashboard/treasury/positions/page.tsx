
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Landmark, 
  Plus,
  Activity,
  Shield,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Banknote,
  PieChart
} from 'lucide-react'

interface CashPosition {
  id: string
  accountName: string
  accountType: string
  bankName?: string
  currentBalance: number
  availableBalance?: number
  currency: string
  interestRate?: number
  monthlyFees?: number
  minimumBalance?: number
  targetBalance?: number
  fdic: boolean
  riskRating: string
  isActive: boolean
  lastReconciled?: string
  notes?: string
  createdAt: string
  updatedAt: string
  cashFlows: any[]
}

interface CashSummary {
  totalCash: number
  totalAvailable: number
  totalAccounts: number
  interestEarningAccounts: number
  monthlyFees: number
  fdieInsured: number
}

export default function TreasuryPositionsPage() {
  const { data: session } = useSession() || {}
  const [cashPositions, setCashPositions] = useState<CashPosition[]>([])
  const [summary, setSummary] = useState<CashSummary>({
    totalCash: 0,
    totalAvailable: 0,
    totalAccounts: 0,
    interestEarningAccounts: 0,
    monthlyFees: 0,
    fdieInsured: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetchCashPositions()
    }
  }, [session?.user?.id])

  const fetchCashPositions = async () => {
    try {
      const response = await fetch('/api/premium-features/treasury/positions')
      if (response.ok) {
        const data = await response.json()
        setCashPositions(data.cashPositions || [])
        setSummary(data.summary || {
          totalCash: 0,
          totalAvailable: 0,
          totalAccounts: 0,
          interestEarningAccounts: 0,
          monthlyFees: 0,
          fdieInsured: 0
        })
      }
    } catch (error) {
      console.error('Error fetching cash positions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'CHECKING': return 'bg-blue-100 text-blue-800'
      case 'SAVINGS': return 'bg-green-100 text-green-800'
      case 'MONEY_MARKET': return 'bg-purple-100 text-purple-800'
      case 'CD': return 'bg-orange-100 text-orange-800'
      case 'TREASURY': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskColor = (rating: string) => {
    switch (rating) {
      case 'LOW': return 'bg-green-100 text-green-800'
      case 'MEDIUM': return 'bg-gray-100 text-gray-800'
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'CRITICAL': return 'bg-red-200 text-red-900'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getUtilizationPercentage = (current: number, target?: number, min?: number) => {
    if (target && current > 0) {
      return (current / target) * 100
    }
    if (min && current > 0) {
      return Math.min(100, (current / min) * 100)
    }
    return 0
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-background p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-background p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-heading text-foreground mb-3">
            Cash Position Management
          </h1>
          <p className="text-body text-muted-foreground">
            Monitor and optimize your cash positions across all accounts
          </p>
        </div>
        <Button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card className="card-premium-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-small text-muted-foreground font-medium flex items-center gap-2">
              <Banknote className="h-4 w-4 text-primary" />
              Total Cash
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-financial-large text-foreground mb-2">
              ${summary.totalCash.toLocaleString()}
            </div>
            <p className="text-small text-muted-foreground">
              Across {summary.totalAccounts} accounts
            </p>
          </CardContent>
        </Card>

        <Card className="card-premium-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-small text-muted-foreground font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-success" />
              Available Cash
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-financial-large text-success mb-2">
              ${summary.totalAvailable.toLocaleString()}
            </div>
            <p className="text-small text-muted-foreground">
              Ready for use
            </p>
          </CardContent>
        </Card>

        <Card className="card-premium-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-small text-muted-foreground font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Interest Earning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-financial-large text-foreground mb-2">
              {summary.interestEarningAccounts}
            </div>
            <p className="text-small text-muted-foreground">
              Of {summary.totalAccounts} accounts
            </p>
          </CardContent>
        </Card>

        <Card className="card-premium-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-small text-muted-foreground font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              FDIC Insured
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-financial-large text-foreground mb-2">
              {summary.fdieInsured}
            </div>
            <p className="text-small text-muted-foreground">
              Protected accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Positions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cashPositions.map((position) => (
          <Card key={position.id} className="card-premium-elevated">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-body-large text-foreground mb-2">
                    {position.accountName}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge className={`${getAccountTypeColor(position.accountType)} text-xs`}>
                      {position.accountType.replace('_', ' ')}
                    </Badge>
                    <Badge className={`${getRiskColor(position.riskRating)} text-xs`}>
                      {position.riskRating} Risk
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {position.fdic && <Shield className="h-4 w-4 text-green-500" />}
                  {position.interestRate && position.interestRate > 0 && (
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Balance Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-small text-muted-foreground">Current Balance</div>
                  <div className="text-financial text-foreground">
                    ${position.currentBalance.toLocaleString()}
                  </div>
                </div>
                {position.availableBalance && (
                  <div>
                    <div className="text-small text-muted-foreground">Available</div>
                    <div className="text-financial text-success">
                      ${position.availableBalance.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Bank Information */}
              {position.bankName && (
                <div>
                  <div className="text-small text-muted-foreground">Bank</div>
                  <div className="text-body text-foreground">{position.bankName}</div>
                </div>
              )}

              {/* Interest and Fees */}
              {(position.interestRate || position.monthlyFees) && (
                <div className="grid grid-cols-2 gap-4">
                  {position.interestRate && (
                    <div>
                      <div className="text-small text-muted-foreground">Interest Rate</div>
                      <div className="text-body text-foreground">
                        {position.interestRate.toFixed(2)}%
                      </div>
                    </div>
                  )}
                  {position.monthlyFees && (
                    <div>
                      <div className="text-small text-muted-foreground">Monthly Fees</div>
                      <div className="text-body text-red-600">
                        ${position.monthlyFees.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Balance Targets */}
              {(position.targetBalance || position.minimumBalance) && (
                <div className="space-y-2">
                  {position.targetBalance && (
                    <div>
                      <div className="flex justify-between text-small text-muted-foreground mb-1">
                        <span>Target Balance</span>
                        <span>${position.targetBalance.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, getUtilizationPercentage(position.currentBalance, position.targetBalance))}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  {position.minimumBalance && (
                    <div>
                      <div className="flex justify-between text-small text-muted-foreground">
                        <span>Minimum Balance</span>
                        <span>${position.minimumBalance.toLocaleString()}</span>
                      </div>
                      {position.currentBalance < position.minimumBalance && (
                        <div className="flex items-center gap-1 text-small text-red-600 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          Below minimum
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Recent Activity */}
              {position.cashFlows && position.cashFlows.length > 0 && (
                <div>
                  <div className="text-small text-muted-foreground mb-2">Recent Activity</div>
                  <div className="space-y-1">
                    {position.cashFlows.slice(0, 3).map((flow: any, index: number) => (
                      <div key={index} className="flex justify-between text-small">
                        <span className="text-muted-foreground truncate">
                          {flow.description}
                        </span>
                        <span className={flow.type === 'INFLOW' ? 'text-green-600' : 'text-red-600'}>
                          {flow.type === 'INFLOW' ? '+' : '-'}${Math.abs(flow.amount).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-muted">
                <Button variant="outline" size="sm" className="flex-1">
                  <Activity className="h-3 w-3 mr-1" />
                  Reconcile
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <PieChart className="h-3 w-3 mr-1" />
                  Analyze
                </Button>
              </div>

              {position.notes && (
                <p className="text-small text-muted-foreground pt-2 border-t border-muted">
                  {position.notes}
                </p>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Empty State */}
        {cashPositions.length === 0 && (
          <Card className="card-premium-elevated border-dashed border-2 hover:border-primary transition-colors cursor-pointer lg:col-span-2">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Landmark className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-body-large font-medium text-foreground mb-2">
                Add Your First Cash Account
              </h3>
              <p className="text-body text-muted-foreground text-center mb-4">
                Start managing your cash positions with advanced treasury management tools
              </p>
              <Button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Cash Account
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Alerts Section */}
      {cashPositions.some(p => (p.minimumBalance && p.currentBalance < p.minimumBalance) || 
                              (p.monthlyFees && p.monthlyFees > 0)) && (
        <Card className="card-premium-elevated mt-10 border-gray-200 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-body-large text-gray-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Cash Position Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cashPositions
                .filter(p => p.minimumBalance && p.currentBalance < p.minimumBalance)
                .map(position => (
                  <div key={position.id} className="text-small text-gray-700">
                    • Account "{position.accountName}" is below minimum balance
                  </div>
                ))}
              {summary.monthlyFees > 1000 && (
                <div className="text-small text-gray-700">
                  • High monthly fees detected: ${summary.monthlyFees.toLocaleString()}/month
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
