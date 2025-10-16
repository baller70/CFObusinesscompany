
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        businessProfiles: {
          where: { isActive: true },
          take: 1
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const activeProfileId = user.businessProfiles[0]?.id

    const where: any = {
      userId: user.id
    }

    // Filter by active profile if exists
    if (activeProfileId) {
      where.OR = [
        { businessProfileId: activeProfileId },
        { businessProfileId: null } // Include bills without profile assignment
      ]
    }

    // Filter by date range if provided
    if (start && end) {
      where.dueDate = {
        gte: new Date(start),
        lte: new Date(end)
      }
    }

    const bills = await prisma.bill.findMany({
      where,
      include: {
        vendor: true
      },
      orderBy: { dueDate: 'asc' }
    })

    return NextResponse.json({ bills })
  } catch (error) {
    console.error('Error fetching bills:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { description, amount, dueDate, vendorId, notes, isRecurring, frequency } = body

    if (!description || !amount || !dueDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        businessProfiles: {
          where: { isActive: true },
          take: 1
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const activeProfileId = user.businessProfiles[0]?.id

    // Create the bill
    const bill = await prisma.bill.create({
      data: {
        userId: user.id,
        businessProfileId: activeProfileId || null,
        description,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        vendorId: vendorId || null,
        notes: notes || null,
        status: 'PENDING'
      }
    })

    // If recurring, create a recurring charge
    if (isRecurring && frequency && activeProfileId) {
      // Calculate next due date based on frequency
      const nextDueDate = new Date(dueDate)
      switch (frequency) {
        case 'WEEKLY':
          nextDueDate.setDate(nextDueDate.getDate() + 7)
          break
        case 'BIWEEKLY':
          nextDueDate.setDate(nextDueDate.getDate() + 14)
          break
        case 'MONTHLY':
          nextDueDate.setMonth(nextDueDate.getMonth() + 1)
          break
        case 'QUARTERLY':
          nextDueDate.setMonth(nextDueDate.getMonth() + 3)
          break
        case 'SEMIANNUALLY':
          nextDueDate.setMonth(nextDueDate.getMonth() + 6)
          break
        case 'ANNUALLY':
          nextDueDate.setFullYear(nextDueDate.getFullYear() + 1)
          break
      }

      // Calculate annual amount
      const frequencyMultipliers: { [key: string]: number } = {
        WEEKLY: 52,
        BIWEEKLY: 26,
        MONTHLY: 12,
        QUARTERLY: 4,
        SEMIANNUALLY: 2,
        ANNUALLY: 1
      }
      const annualAmount = parseFloat(amount) * (frequencyMultipliers[frequency] || 12)

      await prisma.recurringCharge.create({
        data: {
          userId: user.id,
          businessProfileId: activeProfileId,
          name: description,
          description: notes || description,
          amount: parseFloat(amount),
          category: 'Bills',
          frequency,
          nextDueDate,
          billingCycle: 1,
          reminderEnabled: true,
          reminderDays: 3,
          isActive: true,
          isPaused: false,
          annualAmount,
          taxDeductible: false,
          businessExpense: false,
          autoPayEnabled: false
        }
      })
    }

    return NextResponse.json({ bill, success: true })
  } catch (error) {
    console.error('Error creating bill:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
