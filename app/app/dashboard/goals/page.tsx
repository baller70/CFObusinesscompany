'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Target, TrendingUp, TrendingDown, Calendar, DollarSign, CheckCircle, AlertCircle, Clock, Trophy } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { GoalActionButtons } from '@/components/goals/goals-client'
import Link from 'next/link'
import { toast } from 'sonner'

export default function GoalsPage() {
  const { data: session, status } = useSession() || {}
  
  if (status === 'loading') return <div className="p-6">Loading...</div>
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // All data will come from the database - no mock data
  const goals: any[] = []

  const inProgressGoals = 0
  const completedGoals = 0
  const overDueGoals = 0

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
      case 'MEDIUM': return 'bg-gray-100 text-gray-800'
      case 'LOW': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">FINANCIAL GOALS</h1>
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
            <div className="text-2xl font-bold text-gray-900">{goals.length}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active" onClick={() => toast.info('Showing active goals currently in progress')}>Active Goals</TabsTrigger>
          <TabsTrigger value="completed" onClick={() => toast.success('Showing completed goals - celebrate your achievements!')}>Completed</TabsTrigger>
          <TabsTrigger value="savings" onClick={() => toast.info('Showing savings goals for building reserves and funds')}>Savings</TabsTrigger>
          <TabsTrigger value="revenue" onClick={() => toast.info('Showing revenue growth and income targets')}>Revenue</TabsTrigger>
          <TabsTrigger value="all" onClick={() => toast.info('Overview of all financial goals across categories')}>All Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="space-y-6">
            {goals.filter(goal => goal.status === 'IN_PROGRESS').map((goal) => {
              const progressPercentage = getProgressPercentage(goal.currentAmount, goal.targetAmount)
              const daysRemaining = differenceInDays(goal.targetDate, new Date())
      // @ts-ignore
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
      // @ts-ignore
                          {goal.milestones.map((milestone: any, index: any) => (
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
            {goals.filter(goal => goal.type === 'SAVINGS').map((goal) => {
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
            {goals.filter(goal => goal.type === 'REVENUE').map((goal) => {
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
                {goals.map((goal) => {
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
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const progressPercentage = getProgressPercentage(goal.currentAmount, goal.targetAmount)
                            const newWindow = window.open('', '_blank', 'width=700,height=600')
                            if (newWindow) {
                              newWindow.document.write(`
                                <html>
                                  <head>
                                    <title>Goal Details - ${goal.title}</title>
                                    <style>
                                      body { font-family: Arial, sans-serif; margin: 20px; }
                                      .goal-header { background: #2563eb; color: white; padding: 20px; margin-bottom: 20px; }
                                      .progress-bar { width: 100%; height: 20px; background: #e5e7eb; border-radius: 10px; margin: 10px 0; }
                                      .progress-fill { height: 100%; background: #10b981; border-radius: 10px; width: ${progressPercentage}%; }
                                      .milestone { padding: 10px; margin: 5px 0; border-radius: 5px; }
                                      .milestone-completed { background: #dcfce7; border-left: 4px solid #22c55e; }
                                      .milestone-pending { background: #f3f4f6; border-left: 4px solid #9ca3af; }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="goal-header">
                                      <h1>${goal.title}</h1>
                                      <p>${goal.description}</p>
                                      <p><strong>Type:</strong> ${goal.type.replace('_', ' ')}</p>
                                      <p><strong>Category:</strong> ${goal.category}</p>
                                      <p><strong>Priority:</strong> ${goal.priority}</p>
                                    </div>
                                    
                                    <h3>Progress Overview</h3>
                                    <p><strong>Progress:</strong> ${progressPercentage.toFixed(1)}%</p>
                                    <div class="progress-bar">
                                      <div class="progress-fill"></div>
                                    </div>
                                    <p><strong>Current:</strong> ${goal.type === 'CASH_FLOW' ? goal.currentAmount + ' months' : '$' + goal.currentAmount.toLocaleString()}</p>
                                    <p><strong>Target:</strong> ${goal.type === 'CASH_FLOW' ? goal.targetAmount + ' months' : '$' + goal.targetAmount.toLocaleString()}</p>
                                    <p><strong>Remaining:</strong> ${goal.type === 'CASH_FLOW' ? (goal.targetAmount - goal.currentAmount) + ' months' : '$' + (goal.targetAmount - goal.currentAmount).toLocaleString()}</p>
                                    <p><strong>Target Date:</strong> ${format(goal.targetDate, 'MMM d, yyyy')}</p>
                                    
      // @ts-ignore
                                    <h3>Milestones (${goal.milestones.filter((m: any) => m.completed).length}/${goal.milestones.length} completed)</h3>
      // @ts-ignore
                                    ${goal.milestones.map((milestone: any) => `
                                      <div class="milestone ${milestone.completed ? 'milestone-completed' : 'milestone-pending'}">
                                        <strong>${milestone.name}:</strong> ${goal.type === 'CASH_FLOW' ? milestone.amount + ' months' : '$' + milestone.amount.toLocaleString()}
                                        ${milestone.completed && milestone.date ? ` - Completed on ${format(milestone.date, 'MMM d, yyyy')}` : ''}
                                      </div>
                                    `).join('')}
                                  </body>
                                </html>
                              `)
                              newWindow.document.close()
                            } else {
                              toast.info(`Opening detailed view for goal: ${goal.title}`)
                            }
                          }}
                        >
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
