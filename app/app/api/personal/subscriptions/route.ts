import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        businessProfiles: {
          where: { isActive: true },
          take: 1
        }
      }
    });

    if (!user || !user.businessProfiles[0]) {
      return NextResponse.json({ subscriptions: [], stats: { totalMonthly: 0, totalAnnual: 0, activeCount: 0 } })
    }

    const activeProfileId = user.businessProfiles[0].id;

    // Fetch recurring charges that look like subscriptions
    const subscriptions = await prisma.recurringCharge.findMany({
      where: {
        businessProfileId: activeProfileId,
        isActive: true,
        frequency: {
          in: ['MONTHLY', 'ANNUALLY']
        }
      },
      orderBy: {
        amount: 'desc'
      }
    })

    // Calculate stats
    let totalMonthly = 0
    let totalAnnual = 0
    
    subscriptions.forEach(sub => {
      const amount = Math.abs(sub.amount)
      if (sub.frequency === 'MONTHLY') {
        totalMonthly += amount
        totalAnnual += amount * 12
      } else if (sub.frequency === 'ANNUALLY') {
        totalAnnual += amount
        totalMonthly += amount / 12
      }
    })

    const formattedSubscriptions = subscriptions.map(sub => ({
      id: sub.id,
      name: sub.description || 'Subscription',
      amount: Math.abs(sub.amount),
      frequency: sub.frequency,
      category: sub.category || 'Uncategorized',
      nextBillingDate: sub.nextDueDate
    }))

    return NextResponse.json({ 
      subscriptions: formattedSubscriptions, 
      stats: { 
        totalMonthly, 
        totalAnnual, 
        activeCount: subscriptions.length 
      } 
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
