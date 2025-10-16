import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic';
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

    const businessProfileId = await getCurrentBusinessProfileId()

    // Get last 6 months of transactions
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const transactions = await prisma.transaction.findMany({
      where: {
        businessProfileId: businessProfileId,
        date: { gte: sixMonthsAgo }
      },
      orderBy: { date: 'asc' }
    })

    // Group by month
    const monthlyData: Record<string, { income: number; expense: number }> = {}
    transactions.forEach(tx => {
      const monthKey = tx.date.toISOString().substring(0, 7) // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 }
      }
      if (tx.type === 'INCOME') {
        monthlyData[monthKey].income += tx.amount
      } else {
        monthlyData[monthKey].expense += Math.abs(tx.amount)
      }
    })

    const forecast = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expense,
      netCashFlow: data.income - data.expense
    }))

    // Calculate averages for projection
    const avgIncome = forecast.reduce((sum, f) => sum + f.income, 0) / (forecast.length || 1)
    const avgExpenses = forecast.reduce((sum, f) => sum + f.expenses, 0) / (forecast.length || 1)

    return NextResponse.json({ 
      forecast, 
      summary: { 
        projectedIncome: avgIncome, 
        projectedExpenses: avgExpenses, 
        netCashFlow: avgIncome - avgExpenses 
      } 
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
