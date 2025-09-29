
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Target, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  type: string
  targetDate: Date | null
}

interface Debt {
  id: string
  name: string
  balance: number
  interestRate: number
  minimumPayment: number
}

interface ProgressSectionProps {
  goals: Goal[]
  debts: Debt[]
}

export function ProgressSection({ goals, debts }: ProgressSectionProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const calculateProgress = (current: number, target: number) => {
    if (target <= 0) return 0
    return Math.min((current / target) * 100, 100)
  }

  const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0)
  const emergencyFundGoal = goals.find(goal => goal.type === 'EMERGENCY_FUND')

  return (
    <div className="space-y-6">
      {/* Goals Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Goal Progress
              </CardTitle>
              <CardDescription>
                Track your financial milestones
              </CardDescription>
            </div>
            <Link href="/dashboard/goals">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="text-center py-6">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-3">No goals set yet</p>
              <Link href="/dashboard/goals/new">
                <Button size="sm">Set Your First Goal</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.slice(0, 3).map((goal) => {
                const progress = calculateProgress(goal.currentAmount, goal.targetAmount)
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{goal.name}</span>
                      <span className="text-gray-500">
                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-gray-500">
                      {progress.toFixed(1)}% complete
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debt Overview */}
      {totalDebt > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Debt Overview
            </CardTitle>
            <CardDescription>
              Your debt reduction progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalDebt)}
                </p>
                <p className="text-sm text-gray-500">Total Debt</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Highest Interest Debts</h4>
                {debts
                  .sort((a, b) => b.interestRate - a.interestRate)
                  .slice(0, 3)
                  .map((debt) => (
                    <div key={debt.id} className="flex justify-between text-sm">
                      <span className="truncate">{debt.name}</span>
                      <span className="text-red-600 font-medium">
                        {debt.interestRate.toFixed(1)}% APR
                      </span>
                    </div>
                  ))
                }
              </div>
              
              <Link href="/dashboard/debts">
                <Button className="w-full" size="sm">
                  Create Payoff Plan
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency Fund Quick Check */}
      {emergencyFundGoal && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Emergency Fund</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress 
                value={calculateProgress(emergencyFundGoal.currentAmount, emergencyFundGoal.targetAmount)} 
                className="h-2" 
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatCurrency(emergencyFundGoal.currentAmount)}</span>
                <span>{formatCurrency(emergencyFundGoal.targetAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
