
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { startOfYear, endOfYear, addMonths, format } from 'date-fns'

// Calculate tax optimization recommendations
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { taxYear, quarter } = await req.json()
    const userId = session.user.id
    const year = taxYear || new Date().getFullYear()

    // Get business data for tax analysis
    const taxData = await getTaxAnalysisData(userId, year)
    
    // Calculate tax optimization
    const optimization = await calculateTaxOptimization(userId, year, quarter, taxData)

    return NextResponse.json({
      success: true,
      optimization,
      summary: {
        estimatedLiability: optimization.estimatedTaxLiability,
        potentialSavings: optimization.potentialSavings,
        quarterlyEstimates: [
          optimization.quarterlyEstimate,
          optimization.quarterlyEstimate,
          optimization.quarterlyEstimate,
          optimization.quarterlyEstimate
        ],
        upcomingDeadlines: generateTaxDeadlines(year, quarter)
      }
    })

  } catch (error) {
    console.error('Tax optimization error:', error)
    return NextResponse.json({ error: 'Failed to calculate tax optimization' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const taxYear = parseInt(searchParams.get('taxYear') || new Date().getFullYear().toString())
    const quarterParam = searchParams.get('quarter')
    const quarter = quarterParam ? parseInt(quarterParam) : null

    const optimization = await prisma.taxOptimization.findFirst({
      where: {
        userId: session.user.id,
        taxYear,
        ...(quarter && { quarter })
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!optimization) {
      return NextResponse.json({ error: 'No tax optimization data found' }, { status: 404 })
    }

    const summary = {
      estimatedLiability: optimization.estimatedTaxLiability,
      potentialSavings: optimization.potentialSavings,
      quarterlyEstimates: [
        optimization.quarterlyEstimate,
        optimization.quarterlyEstimate,
        optimization.quarterlyEstimate,
        optimization.quarterlyEstimate
      ],
      upcomingDeadlines: generateTaxDeadlines(taxYear, quarter)
    }

    return NextResponse.json({ optimization, summary })

  } catch (error) {
    console.error('Get tax optimization error:', error)
    return NextResponse.json({ error: 'Failed to get tax optimization' }, { status: 500 })
  }
}

async function getTaxAnalysisData(userId: string, year: number) {
  const yearStart = startOfYear(new Date(year, 0, 1))
  const yearEnd = endOfYear(new Date(year, 11, 31))

  const [
    transactions,
    receipts,
    invoices,
    expenses,
    user
  ] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: yearStart, lte: yearEnd }
      },
      include: { categoryRelation: true }
    }),

    prisma.receipt.findMany({
      where: {
        userId,
        date: { gte: yearStart, lte: yearEnd },
        businessExpense: true
      }
    }),

    prisma.invoice.findMany({
      where: {
        userId,
        issueDate: { gte: yearStart, lte: yearEnd },
        status: 'PAID'
      }
    }),

    prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: yearStart, lte: yearEnd }
      }
    }),

    prisma.user.findUnique({
      where: { id: userId },
      select: { businessType: true, state: true }
    })
  ])

  return {
    transactions,
    receipts,
    invoices,
    expenses,
    user
  }
}

async function calculateTaxOptimization(userId: string, taxYear: number, quarter: number | null, data: any) {
  // Calculate business income
  const businessIncome = data.transactions
    .filter((t: any) => t.type === 'INCOME')
    .reduce((sum: number, t: any) => sum + t.amount, 0)

  // Calculate business expenses
  const businessExpenses = data.transactions
    .filter((t: any) => t.type === 'EXPENSE')
    .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0)

  // Calculate net business income
  const netBusinessIncome = businessIncome - businessExpenses

  // Standard deduction for business (2024 rates)
  const standardDeduction = getStandardDeduction(data.user?.businessType)

  // Calculate business deductions
  const businessDeductions = calculateBusinessDeductions(data)
  
  // Calculate itemized deductions
  const itemizedDeductions = calculateItemizedDeductions(data)

  // Use higher of standard or itemized deductions
  const totalDeductions = Math.max(standardDeduction, (Object.values(itemizedDeductions) as number[]).reduce((sum: number, val: number) => sum + val, 0))

  // Calculate taxable income
  const estimatedTaxableIncome = Math.max(0, netBusinessIncome - totalDeductions)

  // Calculate estimated tax liability
  const estimatedTaxLiability = calculateTaxLiability(estimatedTaxableIncome, data.user?.businessType)

  // Calculate quarterly estimate
  const quarterlyEstimate = estimatedTaxLiability / 4

  // Generate tax optimization recommendations
  const recommendations = generateTaxRecommendations(data, businessDeductions, itemizedDeductions)

  // Calculate potential savings
  const potentialSavings = calculatePotentialSavings(recommendations)

  // Generate required documents
  const documentsRequired = generateRequiredDocuments(data.user?.businessType)

  // Generate tax deadlines
  const deadlines = generateTaxDeadlines(taxYear, quarter)

  // Save or update tax optimization
  const optimization = await prisma.taxOptimization.upsert({
    where: {
      userId_taxYear_quarter: {
        userId,
        taxYear,
        quarter: quarter || 0
      }
    },
    update: {
      estimatedTaxableIncome,
      estimatedTaxLiability,
      quarterlyEstimate,
      standardDeduction,
      itemizedDeductions,
      businessDeductions,
      recommendations,
      potentialSavings,
      documentsRequired,
      deadlines
    },
    create: {
      userId,
      taxYear,
      quarter,
      estimatedTaxableIncome,
      estimatedTaxLiability,
      quarterlyEstimate,
      standardDeduction,
      itemizedDeductions,
      businessDeductions,
      recommendations,
      potentialSavings,
      documentsRequired,
      deadlines
    }
  })

  return optimization
}

function getStandardDeduction(businessType?: string): number {
  // 2024 standard deductions
  switch (businessType) {
    case 'SOLE_PROPRIETORSHIP':
      return 14600 // Standard deduction for single filers
    case 'LLC':
    case 'PARTNERSHIP':
      return 29200 // Married filing jointly equivalent
    case 'CORPORATION':
    case 'S_CORPORATION':
      return 0 // Corporations don't get standard deduction
    default:
      return 14600
  }
}

function calculateBusinessDeductions(data: any): any {
  const deductions: any = {}

  // Office expenses
  const officeExpenses = data.expenses.filter((e: any) => 
    ['office', 'supplies', 'equipment', 'software', 'internet', 'phone'].some(keyword => 
      e.category.toLowerCase().includes(keyword) || 
      e.description.toLowerCase().includes(keyword)
    )
  )
  deductions.office = officeExpenses.reduce((sum: number, e: any) => sum + Math.abs(e.amount), 0)

  // Vehicle expenses (simplified - would need mileage data for accurate calculation)
  const vehicleExpenses = data.expenses.filter((e: any) => 
    ['fuel', 'gas', 'parking', 'maintenance', 'car'].some(keyword => 
      e.category.toLowerCase().includes(keyword) || 
      e.description.toLowerCase().includes(keyword)
    )
  )
  deductions.vehicle = vehicleExpenses.reduce((sum: number, e: any) => sum + Math.abs(e.amount), 0)

  // Travel expenses
  const travelExpenses = data.expenses.filter((e: any) => 
    ['travel', 'hotel', 'flight', 'lodging'].some(keyword => 
      e.category.toLowerCase().includes(keyword) || 
      e.description.toLowerCase().includes(keyword)
    )
  )
  deductions.travel = travelExpenses.reduce((sum: number, e: any) => sum + Math.abs(e.amount), 0)

  // Meals and entertainment (50% deductible)
  const mealExpenses = data.expenses.filter((e: any) => 
    ['meals', 'restaurant', 'food', 'entertainment', 'client dinner'].some(keyword => 
      e.category.toLowerCase().includes(keyword) || 
      e.description.toLowerCase().includes(keyword)
    )
  )
  deductions.meals = mealExpenses.reduce((sum: number, e: any) => sum + Math.abs(e.amount), 0) * 0.5

  // Professional services
  const professionalExpenses = data.expenses.filter((e: any) => 
    ['legal', 'accounting', 'consulting', 'professional'].some(keyword => 
      e.category.toLowerCase().includes(keyword) || 
      e.description.toLowerCase().includes(keyword)
    )
  )
  deductions.professional = professionalExpenses.reduce((sum: number, e: any) => sum + Math.abs(e.amount), 0)

  // Marketing and advertising
  const marketingExpenses = data.expenses.filter((e: any) => 
    ['marketing', 'advertising', 'promotion', 'website'].some(keyword => 
      e.category.toLowerCase().includes(keyword) || 
      e.description.toLowerCase().includes(keyword)
    )
  )
  deductions.marketing = marketingExpenses.reduce((sum: number, e: any) => sum + Math.abs(e.amount), 0)

  // Insurance premiums
  const insuranceExpenses = data.expenses.filter((e: any) => 
    ['insurance', 'liability', 'coverage'].some(keyword => 
      e.category.toLowerCase().includes(keyword) || 
      e.description.toLowerCase().includes(keyword)
    )
  )
  deductions.insurance = insuranceExpenses.reduce((sum: number, e: any) => sum + Math.abs(e.amount), 0)

  return deductions
}

function calculateItemizedDeductions(data: any): any {
  const deductions: any = {}

  // Home office deduction (simplified method - $5 per sq ft up to 300 sq ft)
  deductions.homeOffice = 1500 // Assuming 300 sq ft home office

  // Business use of home (percentage method would require more data)
  const utilities = data.expenses.filter((e: any) => 
    ['utilities', 'electricity', 'gas', 'water', 'internet'].some(keyword => 
      e.category.toLowerCase().includes(keyword)
    )
  ).reduce((sum: number, e: any) => sum + Math.abs(e.amount), 0)
  
  deductions.homeUtilities = utilities * 0.25 // Assuming 25% business use

  return deductions
}

function calculateTaxLiability(taxableIncome: number, businessType?: string): number {
  // Simplified tax calculation - would need more sophisticated calculation for production
  
  if (businessType === 'CORPORATION') {
    // Corporate tax rate (flat 21% for 2024)
    return taxableIncome * 0.21
  } else {
    // Individual tax brackets (2024) - simplified
    let tax = 0
    
    if (taxableIncome <= 11000) {
      tax = taxableIncome * 0.10
    } else if (taxableIncome <= 44725) {
      tax = 1100 + (taxableIncome - 11000) * 0.12
    } else if (taxableIncome <= 95375) {
      tax = 5147 + (taxableIncome - 44725) * 0.22
    } else if (taxableIncome <= 182050) {
      tax = 16290 + (taxableIncome - 95375) * 0.24
    } else if (taxableIncome <= 231250) {
      tax = 37104 + (taxableIncome - 182050) * 0.32
    } else if (taxableIncome <= 578125) {
      tax = 52832 + (taxableIncome - 231250) * 0.35
    } else {
      tax = 174238 + (taxableIncome - 578125) * 0.37
    }

    // Add self-employment tax for business income
    const seTax = Math.min(taxableIncome * 0.9235, 160200) * 0.153 // 2024 SE tax
    
    return tax + seTax
  }
}

function generateTaxRecommendations(data: any, businessDeductions: any, itemizedDeductions: any): any[] {
  const recommendations = []

  // Maximize business deductions
  const totalBusinessDeductions = (Object.values(businessDeductions) as number[]).reduce((sum: number, val: number) => sum + val, 0)
  if (totalBusinessDeductions < data.expenses.length * 100) { // If avg expense is > $100
    recommendations.push({
      title: 'Maximize Business Deductions',
      description: 'Review expenses to ensure all business deductions are captured',
      category: 'DEDUCTIONS',
      potentialSavings: 2000,
      steps: [
        'Review all business expenses for deductibility',
        'Separate personal and business expenses',
        'Keep detailed records and receipts',
        'Consider home office deduction'
      ]
    })
  }

  // Retirement contributions
  recommendations.push({
    title: 'Maximize Retirement Contributions',
    description: 'Consider SEP-IRA or Solo 401(k) to reduce taxable income',
    category: 'RETIREMENT',
    potentialSavings: 5000,
    steps: [
      'Research retirement plan options',
      'Calculate maximum contribution limits',
      'Set up automatic contributions',
      'Consider catch-up contributions if eligible'
    ]
  })

  // Equipment purchases
  const equipmentExpenses = (Object.values(businessDeductions) as number[]).reduce((sum: number, val: number) => sum + val, 0)
  if (equipmentExpenses < 10000) {
    recommendations.push({
      title: 'Equipment Purchase Timing',
      description: 'Consider timing of equipment purchases for maximum tax benefit',
      category: 'EQUIPMENT',
      potentialSavings: 3000,
      steps: [
        'Plan equipment purchases before year-end',
        'Consider Section 179 deduction',
        'Research bonus depreciation rules',
        'Keep purchase receipts and documentation'
      ]
    })
  }

  // Estimated tax payments
  recommendations.push({
    title: 'Optimize Estimated Tax Payments',
    description: 'Ensure estimated payments are optimized to avoid penalties',
    category: 'PAYMENTS',
    potentialSavings: 1000,
    steps: [
      'Calculate safe harbor payment amounts',
      'Set up automatic quarterly payments',
      'Monitor income throughout year',
      'Adjust estimates as needed'
    ]
  })

  return recommendations
}

function calculatePotentialSavings(recommendations: any[]): number {
  return recommendations.reduce((sum: number, rec: any) => sum + (rec.potentialSavings || 0), 0)
}

function generateRequiredDocuments(businessType?: string): string[] {
  const baseDocuments = [
    'Income statements (invoices, receipts)',
    'Business expense receipts',
    'Bank and credit card statements',
    'Mileage logs (if applicable)',
    'Home office documentation',
    '1099 forms from clients',
    'Previous year tax returns'
  ]

  const additionalByType: { [key: string]: string[] } = {
    'CORPORATION': ['Form 1120 preparation documents', 'Shareholder information'],
    'S_CORPORATION': ['Form 1120S preparation documents', 'K-1 distributions'],
    'PARTNERSHIP': ['Form 1065 preparation documents', 'Partner information'],
    'LLC': ['Operating agreement', 'Member information']
  }

  return [
    ...baseDocuments,
    ...(businessType && additionalByType[businessType] ? additionalByType[businessType] : [])
  ]
}

function generateTaxDeadlines(year: number, quarter?: number | null): any[] {
  const deadlines = [
    {
      date: new Date(year + 1, 0, 31), // January 31
      description: 'Issue 1099 forms to contractors'
    },
    {
      date: new Date(year + 1, 1, 28), // February 28
      description: 'File 1099 forms with IRS'
    },
    {
      date: new Date(year + 1, 2, 15), // March 15
      description: 'S-Corporation and Partnership tax returns due'
    },
    {
      date: new Date(year + 1, 3, 15), // April 15
      description: 'Individual and C-Corporation tax returns due'
    }
  ]

  // Add quarterly estimated tax deadlines
  const quarterlyDates = [
    new Date(year, 3, 15), // Q1 - April 15
    new Date(year, 5, 17), // Q2 - June 17 (15th falls on weekend)
    new Date(year, 8, 16), // Q3 - September 16 (15th falls on weekend)
    new Date(year + 1, 0, 15) // Q4 - January 15
  ]

  quarterlyDates.forEach((date, index) => {
    deadlines.push({
      date,
      description: `Q${index + 1} ${year} estimated tax payment due`
    })
  })

  return deadlines.sort((a, b) => a.date.getTime() - b.date.getTime())
}
