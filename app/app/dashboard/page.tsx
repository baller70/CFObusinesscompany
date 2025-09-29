
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

async function getDashboardData(userId: string) {
  const [
    user,
    recentInvoices,
    recentTransactions,
    upcomingTasks,
    projects,
    customers,
    vendors,
    bills
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId }
    }),
    prisma.invoice.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: true }
    }).catch(() => []),
    prisma.transaction.findMany({
      where: { userId },
      take: 10,
      orderBy: { date: 'desc' },
      include: { categoryRelation: true }
    }),
    prisma.task.findMany({
      where: { userId, status: { not: 'COMPLETED' } },
      take: 5,
      orderBy: { dueDate: 'asc' },
      include: { project: true }
    }).catch(() => []),
    prisma.project.count({
      where: { userId, status: { not: 'COMPLETED' } }
    }).catch(() => 0),
    prisma.customer.count({
      where: { userId, isActive: true }
    }).catch(() => 0),
    prisma.vendor.count({
      where: { userId, isActive: true }
    }).catch(() => 0),
    prisma.bill.findMany({
      where: { userId, status: 'PENDING' },
      take: 5,
      orderBy: { dueDate: 'asc' },
      include: { vendor: true }
    }).catch(() => [])
  ])

  // Calculate business metrics
  const totalInvoices = await prisma.invoice.count({
    where: { userId }
  }).catch(() => 0)

  const totalRevenue = await prisma.invoice.aggregate({
    where: { userId, status: 'PAID' },
    _sum: { total: true }
  }).then(result => result._sum.total || 0).catch(() => 0)

  const pendingInvoices = await prisma.invoice.aggregate({
    where: { userId, status: { in: ['SENT', 'VIEWED', 'OVERDUE'] } },
    _sum: { total: true }
  }).then(result => result._sum.total || 0).catch(() => 0)

  const monthlyExpenses = await prisma.transaction.aggregate({
    where: {
      userId,
      type: 'EXPENSE',
      date: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    },
    _sum: { amount: true }
  }).then(result => result._sum.amount || 0).catch(() => 0)

  return {
    user,
    recentInvoices,
    recentTransactions,
    upcomingTasks,
    bills,
    businessMetrics: {
      totalInvoices,
      totalRevenue,
      pendingInvoices,
      monthlyExpenses,
      activeProjects: projects,
      totalCustomers: customers,
      totalVendors: vendors
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {dashboardData.user?.firstName || 'there'}!
        </h1>
        <p className="text-gray-600 mt-1">
          {dashboardData.user?.companyName ? `Here's what's happening at ${dashboardData.user.companyName}` : "Here's what's happening with your business"} today
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${dashboardData.businessMetrics.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Outstanding Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${dashboardData.businessMetrics.pendingInvoices.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {dashboardData.businessMetrics.totalInvoices} total invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${dashboardData.businessMetrics.monthlyExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboardData.businessMetrics.activeProjects}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {dashboardData.businessMetrics.totalCustomers} customers, {dashboardData.businessMetrics.totalVendors} vendors
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <QuickActions />
          <BusinessOverview metrics={dashboardData.businessMetrics} />
          <RecentActivity 
            invoices={dashboardData.recentInvoices}
            transactions={dashboardData.recentTransactions}
          />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          <UpcomingTasks tasks={dashboardData.upcomingTasks} />
          <FinancialSummary 
            bills={dashboardData.bills}
            metrics={dashboardData.businessMetrics}
          />
        </div>
      </div>
    </div>
  )
}
