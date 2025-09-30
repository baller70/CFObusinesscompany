
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

// Generate comprehensive business insights using AI analysis
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get comprehensive business data
    const businessData = await getBusinessData(userId)
    
    // Generate various types of insights
    const insights = await generateInsights(userId, businessData)

    return NextResponse.json({
      success: true,
      insights,
      summary: {
        totalInsights: insights.length,
        actionableInsights: insights.filter(i => i.actionable).length,
        highPriorityInsights: insights.filter(i => i.priority === 'HIGH').length,
        categories: insights.reduce((acc, insight) => {
          acc[insight.category] = (acc[insight.category] || 0) + 1
          return acc
        }, {} as { [key: string]: number })
      }
    })

  } catch (error) {
    console.error('Generate insights error:', error)
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const actionable = searchParams.get('actionable') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

    const insights = await prisma.businessInsight.findMany({
      where: {
        userId: session.user.id,
        isStale: false,
        ...(category && { category: category.toUpperCase() as any }),
        ...(actionable !== undefined && { actionable })
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    })

    const summary = {
      totalInsights: insights.length,
      actionableInsights: insights.filter(i => i.actionable).length,
      highPriorityInsights: insights.filter(i => i.priority === 'HIGH').length,
      categories: insights.reduce((acc, insight) => {
        acc[insight.category] = (acc[insight.category] || 0) + 1
        return acc
      }, {} as { [key: string]: number })
    }

    return NextResponse.json({ insights, summary })

  } catch (error) {
    console.error('Get insights error:', error)
    return NextResponse.json({ error: 'Failed to get insights' }, { status: 500 })
  }
}

async function getBusinessData(userId: string) {
  const now = new Date()
  const currentMonth = startOfMonth(now)
  const lastMonth = startOfMonth(subMonths(now, 1))
  const threeMonthsAgo = startOfMonth(subMonths(now, 3))
  const yearAgo = subMonths(now, 12)

  const [
    recentTransactions,
    monthlyRevenue,
    monthlyExpenses,
    invoices,
    customers,
    vendors,
    projects,
    debts,
    financialMetrics
  ] = await Promise.all([
    // Recent transactions for trend analysis
    prisma.transaction.findMany({
      where: { userId, date: { gte: threeMonthsAgo } },
      orderBy: { date: 'desc' }
    }),

    // Monthly revenue trend
    prisma.transaction.groupBy({
      by: ['date'],
      where: {
        userId,
        type: 'INCOME',
        date: { gte: yearAgo }
      },
      _sum: { amount: true }
    }),

    // Monthly expenses trend
    prisma.transaction.groupBy({
      by: ['date'],
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: yearAgo }
      },
      _sum: { amount: true }
    }),

    // Invoice data
    prisma.invoice.findMany({
      where: { userId },
      include: { customer: true }
    }),

    // Customer data
    prisma.customer.findMany({
      where: { userId, isActive: true }
    }),

    // Vendor data
    prisma.vendor.findMany({
      where: { userId, isActive: true }
    }),

    // Project data
    prisma.project.findMany({
      where: { userId }
    }),

    // Debt data
    prisma.debt.findMany({
      where: { userId, isActive: true }
    }),

    // Financial metrics
    prisma.financialMetrics.findUnique({
      where: { userId }
    })
  ])

  return {
    recentTransactions,
    monthlyRevenue,
    monthlyExpenses,
    invoices,
    customers,
    vendors,
    projects,
    debts,
    financialMetrics
  }
}

async function generateInsights(userId: string, data: any): Promise<any[]> {
  const insights: any[] = []

  // Revenue insights
  insights.push(...await generateRevenueInsights(userId, data))
  
  // Expense insights
  insights.push(...await generateExpenseInsights(userId, data))
  
  // Cash flow insights
  insights.push(...await generateCashFlowInsights(userId, data))
  
  // Customer insights
  insights.push(...await generateCustomerInsights(userId, data))
  
  // Operational insights
  insights.push(...await generateOperationalInsights(userId, data))
  
  // Financial health insights
  insights.push(...await generateFinancialHealthInsights(userId, data))

  // Save insights to database
  const savedInsights = []
  for (const insight of insights) {
    const saved = await prisma.businessInsight.create({
      data: {
        userId,
        type: insight.type,
        category: insight.category,
        title: insight.title,
        description: insight.description,
        value: insight.value,
        percentage: insight.percentage,
        trend: insight.trend,
        timeframe: insight.timeframe,
        context: insight.context,
        analysis: insight.analysis,
        confidence: insight.confidence,
        actionable: insight.actionable,
        priority: insight.priority,
        suggestions: insight.suggestions,
        source: 'AI_ANALYSIS'
      }
    })
    savedInsights.push(saved)
  }

  return savedInsights
}

async function generateRevenueInsights(userId: string, data: any): Promise<any[]> {
  const insights: any[] = []
  
  // Calculate revenue trend
  const currentMonthRevenue = data.recentTransactions
    .filter((t: any) => t.type === 'INCOME' && new Date(t.date) >= startOfMonth(new Date()))
    .reduce((sum: number, t: any) => sum + t.amount, 0)
  
  const lastMonthRevenue = data.recentTransactions
    .filter((t: any) => t.type === 'INCOME' && 
      new Date(t.date) >= startOfMonth(subMonths(new Date(), 1)) &&
      new Date(t.date) < startOfMonth(new Date()))
    .reduce((sum: number, t: any) => sum + t.amount, 0)

  const revenueChange = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0
  
  if (Math.abs(revenueChange) > 10) {
    insights.push({
      type: 'REVENUE_PATTERN',
      category: 'REVENUE',
      title: `Revenue ${revenueChange > 0 ? 'Surge' : 'Decline'} Alert`,
      description: `Revenue has ${revenueChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(revenueChange).toFixed(1)}% this month`,
      value: currentMonthRevenue,
      percentage: revenueChange,
      trend: revenueChange > 0 ? 'UP' : 'DOWN',
      timeframe: 'MTD',
      context: { currentMonthRevenue, lastMonthRevenue, change: revenueChange },
      analysis: revenueChange > 0 ? 
        'Strong revenue growth indicates positive business momentum. Consider scaling successful initiatives.' :
        'Revenue decline requires immediate attention. Review customer acquisition and retention strategies.',
      confidence: 0.8,
      actionable: true,
      priority: Math.abs(revenueChange) > 20 ? 'HIGH' : 'MEDIUM',
      suggestions: revenueChange > 0 ? 
        ['Scale successful marketing campaigns', 'Expand to new customer segments', 'Consider raising prices'] :
        ['Review customer feedback', 'Analyze competitor pricing', 'Improve product/service offerings']
    })
  }

  // Revenue diversification insight
  const revenueByCustomer = data.invoices.reduce((acc: any, invoice: any) => {
    const customerId = invoice.customerId
    acc[customerId] = (acc[customerId] || 0) + invoice.total
    return acc
  }, {})

  const topCustomerRevenue = Math.max(...Object.values(revenueByCustomer) as number[])
  const totalRevenue = (Object.values(revenueByCustomer) as number[]).reduce((sum: number, val: number) => sum + val, 0)
  const concentration = topCustomerRevenue / totalRevenue * 100

  if (concentration > 40) {
    insights.push({
      type: 'RISK_INDICATOR',
      category: 'REVENUE',
      title: 'Revenue Concentration Risk',
      description: `${concentration.toFixed(1)}% of revenue comes from your top customer`,
      percentage: concentration,
      trend: 'STABLE',
      timeframe: 'YTD',
      context: { concentration, topCustomerRevenue, totalRevenue },
      analysis: 'High revenue concentration poses business risk if the top customer is lost. Diversification is recommended.',
      confidence: 0.9,
      actionable: true,
      priority: concentration > 60 ? 'HIGH' : 'MEDIUM',
      suggestions: [
        'Acquire new customers to reduce dependency',
        'Develop additional revenue streams',
        'Strengthen relationship with key accounts'
      ]
    })
  }

  return insights
}

async function generateExpenseInsights(userId: string, data: any): Promise<any[]> {
  const insights: any[] = []

  // Expense category analysis
  const expensesByCategory = data.recentTransactions
    .filter((t: any) => t.type === 'EXPENSE')
    .reduce((acc: any, t: any) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount)
      return acc
    }, {})

  const totalExpenses = (Object.values(expensesByCategory) as number[]).reduce((sum: number, val: number) => sum + val, 0)
  const topExpenseCategory = Object.entries(expensesByCategory)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]

  if (topExpenseCategory && totalExpenses > 0) {
    const [category, amount] = topExpenseCategory
    const percentage = ((amount as number) / totalExpenses) * 100

    if (percentage > 30) {
      insights.push({
        type: 'EXPENSE_PATTERN',
        category: 'EXPENSES',
        title: `High ${category} Spending`,
        description: `${category} accounts for ${percentage.toFixed(1)}% of total expenses`,
        value: amount as number,
        percentage,
        trend: 'STABLE',
        timeframe: 'last_3_months',
        context: { category, amount, totalExpenses, percentage },
        analysis: `${category} is your largest expense category. Review for optimization opportunities.`,
        confidence: 0.8,
        actionable: true,
        priority: 'MEDIUM',
        suggestions: [
          `Negotiate better rates for ${category}`,
          `Consider alternatives for ${category} services`,
          `Implement cost controls for ${category}`
        ]
      })
    }
  }

  return insights
}

async function generateCashFlowInsights(userId: string, data: any): Promise<any[]> {
  const insights: any[] = []

  // Cash flow trend analysis
  const monthlyNetFlow = data.recentTransactions.reduce((acc: any, t: any) => {
    const month = format(new Date(t.date), 'yyyy-MM')
    if (!acc[month]) acc[month] = { income: 0, expenses: 0 }
    
    if (t.type === 'INCOME') {
      acc[month].income += t.amount
    } else {
      acc[month].expenses += Math.abs(t.amount)
    }
    return acc
  }, {})

  const netFlows = Object.entries(monthlyNetFlow).map(([month, data]: [string, any]) => ({
    month,
    netFlow: data.income - data.expenses
  })).sort((a, b) => a.month.localeCompare(b.month))

  if (netFlows.length >= 2) {
    const recentFlow = netFlows[netFlows.length - 1].netFlow
    const previousFlow = netFlows[netFlows.length - 2].netFlow
    const flowChange = previousFlow !== 0 ? ((recentFlow - previousFlow) / Math.abs(previousFlow)) * 100 : 0

    if (recentFlow < 0 || Math.abs(flowChange) > 20) {
      insights.push({
        type: 'CASH_FLOW_PATTERN',
        category: 'CASH_FLOW',
        title: recentFlow < 0 ? 'Negative Cash Flow Alert' : 'Cash Flow Volatility',
        description: recentFlow < 0 ? 
          `Cash flow is negative: -$${Math.abs(recentFlow).toFixed(2)}` :
          `Cash flow changed by ${flowChange > 0 ? '+' : ''}${flowChange.toFixed(1)}%`,
        value: recentFlow,
        percentage: flowChange,
        trend: flowChange > 0 ? 'UP' : 'DOWN',
        timeframe: 'current_month',
        context: { recentFlow, previousFlow, flowChange, netFlows },
        analysis: recentFlow < 0 ? 
          'Negative cash flow requires immediate attention to avoid liquidity issues.' :
          'High cash flow volatility indicates potential business instability.',
        confidence: 0.85,
        actionable: true,
        priority: recentFlow < -5000 ? 'HIGH' : 'MEDIUM',
        suggestions: recentFlow < 0 ? [
          'Accelerate accounts receivable collection',
          'Delay non-essential expenses',
          'Consider short-term financing'
        ] : [
          'Build cash reserves during positive periods',
          'Create more predictable revenue streams',
          'Implement better cash flow forecasting'
        ]
      })
    }
  }

  return insights
}

async function generateCustomerInsights(userId: string, data: any): Promise<any[]> {
  const insights: any[] = []

  if (data.customers.length === 0) {
    insights.push({
      type: 'CUSTOMER_ANALYSIS',
      category: 'CUSTOMER_INSIGHTS',
      title: 'No Customer Data',
      description: 'Customer relationship management setup is recommended',
      trend: 'STABLE',
      timeframe: 'current',
      analysis: 'Proper customer tracking enables better business insights and relationship management.',
      confidence: 0.9,
      actionable: true,
      priority: 'MEDIUM',
      suggestions: [
        'Set up customer profiles',
        'Track customer interactions',
        'Implement customer feedback systems'
      ]
    })
  }

  return insights
}

async function generateOperationalInsights(userId: string, data: any): Promise<any[]> {
  const insights: any[] = []

  // Project profitability insight
  const completedProjects = data.projects.filter((p: any) => p.status === 'COMPLETED')
  
  if (completedProjects.length > 0) {
    insights.push({
      type: 'PROJECT_PERFORMANCE',
      category: 'OPERATIONAL_EFFICIENCY',
      title: 'Project Portfolio Performance',
      description: `You have ${completedProjects.length} completed projects`,
      value: completedProjects.length,
      trend: 'STABLE',
      timeframe: 'all_time',
      context: { completedProjects: completedProjects.length, totalProjects: data.projects.length },
      analysis: 'Project completion tracking helps identify successful patterns and areas for improvement.',
      confidence: 0.7,
      actionable: true,
      priority: 'MEDIUM',
      suggestions: [
        'Analyze successful project patterns',
        'Standardize project management processes',
        'Implement project profitability tracking'
      ]
    })
  }

  return insights
}

async function generateFinancialHealthInsights(userId: string, data: any): Promise<any[]> {
  const insights: any[] = []

  if (data.debts.length > 0) {
    const totalDebt = data.debts.reduce((sum: number, debt: any) => sum + debt.balance, 0)
    const highInterestDebt = data.debts.filter((debt: any) => debt.interestRate > 15)

    if (highInterestDebt.length > 0) {
      const highInterestAmount = highInterestDebt.reduce((sum: number, debt: any) => sum + debt.balance, 0)
      
      insights.push({
        type: 'DEBT_STATUS',
        category: 'DEBT_MANAGEMENT',
        title: 'High Interest Debt Alert',
        description: `$${highInterestAmount.toFixed(2)} in high-interest debt (>15% APR)`,
        value: highInterestAmount,
        percentage: (highInterestAmount / totalDebt) * 100,
        trend: 'STABLE',
        timeframe: 'current',
        context: { highInterestDebt: highInterestAmount, totalDebt, count: highInterestDebt.length },
        analysis: 'High-interest debt significantly impacts cash flow and should be prioritized for payoff.',
        confidence: 0.95,
        actionable: true,
        priority: 'HIGH',
        suggestions: [
          'Prioritize high-interest debt payoff',
          'Consider debt consolidation options',
          'Negotiate lower interest rates with creditors'
        ]
      })
    }
  }

  return insights
}
