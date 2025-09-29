
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingDown,
  Calculator,
  Target,
  Clock,
  DollarSign,
  CheckCircle,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { DebtReductionPlan } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

export function DebtReductionPlanner() {
  const [plan, setPlan] = useState<DebtReductionPlan | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [strategy, setStrategy] = useState<'SNOWBALL' | 'AVALANCHE'>('AVALANCHE')
  const [extraPayment, setExtraPayment] = useState(0)
  const { toast } = useToast()

  const generatePlan = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/debt-reduction-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strategy,
          extraMonthlyPayment: extraPayment
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate debt reduction plan')
      }

      const data = await response.json()
      
      if (data.plan === null) {
        toast({
          title: 'No Debts Found',
          description: data.message,
          variant: 'default'
        })
        return
      }

      setPlan(data)
    } catch (error) {
      console.error('Debt plan error:', error)
      toast({
        title: 'Plan Generation Failed',
        description: 'Unable to create debt reduction plan. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStrategyDescription = (strategy: string) => {
    switch (strategy) {
      case 'SNOWBALL':
        return 'Pay off smallest debts first for psychological wins'
      case 'AVALANCHE':
        return 'Pay off highest interest debts first to save money'
      default:
        return 'Optimized hybrid approach'
    }
  }

  const getStrategyBadgeColor = (strategy: string) => {
    switch (strategy) {
      case 'SNOWBALL':
        return 'bg-green-500'
      case 'AVALANCHE':
        return 'bg-blue-500'
      default:
        return 'bg-purple-500'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-red-600" />
          Debt Reduction Planner
        </CardTitle>
        <CardDescription>
          AI-powered debt reduction strategy to get you out of debt faster
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!plan ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="strategy">Debt Strategy</Label>
                <Select value={strategy} onValueChange={(value: 'SNOWBALL' | 'AVALANCHE') => setStrategy(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVALANCHE">Avalanche (Save More Money)</SelectItem>
                    <SelectItem value="SNOWBALL">Snowball (Quick Wins)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {getStrategyDescription(strategy)}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="extra-payment">Extra Monthly Payment</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="extra-payment"
                    type="number"
                    min="0"
                    step="50"
                    value={extraPayment}
                    onChange={(e) => setExtraPayment(Number(e.target.value))}
                    placeholder="0"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Additional amount to pay towards debt each month
                </p>
              </div>
            </div>

            <Button onClick={generatePlan} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Generate Debt Reduction Plan
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Plan Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {plan.payoffTimeline}
                </div>
                <div className="text-sm text-blue-800">months to debt freedom</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  ${plan.totalInterestSaved.toLocaleString()}
                </div>
                <div className="text-sm text-green-800">total interest saved</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">
                  ${plan.monthlyPayment.toLocaleString()}
                </div>
                <div className="text-sm text-purple-800">monthly payment</div>
              </div>
            </div>

            {/* Strategy Badge */}
            <div className="flex justify-center">
              <Badge className={`${getStrategyBadgeColor(plan.strategy)} text-white px-4 py-2`}>
                {plan.strategy} STRATEGY
              </Badge>
            </div>

            {/* Debt Payoff Order */}
            <div>
              <h4 className="font-semibold text-sm text-gray-900 mb-3">Payoff Order</h4>
              <div className="space-y-2">
                {plan.debtOrder.map((debt, index) => (
                  <div key={debt.debtId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{debt.debtName}</div>
                        <div className="text-xs text-gray-500">
                          ${debt.balance.toLocaleString()} at {debt.interestRate}% APR
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{debt.estimatedPayoffMonths} months</div>
                      <div className="text-xs text-gray-500">Min: ${debt.minimumPayment}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Milestones */}
            {plan.milestones && plan.milestones.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-gray-900 mb-3">Key Milestones</h4>
                <div className="space-y-2">
                  {plan.milestones.slice(0, 6).map((milestone, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <CheckCircle className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Month {milestone.month}</div>
                        <div className="text-xs text-gray-600">{milestone.description}</div>
                      </div>
                      <div className="text-sm text-gray-500">
                        ${milestone.remainingDebt.toLocaleString()} left
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {(plan as any).recommendations && (plan as any).recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-gray-900 mb-3">CFO Recommendations</h4>
                <div className="space-y-2">
                  {(plan as any).recommendations.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                      <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span className="text-sm text-blue-900">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Visualization */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Debt Progress</span>
                <span>${plan.totalDebt.toLocaleString()} total debt</span>
              </div>
              <Progress value={0} className="h-2" />
              <div className="text-xs text-gray-500 text-center">
                Start your journey to debt freedom today!
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setPlan(null)} variant="outline" className="flex-1">
                Generate New Plan
              </Button>
              <Button className="flex-1">
                Start This Plan
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
