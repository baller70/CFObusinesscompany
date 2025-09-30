
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { addMonths, addQuarters, addYears, format } from 'date-fns'

// Track business compliance requirements
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const complianceData = await req.json()
    const userId = session.user.id

    // Generate compliance requirements based on type and industry
    const requirements = generateComplianceRequirements(complianceData.complianceType, complianceData.industry)
    
    // Calculate next review date based on frequency
    const nextReviewDate = calculateNextReviewDate(complianceData.frequency)
    
    // Assess risk level based on compliance type and business factors
    const riskLevel = assessComplianceRiskLevel(complianceData.complianceType, complianceData.industry)

    const compliance = await prisma.complianceTracking.create({
      data: {
        userId,
        complianceType: complianceData.complianceType.toUpperCase(),
        title: complianceData.title,
        description: complianceData.description,
        requirements,
        regulations: complianceData.regulations,
        industry: complianceData.industry,
        status: 'PENDING',
        completedItems: [],
        pendingItems: requirements.map((req: any, index: number) => ({ id: index, requirement: req, completed: false })),
        overdue: false,
        dueDate: complianceData.dueDate ? new Date(complianceData.dueDate) : nextReviewDate,
        nextReviewDate,
        frequency: complianceData.frequency?.toUpperCase(),
        documents: [],
        evidence: [],
        notes: complianceData.notes,
        riskLevel: riskLevel as any,
        penalties: generatePotentialPenalties(complianceData.complianceType)
      }
    })

    return NextResponse.json({ success: true, compliance })

  } catch (error) {
    console.error('Create compliance tracking error:', error)
    return NextResponse.json({ error: 'Failed to create compliance tracking' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const complianceType = searchParams.get('complianceType')
    const status = searchParams.get('status')
    const overdue = searchParams.get('overdue') === 'true'

    const compliance = await prisma.complianceTracking.findMany({
      where: {
        userId: session.user.id,
        ...(complianceType && { complianceType: complianceType.toUpperCase() as any }),
        ...(status && { status: status.toUpperCase() as any }),
        ...(overdue !== undefined && { overdue })
      },
      orderBy: [
        { overdue: 'desc' },
        { riskLevel: 'desc' },
        { dueDate: 'asc' }
      ]
    })

    // Update overdue status
    const now = new Date()
    const updatedCompliance = await Promise.all(
      compliance.map(async (comp) => {
        const isOverdue = !!(comp.dueDate && comp.dueDate < now && comp.status !== 'COMPLIANT')
        if (isOverdue !== comp.overdue) {
          return await prisma.complianceTracking.update({
            where: { id: comp.id },
            data: { overdue: isOverdue }
          })
        }
        return comp
      })
    )

    const summary = {
      totalCompliance: updatedCompliance.length,
      compliant: updatedCompliance.filter(c => c.status === 'COMPLIANT').length,
      pending: updatedCompliance.filter(c => c.status === 'PENDING').length,
      overdue: updatedCompliance.filter(c => c.overdue).length,
      highRisk: updatedCompliance.filter(c => c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL').length,
      upcomingDeadlines: updatedCompliance.filter(c => 
        c.dueDate && c.dueDate > now && 
        c.dueDate < addMonths(now, 1) && 
        c.status !== 'COMPLIANT'
      ).length
    }

    return NextResponse.json({ compliance: updatedCompliance, summary })

  } catch (error) {
    console.error('Get compliance tracking error:', error)
    return NextResponse.json({ error: 'Failed to get compliance tracking' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { complianceId, updates } = await req.json()

    // Calculate compliance status based on completed items
    let newStatus = updates.status
    if (updates.completedItems && updates.pendingItems) {
      const totalItems = updates.completedItems.length + updates.pendingItems.length
      const completedCount = updates.completedItems.length
      
      if (completedCount === 0) newStatus = 'PENDING'
      else if (completedCount === totalItems) newStatus = 'COMPLIANT'
      else newStatus = 'PARTIALLY_COMPLIANT'
    }

    const updatedCompliance = await prisma.complianceTracking.update({
      where: {
        id: complianceId,
        userId: session.user.id
      },
      data: {
        ...updates,
        status: newStatus,
        lastReviewDate: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, compliance: updatedCompliance })

  } catch (error) {
    console.error('Update compliance tracking error:', error)
    return NextResponse.json({ error: 'Failed to update compliance tracking' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const complianceId = searchParams.get('complianceId')

    if (!complianceId) {
      return NextResponse.json({ error: 'Compliance ID required' }, { status: 400 })
    }

    await prisma.complianceTracking.delete({
      where: {
        id: complianceId,
        userId: session.user.id
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete compliance tracking error:', error)
    return NextResponse.json({ error: 'Failed to delete compliance tracking' }, { status: 500 })
  }
}

function generateComplianceRequirements(complianceType: string, industry?: string): any[] {
  const baseRequirements: { [key: string]: string[] } = {
    'TAX_COMPLIANCE': [
      'File quarterly estimated tax payments',
      'Maintain organized financial records',
      'Submit annual tax returns on time',
      'Issue 1099 forms to contractors',
      'Keep receipts and documentation',
      'Reconcile business bank statements',
      'Calculate and pay payroll taxes',
      'File state and local tax returns'
    ],
    'REGULATORY_COMPLIANCE': [
      'Maintain business license',
      'Comply with zoning regulations',
      'Follow industry-specific regulations',
      'Submit required regulatory filings',
      'Maintain compliance documentation',
      'Conduct regular compliance audits',
      'Update policies and procedures',
      'Train employees on compliance requirements'
    ],
    'FINANCIAL_REPORTING': [
      'Prepare monthly financial statements',
      'Conduct annual financial audit',
      'Maintain general ledger',
      'Reconcile all accounts monthly',
      'Prepare cash flow statements',
      'Create budget vs actual reports',
      'Document accounting policies',
      'Maintain audit trail'
    ],
    'DATA_PRIVACY': [
      'Implement data protection policies',
      'Conduct privacy impact assessments',
      'Maintain data processing records',
      'Provide privacy notices to customers',
      'Implement data breach procedures',
      'Train staff on privacy requirements',
      'Conduct regular privacy audits',
      'Maintain data retention schedules'
    ],
    'EMPLOYMENT_LAW': [
      'Maintain employee records',
      'Post required workplace notices',
      'Comply with wage and hour laws',
      'Provide required benefits',
      'Maintain workplace safety standards',
      'Conduct background checks as required',
      'Provide equal employment opportunities',
      'Maintain workers compensation insurance'
    ],
    'ENVIRONMENTAL': [
      'Obtain required environmental permits',
      'Conduct environmental assessments',
      'Maintain waste disposal records',
      'Comply with emission standards',
      'Implement environmental management system',
      'Conduct regular environmental monitoring',
      'Train employees on environmental procedures',
      'Maintain emergency response plans'
    ],
    'SAFETY_STANDARDS': [
      'Conduct regular safety inspections',
      'Maintain safety equipment',
      'Provide safety training to employees',
      'Maintain incident reporting system',
      'Comply with OSHA requirements',
      'Conduct emergency drills',
      'Maintain first aid supplies',
      'Document safety procedures'
    ]
  }

  const industrySpecific: { [key: string]: { [key: string]: string[] } } = {
    'Healthcare': {
      'REGULATORY_COMPLIANCE': [
        'Maintain HIPAA compliance',
        'Follow medical device regulations',
        'Comply with patient safety standards',
        'Maintain medical licenses'
      ]
    },
    'Financial Services': {
      'REGULATORY_COMPLIANCE': [
        'Comply with banking regulations',
        'Maintain AML compliance',
        'Follow securities regulations',
        'Conduct regular compliance testing'
      ]
    },
    'Food Service': {
      'SAFETY_STANDARDS': [
        'Maintain food safety certifications',
        'Follow health department regulations',
        'Conduct regular health inspections',
        'Maintain food handling procedures'
      ]
    }
  }

  let requirements = baseRequirements[complianceType] || []
  
  // Add industry-specific requirements
  if (industry && industrySpecific[industry] && industrySpecific[industry][complianceType]) {
    requirements = [...requirements, ...industrySpecific[industry][complianceType]]
  }

  return requirements.map((req, index) => ({
    id: index,
    requirement: req,
    completed: false,
    dueDate: null,
    notes: ''
  }))
}

function calculateNextReviewDate(frequency?: string): Date {
  const now = new Date()
  
  switch (frequency?.toUpperCase()) {
    case 'MONTHLY':
      return addMonths(now, 1)
    case 'QUARTERLY':
      return addQuarters(now, 1)
    case 'SEMI_ANNUALLY':
      return addMonths(now, 6)
    case 'ANNUALLY':
      return addYears(now, 1)
    case 'BI_ANNUALLY':
      return addYears(now, 2)
    default:
      return addQuarters(now, 1) // Default to quarterly
  }
}

function assessComplianceRiskLevel(complianceType: string, industry?: string): string {
  const highRiskTypes = ['TAX_COMPLIANCE', 'REGULATORY_COMPLIANCE', 'DATA_PRIVACY']
  const highRiskIndustries = ['Healthcare', 'Financial Services', 'Food Service']
  
  if (highRiskTypes.includes(complianceType)) {
    if (highRiskIndustries.includes(industry || '')) {
      return 'CRITICAL'
    }
    return 'HIGH'
  }
  
  const mediumRiskTypes = ['EMPLOYMENT_LAW', 'FINANCIAL_REPORTING']
  if (mediumRiskTypes.includes(complianceType)) {
    return 'MEDIUM'
  }
  
  return 'LOW'
}

function generatePotentialPenalties(complianceType: string): any[] {
  const penaltyTypes: { [key: string]: any[] } = {
    'TAX_COMPLIANCE': [
      { type: 'Late Filing Penalty', range: '$135 - $10,000', description: 'Penalty for late tax return filing' },
      { type: 'Late Payment Penalty', range: '0.5% - 25% of tax owed', description: 'Monthly penalty for late tax payments' },
      { type: 'Accuracy Penalty', range: '20% of underpayment', description: 'Penalty for substantial understatement' }
    ],
    'REGULATORY_COMPLIANCE': [
      { type: 'Civil Penalties', range: '$1,000 - $100,000', description: 'Fines for regulatory violations' },
      { type: 'License Suspension', range: 'Varies', description: 'Temporary loss of operating license' },
      { type: 'Criminal Penalties', range: 'Varies', description: 'Potential criminal charges for serious violations' }
    ],
    'DATA_PRIVACY': [
      { type: 'GDPR Fines', range: 'Up to €20M or 4% of revenue', description: 'European data privacy violations' },
      { type: 'State Privacy Fines', range: '$100 - $7,500 per violation', description: 'State-level privacy violations' },
      { type: 'Class Action Lawsuits', range: 'Varies', description: 'Private lawsuits from data breaches' }
    ],
    'EMPLOYMENT_LAW': [
      { type: 'EEOC Fines', range: '$50,000 - $300,000', description: 'Employment discrimination violations' },
      { type: 'Wage & Hour Penalties', range: '$1,000 - $10,000 per violation', description: 'Fair Labor Standards Act violations' },
      { type: 'OSHA Fines', range: '$15,625 - $156,259', description: 'Workplace safety violations' }
    ],
    'FINANCIAL_REPORTING': [
      { type: 'SEC Penalties', range: '$5,000 - $500,000', description: 'Securities reporting violations' },
      { type: 'Auditor Sanctions', range: 'Varies', description: 'Professional sanctions from accounting boards' },
      { type: 'Investor Lawsuits', range: 'Varies', description: 'Private lawsuits from stakeholders' }
    ]
  }

  return penaltyTypes[complianceType] || [
    { type: 'General Penalties', range: 'Varies', description: 'Fines and penalties for non-compliance' }
  ]
}
