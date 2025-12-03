
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    const data = await request.json()
    
    // Record the payment
    const payment = await prisma.debtPayment.create({
      data: {
        debtId: data.debtId,
        amount: parseFloat(data.amount),
        date: new Date(data.date),
        principal: data.principal ? parseFloat(data.principal) : null,
        interest: data.interest ? parseFloat(data.interest) : null
      }
    })

    // Update debt balance if principal amount is provided
    if (data.principal) {
      const debt = await prisma.debt.findUnique({
        where: { id: data.debtId }
      })

      if (debt) {
        await prisma.debt.update({
          where: { id: data.debtId },
          data: {
            balance: Math.max(0, debt.balance - parseFloat(data.principal))
          }
        })
      }
    }

    return NextResponse.json({ payment })
  } catch (error) {
    console.error('Error recording payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
