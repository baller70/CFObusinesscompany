
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { subMonths } from 'date-fns'

// Generate industry benchmarks and comparisons
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { industry, companySize, region } = await req.json()
    const userId = session.user.id

    // Get user's business data
    const businessData = await getBusinessDataForBenchmarking(userId)
    
    // Generate industry benchmark data (in production, this would come from external sources)
    const benchmarkData = await generateIndustryBenchmarks(industry, companySize, region)
    
    // Compare user's performance to benchmarks
    const comparison = await compareToIndustryBenchmarks(businessData, benchmarkData)

    // Save benchmark data
    const benchmark = await prisma.industryBenchmark.create({
      data: {
        userId,
        industry,
        companySize: companySize.toUpperCase(),
        region,
        avgRevenue: benchmarkData.avgRevenue,
        avgProfit: benchmarkData.avgProfit,
        avgExpenses: benchmarkData.avgExpenses,
        avgProfitMargin: benchmarkData.avgProfitMargin,
        avgCurrentRatio: benchmarkData.avgCurrentRatio,
        avgDebtToEquity: benchmarkData.avgDebtToEquity,
        avgROA: benchmarkData.avgROA,
        avgROE: benchmarkData.avgROE,
        avgEmployees: benchmarkData.avgEmployees,
        avgCustomers: benchmarkData.avgCustomers,
        avgProjects: benchmarkData.avgProjects,
        revenueGrowth: benchmarkData.revenueGrowth,
        customerGrowth: benchmarkData.customerGrowth,
        marketShare: benchmarkData.marketShare,
        userPerformance: comparison.userPerformance,
        gaps: comparison.gaps,
        strengths: comparison.strengths,
        dataSource: 'INDUSTRY_ANALYSIS',
        dataDate: new Date(),
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      benchmark,
      comparison,
      recommendations: generateBenchmarkRecommendations(comparison)
    })

  } catch (error) {
    console.error('Industry benchmark error:', error)
    return NextResponse.json({ error: 'Failed to generate industry benchmarks' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const industry = searchParams.get('industry')
    const companySize = searchParams.get('companySize')

    const benchmarks = await prisma.industryBenchmark.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        ...(industry && { industry }),
        ...(companySize && { companySize: companySize.toUpperCase() as any })
      },
      orderBy: { dataDate: 'desc' }
    })

    const summary = benchmarks.length > 0 ? {
      latestBenchmark: benchmarks[0],
      performanceScore: calculateOverallPerformanceScore(benchmarks[0]),
      topStrengths: benchmarks[0]?.strengths || [],
      topGaps: benchmarks[0]?.gaps || [],
      industryRanking: calculateIndustryRanking(benchmarks[0])
    } : null

    return NextResponse.json({ benchmarks, summary })

  } catch (error) {
    console.error('Get benchmarks error:', error)
    return NextResponse.json({ error: 'Failed to get benchmarks' }, { status: 500 })
  }
}

async function getBusinessDataForBenchmarking(userId: string) {
  const twelveMonthsAgo = subMonths(new Date(), 12)
  
  const [
    user,
    transactions,
    customers,
    projects,
    invoices,
    employees,
    financialMetrics
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        companyName: true,
        industry: true,
        companySize: true,
        annualRevenue: true,
        createdAt: true
      }
    }),

    prisma.transaction.findMany({
      where: { userId, date: { gte: twelveMonthsAgo } }
    }),

    prisma.customer.count({
      where: { userId, isActive: true }
    }),

    prisma.project.count({
      where: { userId }
    }),

    prisma.invoice.findMany({
      where: { userId, issueDate: { gte: twelveMonthsAgo } }
    }),

    prisma.employee.count({
      where: { userId, isActive: true }
    }),

    prisma.financialMetrics.findUnique({
      where: { userId }
    })
  ])

  // Calculate metrics
  const annualRevenue = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const annualExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  
  const profit = annualRevenue - annualExpenses
  const profitMargin = annualRevenue > 0 ? (profit / annualRevenue) * 100 : 0

  return {
    user,
    metrics: {
      annualRevenue,
      annualExpenses,
      profit,
      profitMargin,
      customers,
      projects,
      employees,
      currentRatio: financialMetrics?.currentRatio || 0,
      debtToEquityRatio: financialMetrics?.debtToEquityRatio || 0,
      returnOnAssets: financialMetrics?.returnOnAssets || 0,
      returnOnEquity: financialMetrics?.returnOnEquity || 0
    }
  }
}

async function generateIndustryBenchmarks(industry: string, companySize: string, region?: string) {
  // In production, this would pull from real industry data sources
  // For now, we'll generate realistic benchmark data based on industry type
  
  const industryBenchmarks: { [key: string]: any } = {
    'Technology': {
      avgRevenue: getRevenueBySize(companySize, 500000, 2000000, 10000000),
      avgProfitMargin: 15.5,
      avgCurrentRatio: 2.1,
      avgDebtToEquity: 0.3,
      avgROA: 8.2,
      avgROE: 12.5,
      revenueGrowth: 25.0,
      customerGrowth: 30.0
    },
    'Professional Services': {
      avgRevenue: getRevenueBySize(companySize, 300000, 1500000, 8000000),
      avgProfitMargin: 18.2,
      avgCurrentRatio: 1.8,
      avgDebtToEquity: 0.2,
      avgROA: 12.1,
      avgROE: 15.8,
      revenueGrowth: 12.0,
      customerGrowth: 15.0
    },
    'Retail': {
      avgRevenue: getRevenueBySize(companySize, 400000, 2500000, 15000000),
      avgProfitMargin: 8.5,
      avgCurrentRatio: 1.4,
      avgDebtToEquity: 0.6,
      avgROA: 5.8,
      avgROE: 11.2,
      revenueGrowth: 8.0,
      customerGrowth: 12.0
    },
    'Manufacturing': {
      avgRevenue: getRevenueBySize(companySize, 600000, 3000000, 20000000),
      avgProfitMargin: 12.8,
      avgCurrentRatio: 1.6,
      avgDebtToEquity: 0.8,
      avgROA: 6.5,
      avgROE: 10.8,
      revenueGrowth: 6.0,
      customerGrowth: 8.0
    },
    'Healthcare': {
      avgRevenue: getRevenueBySize(companySize, 400000, 2000000, 12000000),
      avgProfitMargin: 16.5,
      avgCurrentRatio: 2.0,
      avgDebtToEquity: 0.4,
      avgROA: 9.2,
      avgROE: 13.5,
      revenueGrowth: 10.0,
      customerGrowth: 12.0
    }
  }

  const baseBenchmark = industryBenchmarks[industry] || industryBenchmarks['Professional Services']
  
  // Calculate other metrics based on revenue
  const avgProfit = baseBenchmark.avgRevenue * (baseBenchmark.avgProfitMargin / 100)
  const avgExpenses = baseBenchmark.avgRevenue - avgProfit

  return {
    ...baseBenchmark,
    avgProfit,
    avgExpenses,
    avgEmployees: getEmployeesBySize(companySize),
    avgCustomers: getCustomersBySize(companySize),
    avgProjects: getProjectsBySize(companySize),
    marketShare: 5.0 // Default market share percentage
  }
}

function getRevenueBySize(companySize: string, microRevenue: number, smallRevenue: number, mediumRevenue: number): number {
  switch (companySize.toUpperCase()) {
    case 'MICRO': return microRevenue
    case 'SMALL': return smallRevenue
    case 'MEDIUM': return mediumRevenue
    case 'LARGE': return mediumRevenue * 3
    default: return smallRevenue
  }
}

function getEmployeesBySize(companySize: string): number {
  switch (companySize.toUpperCase()) {
    case 'MICRO': return 5
    case 'SMALL': return 25
    case 'MEDIUM': return 100
    case 'LARGE': return 300
    default: return 25
  }
}

function getCustomersBySize(companySize: string): number {
  switch (companySize.toUpperCase()) {
    case 'MICRO': return 50
    case 'SMALL': return 200
    case 'MEDIUM': return 1000
    case 'LARGE': return 5000
    default: return 200
  }
}

function getProjectsBySize(companySize: string): number {
  switch (companySize.toUpperCase()) {
    case 'MICRO': return 10
    case 'SMALL': return 25
    case 'MEDIUM': return 100
    case 'LARGE': return 300
    default: return 25
  }
}

async function compareToIndustryBenchmarks(businessData: any, benchmarkData: any) {
  const userMetrics = businessData.metrics
  
  const userPerformance = {
    revenueVsBenchmark: calculatePercentageDiff(userMetrics.annualRevenue, benchmarkData.avgRevenue),
    profitVsBenchmark: calculatePercentageDiff(userMetrics.profit, benchmarkData.avgProfit),
    profitMarginVsBenchmark: calculatePercentageDiff(userMetrics.profitMargin, benchmarkData.avgProfitMargin),
    currentRatioVsBenchmark: calculatePercentageDiff(userMetrics.currentRatio, benchmarkData.avgCurrentRatio),
    debtToEquityVsBenchmark: calculatePercentageDiff(benchmarkData.avgDebtToEquity, userMetrics.debtToEquityRatio), // Lower is better
    roaVsBenchmark: calculatePercentageDiff(userMetrics.returnOnAssets, benchmarkData.avgROA),
    customersVsBenchmark: calculatePercentageDiff(userMetrics.customers, benchmarkData.avgCustomers),
    projectsVsBenchmark: calculatePercentageDiff(userMetrics.projects, benchmarkData.avgProjects)
  }

  // Identify strengths (areas where user performs better than industry average)
  const strengths = []
  if (userPerformance.revenueVsBenchmark > 0) strengths.push({ metric: 'Revenue', performance: userPerformance.revenueVsBenchmark })
  if (userPerformance.profitMarginVsBenchmark > 0) strengths.push({ metric: 'Profit Margin', performance: userPerformance.profitMarginVsBenchmark })
  if (userPerformance.currentRatioVsBenchmark > 0) strengths.push({ metric: 'Current Ratio', performance: userPerformance.currentRatioVsBenchmark })
  if (userPerformance.debtToEquityVsBenchmark > 0) strengths.push({ metric: 'Debt Management', performance: userPerformance.debtToEquityVsBenchmark })
  if (userPerformance.roaVsBenchmark > 0) strengths.push({ metric: 'Return on Assets', performance: userPerformance.roaVsBenchmark })

  // Identify gaps (areas where user underperforms industry average)
  const gaps = []
  if (userPerformance.revenueVsBenchmark < -10) gaps.push({ metric: 'Revenue', gap: Math.abs(userPerformance.revenueVsBenchmark) })
  if (userPerformance.profitMarginVsBenchmark < -5) gaps.push({ metric: 'Profit Margin', gap: Math.abs(userPerformance.profitMarginVsBenchmark) })
  if (userPerformance.currentRatioVsBenchmark < -20) gaps.push({ metric: 'Current Ratio', gap: Math.abs(userPerformance.currentRatioVsBenchmark) })
  if (userPerformance.debtToEquityVsBenchmark < -20) gaps.push({ metric: 'Debt Management', gap: Math.abs(userPerformance.debtToEquityVsBenchmark) })
  if (userPerformance.roaVsBenchmark < -10) gaps.push({ metric: 'Return on Assets', gap: Math.abs(userPerformance.roaVsBenchmark) })

  return { userPerformance, strengths, gaps }
}

function calculatePercentageDiff(userValue: number, benchmarkValue: number): number {
  if (benchmarkValue === 0) return userValue > 0 ? 100 : 0
  return ((userValue - benchmarkValue) / benchmarkValue) * 100
}

function calculateOverallPerformanceScore(benchmark: any): number {
  if (!benchmark?.userPerformance) return 50

  const performance = benchmark.userPerformance
  const scores = [
    Math.max(0, Math.min(100, 50 + performance.revenueVsBenchmark / 4)),
    Math.max(0, Math.min(100, 50 + performance.profitMarginVsBenchmark * 2)),
    Math.max(0, Math.min(100, 50 + performance.currentRatioVsBenchmark / 2)),
    Math.max(0, Math.min(100, 50 + performance.debtToEquityVsBenchmark / 2)),
    Math.max(0, Math.min(100, 50 + performance.roaVsBenchmark * 2))
  ]

  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
}

function calculateIndustryRanking(benchmark: any): string {
  const score = calculateOverallPerformanceScore(benchmark)
  
  if (score >= 80) return 'Top 20%'
  else if (score >= 60) return 'Top 40%'
  else if (score >= 40) return 'Average'
  else if (score >= 20) return 'Below Average'
  else return 'Bottom 20%'
}

function generateBenchmarkRecommendations(comparison: any): string[] {
  const recommendations = []
  const { gaps, strengths } = comparison

  // Revenue gap recommendations
  if (gaps.some((g: any) => g.metric === 'Revenue')) {
    recommendations.push('Focus on revenue growth through market expansion or new product lines')
    recommendations.push('Analyze competitor pricing strategies and market positioning')
  }

  // Profit margin gap recommendations
  if (gaps.some((g: any) => g.metric === 'Profit Margin')) {
    recommendations.push('Review cost structure and identify areas for expense reduction')
    recommendations.push('Consider value-based pricing strategies')
  }

  // Current ratio gap recommendations
  if (gaps.some((g: any) => g.metric === 'Current Ratio')) {
    recommendations.push('Improve working capital management')
    recommendations.push('Consider extending payment terms with suppliers')
  }

  // Debt management gap recommendations
  if (gaps.some((g: any) => g.metric === 'Debt Management')) {
    recommendations.push('Develop a debt reduction strategy')
    recommendations.push('Consider refinancing high-interest debt')
  }

  // ROA gap recommendations
  if (gaps.some((g: any) => g.metric === 'Return on Assets')) {
    recommendations.push('Optimize asset utilization and efficiency')
    recommendations.push('Consider divesting underperforming assets')
  }

  // Leverage strengths
  if (strengths.length > 0) {
    recommendations.push(`Leverage your strengths in ${strengths[0].metric} to gain competitive advantage`)
  }

  // General recommendations
  recommendations.push('Consider joining industry associations for networking and benchmarking')
  recommendations.push('Implement regular performance monitoring against industry standards')

  return recommendations
}
