
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createInvestmentSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['STOCK', 'BOND', 'MUTUAL_FUND', 'ETF', 'REAL_ESTATE', 'COMMODITIES', 'CRYPTOCURRENCY', 'PRIVATE_EQUITY', 'VENTURE_CAPITAL', 'ALTERNATIVE', 'CASH', 'CD', 'TREASURY', 'CORPORATE_BOND', 'MUNICIPAL_BOND', 'OPTIONS', 'FUTURES', 'FOREX']),
  category: z.enum(['GROWTH', 'VALUE', 'DIVIDEND', 'INCOME', 'SPECULATION', 'HEDGE', 'CORE_HOLDING', 'SATELLITE', 'TACTICAL']),
  symbol: z.string().optional(),
  currentValue: z.number().min(0),
  originalCost: z.number().min(0),
  quantity: z.number().optional(),
  pricePerShare: z.number().optional(),
  currency: z.string().default('USD'),
  purchaseDate: z.string().transform(str => new Date(str)),
  maturityDate: z.string().transform(str => new Date(str)).optional(),
  targetAllocation: z.number().min(0).max(100).optional(),
  riskRating: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  sector: z.string().optional(),
  geography: z.string().optional(),
  benchmarkIndex: z.string().optional(),
  targetPrice: z.number().optional(),
  stopLoss: z.number().optional(),
  notes: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createInvestmentSchema.parse(body)

    // Calculate initial performance metrics
    const totalReturn = validatedData.currentValue - validatedData.originalCost
    const totalReturnPct = validatedData.originalCost > 0 
      ? (totalReturn / validatedData.originalCost) * 100 
      : 0

    const investment = await prisma.investment.create({
      data: {
        userId: session.user.id,
        totalReturn,
        totalReturnPct,
        actualAllocation: 0, // Will be calculated based on portfolio
        ...validatedData
      }
    })

    return NextResponse.json(investment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    console.error('Error creating investment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
