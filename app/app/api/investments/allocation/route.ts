
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get assets for allocation
    const assets = await prisma.asset.findMany({
      where: { 
        userId: session.user.id,
        type: 'INVESTMENT'
      }
    })

    // Calculate total value
    const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0)

    // Group by category
    const allocationByCategory = assets.reduce((acc: any, asset) => {
      const category = asset.category || 'Other'
      if (!acc[category]) {
        acc[category] = {
          category,
          currentValue: 0,
          currentPct: 0,
          assets: []
        }
      }
      acc[category].currentValue += asset.value
      acc[category].assets.push(asset)
      return acc
    }, {})

    // Calculate percentages
    const allocations = Object.values(allocationByCategory).map((alloc: any) => ({
      ...alloc,
      currentPct: totalValue > 0 ? (alloc.currentValue / totalValue) * 100 : 0
    }))

    return NextResponse.json({
      allocations,
      totalValue,
      totalAssets: assets.length,
      summary: {
        stocks: allocations.filter((a: any) => a.category === 'Stocks').reduce((sum: number, a: any) => sum + a.currentValue, 0),
        bonds: allocations.filter((a: any) => a.category === 'Bonds').reduce((sum: number, a: any) => sum + a.currentValue, 0),
        realEstate: allocations.filter((a: any) => a.category === 'Real Estate').reduce((sum: number, a: any) => sum + a.currentValue, 0),
        cash: allocations.filter((a: any) => a.category === 'Cash').reduce((sum: number, a: any) => sum + a.currentValue, 0)
      }
    })
  } catch (error) {
    console.error('Error fetching allocation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
