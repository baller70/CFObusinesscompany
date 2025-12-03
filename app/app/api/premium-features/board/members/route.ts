
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic';

const createBoardMemberSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  position: z.string(),
  biography: z.string().optional(),
  expertise: z.any().optional(),
  appointmentDate: z.string().transform(str => new Date(str)),
  termExpiry: z.string().transform(str => new Date(str)).optional(),
  isIndependent: z.boolean().default(false),
  committees: z.any().optional(),
  preferredContact: z.string().optional(),
  timezone: z.string().optional(),
  notes: z.string().optional()
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const boardMembers = await prisma.boardMember.findMany({
      where: { userId: session.user.id, isActive: true },
      include: {
        boardMeetings: {
          include: {
            meeting: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { appointmentDate: 'asc' }
    })

    const totalMembers = boardMembers.length
    const independentMembers = boardMembers.filter(m => m.isIndependent).length
    const expiringTerms = boardMembers.filter(m => 
      m.termExpiry && m.termExpiry <= new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
    ).length

    return NextResponse.json({
      boardMembers,
      summary: {
        totalMembers,
        independentMembers,
        executiveMembers: totalMembers - independentMembers,
        expiringTerms,
        avgTenure: totalMembers > 0 
          ? boardMembers.reduce((sum, m) => {
            const tenure = (Date.now() - m.appointmentDate.getTime()) / (365 * 24 * 60 * 60 * 1000)
            return sum + tenure
          }, 0) / totalMembers
          : 0
      }
    })
  } catch (error) {
    console.error('Error fetching board members:', error)
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
    const validatedData = createBoardMemberSchema.parse(body)

    const boardMember = await prisma.boardMember.create({
      data: {
        userId: session.user.id,
        ...validatedData
      }
    })

    return NextResponse.json(boardMember, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    console.error('Error creating board member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
