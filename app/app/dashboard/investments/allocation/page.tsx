
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Target, Plus, PieChart, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react'

interface Allocation {
  category: string
  currentValue: number
  currentPct: number
  assets: any[]
}

export default function AssetAllocationPage() {
  const { data: session } = useSession() || {}
  const [loading, setLoading] = useState(true)
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [totalValue, setTotalValue] = useState(0)
  const [summary, setSummary] = useState({
    stocks: 0,
    bonds: 0,
    realEstate: 0,
    cash: 0
  })

  useEffect(() => {
    if (session?.user?.id) {
      fetchAllocation()
    }
  }, [session?.user?.id])

  const fetchAllocation = async () => {
    try {
      const response = await fetch('/api/investments/allocation')
      if (response.ok) {
        const data = await response.json()
        setAllocations(data.allocations || [])
        setTotalValue(data.totalValue || 0)
        setSummary(data.summary || { stocks: 0, bonds: 0, realEstate: 0, cash: 0 })
      }
    } catch (error) {
      console.error('Error fetching allocation:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'stocks': return 'bg-blue-500'
      case 'bonds': return 'bg-green-500'
      case 'real estate': return 'bg-purple-500'
      case 'cash': return 'bg-teal-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Asset Allocation</h1>
          <p className="text-muted-foreground mt-1">
            Manage and optimize your investment portfolio allocation
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{allocations.length} asset classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stocks</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${summary.stocks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalValue > 0 ? ((summary.stocks / totalValue) * 100).toFixed(1) : 0}% of portfolio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bonds</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${summary.bonds.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalValue > 0 ? ((summary.bonds / totalValue) * 100).toFixed(1) : 0}% of portfolio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Real Estate & Cash</CardTitle>
            <PieChart className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ${(summary.realEstate + summary.cash).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalValue > 0 ? (((summary.realEstate + summary.cash) / totalValue) * 100).toFixed(1) : 0}% of portfolio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Allocation Details */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Allocation Breakdown</CardTitle>
          <CardDescription>
            Current allocation across different asset classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allocations.length > 0 ? (
            <div className="space-y-6">
              {allocations.map((allocation) => (
                <div key={allocation.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{allocation.category}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {allocation.assets.length} asset{allocation.assets.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${allocation.currentValue.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{allocation.currentPct.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`${getCategoryColor(allocation.category)} h-3 rounded-full transition-all`}
                      style={{ width: `${allocation.currentPct}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Asset Allocation Set</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Start by defining your target allocation across stocks, bonds, real estate, and other asset classes
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
