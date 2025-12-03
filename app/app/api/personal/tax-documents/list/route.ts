
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const documents = await prisma.taxDocument.findMany({
      where: {
        userId: user.id,
        businessProfileId: null
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const stats = {
      totalDocuments: documents.length,
      currentYear: new Date().getFullYear(),
      byType: documents.reduce((acc, doc) => {
        acc[doc.documentType] = (acc[doc.documentType] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({ 
      documents,
      stats 
    })
  } catch (error) {
    console.error('Error fetching tax documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
