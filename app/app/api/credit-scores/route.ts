
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

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

    // Get all credit scores for the user
    const scores = await prisma.creditScore.findMany({
      where: {
        userId: user.id
      },
      include: {
        businessProfile: true
      },
      orderBy: { scoreDate: 'desc' }
    })

    // Group by person/profile
    const scoresByPerson = scores.reduce((acc: any, score: any) => {
      const key = score.businessProfileId || 'personal'
      const personName = score.businessProfile?.businessName || score.provider || 'Personal'
      
      if (!acc[key]) {
        acc[key] = {
          name: personName,
          scores: [],
          latestScore: null
        }
      }
      
      acc[key].scores.push(score)
      
      if (!acc[key].latestScore || new Date(score.scoreDate) > new Date(acc[key].latestScore.scoreDate)) {
        acc[key].latestScore = score
      }
      
      return acc
    }, {})

    return NextResponse.json({
      scores,
      scoresByPerson: Object.values(scoresByPerson)
    })
  } catch (error) {
    console.error('Error fetching credit scores:', error)
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

    const data = await request.json()
    
    const score = await prisma.creditScore.create({
      data: {
        userId: user.id,
        businessProfileId: data.businessProfileId || null,
        score: parseInt(data.score),
        provider: data.provider || data.personName || 'Personal',
        scoreDate: new Date(data.scoreDate || new Date()),
        scoreType: data.scoreType || 'FICO',
        accounts: data.accounts ? parseInt(data.accounts) : null,
        inquiries: data.inquiries ? parseInt(data.inquiries) : null,
        derogatory: data.derogatory ? parseInt(data.derogatory) : null,
        avgAccountAge: data.avgAccountAge ? parseInt(data.avgAccountAge) : null,
        creditUtilization: data.creditUtilization ? parseFloat(data.creditUtilization) : null,
        totalDebt: data.totalDebt ? parseFloat(data.totalDebt) : null,
        paymentHistory: data.paymentHistory ? parseFloat(data.paymentHistory) : null,
        factors: data.factors || null
      }
    })

    return NextResponse.json({ score })
  } catch (error) {
    console.error('Error creating credit score:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
