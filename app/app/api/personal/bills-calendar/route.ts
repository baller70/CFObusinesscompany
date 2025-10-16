import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic';
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
      return NextResponse.json({ bills: [], upcomingTotal: 0 })
    }

    const activeProfileId = user.businessProfiles[0].id;

    // Fetch recurring charges (bills) with next due dates
    const bills = await prisma.recurringCharge.findMany({
      where: {
        businessProfileId: activeProfileId,
        isActive: true
      },
      orderBy: {
        nextDueDate: 'asc'
      }
    })

    // Calculate total for upcoming 30 days
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    const upcomingTotal = bills
      .filter(bill => bill.nextDueDate && new Date(bill.nextDueDate) <= thirtyDaysFromNow)
      .reduce((sum: number, bill: any) => sum + Math.abs(bill.amount), 0)

    const formattedBills = bills.map((bill: any) => ({
      id: bill.id,
      description: bill.description || 'Bill',
      amount: Math.abs(bill.amount),
      dueDate: bill.nextDueDate,
      frequency: bill.frequency,
      category: bill.category || 'Uncategorized',
      isActive: bill.isActive
    }))

    return NextResponse.json({ 
      bills: formattedBills, 
      upcomingTotal 
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
