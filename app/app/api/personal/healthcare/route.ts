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

    // Find healthcare-related expenses
    const healthcareExpenses = await prisma.transaction.findMany({
      where: {
        businessProfileId: businessProfileId,
        type: 'EXPENSE',
        OR: [
          { category: { contains: 'health', mode: 'insensitive' } },
          { category: { contains: 'medical', mode: 'insensitive' } },
          { category: { contains: 'dental', mode: 'insensitive' } },
          { category: { contains: 'pharmacy', mode: 'insensitive' } },
          { description: { contains: 'health', mode: 'insensitive' } },
          { description: { contains: 'medical', mode: 'insensitive' } },
          { description: { contains: 'doctor', mode: 'insensitive' } },
          { description: { contains: 'hospital', mode: 'insensitive' } },
        ]
      },
      orderBy: { date: 'desc' }
    })

    const totalExpenses = healthcareExpenses.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

    const expenses = healthcareExpenses.map(tx => ({
      id: tx.id,
      description: tx.description,
      amount: Math.abs(tx.amount),
      date: tx.date,
      category: tx.category || 'Healthcare'
    }))

    return NextResponse.json({ expenses, totalExpenses })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
