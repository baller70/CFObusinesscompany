
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  Calculator,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

interface FinancialMetrics {
  monthlyIncome?: number | null
  monthlyExpenses?: number | null
  monthlyBurnRate?: number | null
  totalDebt?: number | null
  totalAssets?: number | null
  netWorth?: number | null
  emergencyFundGoal?: number | null
  debtToIncomeRatio?: number | null
}

interface FinancialOverviewProps {
  metrics: FinancialMetrics | null
  userId: string
}

export function FinancialOverview({ metrics, userId }: FinancialOverviewProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [localMetrics, setLocalMetrics] = useState<FinancialMetrics | null>(metrics)
  const router = useRouter()

  // Update local metrics when props change
  useEffect(() => {
    setLocalMetrics(metrics)
  }, [metrics])

  const refreshMetrics = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/financial-metrics/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      
      if (response.ok) {
        // Fetch updated metrics
        const metricsResponse = await fetch('/api/financial-metrics')
        if (metricsResponse.ok) {
          const updatedMetrics = await metricsResponse.json()
          setLocalMetrics(updatedMetrics)
          toast.success('Metrics refreshed successfully')
        } else {
          toast.error('Failed to fetch updated metrics')
        }
      } else {
        toast.error('Failed to calculate metrics')
      }
    } catch (error) {
      console.error('Failed to refresh metrics:', error)
      toast.error('Failed to refresh metrics')
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '$0.00'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const calculateBurnRateMonths = () => {
    if (!localMetrics?.totalAssets || !localMetrics?.monthlyBurnRate || localMetrics.monthlyBurnRate <= 0) {
      return null
    }
    return Math.floor(localMetrics.totalAssets / localMetrics.monthlyBurnRate)
  }

  const burnRateMonths = calculateBurnRateMonths()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Financial Overview</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshMetrics}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Calculating...' : 'Refresh'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Monthly Income */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{formatCurrency(localMetrics?.monthlyIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average over last 3 months
            </p>
          </CardContent>
        </Card>

        {/* Monthly Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -{formatCurrency(localMetrics?.monthlyExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average over last 3 months
            </p>
          </CardContent>
        </Card>

        {/* Net Worth */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(localMetrics?.netWorth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(localMetrics?.netWorth)}
            </div>
            <p className="text-xs text-muted-foreground">
              Assets minus debts
            </p>
          </CardContent>
        </Card>

        {/* Burn Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Burn Rate</CardTitle>
            <Calculator className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {burnRateMonths ? `${burnRateMonths} mo` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              At current spending rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Debt to Income Ratio */}
      {localMetrics?.debtToIncomeRatio && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Debt-to-Income Ratio</CardTitle>
              {(localMetrics.debtToIncomeRatio || 0) > 0.4 && (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current Ratio</span>
                <span className={`font-medium ${(localMetrics.debtToIncomeRatio || 0) > 0.4 ? 'text-red-600' : 'text-green-600'}`}>
                  {((localMetrics.debtToIncomeRatio || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={(localMetrics.debtToIncomeRatio || 0) * 100} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {(localMetrics.debtToIncomeRatio || 0) > 0.4 
                  ? 'High debt ratio - consider debt reduction strategies'
                  : 'Healthy debt ratio - keep it up!'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
