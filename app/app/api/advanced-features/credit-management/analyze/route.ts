
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { subMonths } from 'date-fns'

// Analyze business credit profile and generate funding recommendations
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get comprehensive business data for credit analysis
    const businessData = await getBusinessCreditData(userId)
    
    // Analyze credit profile
    const creditAnalysis = await analyzeCreditProfile(userId, businessData)
    
    // Generate funding recommendations
    const fundingOptions = await generateFundingRecommendations(userId, creditAnalysis, businessData)

    return NextResponse.json({
      success: true,
      creditAnalysis,
      fundingOptions,
      summary: {
        creditScore: creditAnalysis.estimatedCreditScore,
        riskLevel: creditAnalysis.riskLevel,
        fundingCapacity: creditAnalysis.fundingCapacity,
        recommendedOptions: fundingOptions.filter(o => o.eligible).length,
        potentialFunding: fundingOptions.reduce((sum, o) => sum + (o.eligible ? o.maxAmount : 0), 0)
      }
    })

  } catch (error) {
    console.error('Credit analysis error:', error)
    return NextResponse.json({ error: 'Failed to analyze credit profile' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const applicationType = searchParams.get('type')
    const status = searchParams.get('status')

    const applications = await prisma.creditApplication.findMany({
      where: {
        userId: session.user.id,
        ...(applicationType && { type: applicationType.toUpperCase() as any }),
        ...(status && { status: status.toUpperCase() as any })
      },
      orderBy: { createdAt: 'desc' }
    })

    const summary = {
      totalApplications: applications.length,
      pendingApplications: applications.filter(a => ['SUBMITTED', 'UNDER_REVIEW'].includes(a.status)).length,
      approvedApplications: applications.filter(a => a.status === 'APPROVED').length,
      totalApprovedAmount: applications
        .filter(a => a.status === 'APPROVED')
        .reduce((sum, a) => sum + (a.decisionAmount || 0), 0),
      avgProcessingTime: calculateAvgProcessingTime(applications)
    }

    return NextResponse.json({ applications, summary })

  } catch (error) {
    console.error('Get credit applications error:', error)
    return NextResponse.json({ error: 'Failed to get credit applications' }, { status: 500 })
  }
}

// Submit credit application
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const applicationData = await req.json()
    const userId = session.user.id

    // Get business metrics for application
    const businessMetrics = await getBusinessMetricsForApplication(userId)
    
    // Calculate eligibility score
    const eligibilityScore = calculateEligibilityScore(businessMetrics, applicationData)

    const application = await prisma.creditApplication.create({
      data: {
        userId,
        type: applicationData.type.toUpperCase(),
        lender: applicationData.lender,
        productName: applicationData.productName,
        requestedAmount: applicationData.requestedAmount,
        purpose: applicationData.purpose,
        termLength: applicationData.termLength,
        collateral: applicationData.collateral,
        businessRevenue: businessMetrics.annualRevenue,
        businessExpenses: businessMetrics.annualExpenses,
        businessAge: businessMetrics.businessAgeMonths,
        status: 'DRAFT',
        eligibilityScore,
        requirements: generateApplicationRequirements(applicationData.type),
        recommendations: generateApplicationRecommendations(eligibilityScore, businessMetrics),
        alternativeOptions: generateAlternativeOptions(applicationData, businessMetrics)
      }
    })

    return NextResponse.json({ success: true, application })

  } catch (error) {
    console.error('Submit credit application error:', error)
    return NextResponse.json({ error: 'Failed to submit credit application' }, { status: 500 })
  }
}

async function getBusinessCreditData(userId: string) {
  const twelveMonthsAgo = subMonths(new Date(), 12)
  
  const [
    user,
    transactions,
    invoices,
    debts,
    financialMetrics,
    customers,
    vendors
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        companyName: true,
        businessType: true,
        industry: true,
        annualRevenue: true,
        companySize: true,
        createdAt: true,
        state: true
      }
    }),

    prisma.transaction.findMany({
      where: { userId, date: { gte: twelveMonthsAgo } }
    }),

    prisma.invoice.findMany({
      where: { userId, issueDate: { gte: twelveMonthsAgo } },
      include: { payments: true }
    }),

    prisma.debt.findMany({
      where: { userId, isActive: true }
    }),

    prisma.financialMetrics.findUnique({
      where: { userId }
    }),

    prisma.customer.findMany({
      where: { userId, isActive: true }
    }),

    prisma.vendor.findMany({
      where: { userId, isActive: true }
    })
  ])

  return {
    user,
    transactions,
    invoices,
    debts,
    financialMetrics,
    customers,
    vendors
  }
}

async function analyzeCreditProfile(userId: string, data: any) {
  // Calculate key financial metrics
  const annualRevenue = data.transactions
    .filter((t: any) => t.type === 'INCOME')
    .reduce((sum: number, t: any) => sum + t.amount, 0)
  
  const annualExpenses = data.transactions
    .filter((t: any) => t.type === 'EXPENSE')
    .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0)
  
  const netIncome = annualRevenue - annualExpenses
  const profitMargin = annualRevenue > 0 ? netIncome / annualRevenue : 0
  
  // Calculate debt-to-income ratio
  const totalDebt = data.debts.reduce((sum: number, d: any) => sum + d.balance, 0)
  const debtToIncomeRatio = annualRevenue > 0 ? totalDebt / annualRevenue : 0
  
  // Calculate business age
  const businessAge = data.user?.createdAt ? 
    Math.floor((new Date().getTime() - new Date(data.user.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0
  
  // Calculate payment history score
  const paymentScore = calculatePaymentHistoryScore(data.invoices)
  
  // Calculate cash flow stability
  const cashFlowStability = calculateCashFlowStability(data.transactions)
  
  // Calculate customer concentration risk
  const customerConcentration = calculateCustomerConcentration(data.invoices, data.customers)
  
  // Estimate business credit score (300-850 scale)
  const estimatedCreditScore = calculateBusinessCreditScore({
    profitMargin,
    debtToIncomeRatio,
    businessAge,
    paymentScore,
    cashFlowStability,
    customerConcentration,
    annualRevenue
  })
  
  // Determine risk level
  const riskLevel = estimatedCreditScore >= 700 ? 'LOW' : 
                   estimatedCreditScore >= 600 ? 'MEDIUM' : 'HIGH'
  
  // Calculate funding capacity
  const fundingCapacity = calculateFundingCapacity(annualRevenue, netIncome, totalDebt, estimatedCreditScore)

  return {
    estimatedCreditScore,
    riskLevel,
    fundingCapacity,
    metrics: {
      annualRevenue,
      annualExpenses,
      netIncome,
      profitMargin: profitMargin * 100,
      totalDebt,
      debtToIncomeRatio: debtToIncomeRatio * 100,
      businessAgeMonths: businessAge,
      paymentScore: paymentScore * 100,
      cashFlowStability: cashFlowStability * 100,
      customerConcentration: customerConcentration * 100
    },
    strengths: identifyCreditStrengths({
      profitMargin,
      debtToIncomeRatio,
      businessAge,
      paymentScore,
      annualRevenue
    }),
    weaknesses: identifyCreditWeaknesses({
      profitMargin,
      debtToIncomeRatio,
      businessAge,
      paymentScore,
      customerConcentration,
      cashFlowStability
    }),
    improvementAreas: generateImprovementRecommendations({
      estimatedCreditScore,
      profitMargin,
      debtToIncomeRatio,
      paymentScore,
      cashFlowStability
    })
  }
}

async function generateFundingRecommendations(userId: string, creditAnalysis: any, data: any) {
  const fundingOptions = []
  
  // Traditional business loan
  const businessLoanEligible = creditAnalysis.estimatedCreditScore >= 650 && 
                               creditAnalysis.metrics.businessAgeMonths >= 12 &&
                               creditAnalysis.metrics.annualRevenue >= 50000
  
  fundingOptions.push({
    type: 'BUSINESS_LOAN',
    name: 'Traditional Business Loan',
    description: 'Fixed-rate term loan for established businesses',
    eligible: businessLoanEligible,
    maxAmount: businessLoanEligible ? Math.min(creditAnalysis.metrics.annualRevenue * 0.3, 500000) : 0,
    estimatedRate: getEstimatedInterestRate('BUSINESS_LOAN', creditAnalysis.estimatedCreditScore),
    termRange: '1-7 years',
    requirements: [
      'Credit score 650+',
      'Business operational 12+ months',
      'Annual revenue $50,000+',
      'Financial statements',
      'Business tax returns'
    ],
    advantages: ['Fixed interest rate', 'Predictable payments', 'Build business credit'],
    disadvantages: ['Strict qualification', 'Lengthy approval process', 'Collateral may be required'],
    timeToFunding: '2-8 weeks',
    collateralRequired: creditAnalysis.estimatedCreditScore < 700
  })

  // SBA loan
  const sbaEligible = creditAnalysis.estimatedCreditScore >= 680 && 
                      creditAnalysis.metrics.businessAgeMonths >= 24 &&
                      creditAnalysis.metrics.annualRevenue >= 100000 &&
                      data.user?.companySize !== 'LARGE'

  fundingOptions.push({
    type: 'SBA_LOAN',
    name: 'SBA Loan',
    description: 'Government-backed loan with favorable terms',
    eligible: sbaEligible,
    maxAmount: sbaEligible ? Math.min(creditAnalysis.metrics.annualRevenue * 0.5, 5000000) : 0,
    estimatedRate: getEstimatedInterestRate('SBA_LOAN', creditAnalysis.estimatedCreditScore),
    termRange: '5-25 years',
    requirements: [
      'Credit score 680+',
      'Business operational 24+ months',
      'Small business qualification',
      'Owner investment in business',
      'Detailed business plan'
    ],
    advantages: ['Lower interest rates', 'Longer repayment terms', 'Government backing'],
    disadvantages: ['Extensive paperwork', 'Slow approval process', 'Personal guarantee required'],
    timeToFunding: '6-12 weeks',
    collateralRequired: true
  })

  // Line of credit
  const locEligible = creditAnalysis.estimatedCreditScore >= 600 && 
                      creditAnalysis.metrics.businessAgeMonths >= 6 &&
                      creditAnalysis.metrics.annualRevenue >= 25000

  fundingOptions.push({
    type: 'LINE_OF_CREDIT',
    name: 'Business Line of Credit',
    description: 'Flexible credit line for working capital needs',
    eligible: locEligible,
    maxAmount: locEligible ? Math.min(creditAnalysis.metrics.annualRevenue * 0.2, 250000) : 0,
    estimatedRate: getEstimatedInterestRate('LINE_OF_CREDIT', creditAnalysis.estimatedCreditScore),
    termRange: 'Revolving',
    requirements: [
      'Credit score 600+',
      'Business operational 6+ months',
      'Regular cash flow',
      'Bank statements'
    ],
    advantages: ['Only pay interest on used funds', 'Flexible access', 'Helps cash flow'],
    disadvantages: ['Variable interest rates', 'Credit limit may fluctuate', 'Requires discipline'],
    timeToFunding: '1-3 weeks',
    collateralRequired: false
  })

  // Equipment financing
  const equipmentEligible = creditAnalysis.estimatedCreditScore >= 550 && 
                            creditAnalysis.metrics.businessAgeMonths >= 3

  fundingOptions.push({
    type: 'EQUIPMENT_FINANCING',
    name: 'Equipment Financing',
    description: 'Financing secured by the equipment being purchased',
    eligible: equipmentEligible,
    maxAmount: equipmentEligible ? 1000000 : 0,
    estimatedRate: getEstimatedInterestRate('EQUIPMENT_FINANCING', creditAnalysis.estimatedCreditScore),
    termRange: '1-10 years',
    requirements: [
      'Credit score 550+',
      'Business operational 3+ months',
      'Equipment quote/invoice',
      'Down payment (10-20%)'
    ],
    advantages: ['Equipment serves as collateral', 'Lower rates', 'Preserve working capital'],
    disadvantages: ['Limited to equipment purchases', 'Equipment depreciates', 'Default risk'],
    timeToFunding: '1-2 weeks',
    collateralRequired: true
  })

  // Merchant cash advance (for businesses with credit card sales)
  const mcaEligible = creditAnalysis.metrics.annualRevenue >= 100000 && 
                      creditAnalysis.metrics.businessAgeMonths >= 6

  fundingOptions.push({
    type: 'MERCHANT_CASH_ADVANCE',
    name: 'Merchant Cash Advance',
    description: 'Advance against future credit card sales',
    eligible: mcaEligible,
    maxAmount: mcaEligible ? Math.min(creditAnalysis.metrics.annualRevenue * 0.15, 100000) : 0,
    estimatedRate: 15, // Factor rate, not APR
    termRange: '3-18 months',
    requirements: [
      'Credit card sales',
      'Business operational 6+ months',
      'Minimum monthly revenue',
      'Bank statements'
    ],
    advantages: ['Fast approval', 'No collateral', 'Payments tied to sales'],
    disadvantages: ['Very expensive', 'Daily payments', 'Can hurt cash flow'],
    timeToFunding: '1-3 days',
    collateralRequired: false
  })

  // Invoice factoring
  const factoringEligible = data.invoices.length > 0 && 
                            creditAnalysis.metrics.annualRevenue >= 50000

  fundingOptions.push({
    type: 'INVOICE_FACTORING',
    name: 'Invoice Factoring',
    description: 'Sell invoices for immediate cash',
    eligible: factoringEligible,
    maxAmount: factoringEligible ? data.invoices
      .filter((i: any) => ['SENT', 'VIEWED'].includes(i.status))
      .reduce((sum: number, i: any) => sum + i.total, 0) * 0.8 : 0,
    estimatedRate: 2.5, // Monthly rate
    termRange: '30-90 days',
    requirements: [
      'Outstanding invoices',
      'Creditworthy customers',
      'B2B transactions',
      'Invoice aging report'
    ],
    advantages: ['Immediate cash flow', 'No debt on books', 'Credit based on customers'],
    disadvantages: ['Ongoing fees', 'Customer notification', 'Limited to invoiced sales'],
    timeToFunding: '1-2 days',
    collateralRequired: false
  })

  return fundingOptions.sort((a, b) => {
    if (a.eligible && !b.eligible) return -1
    if (!a.eligible && b.eligible) return 1
    return b.maxAmount - a.maxAmount
  })
}

function calculatePaymentHistoryScore(invoices: any[]): number {
  if (invoices.length === 0) return 0.5

  let totalScore = 0
  let scoredInvoices = 0

  invoices.forEach(invoice => {
    if (invoice.status === 'PAID') {
      const daysToPay = invoice.payments.length > 0 ? 
        Math.max(...invoice.payments.map((p: any) => {
          const payDate = new Date(p.date)
          const dueDate = new Date(invoice.dueDate)
          return (payDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        })) : 0

      // Score based on payment timing
      if (daysToPay <= 0) totalScore += 1.0      // Paid on time or early
      else if (daysToPay <= 15) totalScore += 0.8 // Paid within 15 days
      else if (daysToPay <= 30) totalScore += 0.6 // Paid within 30 days
      else totalScore += 0.3                      // Paid late

      scoredInvoices++
    }
  })

  return scoredInvoices > 0 ? totalScore / scoredInvoices : 0.5
}

function calculateCashFlowStability(transactions: any[]): number {
  if (transactions.length < 12) return 0.5

  // Group transactions by month
  const monthlyFlow: { [month: string]: number } = {}
  
  transactions.forEach(t => {
    const month = t.date.substring(0, 7) // YYYY-MM format
    if (!monthlyFlow[month]) monthlyFlow[month] = 0
    monthlyFlow[month] += t.type === 'INCOME' ? t.amount : -Math.abs(t.amount)
  })

  const monthlyFlows = Object.values(monthlyFlow)
  if (monthlyFlows.length < 3) return 0.5

  // Calculate coefficient of variation (lower = more stable)
  const mean = monthlyFlows.reduce((sum, val) => sum + val, 0) / monthlyFlows.length
  const variance = monthlyFlows.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / monthlyFlows.length
  const stdDev = Math.sqrt(variance)
  const coefficientOfVariation = mean !== 0 ? stdDev / Math.abs(mean) : 1

  // Convert to stability score (0-1, higher = more stable)
  return Math.max(0, Math.min(1, 1 - coefficientOfVariation / 2))
}

function calculateCustomerConcentration(invoices: any[], customers: any[]): number {
  if (invoices.length === 0) return 0

  const customerRevenue: { [customerId: string]: number } = {}
  invoices.forEach(invoice => {
    customerRevenue[invoice.customerId] = (customerRevenue[invoice.customerId] || 0) + invoice.total
  })

  const totalRevenue = (Object.values(customerRevenue) as number[]).reduce((sum: number, val: number) => sum + val, 0)
  const maxCustomerRevenue = Math.max(...Object.values(customerRevenue) as number[])

  return totalRevenue > 0 ? maxCustomerRevenue / totalRevenue : 0
}

function calculateBusinessCreditScore(factors: any): number {
  let score = 300 // Base score

  // Revenue factor (0-150 points)
  if (factors.annualRevenue >= 1000000) score += 150
  else if (factors.annualRevenue >= 500000) score += 120
  else if (factors.annualRevenue >= 250000) score += 100
  else if (factors.annualRevenue >= 100000) score += 80
  else if (factors.annualRevenue >= 50000) score += 60
  else score += Math.max(0, factors.annualRevenue / 1000)

  // Profitability factor (0-100 points)
  if (factors.profitMargin >= 0.2) score += 100
  else if (factors.profitMargin >= 0.1) score += 80
  else if (factors.profitMargin >= 0.05) score += 60
  else if (factors.profitMargin >= 0) score += 40
  else score += 20

  // Debt-to-income factor (0-100 points)
  if (factors.debtToIncomeRatio <= 0.3) score += 100
  else if (factors.debtToIncomeRatio <= 0.5) score += 80
  else if (factors.debtToIncomeRatio <= 0.7) score += 60
  else if (factors.debtToIncomeRatio <= 1.0) score += 40
  else score += 20

  // Business age factor (0-80 points)
  if (factors.businessAge >= 60) score += 80
  else if (factors.businessAge >= 36) score += 60
  else if (factors.businessAge >= 24) score += 50
  else if (factors.businessAge >= 12) score += 40
  else score += Math.max(10, factors.businessAge * 2)

  // Payment history factor (0-100 points)
  score += factors.paymentScore * 100

  // Cash flow stability factor (0-50 points)
  score += factors.cashFlowStability * 50

  // Customer concentration penalty (0-30 points deducted)
  if (factors.customerConcentration > 0.5) score -= 30
  else if (factors.customerConcentration > 0.3) score -= 20
  else if (factors.customerConcentration > 0.2) score -= 10

  return Math.max(300, Math.min(850, Math.round(score)))
}

function calculateFundingCapacity(annualRevenue: number, netIncome: number, totalDebt: number, creditScore: number): number {
  // Base capacity on revenue and credit score
  let baseCapacity = annualRevenue * 0.3 // Conservative 30% of revenue

  // Adjust for credit score
  if (creditScore >= 750) baseCapacity *= 1.5
  else if (creditScore >= 700) baseCapacity *= 1.2
  else if (creditScore >= 650) baseCapacity *= 1.0
  else if (creditScore >= 600) baseCapacity *= 0.8
  else baseCapacity *= 0.5

  // Adjust for profitability
  const profitMargin = annualRevenue > 0 ? netIncome / annualRevenue : 0
  if (profitMargin >= 0.15) baseCapacity *= 1.3
  else if (profitMargin >= 0.1) baseCapacity *= 1.1
  else if (profitMargin >= 0.05) baseCapacity *= 1.0
  else baseCapacity *= 0.7

  // Reduce for existing debt
  const debtToIncomeRatio = annualRevenue > 0 ? totalDebt / annualRevenue : 0
  if (debtToIncomeRatio <= 0.3) baseCapacity *= 1.0
  else if (debtToIncomeRatio <= 0.5) baseCapacity *= 0.8
  else baseCapacity *= 0.6

  return Math.max(0, Math.round(baseCapacity))
}

function identifyCreditStrengths(factors: any): string[] {
  const strengths = []

  if (factors.profitMargin >= 0.15) strengths.push('Strong profitability')
  if (factors.debtToIncomeRatio <= 0.3) strengths.push('Low debt levels')
  if (factors.businessAge >= 36) strengths.push('Established business history')
  if (factors.paymentScore >= 0.9) strengths.push('Excellent payment history')
  if (factors.annualRevenue >= 500000) strengths.push('Strong revenue base')

  return strengths
}

function identifyCreditWeaknesses(factors: any): string[] {
  const weaknesses = []

  if (factors.profitMargin < 0) weaknesses.push('Negative profitability')
  if (factors.debtToIncomeRatio > 0.7) weaknesses.push('High debt burden')
  if (factors.businessAge < 12) weaknesses.push('Limited business history')
  if (factors.paymentScore < 0.7) weaknesses.push('Payment delays')
  if (factors.customerConcentration > 0.5) weaknesses.push('High customer concentration risk')
  if (factors.cashFlowStability < 0.5) weaknesses.push('Unstable cash flow')

  return weaknesses
}

function generateImprovementRecommendations(factors: any): string[] {
  const recommendations = []

  if (factors.profitMargin < 0.1) {
    recommendations.push('Focus on improving profit margins through cost reduction or pricing optimization')
  }
  
  if (factors.debtToIncomeRatio > 0.5) {
    recommendations.push('Pay down existing debt to improve debt-to-income ratio')
  }
  
  if (factors.paymentScore < 0.8) {
    recommendations.push('Improve payment history by paying all bills on time')
  }
  
  if (factors.cashFlowStability < 0.6) {
    recommendations.push('Work on stabilizing cash flow through diversified revenue streams')
  }

  if (factors.estimatedCreditScore < 650) {
    recommendations.push('Consider working with a business credit consultant')
  }

  return recommendations
}

function getEstimatedInterestRate(loanType: string, creditScore: number): number {
  const baseRates: { [key: string]: number } = {
    'BUSINESS_LOAN': 8.0,
    'SBA_LOAN': 6.0,
    'LINE_OF_CREDIT': 10.0,
    'EQUIPMENT_FINANCING': 7.0
  }

  const baseRate = baseRates[loanType] || 12.0

  // Adjust for credit score
  if (creditScore >= 750) return baseRate + 0
  else if (creditScore >= 700) return baseRate + 1
  else if (creditScore >= 650) return baseRate + 2
  else if (creditScore >= 600) return baseRate + 3
  else return baseRate + 5
}

async function getBusinessMetricsForApplication(userId: string) {
  const data = await getBusinessCreditData(userId)
  
  const annualRevenue = data.transactions
    .filter((t: any) => t.type === 'INCOME')
    .reduce((sum: number, t: any) => sum + t.amount, 0)
  
  const annualExpenses = data.transactions
    .filter((t: any) => t.type === 'EXPENSE')
    .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0)

  const businessAgeMonths = data.user?.createdAt ? 
    Math.floor((new Date().getTime() - new Date(data.user.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0

  return { annualRevenue, annualExpenses, businessAgeMonths }
}

function calculateEligibilityScore(businessMetrics: any, applicationData: any): number {
  let score = 0.5 // Base score

  // Revenue factor
  if (businessMetrics.annualRevenue >= 500000) score += 0.2
  else if (businessMetrics.annualRevenue >= 100000) score += 0.15
  else if (businessMetrics.annualRevenue >= 50000) score += 0.1

  // Business age factor
  if (businessMetrics.businessAgeMonths >= 24) score += 0.15
  else if (businessMetrics.businessAgeMonths >= 12) score += 0.1
  else if (businessMetrics.businessAgeMonths >= 6) score += 0.05

  // Requested amount vs revenue ratio
  const requestRatio = applicationData.requestedAmount / Math.max(1, businessMetrics.annualRevenue)
  if (requestRatio <= 0.2) score += 0.15
  else if (requestRatio <= 0.4) score += 0.1
  else if (requestRatio <= 0.6) score += 0.05

  return Math.max(0, Math.min(1, score))
}

function generateApplicationRequirements(applicationType: string): string[] {
  const baseRequirements = [
    'Business tax returns (2 years)',
    'Personal tax returns (2 years)',
    'Bank statements (6 months)',
    'Financial statements',
    'Business license',
    'Personal identification'
  ]

  const typeSpecific: { [key: string]: string[] } = {
    'SBA_LOAN': [
      'SBA Form 1919',
      'Business plan',
      'Personal financial statement',
      'Collateral documentation'
    ],
    'EQUIPMENT_FINANCING': [
      'Equipment quote/invoice',
      'Vendor information',
      'Equipment specifications'
    ],
    'LINE_OF_CREDIT': [
      'Accounts receivable aging',
      'Accounts payable summary'
    ]
  }

  return [...baseRequirements, ...(typeSpecific[applicationType] || [])]
}

function generateApplicationRecommendations(eligibilityScore: number, businessMetrics: any): string[] {
  const recommendations = []

  if (eligibilityScore < 0.6) {
    recommendations.push('Consider improving business metrics before applying')
  }

  if (businessMetrics.businessAgeMonths < 12) {
    recommendations.push('Wait until business has 12+ months of operating history')
  }

  if (businessMetrics.annualRevenue < 50000) {
    recommendations.push('Focus on growing revenue before seeking traditional financing')
  }

  recommendations.push('Prepare all required documentation in advance')
  recommendations.push('Consider multiple lenders to compare terms')

  return recommendations
}

function generateAlternativeOptions(applicationData: any, businessMetrics: any): any[] {
  const alternatives = []

  if (businessMetrics.annualRevenue < 100000) {
    alternatives.push({
      type: 'MICROFINANCE',
      description: 'Consider microfinance or community development financial institutions'
    })
  }

  alternatives.push({
    type: 'GRANTS',
    description: 'Research small business grants in your industry and location'
  })

  if (applicationData.type === 'EQUIPMENT_FINANCING') {
    alternatives.push({
      type: 'EQUIPMENT_LEASE',
      description: 'Consider equipment leasing as an alternative to purchasing'
    })
  }

  alternatives.push({
    type: 'CROWDFUNDING',
    description: 'Explore crowdfunding platforms for product-based businesses'
  })

  return alternatives
}

function calculateAvgProcessingTime(applications: any[]): number {
  const completedApps = applications.filter(app => 
    app.applicationDate && (app.approvalDate || app.status === 'DECLINED')
  )

  if (completedApps.length === 0) return 0

  const totalDays = completedApps.reduce((sum, app) => {
    const startDate = new Date(app.applicationDate)
    const endDate = new Date(app.approvalDate || app.updatedAt)
    return sum + Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  }, 0)

  return Math.round(totalDays / completedApps.length)
}
