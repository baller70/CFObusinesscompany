
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

    const members = await prisma.householdMember.findMany({
      where: {
        userId: user.id,
        businessProfileId: businessProfileId,
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Error fetching household members:', error)
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

    const member = await prisma.householdMember.create({
      data: {
        userId: user.id,
        businessProfileId: businessProfileId,
        firstName: body.firstName,
        lastName: body.lastName,
        relationship: body.relationship,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        dependentStatus: body.dependentStatus || false,
        email: body.email || null,
        phone: body.phone || null,
        notes: body.notes || null
      }
    })

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    console.error('Error creating household member:', error)
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
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    // Verify ownership
    const existingMember = await prisma.householdMember.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!existingMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const member = await prisma.householdMember.update({
      where: { id: id },
      data: {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        relationship: updateData.relationship,
        birthDate: updateData.birthDate ? new Date(updateData.birthDate) : null,
        dependentStatus: updateData.dependentStatus,
        email: updateData.email || null,
        phone: updateData.phone || null,
        notes: updateData.notes || null
      }
    })

    return NextResponse.json({ member })
  } catch (error) {
    console.error('Error updating household member:', error)
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
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    // Verify ownership
    const existingMember = await prisma.householdMember.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!existingMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    await prisma.householdMember.update({
      where: { id: id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting household member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
