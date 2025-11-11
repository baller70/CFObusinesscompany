
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TrendingUp, TrendingDown, BarChart3, DollarSign, Activity } from 'lucide-react'

import { BackButton } from '@/components/ui/back-button';
interface Investment {
  id: string
  name: string
  symbol?: string
  currentValue: number
  originalCost: number
  totalReturn?: number
  totalReturnPct?: number
  type: string
}

export default function PerformanceAnalyticsPage() {
  const { data: session } = useSession() || {}
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    totalValue: 0,
    totalCost: 0,
    totalReturn: 0,
    totalReturnPct: 0,
    investmentCount: 0
  })
  const [topPerformers, setTopPerformers] = useState<Investment[]>([])
  const [bottomPerformers, setBottomPerformers] = useState<Investment[]>([])
  const [performanceByType, setPerformanceByType] = useState<any[]>([])

  useEffect(() => {
    if (session?.user?.id) {
      fetchAnalytics()
    }
  }, [session?.user?.id])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/investments/analytics')
      if (response.ok) {
        const data = await response.json()
        setSummary(data.summary || {})
        setTopPerformers(data.topPerformers || [])
        setBottomPerformers(data.bottomPerformers || [])
        setPerformanceByType(data.performanceByType || [])
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <BackButton href="/dashboard" />
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Performance Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Track and analyze your investment performance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${summary.totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.investmentCount} investment{summary.investmentCount !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Original investment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Return</CardTitle>
            {summary.totalReturn >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${summary.totalReturn.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.totalReturnPct.toFixed(2)}% return
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.totalReturnPct.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Overall return rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Investment Type</CardTitle>
          <CardDescription>
            Compare returns across different investment categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          {performanceByType.length > 0 ? (
            <div className="space-y-4">
              {performanceByType.map((type) => (
                <div key={type.type} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{type.type}</div>
                    <div className="text-sm text-muted-foreground">{type.count} holdings</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${type.totalValue.toLocaleString()}</div>
                    <div className={`text-sm ${type.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {type.totalReturn >= 0 ? '+' : ''}${type.totalReturn.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No performance data available</p>
          )}
        </CardContent>
      </Card>

      {/* Top and Bottom Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Top Performers
            </CardTitle>
            <CardDescription>Best performing investments</CardDescription>
          </CardHeader>
          <CardContent>
            {topPerformers.length > 0 ? (
              <div className="space-y-3">
                {topPerformers.map((inv, index) => (
                  <div key={inv.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="font-medium">{inv.name}</div>
                      <div className="text-sm text-muted-foreground">{inv.symbol || inv.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        +{(inv.totalReturnPct || 0).toFixed(2)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${inv.currentValue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              Needs Attention
            </CardTitle>
            <CardDescription>Lower performing investments</CardDescription>
          </CardHeader>
          <CardContent>
            {bottomPerformers.length > 0 ? (
              <div className="space-y-3">
                {bottomPerformers.map((inv, index) => (
                  <div key={inv.id} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <div>
                      <div className="font-medium">{inv.name}</div>
                      <div className="text-sm text-muted-foreground">{inv.symbol || inv.type}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${(inv.totalReturnPct || 0) < 0 ? 'text-red-600' : 'text-orange-600'}`}>
                        {(inv.totalReturnPct || 0) >= 0 ? '+' : ''}{(inv.totalReturnPct || 0).toFixed(2)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${inv.currentValue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
