
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
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all active debts for the user
    const debts = await prisma.debt.findMany({
      where: {
        userId: user.id,
        isActive: true
      },
      include: {
        businessProfile: true,
        payments: {
          orderBy: { date: 'desc' },
          take: 5
        }
      },
      orderBy: { priority: 'desc' }
    })

    // Calculate statistics
    const totalDebt = debts.reduce((sum: number, debt) => sum + debt.balance, 0)
    const totalMonthlyPayments = debts.reduce((sum: number, debt) => sum + debt.minimumPayment, 0)
    const highestInterestRate = debts.length > 0 ? Math.max(...debts.map((d) => d.interestRate)) : 0
    const averageInterestRate = debts.length > 0 
      ? debts.reduce((sum: number, debt) => sum + (debt.interestRate * debt.balance), 0) / totalDebt
      : 0

    return NextResponse.json({
      debts,
      statistics: {
        totalDebt,
        totalMonthlyPayments,
        highestInterestRate,
        averageInterestRate: parseFloat(averageInterestRate.toFixed(2))
      }
    })
  } catch (error) {
    console.error('Error fetching debts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    
    const debt = await prisma.debt.create({
      data: {
        userId: user.id,
        businessProfileId: data.businessProfileId || null,
        name: data.name,
        balance: parseFloat(data.balance),
        interestRate: parseFloat(data.interestRate),
        minimumPayment: parseFloat(data.minimumPayment),
        dueDate: parseInt(data.dueDate),
        type: data.type,
        priority: data.priority || 0
      }
    })

    return NextResponse.json({ debt })
  } catch (error) {
    console.error('Error creating debt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
