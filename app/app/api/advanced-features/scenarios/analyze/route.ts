
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { addMonths, addQuarters, addYears, format } from 'date-fns'

export const dynamic = 'force-dynamic';

// Create and analyze business scenarios
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const scenarioData = await req.json()
    const userId = session.user.id

    // Get current business data for baseline
    const baselineData = await getBaselineBusinessData(userId)
    
    // Calculate scenario projections
    const projections = await calculateScenarioProjections(baselineData, scenarioData)
    
    // Analyze risks and opportunities
    const analysis = await analyzeScenario(projections, scenarioData)
    
    // Generate recommendations
    const recommendations = generateScenarioRecommendations(analysis, scenarioData)

    const scenario = await prisma.scenarioAnalysis.create({
      data: {
        userId,
        name: scenarioData.name,
        description: scenarioData.description,
        scenarioType: scenarioData.scenarioType?.toUpperCase() || 'REALISTIC',
        timeHorizon: scenarioData.timeHorizon,
        startDate: new Date(scenarioData.startDate),
        endDate: new Date(scenarioData.endDate),
        revenueGrowth: scenarioData.revenueGrowth,
        expenseGrowth: scenarioData.expenseGrowth,
        inflationRate: scenarioData.inflationRate,
        customVariables: scenarioData.customVariables,
        projectedRevenue: projections.totalRevenue,
        projectedExpenses: projections.totalExpenses,
        projectedProfit: projections.totalProfit,
        projectedCashFlow: projections.netCashFlow,
        breakEvenPoint: projections.breakEvenDate,
        riskFactors: analysis.risks,
        opportunities: analysis.opportunities,
        recommendations,
        comparisonData: projections.monthlyBreakdown,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      scenario,
      projections,
      analysis,
      summary: {
        projectedProfit: projections.totalProfit,
        profitMargin: projections.totalRevenue > 0 ? (projections.totalProfit / projections.totalRevenue) * 100 : 0,
        breakEvenMonths: projections.breakEvenMonths,
        riskCount: analysis.risks.length,
        opportunityCount: analysis.opportunities.length
      }
    })

  } catch (error) {
    console.error('Scenario analysis error:', error)
    return NextResponse.json({ error: 'Failed to analyze scenario' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const scenarioType = searchParams.get('scenarioType')
    const timeHorizon = searchParams.get('timeHorizon')

    const scenarios = await prisma.scenarioAnalysis.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        ...(scenarioType && { scenarioType: scenarioType.toUpperCase() as any }),
        ...(timeHorizon && { timeHorizon })
      },
      orderBy: { createdAt: 'desc' }
    })

    const summary = {
      totalScenarios: scenarios.length,
      scenarioTypes: [...new Set(scenarios.map(s => s.scenarioType))],
      avgProjectedProfit: scenarios.length > 0 ? 
        scenarios.reduce((sum, s) => sum + (s.projectedProfit || 0), 0) / scenarios.length : 0,
      bestCaseProfit: Math.max(...scenarios.map(s => s.projectedProfit || 0)),
      worstCaseProfit: Math.min(...scenarios.map(s => s.projectedProfit || 0))
    }

    return NextResponse.json({ scenarios, summary })

  } catch (error) {
    console.error('Get scenarios error:', error)
    return NextResponse.json({ error: 'Failed to get scenarios' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { scenarioId, ...updates } = await req.json()

    const updatedScenario = await prisma.scenarioAnalysis.update({
      where: {
        id: scenarioId,
        userId: session.user.id
      },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, scenario: updatedScenario })

  } catch (error) {
    console.error('Update scenario error:', error)
    return NextResponse.json({ error: 'Failed to update scenario' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const scenarioId = searchParams.get('scenarioId')

    if (!scenarioId) {
      return NextResponse.json({ error: 'Scenario ID required' }, { status: 400 })
    }

    await prisma.scenarioAnalysis.update({
      where: {
        id: scenarioId,
        userId: session.user.id
      },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete scenario error:', error)
    return NextResponse.json({ error: 'Failed to delete scenario' }, { status: 500 })
  }
}

async function getBaselineBusinessData(userId: string) {
  const lastTwelveMonths = addMonths(new Date(), -12)
  
  const [
    transactions,
    customers,
    financialMetrics,
    debts
  ] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, date: { gte: lastTwelveMonths } },
      orderBy: { date: 'asc' }
    }),

    prisma.customer.count({
      where: { userId, isActive: true }
    }),

    prisma.financialMetrics.findFirst({
      where: { userId }
    }),

    prisma.debt.findMany({
      where: { userId, isActive: true }
    })
  ])

  // Calculate baseline metrics
  const monthlyRevenue = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0) / 12

  const monthlyExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0) / 12

  const monthlyProfit = monthlyRevenue - monthlyExpenses
  const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0)

  // Calculate monthly revenue/expense patterns
  const monthlyPatterns = calculateMonthlyPatterns(transactions)

  return {
    monthlyRevenue,
    monthlyExpenses,
    monthlyProfit,
    totalDebt,
    customers,
    monthlyPatterns,
    financialMetrics
  }
}

function calculateMonthlyPatterns(transactions: any[]) {
  const patterns: { [month: string]: { revenue: number, expenses: number } } = {}
  
  transactions.forEach(transaction => {
    const month = format(new Date(transaction.date), 'yyyy-MM')
    if (!patterns[month]) {
      patterns[month] = { revenue: 0, expenses: 0 }
    }
    
    if (transaction.type === 'INCOME') {
      patterns[month].revenue += transaction.amount
    } else if (transaction.type === 'EXPENSE') {
      patterns[month].expenses += Math.abs(transaction.amount)
    }
  })

  return patterns
}

async function calculateScenarioProjections(baselineData: any, scenarioData: any) {
  const startDate = new Date(scenarioData.startDate)
  const endDate = new Date(scenarioData.endDate)
  const monthsToProject = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
  
  const revenueGrowthRate = (scenarioData.revenueGrowth || 0) / 100
  const expenseGrowthRate = (scenarioData.expenseGrowth || 0) / 100
  const inflationRate = (scenarioData.inflationRate || 2) / 100
  
  let monthlyBreakdown = []
  let totalRevenue = 0
  let totalExpenses = 0
  let runningCashFlow = 0
  let breakEvenDate = null
  let breakEvenMonths = 0

  for (let i = 0; i < monthsToProject; i++) {
    const monthDate = addMonths(startDate, i)
    const monthKey = format(monthDate, 'yyyy-MM')
    
    // Apply growth rates and seasonality
    const seasonalityFactor = getSeasonalityFactor(monthDate.getMonth(), baselineData.monthlyPatterns)
    
    const projectedMonthlyRevenue = baselineData.monthlyRevenue * 
      Math.pow(1 + revenueGrowthRate / 12, i) * 
      seasonalityFactor.revenue
    
    const projectedMonthlyExpenses = baselineData.monthlyExpenses * 
      Math.pow(1 + expenseGrowthRate / 12, i) * 
      Math.pow(1 + inflationRate / 12, i) *
      seasonalityFactor.expenses
    
    const monthlyProfit = projectedMonthlyRevenue - projectedMonthlyExpenses
    runningCashFlow += monthlyProfit
    
    // Check for break-even point (first month with positive cumulative cash flow)
    if (!breakEvenDate && runningCashFlow > 0) {
      breakEvenDate = monthDate
      breakEvenMonths = i + 1
    }
    
    monthlyBreakdown.push({
      month: monthKey,
      revenue: projectedMonthlyRevenue,
      expenses: projectedMonthlyExpenses,
      profit: monthlyProfit,
      cumulativeCashFlow: runningCashFlow
    })
    
    totalRevenue += projectedMonthlyRevenue
    totalExpenses += projectedMonthlyExpenses
  }

  return {
    monthlyBreakdown,
    totalRevenue,
    totalExpenses,
    totalProfit: totalRevenue - totalExpenses,
    netCashFlow: runningCashFlow,
    breakEvenDate,
    breakEvenMonths,
    avgMonthlyRevenue: totalRevenue / monthsToProject,
    avgMonthlyExpenses: totalExpenses / monthsToProject
  }
}

function getSeasonalityFactor(month: number, patterns: any) {
  // Calculate average monthly values
  const monthlyData = Object.values(patterns) as any[]
  if (monthlyData.length === 0) {
    return { revenue: 1, expenses: 1 }
  }
  
  const avgRevenue = monthlyData.reduce((sum, data) => sum + data.revenue, 0) / monthlyData.length
  const avgExpenses = monthlyData.reduce((sum, data) => sum + data.expenses, 0) / monthlyData.length
  
  // Find data for the same month in previous years
  const sameMonthData = Object.entries(patterns)
    .filter(([key, _]) => new Date(key + '-01').getMonth() === month)
    .map(([_, data]) => data as any)
  
  if (sameMonthData.length === 0) {
    return { revenue: 1, expenses: 1 }
  }
  
  const monthRevenue = sameMonthData.reduce((sum, data) => sum + data.revenue, 0) / sameMonthData.length
  const monthExpenses = sameMonthData.reduce((sum, data) => sum + data.expenses, 0) / sameMonthData.length
  
  return {
    revenue: avgRevenue > 0 ? monthRevenue / avgRevenue : 1,
    expenses: avgExpenses > 0 ? monthExpenses / avgExpenses : 1
  }
}

async function analyzeScenario(projections: any, scenarioData: any) {
  const risks = []
  const opportunities = []
  
  // Cash flow risks
  const negativeCashFlowMonths = projections.monthlyBreakdown.filter((month: any) => month.profit < 0)
  if (negativeCashFlowMonths.length > 0) {
    risks.push({
      type: 'CASH_FLOW_RISK',
      severity: negativeCashFlowMonths.length > projections.monthlyBreakdown.length / 2 ? 'HIGH' : 'MEDIUM',
      description: `${negativeCashFlowMonths.length} months with negative cash flow`,
      impact: negativeCashFlowMonths.reduce((sum: number, month: any) => sum + Math.abs(month.profit), 0),
      affectedPeriods: negativeCashFlowMonths.map((month: any) => month.month)
    })
  }

  // Break-even risk
  if (!projections.breakEvenDate || projections.breakEvenMonths > 12) {
    risks.push({
      type: 'PROFITABILITY_RISK',
      severity: 'HIGH',
      description: 'Break-even point not achieved within reasonable timeframe',
      impact: Math.abs(projections.totalProfit),
      timeline: projections.breakEvenMonths || 'Not achieved'
    })
  }

  // Revenue decline risk
  const revenueGrowth = scenarioData.revenueGrowth || 0
  if (revenueGrowth < 0) {
    risks.push({
      type: 'REVENUE_DECLINE_RISK',
      severity: revenueGrowth < -10 ? 'HIGH' : 'MEDIUM',
      description: `${Math.abs(revenueGrowth)}% revenue decline projected`,
      impact: projections.totalRevenue * Math.abs(revenueGrowth) / 100
    })
  }

  // High expense growth risk
  const expenseGrowth = scenarioData.expenseGrowth || 0
  if (expenseGrowth > revenueGrowth + 5) {
    risks.push({
      type: 'COST_INFLATION_RISK',
      severity: 'MEDIUM',
      description: 'Expenses growing faster than revenue',
      impact: (expenseGrowth - revenueGrowth) / 100 * projections.totalExpenses
    })
  }

  // Growth opportunities
  if (revenueGrowth > 15) {
    opportunities.push({
      type: 'HIGH_GROWTH_OPPORTUNITY',
      potential: 'HIGH',
      description: `${revenueGrowth}% revenue growth presents scaling opportunities`,
      value: projections.totalRevenue * revenueGrowth / 100,
      requirements: ['Increased operational capacity', 'Working capital', 'Marketing investment']
    })
  }

  // Profitability opportunities
  const profitMargin = projections.totalRevenue > 0 ? 
    (projections.totalProfit / projections.totalRevenue) * 100 : 0
    
  if (profitMargin > 20) {
    opportunities.push({
      type: 'HIGH_MARGIN_OPPORTUNITY',
      potential: 'MEDIUM',
      description: `${profitMargin.toFixed(1)}% profit margin enables strategic investments`,
      value: projections.totalProfit * 0.3, // 30% could be reinvested
      requirements: ['Strategic planning', 'Investment analysis', 'Growth initiatives']
    })
  }

  // Market expansion opportunities
  if (projections.breakEvenMonths <= 6) {
    opportunities.push({
      type: 'MARKET_EXPANSION_OPPORTUNITY',
      potential: 'MEDIUM',
      description: 'Quick break-even enables market expansion',
      value: projections.avgMonthlyRevenue * 3, // Potential 3-month revenue boost
      requirements: ['Market research', 'Expansion capital', 'Operational scaling']
    })
  }

  return { risks, opportunities }
}

function generateScenarioRecommendations(analysis: any, scenarioData: any): string[] {
  const recommendations = []
  
  // Risk mitigation recommendations
  analysis.risks.forEach((risk: any) => {
    switch (risk.type) {
      case 'CASH_FLOW_RISK':
        recommendations.push('Establish credit line or emergency funding before cash flow issues arise')
        recommendations.push('Implement aggressive accounts receivable collection procedures')
        break
      case 'PROFITABILITY_RISK':
        recommendations.push('Review and reduce operating expenses')
        recommendations.push('Consider price increases or premium service offerings')
        break
      case 'REVENUE_DECLINE_RISK':
        recommendations.push('Diversify revenue streams to reduce risk')
        recommendations.push('Increase marketing and customer retention efforts')
        break
      case 'COST_INFLATION_RISK':
        recommendations.push('Lock in supplier contracts to control cost increases')
        recommendations.push('Implement cost control measures and efficiency improvements')
        break
    }
  })

  // Opportunity recommendations
  analysis.opportunities.forEach((opportunity: any) => {
    switch (opportunity.type) {
      case 'HIGH_GROWTH_OPPORTUNITY':
        recommendations.push('Prepare operational infrastructure for rapid scaling')
        recommendations.push('Secure adequate working capital for growth')
        break
      case 'HIGH_MARGIN_OPPORTUNITY':
        recommendations.push('Reinvest profits into growth initiatives')
        recommendations.push('Build cash reserves for strategic opportunities')
        break
      case 'MARKET_EXPANSION_OPPORTUNITY':
        recommendations.push('Research new market segments or geographic areas')
        recommendations.push('Develop expansion strategy and timeline')
        break
    }
  })

  // General scenario-based recommendations
  if (scenarioData.scenarioType === 'OPTIMISTIC') {
    recommendations.push('Create contingency plans for if growth doesn\'t materialize as expected')
  } else if (scenarioData.scenarioType === 'PESSIMISTIC') {
    recommendations.push('Focus on cost reduction and cash preservation strategies')
  }

  recommendations.push('Monitor key metrics monthly to track actual vs projected performance')
  recommendations.push('Update scenario assumptions quarterly based on market conditions')

  return [...new Set(recommendations)] // Remove duplicates
}
