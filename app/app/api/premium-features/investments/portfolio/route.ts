
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createPortfolioSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['GENERAL', 'RETIREMENT', 'TAXABLE', 'TAX_DEFERRED', 'HEDGE_FUND', 'PRIVATE_EQUITY', 'REAL_ESTATE', 'COMMODITIES', 'EMERGENCY_FUND']),
  equityTarget: z.number().min(0).max(100).optional(),
  bondTarget: z.number().min(0).max(100).optional(),
  cashTarget: z.number().min(0).max(100).optional(),
  alternativeTarget: z.number().min(0).max(100).optional(),
  baseCurrency: z.string().default('USD'),
  notes: z.string().optional()
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get portfolios
    const portfolios = await prisma.portfolio.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    })

    // Get investments for each portfolio
    const portfoliosWithInvestments = await Promise.all(
      portfolios.map(async (portfolio) => {
        const investments = await prisma.investment.findMany({
          where: {
            userId: session.user.id,
            businessProfileId: portfolio.businessProfileId
          }
        })

        return {
          ...portfolio,
          totalInvestments: investments.length,
          performanceScore: Math.min(100, Math.max(0, 50 + portfolio.totalReturnPct * 2)),
          riskScore: calculateRiskScore(investments),
          diversificationScore: calculateDiversificationScore(investments)
        }
      })
    )

    return NextResponse.json({
      portfolios: portfoliosWithInvestments,
      summary: {
        totalPortfolios: portfolios.length,
        totalValue: portfolios.reduce((sum, p) => sum + p.totalValue, 0),
        totalReturn: portfolios.reduce((sum, p) => sum + p.totalReturn, 0),
        avgReturnPct: portfolios.length > 0 
          ? portfolios.reduce((sum, p) => sum + p.totalReturnPct, 0) / portfolios.length 
          : 0
      }
    })
  } catch (error) {
    console.error('Error fetching portfolios:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateRiskScore(investments: any[]): number {
  if (investments.length === 0) return 0
  
  // Calculate based on risk ratings
  const riskWeights = { LOW: 20, MEDIUM: 50, HIGH: 80 }
  const avgRisk = investments.reduce((sum, inv) => {
    const weight = riskWeights[inv.riskRating as keyof typeof riskWeights] || 50
    return sum + weight
  }, 0) / investments.length
  
  return Math.round(avgRisk)
}

function calculateDiversificationScore(investments: any[]): number {
  if (investments.length === 0) return 0
  
  // Count unique types and sectors
  const uniqueTypes = new Set(investments.map(inv => inv.type))
  const uniqueSectors = new Set(investments.map(inv => inv.sector))
  
  // Score based on diversification
  const typeScore = Math.min(100, uniqueTypes.size * 20)
  const sectorScore = Math.min(100, uniqueSectors.size * 15)
  const countScore = Math.min(100, investments.length * 10)
  
  return Math.round((typeScore + sectorScore + countScore) / 3)
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createPortfolioSchema.parse(body)

    const portfolio = await prisma.portfolio.create({
      data: {
        userId: session.user.id,
        ...validatedData
      }
    })

    return NextResponse.json(portfolio, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    console.error('Error creating portfolio:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
