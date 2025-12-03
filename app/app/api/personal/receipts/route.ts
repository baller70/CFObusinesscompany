
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const processed = searchParams.get('processed')

    const where: any = { userId: session.user.id }
    
    if (category && category !== 'all') {
      where.category = category
    }
    
    if (startDate) {
      where.date = { gte: new Date(startDate) }
    }
    
    if (endDate) {
      where.date = { ...where.date, lte: new Date(endDate) }
    }
    
    if (processed !== null && processed !== undefined) {
      where.processed = processed === 'true'
    }

    const receipts = await prisma.receipt.findMany({
      where,
      orderBy: { date: 'desc' }
    })

    // Get statistics
    const stats = await prisma.receipt.groupBy({
      by: ['category'],
      where: { userId: session.user.id },
      _count: { _all: true },
      _sum: { amount: true }
    })

    return NextResponse.json({ receipts, stats })
  } catch (error) {
    console.error('Error fetching receipts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { vendor, amount, date, category, description, cloudStoragePath, taxDeductible, businessExpense } = body

    const receipt = await prisma.receipt.create({
      data: {
        userId: session.user.id,
        vendor,
        amount: parseFloat(amount),
        date: new Date(date),
        category,
        description,
        cloudStoragePath,
        taxDeductible: taxDeductible || false,
        businessExpense: businessExpense !== undefined ? businessExpense : true
      }
    })

    return NextResponse.json({ receipt }, { status: 201 })
  } catch (error) {
    console.error('Error creating receipt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, vendor, amount, date, category, description, taxDeductible, businessExpense, processed } = body

    // Verify ownership
    const existing = await prisma.receipt.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    const receipt = await prisma.receipt.update({
      where: { id },
      data: {
        vendor,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        date: date ? new Date(date) : undefined,
        category,
        description,
        taxDeductible,
        businessExpense,
        processed
      }
    })

    return NextResponse.json({ receipt })
  } catch (error) {
    console.error('Error updating receipt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing receipt ID' }, { status: 400 })
    }

    // Verify ownership
    const existing = await prisma.receipt.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    await prisma.receipt.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting receipt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
