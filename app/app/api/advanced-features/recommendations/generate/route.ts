
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { startOfMonth, subMonths, format } from 'date-fns'

// Generate AI-powered business recommendations
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { focus } = await req.json() // 'all', 'cost_reduction', 'revenue_optimization', etc.

    // Get comprehensive business data
    const businessData = await getBusinessAnalysisData(userId)
    
    // Generate AI recommendations based on data analysis
    const recommendations = await generateAIRecommendations(userId, businessData, focus)

    return NextResponse.json({
      success: true,
      recommendations,
      summary: {
        totalRecommendations: recommendations.length,
        pendingRecommendations: recommendations.filter(r => r.status === 'PENDING').length,
        highImpactRecommendations: recommendations.filter(r => r.impactLevel === 'HIGH' || r.impactLevel === 'CRITICAL').length,
        potentialSavings: recommendations.reduce((sum, r) => sum + (r.potentialSavings || 0), 0),
        potentialRevenue: recommendations.reduce((sum, r) => sum + (r.potentialRevenue || 0), 0)
      }
    })

  } catch (error) {
    console.error('Generate recommendations error:', error)
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')
    const limit = parseInt(searchParams.get('limit') || '20')

    const recommendations = await prisma.aIRecommendation.findMany({
      where: {
        userId: session.user.id,
        ...(status && { status: status.toUpperCase() as any }),
        ...(category && { category: category.toUpperCase() as any }),
        ...(priority && { priority: priority.toUpperCase() as any })
      },
      orderBy: [
        { urgencyLevel: 'desc' },
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    })

    const summary = {
      totalRecommendations: recommendations.length,
      pendingRecommendations: recommendations.filter(r => r.status === 'PENDING').length,
      highImpactRecommendations: recommendations.filter(r => r.impactLevel === 'HIGH' || r.impactLevel === 'CRITICAL').length,
      potentialSavings: recommendations.reduce((sum, r) => sum + (r.potentialSavings || 0), 0),
      potentialRevenue: recommendations.reduce((sum, r) => sum + (r.potentialRevenue || 0), 0)
    }

    return NextResponse.json({ recommendations, summary })

  } catch (error) {
    console.error('Get recommendations error:', error)
    return NextResponse.json({ error: 'Failed to get recommendations' }, { status: 500 })
  }
}

// Update recommendation status
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { recommendationId, status, rejectionReason } = await req.json()

    const updateData: any = {
      status: status.toUpperCase(),
      updatedAt: new Date()
    }

    if (status.toUpperCase() === 'COMPLETED') {
      updateData.implementedAt = new Date()
    } else if (status.toUpperCase() === 'REJECTED') {
      updateData.rejectedAt = new Date()
      updateData.rejectionReason = rejectionReason
    }

    const recommendation = await prisma.aIRecommendation.update({
      where: {
        id: recommendationId,
        userId: session.user.id
      },
      data: updateData
    })

    return NextResponse.json({ success: true, recommendation })

  } catch (error) {
    console.error('Update recommendation error:', error)
    return NextResponse.json({ error: 'Failed to update recommendation' }, { status: 500 })
  }
}

async function getBusinessAnalysisData(userId: string) {
  const now = new Date()
  const threeMonthsAgo = startOfMonth(subMonths(now, 3))
  const yearAgo = subMonths(now, 12)

  const [
    transactions,
    invoices,
    expenses,
    debts,
    customers,
    vendors,
    projects,
    financialMetrics,
    receipts
  ] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, date: { gte: threeMonthsAgo } },
      include: { categoryRelation: true }
    }),

    prisma.invoice.findMany({
      where: { userId },
      include: { customer: true, payments: true }
    }),

    prisma.transaction.findMany({
      where: { userId, type: 'EXPENSE', date: { gte: threeMonthsAgo } },
      orderBy: { amount: 'desc' }
    }),

    prisma.debt.findMany({
      where: { userId, isActive: true }
    }),

    prisma.customer.findMany({
      where: { userId, isActive: true },
      include: { invoices: true }
    }),

    prisma.vendor.findMany({
      where: { userId, isActive: true }
    }),

    prisma.project.findMany({
      where: { userId }
    }),

    prisma.financialMetrics.findFirst({
      where: { userId }
    }),

    prisma.receipt.findMany({
      where: { userId, processed: true }
    })
  ])

  return {
    transactions,
    invoices,
    expenses,
    debts,
    customers,
    vendors,
    projects,
    financialMetrics,
    receipts
  }
}

async function generateAIRecommendations(userId: string, data: any, focus?: string): Promise<any[]> {
  const recommendations: any[] = []

  // Cost reduction recommendations
  if (!focus || focus === 'all' || focus === 'cost_reduction') {
    recommendations.push(...await generateCostReductionRecommendations(userId, data))
  }

  // Revenue optimization recommendations
  if (!focus || focus === 'all' || focus === 'revenue_optimization') {
    recommendations.push(...await generateRevenueOptimizationRecommendations(userId, data))
  }

  // Cash flow improvement recommendations
  if (!focus || focus === 'all' || focus === 'cash_flow') {
    recommendations.push(...await generateCashFlowRecommendations(userId, data))
  }

  // Debt management recommendations
  if (!focus || focus === 'all' || focus === 'debt_management') {
    recommendations.push(...await generateDebtManagementRecommendations(userId, data))
  }

  // Operational efficiency recommendations
  if (!focus || focus === 'all' || focus === 'operational_efficiency') {
    recommendations.push(...await generateOperationalRecommendations(userId, data))
  }

  // Save recommendations to database
  const savedRecommendations = []
  for (const rec of recommendations) {
    const saved = await prisma.aIRecommendation.create({
      data: {
        userId,
        type: rec.type,
        category: rec.category,
        title: rec.title,
        description: rec.description,
        impactLevel: rec.impactLevel,
        potentialSavings: rec.potentialSavings,
        potentialRevenue: rec.potentialRevenue,
        riskLevel: rec.riskLevel,
        timeToImplement: rec.timeToImplement,
        steps: rec.steps,
        requirements: rec.requirements,
        resources: rec.resources,
        confidence: rec.confidence,
        dataSupporting: rec.dataSupporting,
        priority: rec.priority,
        urgencyLevel: rec.urgencyLevel,
        dueDate: rec.dueDate
      }
    })
    savedRecommendations.push(saved)
  }

  return savedRecommendations
}

async function generateCostReductionRecommendations(userId: string, data: any): Promise<any[]> {
  const recommendations: any[] = []

  // Analyze expense categories for reduction opportunities
  const expenseCategories = data.expenses.reduce((acc: any, expense: any) => {
    acc[expense.category] = (acc[expense.category] || 0) + Math.abs(expense.amount)
    return acc
  }, {})

  const totalExpenses = (Object.values(expenseCategories) as number[]).reduce((sum: number, val: number) => sum + val, 0)
  
  // Find high-expense categories
  Object.entries(expenseCategories).forEach(([category, amount]: [string, any]) => {
    const percentage = (amount / totalExpenses) * 100
    
    if (percentage > 20 && amount > 1000) { // Significant expense category
      recommendations.push({
        type: 'COST_REDUCTION',
        category: 'FINANCIAL',
        title: `Optimize ${category} Spending`,
        description: `${category} represents ${percentage.toFixed(1)}% of expenses. Review for cost reduction opportunities.`,
        impactLevel: percentage > 30 ? 'HIGH' : 'MEDIUM',
        potentialSavings: amount * 0.15, // Estimate 15% savings potential
        riskLevel: 'LOW',
        timeToImplement: '2-4 weeks',
        steps: [
          `Audit all ${category} expenses`,
          'Compare alternative suppliers/services',
          'Negotiate better rates with current providers',
          'Eliminate unnecessary expenses',
          'Implement approval process for future expenses'
        ],
        requirements: ['Time for analysis', 'Access to vendor contracts'],
        resources: ['Expense reports', 'Vendor contact information'],
        confidence: 0.8,
        dataSupporting: { category, amount, percentage, totalExpenses },
        priority: percentage > 30 ? 'HIGH' : 'MEDIUM',
        urgencyLevel: 'NORMAL'
      })
    }
  })

  // Subscription optimization
  const subscriptionExpenses = data.expenses.filter((e: any) => 
    e.description.toLowerCase().includes('subscription') || 
    e.description.toLowerCase().includes('monthly') ||
    e.description.toLowerCase().includes('saas')
  )

  if (subscriptionExpenses.length > 3) {
    const totalSubscriptions = subscriptionExpenses.reduce((sum: number, e: any) => sum + Math.abs(e.amount), 0)
    
    recommendations.push({
      type: 'COST_REDUCTION',
      category: 'OPERATIONAL',
      title: 'Audit Software Subscriptions',
      description: `You have ${subscriptionExpenses.length} subscription-based expenses totaling $${totalSubscriptions.toFixed(2)}`,
      impactLevel: 'MEDIUM',
      potentialSavings: totalSubscriptions * 0.25, // 25% potential savings
      riskLevel: 'LOW',
      timeToImplement: '1-2 weeks',
      steps: [
        'List all active subscriptions',
        'Identify unused or underutilized services',
        'Negotiate annual discounts',
        'Cancel unnecessary subscriptions',
        'Implement subscription tracking system'
      ],
      requirements: ['Access to payment records', 'Usage analytics'],
      resources: ['Subscription management tool'],
      confidence: 0.9,
      dataSupporting: { 
        subscriptionCount: subscriptionExpenses.length,
        totalAmount: totalSubscriptions,
        expenses: subscriptionExpenses 
      },
      priority: 'MEDIUM',
      urgencyLevel: 'NORMAL'
    })
  }

  return recommendations
}

async function generateRevenueOptimizationRecommendations(userId: string, data: any): Promise<any[]> {
  const recommendations: any[] = []

  // Customer analysis for upselling opportunities
  const customerRevenue = data.customers.reduce((acc: any, customer: any) => {
    const revenue = customer.invoices.reduce((sum: number, invoice: any) => sum + invoice.total, 0)
    acc[customer.id] = { customer, revenue, invoiceCount: customer.invoices.length }
    return acc
  }, {})

  const totalCustomers = Object.keys(customerRevenue).length
  if (totalCustomers > 5) {
    const avgRevenue = (Object.values(customerRevenue) as any[]).reduce((sum: number, data: any) => sum + data.revenue, 0) / totalCustomers
    const topCustomers = Object.values(customerRevenue)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, Math.ceil(totalCustomers * 0.2)) // Top 20%

    recommendations.push({
      type: 'REVENUE_OPTIMIZATION',
      category: 'SALES',
      title: 'Customer Expansion Opportunity',
      description: `Focus on expanding revenue from your top ${topCustomers.length} customers`,
      impactLevel: 'HIGH',
      potentialRevenue: avgRevenue * topCustomers.length * 0.3, // 30% increase potential
      riskLevel: 'LOW',
      timeToImplement: '1-2 months',
      steps: [
        'Analyze top customer needs and pain points',
        'Develop upselling/cross-selling strategies',
        'Create customer expansion playbook',
        'Schedule regular check-ins with key accounts',
        'Track expansion metrics and success rates'
      ],
      requirements: ['Customer relationship data', 'Sales team availability'],
      resources: ['CRM system', 'Customer feedback tools'],
      confidence: 0.75,
      dataSupporting: { 
        totalCustomers,
        avgRevenue,
        topCustomerCount: topCustomers.length,
        expansionPotential: avgRevenue * 0.3
      },
      priority: 'HIGH',
      urgencyLevel: 'NORMAL'
    })
  }

  // Invoice collection optimization
  const overdueInvoices = data.invoices.filter((inv: any) => 
    inv.status === 'OVERDUE' || 
    (inv.status === 'SENT' && new Date(inv.dueDate) < new Date())
  )

  if (overdueInvoices.length > 0) {
    const overdueAmount = overdueInvoices.reduce((sum: number, inv: any) => sum + (inv.total - inv.amountPaid), 0)
    
    recommendations.push({
      type: 'REVENUE_OPTIMIZATION',
      category: 'FINANCIAL',
      title: 'Accelerate Invoice Collection',
      description: `$${overdueAmount.toFixed(2)} in overdue invoices needs immediate attention`,
      impactLevel: overdueAmount > 5000 ? 'HIGH' : 'MEDIUM',
      potentialRevenue: overdueAmount * 0.8, // 80% collection rate
      riskLevel: 'LOW',
      timeToImplement: '1-2 weeks',
      steps: [
        'Contact customers with overdue invoices',
        'Offer payment plans if necessary',
        'Implement automated follow-up system',
        'Review and improve invoicing process',
        'Consider factoring for immediate cash flow'
      ],
      requirements: ['Customer contact information', 'Collection process'],
      resources: ['Invoicing system', 'Communication templates'],
      confidence: 0.85,
      dataSupporting: { 
        overdueCount: overdueInvoices.length,
        overdueAmount,
        invoices: overdueInvoices.map((inv: any) => ({ id: inv.id, amount: inv.total - inv.amountPaid }))
      },
      priority: overdueAmount > 10000 ? 'HIGH' : 'MEDIUM',
      urgencyLevel: overdueAmount > 10000 ? 'HIGH' : 'NORMAL'
    })
  }

  return recommendations
}

async function generateCashFlowRecommendations(userId: string, data: any): Promise<any[]> {
  const recommendations: any[] = []

  // Cash flow timing optimization
  const currentMonth = format(new Date(), 'yyyy-MM')
  const currentMonthTransactions = data.transactions.filter((t: any) => 
    format(new Date(t.date), 'yyyy-MM') === currentMonth
  )

  const currentIncome = currentMonthTransactions
    .filter((t: any) => t.type === 'INCOME')
    .reduce((sum: number, t: any) => sum + t.amount, 0)
  
  const currentExpenses = currentMonthTransactions
    .filter((t: any) => t.type === 'EXPENSE')
    .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0)

  const netCashFlow = currentIncome - currentExpenses

  if (netCashFlow < 0) {
    recommendations.push({
      type: 'CASH_FLOW_IMPROVEMENT',
      category: 'FINANCIAL',
      title: 'Negative Cash Flow Alert',
      description: `Current month cash flow is negative: -$${Math.abs(netCashFlow).toFixed(2)}`,
      impactLevel: 'CRITICAL',
      potentialSavings: Math.abs(netCashFlow),
      riskLevel: 'HIGH',
      timeToImplement: 'Immediate',
      steps: [
        'Accelerate accounts receivable collection',
        'Delay non-essential expenses',
        'Review payment terms with vendors',
        'Consider short-term financing options',
        'Implement weekly cash flow monitoring'
      ],
      requirements: ['Immediate attention', 'Cash flow analysis'],
      resources: ['Banking relationships', 'Customer contacts'],
      confidence: 0.95,
      dataSupporting: { 
        currentIncome,
        currentExpenses,
        netCashFlow,
        month: currentMonth
      },
      priority: 'HIGH',
      urgencyLevel: 'CRITICAL',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week
    })
  }

  return recommendations
}

async function generateDebtManagementRecommendations(userId: string, data: any): Promise<any[]> {
  const recommendations: any[] = []

  if (data.debts.length > 0) {
    const totalDebt = data.debts.reduce((sum: number, debt: any) => sum + debt.balance, 0)
    const highInterestDebts = data.debts.filter((debt: any) => debt.interestRate > 12)
    
    if (highInterestDebts.length > 0) {
      const totalHighInterest = highInterestDebts.reduce((sum: number, debt: any) => sum + debt.balance, 0)
      const avgRate = highInterestDebts.reduce((sum: number, debt: any) => sum + debt.interestRate, 0) / highInterestDebts.length
      
      recommendations.push({
        type: 'DEBT_MANAGEMENT',
        category: 'FINANCIAL',
        title: 'High-Interest Debt Consolidation',
        description: `$${totalHighInterest.toFixed(2)} in high-interest debt (avg ${avgRate.toFixed(1)}% APR)`,
        impactLevel: 'HIGH',
        potentialSavings: totalHighInterest * (avgRate - 8) / 100, // Savings if consolidated to 8%
        riskLevel: 'MEDIUM',
        timeToImplement: '2-4 weeks',
        steps: [
          'Research debt consolidation options',
          'Compare interest rates from multiple lenders',
          'Calculate total cost savings',
          'Apply for consolidation loan',
          'Use savings to build emergency fund'
        ],
        requirements: ['Good credit score', 'Financial documentation'],
        resources: ['Credit report', 'Debt statements'],
        confidence: 0.8,
        dataSupporting: { 
          totalHighInterest,
          avgRate,
          debtCount: highInterestDebts.length,
          debts: highInterestDebts.map((d: any) => ({ balance: d.balance, rate: d.interestRate }))
        },
        priority: 'HIGH',
        urgencyLevel: 'HIGH'
      })
    }
  }

  return recommendations
}

async function generateOperationalRecommendations(userId: string, data: any): Promise<any[]> {
  const recommendations: any[] = []

  // Process automation opportunities
  const recurringTransactions = data.transactions.filter((t: any) => t.isRecurring).length
  const totalTransactions = data.transactions.length

  if (recurringTransactions < totalTransactions * 0.3 && totalTransactions > 50) {
    recommendations.push({
      type: 'OPERATIONAL_EFFICIENCY',
      category: 'TECHNOLOGY',
      title: 'Automate Recurring Transactions',
      description: `Only ${recurringTransactions} of ${totalTransactions} transactions are marked as recurring`,
      impactLevel: 'MEDIUM',
      potentialSavings: 500, // Time savings valued at $500/month
      riskLevel: 'LOW',
      timeToImplement: '1-2 weeks',
      steps: [
        'Identify recurring income and expenses',
        'Set up automatic bill pay for fixed expenses',
        'Automate recurring revenue collection',
        'Implement transaction categorization rules',
        'Monitor and refine automation rules'
      ],
      requirements: ['Banking integration', 'Process documentation'],
      resources: ['Accounting software', 'Bank connections'],
      confidence: 0.7,
      dataSupporting: { 
        recurringTransactions,
        totalTransactions,
        automationPotential: totalTransactions - recurringTransactions
      },
      priority: 'MEDIUM',
      urgencyLevel: 'NORMAL'
    })
  }

  return recommendations
}
