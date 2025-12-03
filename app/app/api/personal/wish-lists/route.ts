
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

    const wishLists = await prisma.wishList.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ wishLists })
  } catch (error) {
    console.error('Error fetching wish lists:', error)
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
    const { name, description, category, priority, targetAmount, targetDate, notes } = body

    const wishList = await prisma.wishList.create({
      data: {
        userId: session.user.id,
        name,
        description,
        category,
        priority: priority || 'MEDIUM',
        targetAmount: targetAmount ? parseFloat(targetAmount) : null,
        targetDate: targetDate ? new Date(targetDate) : null,
        notes
      }
    })

    return NextResponse.json({ wishList }, { status: 201 })
  } catch (error) {
    console.error('Error creating wish list:', error)
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
    const { id, name, description, category, priority, targetAmount, savedAmount, targetDate, isActive, notes } = body

    // Verify ownership
    const existing = await prisma.wishList.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Wish list not found' }, { status: 404 })
    }

    const wishList = await prisma.wishList.update({
      where: { id },
      data: {
        name,
        description,
        category,
        priority,
        targetAmount: targetAmount ? parseFloat(targetAmount) : null,
        savedAmount: savedAmount !== undefined ? parseFloat(savedAmount) : undefined,
        targetDate: targetDate ? new Date(targetDate) : null,
        isActive,
        notes
      }
    })

    return NextResponse.json({ wishList })
  } catch (error) {
    console.error('Error updating wish list:', error)
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
      return NextResponse.json({ error: 'Missing wish list ID' }, { status: 400 })
    }

    // Verify ownership
    const existing = await prisma.wishList.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Wish list not found' }, { status: 404 })
    }

    await prisma.wishList.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting wish list:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
