
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Shield, TrendingUp, Calendar } from 'lucide-react'

import { BackButton } from '@/components/ui/back-button';
export default function EmergencyFundPage() {
  const [fundData, setFundData] = useState({
    currentAmount: 0,
    targetAmount: 0,
    monthlyExpenses: 0,
    monthsCovered: 0,
    progress: 0
  })

  useEffect(() => {
    fetchFundData()
  }, [])

  const fetchFundData = async () => {
    try {
      const response = await fetch('/api/personal/emergency-fund')
      if (response.ok) {
        const data = await response.json()
        setFundData(data)
      }
    } catch (error) {
      console.error('Error fetching emergency fund:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Emergency Fund Tracker</h1>
          <p className="text-muted-foreground">Build your financial safety net</p>
        </div>
        <Button>Update Fund</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BackButton href="/dashboard/personal" />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Savings</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${fundData.currentAmount.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${fundData.targetAmount.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Months Covered</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{fundData.monthsCovered.toFixed(1)} months</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress to Goal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={fundData.progress} className="h-4" />
          <div className="flex justify-between text-sm">
            <span>${fundData.currentAmount.toLocaleString()}</span>
            <span className="font-medium">{fundData.progress.toFixed(1)}%</span>
            <span>${fundData.targetAmount.toLocaleString()}</span>
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900">Recommended: 3-6 months of expenses</p>
            <p className="text-xs text-blue-700 mt-1">Monthly expenses: ${fundData.monthlyExpenses.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
