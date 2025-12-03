
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic';

const createRiskAssessmentSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['FINANCIAL', 'OPERATIONAL', 'STRATEGIC', 'COMPLIANCE', 'REPUTATIONAL', 'TECHNOLOGY', 'MARKET', 'CREDIT', 'LIQUIDITY', 'INTEREST_RATE', 'CURRENCY', 'CYBERSECURITY']),
  category: z.enum(['HIGH_LEVEL', 'PROCESS_LEVEL', 'TRANSACTION_LEVEL', 'SYSTEM_LEVEL']),
  description: z.string(),
  probability: z.number().min(0).max(1),
  impact: z.number().min(0),
  mitigationPlan: z.string().optional(),
  mitigationCost: z.number().optional(),
  owner: z.string().optional(),
  reviewer: z.string().optional(),
  reviewDate: z.string().transform(str => new Date(str)).optional(),
  nextReviewDate: z.string().transform(str => new Date(str)).optional(),
  evidence: z.any().optional(),
  controls: z.any().optional(),
  notes: z.string().optional()
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const riskAssessments = await prisma.riskAssessment.findMany({
      where: { userId: session.user.id },
      include: {
        incidents: {
          orderBy: { incidentDate: 'desc' },
          take: 3
        }
      },
      orderBy: { riskScore: 'desc' }
    })

    // Calculate risk statistics
    const totalRisks = riskAssessments.length
    const highRiskCount = riskAssessments.filter(r => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL').length
    const avgRiskScore = totalRisks > 0 
      ? riskAssessments.reduce((sum, r) => sum + r.riskScore, 0) / totalRisks 
      : 0
    
    const risksByType = riskAssessments.reduce((acc: any, risk) => {
      acc[risk.type] = (acc[risk.type] || 0) + 1
      return acc
    }, {})

    const totalIncidents = riskAssessments.reduce((sum, r) => sum + r.incidents.length, 0)

    return NextResponse.json({
      riskAssessments,
      summary: {
        totalRisks,
        highRiskCount,
        avgRiskScore,
        totalIncidents,
        risksByType,
        risksRequiringReview: riskAssessments.filter(r => 
          r.nextReviewDate && r.nextReviewDate <= new Date()
        ).length
      }
    })
  } catch (error) {
    console.error('Error fetching risk assessments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createRiskAssessmentSchema.parse(body)

    // Calculate risk score (probability × impact)
    const riskScore = validatedData.probability * validatedData.impact

    // Determine risk level based on score
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    if (riskScore >= 75000) riskLevel = 'CRITICAL'
    else if (riskScore >= 25000) riskLevel = 'HIGH'
    else if (riskScore >= 5000) riskLevel = 'MEDIUM'
    else riskLevel = 'LOW'

    const riskAssessment = await prisma.riskAssessment.create({
      data: {
        userId: session.user.id,
        riskScore,
        riskLevel,
        status: 'IDENTIFIED',
        ...validatedData
      }
    })

    return NextResponse.json(riskAssessment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    console.error('Error creating risk assessment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
