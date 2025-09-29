import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Target, TrendingUp, TrendingDown, Calendar, DollarSign, CheckCircle, AlertCircle, Clock, Trophy } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { GoalActionButtons } from '@/components/goals/goals-client'
import Link from 'next/link'

async function getGoalsData(userId: string) {
  const [goals, goalStats] = await Promise.all([
    Promise.resolve([]),
    Promise.resolve([])
  ])

  return { goals, goalStats }
}

export default async function GoalsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const { goals, goalStats } = await getGoalsData(session.user.id)

  // Mock data for demonstration
  const mockGoals = [
    {
      id: '1',
      title: 'Emergency Fund Target',
      description: 'Build emergency fund equivalent to 6 months of operating expenses',
      type: 'SAVINGS',
      targetAmount: 150000,
      currentAmount: 85000,
      targetDate: new Date('2024-12-31'),
      createdAt: new Date('2024-01-01'),
      status: 'IN_PROGRESS',
      category: 'Emergency Fund',
      priority: 'HIGH',
      isRecurring: false,
      milestones: [
        { name: '25%', amount: 37500, completed: true, date: new Date('2024-03-15') },
        { name: '50%', amount: 75000, completed: true, date: new Date('2024-07-20') },
        { name: '75%', amount: 112500, completed: false, date: null },
        { name: '100%', amount: 150000, completed: false, date: null }
      ]
    },
    {
      id: '2',
      title: 'Reduce Operating Expenses',
      description: 'Cut monthly operating costs by 15% through efficiency improvements',
      type: 'EXPENSE_REDUCTION',
      targetAmount: 8000,
      currentAmount: 4800,
      targetDate: new Date('2024-11-30'),
      createdAt: new Date('2024-08-01'),
      status: 'IN_PROGRESS',
      category: 'Cost Optimization',
      priority: 'HIGH',
      isRecurring: false,
      milestones: [
        { name: 'Process Audit', amount: 2000, completed: true, date: new Date('2024-08-15') },
        { name: 'Technology Upgrade', amount: 4800, completed: true, date: new Date('2024-10-01') },
        { name: 'Final Target', amount: 8000, completed: false, date: null }
      ]
    },
    {
      id: '3',
      title: 'Revenue Growth Target',
      description: 'Increase quarterly revenue by 25% compared to previous year',
      type: 'REVENUE',
      targetAmount: 500000,
      currentAmount: 420000,
      targetDate: new Date('2024-12-31'),
      createdAt: new Date('2024-01-01'),
      status: 'IN_PROGRESS',
      category: 'Revenue Growth',
      priority: 'HIGH',
      isRecurring: false,
      milestones: [
        { name: 'Q1 Target', amount: 125000, completed: true, date: new Date('2024-03-31') },
        { name: 'Q2 Target', amount: 250000, completed: true, date: new Date('2024-06-30') },
        { name: 'Q3 Target', amount: 375000, completed: true, date: new Date('2024-09-30') },
        { name: 'Q4 Target', amount: 500000, completed: false, date: null }
      ]
    },
    {
      id: '4',
      title: 'Equipment Upgrade Fund',
      description: 'Save for new office equipment and technology upgrades',
      type: 'SAVINGS',
      targetAmount: 50000,
      currentAmount: 32000,
      targetDate: new Date('2025-03-31'),
      createdAt: new Date('2024-10-01'),
      status: 'IN_PROGRESS',
      category: 'Capital Expenditure',
      priority: 'MEDIUM',
      isRecurring: false,
      milestones: [
        { name: 'Initial Target', amount: 25000, completed: true, date: new Date('2024-11-15') },
        { name: 'Mid-point', amount: 37500, completed: false, date: null },
        { name: 'Final Target', amount: 50000, completed: false, date: null }
      ]
    },
    {
      id: '5',
      title: 'Debt Reduction Plan',
      description: 'Pay down business line of credit completely',
      type: 'DEBT_REDUCTION',
      targetAmount: 75000,
      currentAmount: 25000,
      targetDate: new Date('2025-06-30'),
      createdAt: new Date('2024-01-01'),
      status: 'IN_PROGRESS',
      category: 'Debt Management',
      priority: 'HIGH',
      isRecurring: false,
      milestones: [
        { name: 'First 25%', amount: 18750, completed: true, date: new Date('2024-04-01') },
        { name: 'Halfway Point', amount: 37500, completed: false, date: null },
        { name: 'Final Payment', amount: 75000, completed: false, date: null }
      ]
    },
    {
      id: '6',
      title: 'Monthly Cash Flow Stability',
      description: 'Maintain positive cash flow for 12 consecutive months',
      type: 'CASH_FLOW',
      targetAmount: 12,
      currentAmount: 8,
      targetDate: new Date('2025-01-31'),
      createdAt: new Date('2024-02-01'),
      status: 'IN_PROGRESS',
      category: 'Cash Management',
      priority: 'HIGH',
      isRecurring: true,
      milestones: [
        { name: '6 Months', amount: 6, completed: true, date: new Date('2024-08-01') },
        { name: '9 Months', amount: 9, completed: false, date: null },
        { name: '12 Months', amount: 12, completed: false, date: null }
      ]
    }
  ]

  const inProgressGoals = mockGoals.filter(g => g.status === 'IN_PROGRESS').length
  const completedGoals = mockGoals.filter(g => g.status === 'COMPLETED').length
  const overDueGoals = mockGoals.filter(g => 
    g.status === 'IN_PROGRESS' && new Date(g.targetDate) < new Date()
  ).length

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return <Clock className="h-4 w-4" />
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />
      case 'PAUSED': return <AlertCircle className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'secondary'
      case 'COMPLETED': return 'default'
      case 'PAUSED': return 'destructive'
      default: return 'outline'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SAVINGS': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'REVENUE': return <DollarSign className="h-4 w-4 text-blue-600" />
      case 'EXPENSE_REDUCTION': return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'DEBT_REDUCTION': return <TrendingDown className="h-4 w-4 text-orange-600" />
      case 'CASH_FLOW': return <Target className="h-4 w-4 text-purple-600" />
      default: return <Target className="h-4 w-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Goals</h1>
          <p className="text-gray-600 mt-1">Set, track, and achieve your financial objectives</p>
        </div>
        <Link href="/dashboard/goals/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Goal
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressGoals}</div>
            <p className="text-xs text-gray-500 mt-1">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Trophy className="h-5 w-5 text-green-500 mr-2" />
              <div className="text-2xl font-bold text-green-600">{completedGoals}</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Successfully achieved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <div className="text-2xl font-bold text-red-600">{overDueGoals}</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Past target date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{mockGoals.length}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active Goals</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="savings">Savings</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="all">All Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="space-y-6">
            {mockGoals.filter(goal => goal.status === 'IN_PROGRESS').map((goal) => {
              const progressPercentage = getProgressPercentage(goal.currentAmount, goal.targetAmount)
              const daysRemaining = differenceInDays(goal.targetDate, new Date())
              const completedMilestones = goal.milestones.filter(m => m.completed).length

              return (
                <Card key={goal.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getTypeIcon(goal.type)}
                          <h3 className="text-xl font-semibold text-gray-900">{goal.title}</h3>
                          <Badge variant={getStatusColor(goal.status)}>
                            {getStatusIcon(goal.status)}
                            <span className="ml-1">{goal.status.replace('_', ' ')}</span>
                          </Badge>
                          <Badge className={getPriorityColor(goal.priority)}>
                            {goal.priority}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm">{goal.description}</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-6">
                      {/* Progress Section */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Progress</span>
                          <span className="text-sm font-bold text-gray-900">
                            {progressPercentage.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={progressPercentage} className="h-3" />
                        <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                          <span>
                            {goal.type === 'CASH_FLOW' ? 
                              `${goal.currentAmount} months` : 
                              `$${goal.currentAmount.toLocaleString()}`
                            }
                          </span>
                          <span>
                            {goal.type === 'CASH_FLOW' ? 
                              `${goal.targetAmount} months` : 
                              `$${goal.targetAmount.toLocaleString()}`
                            }
                          </span>
                        </div>
                      </div>

                      {/* Key Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm text-gray-600">Target Date</div>
                          <div className="font-semibold text-gray-900">
                            {format(goal.targetDate, 'MMM d, yyyy')}
                          </div>
                          <div className={`text-xs ${daysRemaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {daysRemaining > 0 ? `${daysRemaining} days left` : `${Math.abs(daysRemaining)} days overdue`}
                          </div>
                        </div>

                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-sm text-gray-600">Remaining</div>
                          <div className="font-semibold text-gray-900">
                            {goal.type === 'CASH_FLOW' ? 
                              `${goal.targetAmount - goal.currentAmount} months` : 
                              `$${(goal.targetAmount - goal.currentAmount).toLocaleString()}`
                            }
                          </div>
                        </div>

                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-sm text-gray-600">Category</div>
                          <div className="font-semibold text-gray-900">{goal.category}</div>
                        </div>

                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-sm text-gray-600">Milestones</div>
                          <div className="font-semibold text-gray-900">
                            {completedMilestones}/{goal.milestones.length}
                          </div>
                          <div className="text-xs text-gray-600">completed</div>
                        </div>
                      </div>

                      {/* Milestones */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Milestones</h4>
                        <div className="space-y-2">
                          {goal.milestones.map((milestone, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  milestone.completed ? 'bg-green-500' : 'bg-gray-200'
                                }`}>
                                  {milestone.completed && (
                                    <CheckCircle className="h-4 w-4 text-white" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{milestone.name}</div>
                                  <div className="text-sm text-gray-600">
                                    {goal.type === 'CASH_FLOW' ? 
                                      `${milestone.amount} months` : 
                                      `$${milestone.amount.toLocaleString()}`
                                    }
                                  </div>
                                </div>
                              </div>
                              {milestone.completed && milestone.date && (
                                <div className="text-sm text-green-600">
                                  Completed {format(milestone.date, 'MMM d, yyyy')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <GoalActionButtons goalTitle={goal.title} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 text-green-600 mr-2" />
                Completed Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No completed goals yet</h3>
                <p className="text-gray-600">Keep working on your active goals to see completed ones here!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="savings">
          <div className="space-y-4">
            {mockGoals.filter(goal => goal.type === 'SAVINGS').map((goal) => {
              const progressPercentage = getProgressPercentage(goal.currentAmount, goal.targetAmount)

              return (
                <Card key={goal.id} className="bg-green-50 border-green-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                          <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                          <Badge className="bg-green-100 text-green-800">Savings Goal</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Target: ${goal.targetAmount.toLocaleString()}</span>
                          <span>Current: ${goal.currentAmount.toLocaleString()}</span>
                          <span>Due: {format(goal.targetDate, 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {progressPercentage.toFixed(0)}%
                        </div>
                        <div className="text-sm text-gray-600">Complete</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          <div className="space-y-4">
            {mockGoals.filter(goal => goal.type === 'REVENUE').map((goal) => {
              const progressPercentage = getProgressPercentage(goal.currentAmount, goal.targetAmount)

              return (
                <Card key={goal.id} className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <DollarSign className="h-5 w-5 text-blue-600" />
                          <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                          <Badge className="bg-blue-100 text-blue-800">Revenue Goal</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Target: ${goal.targetAmount.toLocaleString()}</span>
                          <span>Current: ${goal.currentAmount.toLocaleString()}</span>
                          <span>Due: {format(goal.targetDate, 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {progressPercentage.toFixed(0)}%
                        </div>
                        <div className="text-sm text-gray-600">Complete</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Goals Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockGoals.map((goal) => {
                  const progressPercentage = getProgressPercentage(goal.currentAmount, goal.targetAmount)

                  return (
                    <div key={goal.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        {getTypeIcon(goal.type)}
                        <div>
                          <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                          <div className="flex items-center space-x-3 text-sm text-gray-600">
                            <span>{goal.category}</span>
                            <Badge variant={getStatusColor(goal.status)} className="text-xs">
                              {goal.status.replace('_', ' ')}
                            </Badge>
                            <span>Due: {format(goal.targetDate, 'MMM d')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {progressPercentage.toFixed(0)}%
                          </div>
                          <div className="text-sm text-gray-600">Complete</div>
                        </div>
                        <div className="w-20">
                          <Progress value={progressPercentage} className="h-2" />
                        </div>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
