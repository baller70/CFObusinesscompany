import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getCurrentBusinessProfileId } from '@/lib/business-profile-utils'

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

    // Get all bank accounts and cash as emergency fund
    const assets = await prisma.asset.findMany({
      where: {
        userId: user.id,
        businessProfileId: businessProfileId,
        type: { in: ['BANK_ACCOUNT', 'CASH'] }
      }
    })

    const currentAmount = assets.reduce((sum, asset) => sum + asset.value, 0)

    // Calculate monthly expenses from last 3 months
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const transactions = await prisma.transaction.findMany({
      where: {
        businessProfileId: businessProfileId,
        type: 'EXPENSE',
        date: { gte: threeMonthsAgo }
      }
    })

    const totalExpenses = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
    const monthlyExpenses = totalExpenses / 3
    const targetAmount = monthlyExpenses * 6 // 6 months of expenses
    const monthsCovered = monthlyExpenses > 0 ? currentAmount / monthlyExpenses : 0
    const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0

    return NextResponse.json({ 
      currentAmount, 
      targetAmount, 
      monthlyExpenses, 
      monthsCovered, 
      progress 
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
