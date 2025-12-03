import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getCurrentBusinessProfileId } from '@/lib/business-profile-utils'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessProfileId = await getCurrentBusinessProfileId()

    // Find insurance-related transactions
    const insuranceTransactions = await prisma.transaction.findMany({
      where: {
        businessProfileId: businessProfileId,
        type: 'EXPENSE',
        OR: [
          { category: { contains: 'insurance', mode: 'insensitive' } },
          { description: { contains: 'insurance', mode: 'insensitive' } },
        ]
      },
      orderBy: { date: 'desc' }
    })

    const policies = insuranceTransactions.map(tx => ({
      id: tx.id,
      type: tx.category || 'Insurance',
      provider: tx.description,
      premium: Math.abs(tx.amount),
      paymentDate: tx.date
    }))

    return NextResponse.json({ policies })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
