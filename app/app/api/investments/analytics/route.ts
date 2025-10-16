
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all investments
    const investments = await prisma.investment.findMany({
      where: { userId: session.user.id, isActive: true }
    })

    // Calculate metrics
    const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0)
    const totalCost = investments.reduce((sum, inv) => sum + inv.originalCost, 0)
    const totalReturn = totalValue - totalCost
    const totalReturnPct = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0

    // Top performers
    const topPerformers = investments
      .sort((a, b) => (b.totalReturnPct || 0) - (a.totalReturnPct || 0))
      .slice(0, 5)

    // Bottom performers
    const bottomPerformers = investments
      .sort((a, b) => (a.totalReturnPct || 0) - (b.totalReturnPct || 0))
      .slice(0, 5)

    // Performance by type
    const performanceByType = investments.reduce((acc: any, inv) => {
      if (!acc[inv.type]) {
        acc[inv.type] = { type: inv.type, totalValue: 0, totalReturn: 0, count: 0 }
      }
      acc[inv.type].totalValue += inv.currentValue
      acc[inv.type].totalReturn += inv.totalReturn || 0
      acc[inv.type].count += 1
      return acc
    }, {})

    return NextResponse.json({
      summary: {
        totalValue,
        totalCost,
        totalReturn,
        totalReturnPct,
        investmentCount: investments.length
      },
      topPerformers,
      bottomPerformers,
      performanceByType: Object.values(performanceByType)
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
