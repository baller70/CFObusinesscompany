
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Verify the bill belongs to the user
    const bill = await prisma.bill.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    await prisma.bill.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bill:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { dueDate, status, amount, description } = body

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify the bill belongs to the user
    const bill = await prisma.bill.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    const updatedBill = await prisma.bill.update({
      where: { id: params.id },
      data: {
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(status && { status }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(description && { description })
      }
    })

    return NextResponse.json({ bill: updatedBill, success: true })
  } catch (error) {
    console.error('Error updating bill:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
