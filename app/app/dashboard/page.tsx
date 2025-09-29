
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { FinancialOverview } from '@/components/dashboard/financial-overview'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { UpcomingBills } from '@/components/dashboard/upcoming-bills'
import { ProgressSection } from '@/components/dashboard/progress-section'

async function getDashboardData(userId: string) {
  const [user, financialMetrics, recentTransactions, debts, goals] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { 
        transactions: { take: 5, orderBy: { date: 'desc' } },
        debts: { where: { isActive: true }, orderBy: { balance: 'desc' } },
        goals: { where: { isCompleted: false }, orderBy: { priority: 'desc' } }
      }
    }),
    prisma.financialMetrics.findUnique({
      where: { userId }
    }),
    prisma.transaction.findMany({
      where: { userId },
      take: 10,
      orderBy: { date: 'desc' },
      include: { categoryRelation: true }
    }),
    prisma.debt.findMany({
      where: { userId, isActive: true },
      orderBy: { balance: 'desc' }
    }),
    prisma.goal.findMany({
      where: { userId, isCompleted: false },
      orderBy: { priority: 'desc' }
    })
  ])

  return {
    user,
    financialMetrics,
    recentTransactions,
    debts,
    goals
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const dashboardData = await getDashboardData(session.user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={dashboardData.user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {dashboardData.user?.firstName || 'there'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your finances today
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <FinancialOverview 
              metrics={dashboardData.financialMetrics}
              userId={session.user.id}
            />
            
            <QuickActions />
            
            <RecentTransactions 
              transactions={dashboardData.recentTransactions}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            <UpcomingBills debts={dashboardData.debts} />
            
            <ProgressSection 
              goals={dashboardData.goals}
              debts={dashboardData.debts}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
