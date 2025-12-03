
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic';

const createCompetitiveAnalysisSchema = z.object({
  competitorName: z.string().min(1),
  industry: z.string().min(1),
  description: z.string().optional(),
  website: z.string().optional(),
  employees: z.number().optional(),
  foundedYear: z.number().optional(),
  estimatedRevenue: z.number().optional(),
  fundingRaised: z.number().optional(),
  valuation: z.number().optional(),
  strengths: z.any().optional(),
  weaknesses: z.any().optional(),
  marketPosition: z.string().optional(),
  targetMarket: z.any().optional(),
  products: z.any().optional(),
  pricing: z.any().optional(),
  features: z.any().optional(),
  threatLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  competitiveGap: z.any().optional(),
  recommendations: z.any().optional(),
  dataSource: z.string().optional(),
  lastUpdated: z.string().transform(str => new Date(str)).default(new Date().toISOString())
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const competitiveAnalyses = await prisma.competitiveAnalysis.findMany({
      where: { userId: session.user.id, isActive: true },
      orderBy: { lastUpdated: 'desc' }
    })

    const totalCompetitors = competitiveAnalyses.length
    const highThreatCompetitors = competitiveAnalyses.filter(c => c.threatLevel === 'HIGH' || c.threatLevel === 'CRITICAL').length
    
    const threatLevelDistribution = competitiveAnalyses.reduce((acc: any, comp) => {
      acc[comp.threatLevel] = (acc[comp.threatLevel] || 0) + 1
      return acc
    }, {})

    const industryDistribution = competitiveAnalyses.reduce((acc: any, comp) => {
      acc[comp.industry] = (acc[comp.industry] || 0) + 1
      return acc
    }, {})

    // Calculate average competitor metrics
    const avgRevenue = competitiveAnalyses
      .filter(c => c.estimatedRevenue)
      .reduce((sum, c) => sum + (c.estimatedRevenue || 0), 0) / 
      (competitiveAnalyses.filter(c => c.estimatedRevenue).length || 1)

    const avgEmployees = competitiveAnalyses
      .filter(c => c.employees)
      .reduce((sum, c) => sum + (c.employees || 0), 0) / 
      (competitiveAnalyses.filter(c => c.employees).length || 1)

    return NextResponse.json({
      competitiveAnalyses,
      summary: {
        totalCompetitors,
        highThreatCompetitors,
        threatLevelDistribution,
        industryDistribution,
        avgRevenue,
        avgEmployees,
        staleAnalyses: competitiveAnalyses.filter(c => 
          (Date.now() - c.lastUpdated.getTime()) > 180 * 24 * 60 * 60 * 1000 // 180 days
        ).length
      }
    })
  } catch (error) {
    console.error('Error fetching competitive analyses:', error)
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
    const validatedData = createCompetitiveAnalysisSchema.parse(body)

    const competitiveAnalysis = await prisma.competitiveAnalysis.create({
      data: {
        userId: session.user.id,
        ...validatedData
      }
    })

    return NextResponse.json(competitiveAnalysis, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    console.error('Error creating competitive analysis:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
