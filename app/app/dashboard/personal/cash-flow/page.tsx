
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, TrendingUp, TrendingDown } from 'lucide-react'

export default function CashFlowPage() {
  const [forecast, setForecast] = useState([])
  const [summary, setSummary] = useState({
    projectedIncome: 0,
    projectedExpenses: 0,
    netCashFlow: 0
  })

  useEffect(() => {
    fetchForecast()
  }, [])

  const fetchForecast = async () => {
    try {
      const response = await fetch('/api/personal/cash-flow')
      if (response.ok) {
        const data = await response.json()
        setForecast(data.forecast || [])
        setSummary(data.summary || { projectedIncome: 0, projectedExpenses: 0, netCashFlow: 0 })
      }
    } catch (error) {
      console.error('Error fetching cash flow:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cash Flow Forecast</h1>
        <p className="text-muted-foreground">Predict your future cash position</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${summary.projectedIncome.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${summary.projectedExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${summary.netCashFlow.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Forecast Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {forecast.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No forecast data available</p>
              <p className="text-sm text-muted-foreground mt-2">Add income and expenses to generate forecast</p>
            </div>
          ) : (
            <div className="space-y-4">
              {forecast.map((period: any) => (
                <div key={period.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{period.period}</p>
                      <p className="text-sm text-muted-foreground">{period.periodType}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${period.projectedCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${period.projectedCashFlow.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Net Cash Flow</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
