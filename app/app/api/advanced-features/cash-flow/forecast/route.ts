
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { addDays, addMonths, addQuarters, addYears, startOfMonth, endOfMonth } from 'date-fns'

export const dynamic = 'force-dynamic';

// Generate cash flow forecasts based on historical data and AI predictions
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { periodType, periods, scenarioType, startDate } = await req.json()

    // Get historical transaction data for analysis
    const historicalTransactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last year
        }
      },
      orderBy: { date: 'asc' }
    })

    // Calculate base metrics
    const monthlyIncome = calculateMonthlyAverage(historicalTransactions, 'INCOME')
    const monthlyExpenses = calculateMonthlyAverage(historicalTransactions, 'EXPENSE')
    const seasonality = calculateSeasonality(historicalTransactions)
    
    // Get current balance (this would typically come from bank integration)
    const currentBalance = 10000 // Placeholder - would be from actual bank data

    // Generate forecasts for each period
    const forecasts = []
    let currentDate = new Date(startDate || new Date())
    let runningBalance = currentBalance

    for (let i = 0; i < periods; i++) {
      const { start, end } = getPeriodDates(currentDate, periodType, i)
      const periodKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${periodType}`
      
      // Apply scenario multipliers and seasonality
      const scenarioMultiplier = getScenarioMultiplier(scenarioType)
      const seasonalFactor = seasonality[start.getMonth()] || 1.0
      
      const projectedIncome = monthlyIncome * scenarioMultiplier.income * seasonalFactor
      const projectedExpenses = monthlyExpenses * scenarioMultiplier.expenses
      const projectedCashFlow = projectedIncome - projectedExpenses
      
      runningBalance += projectedCashFlow
      
      // Generate income and expense breakdown
      const incomeBreakdown = await generateIncomeBreakdown(session.user.id, projectedIncome)
      const expenseBreakdown = await generateExpenseBreakdown(session.user.id, projectedExpenses)
      
      // Calculate confidence based on data quality and period distance
      const confidence = calculateConfidence(historicalTransactions.length, i, periodType)

      const forecast = await prisma.cashFlowForecast.create({
        data: {
          userId: session.user.id,
          period: periodKey,
          periodType: periodType.toUpperCase(),
          startDate: start,
          endDate: end,
          projectedIncome,
          projectedExpenses,
          projectedCashFlow,
          openingBalance: runningBalance - projectedCashFlow,
          closingBalance: runningBalance,
          confidence,
          scenarioType: scenarioType.toUpperCase(),
          incomeBreakdown,
          expenseBreakdown,
          modelVersion: '1.0'
        }
      })

      forecasts.push(forecast)
    }

    return NextResponse.json({
      success: true,
      forecasts,
      summary: {
        totalPeriods: forecasts.length,
        avgProjectedCashFlow: forecasts.reduce((sum, f) => sum + f.projectedCashFlow, 0) / forecasts.length,
        highestCashFlow: Math.max(...forecasts.map(f => f.projectedCashFlow)),
        lowestCashFlow: Math.min(...forecasts.map(f => f.projectedCashFlow)),
        riskPeriods: forecasts.filter(f => f.projectedCashFlow < 0).length
      }
    })

  } catch (error) {
    console.error('Cash flow forecast error:', error)
    return NextResponse.json({ error: 'Failed to generate forecast' }, { status: 500 })
  }
}

// Get existing cash flow forecasts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const scenarioType = searchParams.get('scenarioType')
    const limit = parseInt(searchParams.get('limit') || '12')

    const forecasts = await prisma.cashFlowForecast.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        ...(scenarioType && { scenarioType: scenarioType.toUpperCase() as any })
      },
      orderBy: { startDate: 'asc' },
      take: limit
    })

    const summary = {
      totalPeriods: forecasts.length,
      avgProjectedCashFlow: forecasts.length > 0 ? forecasts.reduce((sum, f) => sum + f.projectedCashFlow, 0) / forecasts.length : 0,
      highestCashFlow: forecasts.length > 0 ? Math.max(...forecasts.map(f => f.projectedCashFlow)) : 0,
      lowestCashFlow: forecasts.length > 0 ? Math.min(...forecasts.map(f => f.projectedCashFlow)) : 0,
      riskPeriods: forecasts.filter(f => f.projectedCashFlow < 0).length
    }

    return NextResponse.json({ forecasts, summary })

  } catch (error) {
    console.error('Get forecasts error:', error)
    return NextResponse.json({ error: 'Failed to get forecasts' }, { status: 500 })
  }
}

// Helper functions
function calculateMonthlyAverage(transactions: any[], type: string): number {
  const filtered = transactions.filter(t => t.type === type)
  const totalAmount = filtered.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const months = Math.max(1, new Date().getMonth() - new Date(Math.min(...transactions.map(t => new Date(t.date).getTime()))).getMonth() + 1)
  return totalAmount / months
}

function calculateSeasonality(transactions: any[]): { [month: number]: number } {
  const monthlyData: { [month: number]: number[] } = {}
  
  transactions.forEach(t => {
    const month = new Date(t.date).getMonth()
    if (!monthlyData[month]) monthlyData[month] = []
    monthlyData[month].push(Math.abs(t.amount))
  })

  const seasonality: { [month: number]: number } = {}
  const yearlyAvg = (Object.values(monthlyData) as number[][]).flat().reduce((sum, val) => sum + val, 0) / (Object.values(monthlyData) as number[][]).flat().length

  for (let month = 0; month < 12; month++) {
    const monthlyAvg = monthlyData[month] ? monthlyData[month].reduce((sum, val) => sum + val, 0) / monthlyData[month].length : yearlyAvg
    seasonality[month] = monthlyAvg / yearlyAvg
  }

  return seasonality
}

function getPeriodDates(baseDate: Date, periodType: string, offset: number): { start: Date, end: Date } {
  let start: Date, end: Date

  switch (periodType.toLowerCase()) {
    case 'daily':
      start = addDays(baseDate, offset)
      end = addDays(start, 1)
      break
    case 'weekly':
      start = addDays(baseDate, offset * 7)
      end = addDays(start, 7)
      break
    case 'monthly':
      start = startOfMonth(addMonths(baseDate, offset))
      end = endOfMonth(start)
      break
    case 'quarterly':
      start = addQuarters(baseDate, offset)
      end = addQuarters(start, 1)
      break
    case 'yearly':
      start = addYears(baseDate, offset)
      end = addYears(start, 1)
      break
    default:
      start = startOfMonth(addMonths(baseDate, offset))
      end = endOfMonth(start)
  }

  return { start, end }
}

function getScenarioMultiplier(scenarioType: string): { income: number, expenses: number } {
  switch (scenarioType.toLowerCase()) {
    case 'optimistic':
      return { income: 1.15, expenses: 0.95 }
    case 'pessimistic':
      return { income: 0.85, expenses: 1.10 }
    case 'realistic':
    default:
      return { income: 1.0, expenses: 1.0 }
  }
}

async function generateIncomeBreakdown(userId: string, totalIncome: number): Promise<any> {
  // Get historical income categories
  const incomeCategories = await prisma.transaction.groupBy({
    by: ['category'],
    where: {
      userId,
      type: 'INCOME',
      date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
    },
    _sum: { amount: true },
    _count: true
  })

  const total = incomeCategories.reduce((sum, cat) => sum + (cat._sum.amount || 0), 0)
  const breakdown: any = {}

  incomeCategories.forEach(cat => {
    const percentage = total > 0 ? (cat._sum.amount || 0) / total : 0
    breakdown[cat.category] = totalIncome * percentage
  })

  return breakdown
}

async function generateExpenseBreakdown(userId: string, totalExpenses: number): Promise<any> {
  // Get historical expense categories
  const expenseCategories = await prisma.transaction.groupBy({
    by: ['category'],
    where: {
      userId,
      type: 'EXPENSE',
      date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
    },
    _sum: { amount: true },
    _count: true
  })

  const total = expenseCategories.reduce((sum, cat) => sum + Math.abs(cat._sum.amount || 0), 0)
  const breakdown: any = {}

  expenseCategories.forEach(cat => {
    const percentage = total > 0 ? Math.abs(cat._sum.amount || 0) / total : 0
    breakdown[cat.category] = totalExpenses * percentage
  })

  return breakdown
}

function calculateConfidence(dataPoints: number, periodOffset: number, periodType: string): number {
  // Base confidence on amount of historical data
  let dataConfidence = Math.min(dataPoints / 365, 1.0) * 0.8 + 0.2
  
  // Reduce confidence for future periods
  const timeDecay = Math.max(0.3, 1 - (periodOffset * 0.1))
  
  // Adjust for period type (shorter periods are generally more accurate)
  const periodConfidence = periodType === 'daily' ? 0.9 : periodType === 'weekly' ? 0.85 : periodType === 'monthly' ? 0.8 : 0.7
  
  return dataConfidence * timeDecay * periodConfidence
}
