
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
    <DashboardWithCFO>
      <div className="min-h-screen bg-gradient-background">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10 animate-fade-in">
            <h1 className="text-heading text-foreground mb-3">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {dashboardData.user?.firstName || 'there'}!
            </h1>
            <p className="text-body text-muted-foreground">
              {dashboardData.user?.companyName ? `Here's what's happening at ${dashboardData.user.companyName}` : "Here's what's happening with your business"} today
            </p>
          </div>

          {/* Premium Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <Card className="card-premium-elevated animate-slide-in-up group hover:scale-105 transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-small text-muted-foreground font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success"></div>
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-financial-large text-financial-positive mb-2">
                  ${dashboardData.businessMetrics.totalRevenue.toLocaleString()}
                </div>
                <p className="text-small text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-success" />
                  All time
                </p>
              </CardContent>
            </Card>

            <Card className="card-premium-elevated animate-slide-in-up group hover:scale-105 transition-all duration-300" style={{ animationDelay: '100ms' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-small text-muted-foreground font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-warning"></div>
                  Outstanding Invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-financial-large text-warning mb-2">
                  ${dashboardData.businessMetrics.pendingInvoices.toLocaleString()}
                </div>
                <p className="text-small text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3 text-warning" />
                  {dashboardData.businessMetrics.totalInvoices} total invoices
                </p>
              </CardContent>
            </Card>

            <Card className="card-premium-elevated animate-slide-in-up group hover:scale-105 transition-all duration-300" style={{ animationDelay: '200ms' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-small text-muted-foreground font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-destructive"></div>
                  Monthly Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-financial-large text-financial-negative mb-2">
                  ${dashboardData.businessMetrics.monthlyExpenses.toLocaleString()}
                </div>
                <p className="text-small text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-destructive" />
                  This month
                </p>
              </CardContent>
            </Card>

            <Card className="card-premium-elevated animate-slide-in-up group hover:scale-105 transition-all duration-300" style={{ animationDelay: '300ms' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-small text-muted-foreground font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  Active Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-financial-large text-primary mb-2">
                  {dashboardData.businessMetrics.activeProjects}
                </div>
                <p className="text-small text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3 text-primary" />
                  {dashboardData.businessMetrics.totalCustomers} customers, {dashboardData.businessMetrics.totalVendors} vendors
                </p>
              </CardContent>
            </Card>
          </div>

          <DashboardContent
            businessMetrics={dashboardData.businessMetrics}
            recentInvoices={dashboardData.recentInvoices}
            recentTransactions={dashboardData.recentTransactions}
            upcomingTasks={dashboardData.upcomingTasks}
            bills={dashboardData.bills}
          />
        </div>
      </div>
    </DashboardWithCFO>
  )
}
