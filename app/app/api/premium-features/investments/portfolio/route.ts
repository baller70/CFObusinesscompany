
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

    const portfolios = await prisma.portfolio.findMany({
      where: { userId: session.user.id },
      include: {
        investments: {
          include: {
            investment: true
          }
        },
        rebalanceEvents: {
          orderBy: { rebalanceDate: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate portfolio performance metrics
    const portfoliosWithMetrics = portfolios.map(portfolio => ({
      ...portfolio,
      totalInvestments: portfolio.investments.length,
      performanceScore: Math.random() * 100, // This would be calculated based on actual performance
      riskScore: Math.random() * 100,
      diversificationScore: Math.random() * 100
    }))

    return NextResponse.json({
      portfolios: portfoliosWithMetrics,
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
