
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic';

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

    const donations = await prisma.charitableGiving.findMany({
      where: {
        userId: user.id,
        businessProfileId: null
      },
      orderBy: {
        date: 'desc'
      }
    })

    const currentYear = new Date().getFullYear()
    const totalGiving = donations
      .filter(d => new Date(d.date).getFullYear() === currentYear)
      .reduce((sum, d) => sum + d.amount, 0)

    return NextResponse.json({ 
      donations,
      totalGiving 
    })
  } catch (error) {
    console.error('Error fetching charitable giving:', error)
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

    const body = await request.json()
    const { organizationName, amount, date, taxDeductible, receiptNumber, notes } = body

    const donationDate = new Date(date)
    const taxYear = donationDate.getFullYear()

    const donation = await prisma.charitableGiving.create({
      data: {
        userId: user.id,
        businessProfileId: null,
        organizationName,
        amount: parseFloat(amount),
        date: donationDate,
        donationType: 'CASH', // Default to CASH, can be made configurable
        taxYear,
        taxDeductible: taxDeductible !== false,
        receiptNumber: receiptNumber || undefined,
        notes: notes || undefined,
      }
    })

    return NextResponse.json({ 
      success: true,
      donation 
    })
  } catch (error) {
    console.error('Error creating donation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
