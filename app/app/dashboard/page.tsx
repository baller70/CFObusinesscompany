
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { BusinessOverview } from '@/components/dashboard/business-overview'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { QuickActions } from '@/components/dashboard/business-quick-actions'
import { UpcomingTasks } from '@/components/dashboard/upcoming-tasks'
import { FinancialSummary } from '@/components/dashboard/financial-summary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DashboardWithCFO from '@/components/dashboard/dashboard-with-cfo'
import DashboardContent from '@/components/dashboard/dashboard-content'
import { TrendingUp, FileText, Calendar, Users } from 'lucide-react'
import { getCurrentBusinessProfileId } from '@/lib/business-profile-utils'

import { BackButton } from '@/components/ui/back-button';
async function getDashboardData(userId: string) {
  const currentDate = new Date()
  
  // Get current business profile ID
  const businessProfileId = await getCurrentBusinessProfileId()
  
  // Get profile details for display
  let currentProfile = null
  if (businessProfileId) {
    currentProfile = await prisma.businessProfile.findUnique({
      where: { id: businessProfileId },
      select: { name: true, type: true }
    })
  }
  
  // Build the where clause for profile filtering
  const profileWhere = businessProfileId ? { businessProfileId } : {}
  
  // Get the most recent transaction to determine the last active month
  const mostRecentTransaction = await prisma.transaction.findFirst({
    where: { 
      userId,
      ...profileWhere
    },
    orderBy: { date: 'desc' },
    select: { date: true }
  })

  // Use the most recent transaction month, or fall back to current month
  let targetDate = mostRecentTransaction?.date || currentDate
  const targetMonth = targetDate.getMonth()
  const targetYear = targetDate.getFullYear()
  const firstDayOfMonth = new Date(targetYear, targetMonth, 1)
  const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0)
  
  // Check if this month has sufficient data (at least 3 transactions)
  const transactionCount = await prisma.transaction.count({
    where: {
      userId,
      ...profileWhere,
      date: { gte: firstDayOfMonth, lte: lastDayOfMonth }
    }
  })
  
  // If current month has few transactions, find the most recent month with activity
  let finalMonth = targetMonth
  let finalYear = targetYear
  let periodLabel = `${new Date(finalYear, finalMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
  
  if (transactionCount < 3 && mostRecentTransaction) {
    // Find the most recent month with at least 5 transactions
    for (let i = 1; i <= 12; i++) {
      const checkDate = new Date(targetYear, targetMonth - i, 1)
      const checkMonth = checkDate.getMonth()
      const checkYear = checkDate.getFullYear()
      const checkFirstDay = new Date(checkYear, checkMonth, 1)
      const checkLastDay = new Date(checkYear, checkMonth + 1, 0)
      
      const checkCount = await prisma.transaction.count({
        where: {
          userId,
          ...profileWhere,
          date: { gte: checkFirstDay, lte: checkLastDay }
        }
      })
      
      if (checkCount >= 5) {
        finalMonth = checkMonth
        finalYear = checkYear
        periodLabel = `${new Date(finalYear, finalMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
        break
      }
    }
  }
  
  const firstDayOfFinalMonth = new Date(finalYear, finalMonth, 1)
  const lastDayOfFinalMonth = new Date(finalYear, finalMonth + 1, 0)

  const [
    user,
    recentTransactions,
    budgets,
    bankStatements,
    businessProfiles
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId }
    }),
    prisma.transaction.findMany({
      where: { 
        userId,
        ...profileWhere
      },
      take: 10,
      orderBy: { date: 'desc' },
      include: { 
        categoryRelation: true,
        businessProfile: true
      }
    }),
    prisma.budget.findMany({
      where: { 
        userId,
        ...profileWhere,
        month: finalMonth + 1,
        year: finalYear
      },
      include: {
        businessProfile: true
      }
    }),
    prisma.bankStatement.findMany({
      where: { 
        userId,
        ...profileWhere
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        businessProfile: true,
        _count: {
          select: { transactions: true }
        }
      }
    }),
    prisma.businessProfile.findMany({
      where: { userId, isActive: true }
    })
  ])

  // Calculate financial metrics from actual transactions for the final month
  const incomeTransactions = await prisma.transaction.aggregate({
    where: {
      userId,
      ...profileWhere,
      type: 'INCOME',
      date: { 
        gte: firstDayOfFinalMonth,
        lte: lastDayOfFinalMonth
      }
    },
    _sum: { amount: true }
  }).then(result => result._sum.amount || 0)

  const expenseTransactions = await prisma.transaction.aggregate({
    where: {
      userId,
      ...profileWhere,
      type: 'EXPENSE',
      date: { 
        gte: firstDayOfFinalMonth,
        lte: lastDayOfFinalMonth
      }
    },
    _sum: { amount: true }
  }).then(result => Math.abs(result._sum.amount || 0))

  // Calculate total budget allocated and spent
  const totalBudgetAllocated = budgets.reduce((sum, b) => sum + (b.amount || 0), 0)
  const totalBudgetSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0)

  // Count completed bank statements
  const completedStatements = await prisma.bankStatement.count({
    where: { 
      userId, 
      ...profileWhere,
      status: 'COMPLETED' 
    }
  })

  return {
    user,
    recentTransactions,
    budgets,
    bankStatements,
    businessProfiles,
    periodLabel,
    currentProfile,
    businessMetrics: {
      monthlyIncome: incomeTransactions,
      monthlyExpenses: expenseTransactions,
      totalBudgetAllocated,
      totalBudgetSpent,
      completedStatements,
      totalProfiles: businessProfiles.length
    }
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const dashboardData = await getDashboardData(session.user.id)

  return (
    <DashboardWithCFO>
      <div className="min-h-screen bg-gradient-background">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <BackButton href="/" />
          {/* Header */}
          <div className="mb-10 animate-fade-in">
            <h1 className="text-heading text-foreground mb-3">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {dashboardData.user?.firstName || 'there'}!
            </h1>
            <p className="text-body text-muted-foreground">
              {dashboardData.user?.companyName ? `Here's what's happening at ${dashboardData.user.companyName}` : "Here's what's happening with your business"} today
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {dashboardData.currentProfile && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-small font-medium text-primary">
                    {dashboardData.currentProfile.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({dashboardData.currentProfile.type === 'PERSONAL' ? 'Personal' : 'Business'})
                  </span>
                </div>
              )}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border rounded-lg">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-small font-medium text-foreground">
                  {dashboardData.periodLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Premium Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <Card className="card-premium-elevated animate-slide-in-up group hover:scale-105 transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-small text-muted-foreground font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success"></div>
                  Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-financial-large text-green-600 mb-2">
                  +${dashboardData.businessMetrics.monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-small text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-success" />
                  {dashboardData.periodLabel}
                </p>
              </CardContent>
            </Card>

            <Card className="card-premium-elevated animate-slide-in-up group hover:scale-105 transition-all duration-300" style={{ animationDelay: '100ms' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-small text-muted-foreground font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-destructive"></div>
                  Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-financial-large text-red-600 mb-2">
                  -${dashboardData.businessMetrics.monthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-small text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-destructive" />
                  {dashboardData.periodLabel}
                </p>
              </CardContent>
            </Card>

            <Card className="card-premium-elevated animate-slide-in-up group hover:scale-105 transition-all duration-300" style={{ animationDelay: '200ms' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-small text-muted-foreground font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  Budget Allocated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-financial-large text-primary mb-2">
                  ${dashboardData.businessMetrics.totalBudgetAllocated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-small text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3 text-primary" />
                  ${dashboardData.businessMetrics.totalBudgetSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} spent
                </p>
              </CardContent>
            </Card>

            <Card className="card-premium-elevated animate-slide-in-up group hover:scale-105 transition-all duration-300" style={{ animationDelay: '300ms' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-small text-muted-foreground font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-warning"></div>
                  Bank Statements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-financial-large text-warning mb-2">
                  {dashboardData.businessMetrics.completedStatements}
                </div>
                <p className="text-small text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3 text-warning" />
                  {dashboardData.businessMetrics.totalProfiles} profiles
                </p>
              </CardContent>
            </Card>
          </div>

          <DashboardContent
            businessMetrics={dashboardData.businessMetrics}
            recentTransactions={dashboardData.recentTransactions}
            budgets={dashboardData.budgets}
            bankStatements={dashboardData.bankStatements}
          />
        </div>
      </div>
    </DashboardWithCFO>
  )
}
