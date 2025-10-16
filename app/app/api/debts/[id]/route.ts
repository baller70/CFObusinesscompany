
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
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

    const data = await request.json()
    
    const debt = await prisma.debt.update({
      where: {
        id: params.id,
        userId: user.id
      },
      data: {
        ...data,
        balance: data.balance ? parseFloat(data.balance) : undefined,
        interestRate: data.interestRate ? parseFloat(data.interestRate) : undefined,
        minimumPayment: data.minimumPayment ? parseFloat(data.minimumPayment) : undefined,
        dueDate: data.dueDate ? parseInt(data.dueDate) : undefined
      }
    })

    return NextResponse.json({ debt })
  } catch (error) {
    console.error('Error updating debt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
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

    // Soft delete by setting isActive to false
    await prisma.debt.update({
      where: {
        id: params.id,
        userId: user.id
      },
      data: {
        isActive: false
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting debt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
