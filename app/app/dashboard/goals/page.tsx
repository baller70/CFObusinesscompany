
'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Target, Trophy, AlertCircle, Building2, Home } from 'lucide-react'
import { format, differenceInDays, parseISO } from 'date-fns'
import Link from 'next/link'
import { toast } from 'sonner'
import { BackButton } from '@/components/ui/back-button'

interface Goal {
  id: string
  name: string
  description: string | null
  targetAmount: number
  currentAmount: number
  targetDate: string | null
  type: string
  priority: number
  isCompleted: boolean
  businessProfile: {
    id: string
    name: string
    type: string
  }
}

export default function GoalsPage() {
  const { data: session, status } = useSession() || {}
  const [goals, setGoals] = useState<Goal[]>([])
  const [allGoals, setAllGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (session?.user) {
      fetchGoals()
    }
  }, [session])

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals')
      if (response.ok) {
        const data = await response.json()
        setGoals(data.goals || [])
        setAllGoals(data.allGoals || [])
      } else {
        toast.error('Failed to fetch goals')
      }
    } catch (error) {
      console.error('Error fetching goals:', error)
      toast.error('Error loading goals')
    } finally {
      setLoading(false)
    }
  }
  
  if (status === 'loading' || loading) {
    return (
      <div className="p-6">
        <BackButton href="/dashboard" />
        <div className="text-center py-12">
          <div className="text-lg text-gray-600">Loading goals...</div>
        </div>
      </div>
    )
  }
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Calculate statistics
  const inProgressGoals = allGoals.filter(g => !g.isCompleted).length
  const completedGoals = allGoals.filter(g => g.isCompleted).length
  const overDueGoals = allGoals.filter(g => {
    if (!g.targetDate) return false
    const daysRemaining = differenceInDays(parseISO(g.targetDate), new Date())
    return daysRemaining < 0 && !g.isCompleted
  }).length

  const getProgressPercentage = (current: number, target: number) => {
    if (target === 0) return 0
    return Math.min((current / target) * 100, 100)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BackButton href="/dashboard" />
      
      <div className="flex items-center justify-between mb-8 mt-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Goals</h1>
          <p className="text-gray-600 mt-1">Track and achieve your financial objectives</p>
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
            <div className="text-2xl font-bold text-gray-900">{allGoals.length}</div>
            <p className="text-xs text-gray-500 mt-1">All profiles</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <div className="space-y-6">
        {allGoals.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Goals Yet</h3>
              <p className="text-gray-600 mb-4">Start tracking your financial objectives by creating your first goal.</p>
              <Link href="/dashboard/goals/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Goal
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All Goals ({allGoals.length})</TabsTrigger>
              <TabsTrigger value="business">Business ({allGoals.filter(g => g.businessProfile.type === 'BUSINESS').length})</TabsTrigger>
              <TabsTrigger value="personal">Personal ({allGoals.filter(g => g.businessProfile.type === 'PERSONAL').length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="space-y-4">
                {allGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} getProgressPercentage={getProgressPercentage} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="business">
              <div className="space-y-4">
                {allGoals.filter(g => g.businessProfile.type === 'BUSINESS').map((goal) => (
                  <GoalCard key={goal.id} goal={goal} getProgressPercentage={getProgressPercentage} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="personal">
              <div className="space-y-4">
                {allGoals.filter(g => g.businessProfile.type === 'PERSONAL').map((goal) => (
                  <GoalCard key={goal.id} goal={goal} getProgressPercentage={getProgressPercentage} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}

interface GoalCardProps {
  goal: Goal
  getProgressPercentage: (current: number, target: number) => number
}

function GoalCard({ goal, getProgressPercentage }: GoalCardProps) {
  const progressPercentage = getProgressPercentage(goal.currentAmount, goal.targetAmount)
  const daysRemaining = goal.targetDate ? differenceInDays(parseISO(goal.targetDate), new Date()) : null
  const isOverdue = daysRemaining !== null && daysRemaining < 0
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                {goal.businessProfile.type === 'BUSINESS' ? (
                  <Building2 className="h-5 w-5 text-blue-600" />
                ) : (
                  <Home className="h-5 w-5 text-green-600" />
                )}
                <h3 className="text-xl font-semibold text-gray-900">{goal.name}</h3>
                <Badge variant={goal.businessProfile.type === 'BUSINESS' ? 'default' : 'secondary'}>
                  {goal.businessProfile.name}
                </Badge>
                {goal.priority > 0 && (
                  <Badge variant={goal.priority >= 3 ? 'destructive' : goal.priority >= 2 ? 'outline' : 'secondary'}>
                    Priority: {goal.priority}
                  </Badge>
                )}
              </div>
              {goal.description && (
                <p className="text-gray-600 text-sm mb-3">{goal.description}</p>
              )}
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-bold text-gray-900">
                {progressPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
              <span className="text-green-600 font-medium">
                ${goal.currentAmount.toLocaleString()}
              </span>
              <span className="text-gray-400">
                of ${goal.targetAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600">Remaining</div>
              <div className="font-semibold text-gray-900">
                ${(goal.targetAmount - goal.currentAmount).toLocaleString()}
              </div>
            </div>

            {goal.targetDate && (
              <div className={`text-center p-3 rounded-lg ${isOverdue ? 'bg-red-50' : 'bg-green-50'}`}>
                <div className="text-sm text-gray-600">Target Date</div>
                <div className="font-semibold text-gray-900">
                  {format(parseISO(goal.targetDate), 'MMM d, yyyy')}
                </div>
                <div className={`text-xs ${isOverdue ? 'text-red-600' : 'text-green-600'}`}>
                  {daysRemaining !== null && (
                    <>
                      {daysRemaining > 0 
                        ? `${daysRemaining} days left` 
                        : `${Math.abs(daysRemaining)} days overdue`}
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600">Completion</div>
              <div className="font-semibold text-gray-900">
                {progressPercentage >= 100 ? '✓ Complete' : `${(100 - progressPercentage).toFixed(0)}% to go`}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
