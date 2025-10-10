import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getCurrentBusinessProfileId } from '@/lib/business-profile-utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const businessProfileId = await getCurrentBusinessProfileId()

    const assets = await prisma.asset.findMany({
      where: {
        userId: user.id,
        businessProfileId: businessProfileId
      }
    })

    const liabilities = await prisma.liability.findMany({
      where: {
        userId: user.id,
        businessProfileId: businessProfileId
      }
    })

    const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0)
    const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.balance, 0)
    const netWorth = totalAssets - totalLiabilities

    return NextResponse.json({
      assets,
      liabilities,
      totalAssets,
      totalLiabilities,
      netWorth,
      snapshots: []
    })
  } catch (error) {
    console.error('Error fetching net worth:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
