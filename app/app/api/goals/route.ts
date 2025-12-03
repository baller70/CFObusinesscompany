
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

    // Get user and their business profiles
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        businessProfiles: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get current business profile ID from query param or user's current profile
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId') || user.currentBusinessProfileId
    
    // Fetch goals for the business profile
    const goals = await prisma.goal.findMany({
      where: {
        businessProfileId: profileId || undefined
      },
      include: {
        businessProfile: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Also get goals for all profiles if needed
    const allProfileGoals = await prisma.goal.findMany({
      where: {
        businessProfileId: {
          in: user.businessProfiles.map(p => p.id)
        }
      },
      include: {
        businessProfile: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ 
      goals,
      allGoals: allProfileGoals,
      currentProfileId: profileId,
      profiles: user.businessProfiles
    })
  } catch (error) {
    console.error('❌ Goals fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, businessProfileId, name, description, targetAmount, currentAmount, targetDate, type, priority } = body

    if (!userId || !name || !targetAmount || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const goal = await prisma.goal.create({
      data: {
        userId,
        businessProfileId: businessProfileId || null,
        name,
        description: description || null,
        targetAmount: parseFloat(targetAmount),
        currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
        targetDate: targetDate ? new Date(targetDate) : null,
        type,
        priority: priority ? parseInt(priority) : 0,
        isCompleted: false
      }
    })

    return NextResponse.json({ success: true, goal })
  } catch (error) {
    console.error('❌ Goal creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    )
  }
}
