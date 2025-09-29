
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, description, targetAmount, currentAmount, targetDate, type } = body

    if (!userId || !name || !targetAmount || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const goal = await prisma.goal.create({
      data: {
        userId,
        name,
        description,
        targetAmount,
        currentAmount: currentAmount || 0,
        targetDate: targetDate ? new Date(targetDate) : null,
        type
      }
    })

    return NextResponse.json({ success: true, goal })
  } catch (error) {
    console.error('Goal creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ goals })
  } catch (error) {
    console.error('Goals fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    )
  }
}
