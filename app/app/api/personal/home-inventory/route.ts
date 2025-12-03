
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getCurrentBusinessProfileId } from '@/lib/business-profile-utils'

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

    const businessProfileId = await getCurrentBusinessProfileId()

    const items = await prisma.homeInventoryItem.findMany({
      where: {
        userId: user.id,
        businessProfileId: businessProfileId
      },
      orderBy: { createdAt: 'desc' }
    })

    const totalValue = items.reduce((sum, item) => sum + (item.currentValue || 0), 0)

    return NextResponse.json({ items, totalValue })
  } catch (error) {
    console.error('Error fetching home inventory:', error)
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
    const businessProfileId = await getCurrentBusinessProfileId()

    const item = await prisma.homeInventoryItem.create({
      data: {
        userId: user.id,
        businessProfileId: businessProfileId,
        name: body.name,
        description: body.description || null,
        category: body.category,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        purchasePrice: body.purchasePrice ? parseFloat(body.purchasePrice) : null,
        currentValue: body.currentValue ? parseFloat(body.currentValue) : null,
        location: body.location || null,
        brand: body.brand || null,
        model: body.model || null,
        serialNumber: body.serialNumber || null,
        warrantyExpiration: body.warrantyExpiration ? new Date(body.warrantyExpiration) : null,
        notes: body.notes || null,
        tags: body.tags || null
      }
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Error creating home inventory item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    // Verify ownership
    const existingItem = await prisma.homeInventoryItem.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const item = await prisma.homeInventoryItem.update({
      where: { id: id },
      data: {
        name: updateData.name,
        description: updateData.description || null,
        category: updateData.category,
        purchaseDate: updateData.purchaseDate ? new Date(updateData.purchaseDate) : null,
        purchasePrice: updateData.purchasePrice ? parseFloat(updateData.purchasePrice) : null,
        currentValue: updateData.currentValue ? parseFloat(updateData.currentValue) : null,
        location: updateData.location || null,
        brand: updateData.brand || null,
        model: updateData.model || null,
        serialNumber: updateData.serialNumber || null,
        warrantyExpiration: updateData.warrantyExpiration ? new Date(updateData.warrantyExpiration) : null,
        notes: updateData.notes || null,
        tags: updateData.tags || null
      }
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error updating home inventory item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    // Verify ownership
    const existingItem = await prisma.homeInventoryItem.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    await prisma.homeInventoryItem.delete({
      where: { id: id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting home inventory item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
