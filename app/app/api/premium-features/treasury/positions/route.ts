
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic';

const createCashPositionSchema = z.object({
  accountName: z.string().min(1),
  accountType: z.enum(['CHECKING', 'SAVINGS', 'MONEY_MARKET', 'CD', 'TREASURY', 'SWEEP', 'ESCROW', 'OPERATING', 'INVESTMENT']),
  bankName: z.string().optional(),
  currentBalance: z.number(),
  availableBalance: z.number().optional(),
  currency: z.string().default('USD'),
  interestRate: z.number().optional(),
  monthlyFees: z.number().optional(),
  minimumBalance: z.number().optional(),
  targetBalance: z.number().optional(),
  sweepAccount: z.string().optional(),
  fdic: z.boolean().default(false),
  riskRating: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('LOW'),
  notes: z.string().optional()
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cashPositions = await prisma.cashPosition.findMany({
      where: { userId: session.user.id, isActive: true },
      include: {
        cashFlows: {
          where: {
            date: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          orderBy: { date: 'desc' },
          take: 10
        }
      },
      orderBy: { currentBalance: 'desc' }
    })

    const totalCash = cashPositions.reduce((sum, pos) => sum + pos.currentBalance, 0)
    const totalAvailable = cashPositions.reduce((sum, pos) => sum + (pos.availableBalance || pos.currentBalance), 0)
    const totalInterestEarning = cashPositions.filter(pos => pos.interestRate && pos.interestRate > 0).length
    const totalFees = cashPositions.reduce((sum, pos) => sum + (pos.monthlyFees || 0), 0)

    return NextResponse.json({
      cashPositions,
      summary: {
        totalCash,
        totalAvailable,
        totalAccounts: cashPositions.length,
        interestEarningAccounts: totalInterestEarning,
        monthlyFees: totalFees,
        fdieInsured: cashPositions.filter(pos => pos.fdic).length
      }
    })
  } catch (error) {
    console.error('Error fetching cash positions:', error)
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
    const validatedData = createCashPositionSchema.parse(body)

    const cashPosition = await prisma.cashPosition.create({
      data: {
        userId: session.user.id,
        ...validatedData
      }
    })

    return NextResponse.json(cashPosition, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    console.error('Error creating cash position:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
