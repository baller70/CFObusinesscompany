
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

    // Fetch retirement accounts for the user
    const accounts = await prisma.retirementAccount.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    })

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0)
    const annualContribution = accounts.reduce((sum, acc) => sum + (acc.annualContribution || 0), 0)
    const employerMatch = accounts.reduce((sum, acc) => sum + (acc.employerMatch || 0), 0)

    return NextResponse.json({ 
      accounts, 
      totalBalance, 
      annualContribution,
      employerMatch,
      accountCount: accounts.length
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
