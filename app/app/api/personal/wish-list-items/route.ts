
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const wishListId = searchParams.get('wishListId')

    if (!wishListId) {
      return NextResponse.json({ error: 'Missing wish list ID' }, { status: 400 })
    }

    // Verify ownership
    const wishList = await prisma.wishList.findFirst({
      where: { id: wishListId, userId: session.user.id }
    })

    if (!wishList) {
      return NextResponse.json({ error: 'Wish list not found' }, { status: 404 })
    }

    const items = await prisma.wishListItem.findMany({
      where: { wishListId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching wish list items:', error)
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
    const { wishListId, name, description, estimatedCost, url, imageUrl, priority, notes } = body

    // Verify ownership
    const wishList = await prisma.wishList.findFirst({
      where: { id: wishListId, userId: session.user.id }
    })

    if (!wishList) {
      return NextResponse.json({ error: 'Wish list not found' }, { status: 404 })
    }

    const item = await prisma.wishListItem.create({
      data: {
        wishListId,
        name,
        description,
        estimatedCost: parseFloat(estimatedCost),
        url,
        imageUrl,
        priority: priority || 'MEDIUM',
        notes
      }
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Error creating wish list item:', error)
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
    const { id, name, description, estimatedCost, url, imageUrl, priority, isPurchased, purchasedDate, actualCost, notes } = body

    // Verify ownership through wishList
    const item = await prisma.wishListItem.findUnique({
      where: { id },
      include: { wishList: true }
    })

    if (!item || item.wishList.userId !== session.user.id) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const updatedItem = await prisma.wishListItem.update({
      where: { id },
      data: {
        name,
        description,
        estimatedCost: estimatedCost !== undefined ? parseFloat(estimatedCost) : undefined,
        url,
        imageUrl,
        priority,
        isPurchased,
        purchasedDate: purchasedDate ? new Date(purchasedDate) : null,
        actualCost: actualCost !== undefined ? parseFloat(actualCost) : null,
        notes
      }
    })

    return NextResponse.json({ item: updatedItem })
  } catch (error) {
    console.error('Error updating wish list item:', error)
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
      return NextResponse.json({ error: 'Missing item ID' }, { status: 400 })
    }

    // Verify ownership through wishList
    const item = await prisma.wishListItem.findUnique({
      where: { id },
      include: { wishList: true }
    })

    if (!item || item.wishList.userId !== session.user.id) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    await prisma.wishListItem.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting wish list item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
