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

    const businessProfileId = await getCurrentBusinessProfileId()

    // Find education-related transactions
    const educationTransactions = await prisma.transaction.findMany({
      where: {
        businessProfileId: businessProfileId,
        OR: [
          { category: { contains: 'education', mode: 'insensitive' } },
          { category: { contains: 'school', mode: 'insensitive' } },
          { category: { contains: 'tuition', mode: 'insensitive' } },
          { description: { contains: 'education', mode: 'insensitive' } },
          { description: { contains: 'school', mode: 'insensitive' } },
          { description: { contains: 'tuition', mode: 'insensitive' } },
        ]
      },
      orderBy: { date: 'desc' }
    })

    const totalSavings = educationTransactions
      .filter(tx => tx.type === 'INCOME' || tx.amount > 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

    return NextResponse.json({ 
      accounts: educationTransactions.slice(0, 10).map(tx => ({
        id: tx.id,
        name: tx.description,
        balance: Math.abs(tx.amount),
        date: tx.date
      })), 
      totalSavings 
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
