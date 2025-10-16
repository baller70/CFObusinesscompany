import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic';
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

    const businessProfileId = await getCurrentBusinessProfileId()

    // Find donation/charity-related transactions
    const donationTransactions = await prisma.transaction.findMany({
      where: {
        businessProfileId: businessProfileId,
        type: 'EXPENSE',
        OR: [
          { category: { contains: 'donation', mode: 'insensitive' } },
          { category: { contains: 'charity', mode: 'insensitive' } },
          { category: { contains: 'gift', mode: 'insensitive' } },
          { description: { contains: 'donation', mode: 'insensitive' } },
          { description: { contains: 'charity', mode: 'insensitive' } },
          { description: { contains: 'giving', mode: 'insensitive' } },
        ]
      },
      orderBy: { date: 'desc' }
    })

    const totalGiving = donationTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

    const donations = donationTransactions.map(tx => ({
      id: tx.id,
      recipient: tx.description,
      amount: Math.abs(tx.amount),
      date: tx.date,
      category: tx.category || 'Charitable Giving'
    }))

    return NextResponse.json({ donations, totalGiving })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
