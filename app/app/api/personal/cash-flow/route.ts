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

    // Format data for frontend
    const forecast = Object.entries(monthlyData).map(([month, data], index) => {
      const date = new Date(month + '-01')
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      
      return {
        id: `${month}-${index}`,
        period: monthName,
        periodType: 'Monthly',
        income: data.income,
        expenses: data.expense,
        projectedCashFlow: data.income - data.expense
      }
    })

    // Calculate averages for projection
    const avgIncome = forecast.reduce((sum, f) => sum + f.income, 0) / (forecast.length || 1)
    const avgExpenses = forecast.reduce((sum, f) => sum + f.expenses, 0) / (forecast.length || 1)

    return NextResponse.json({ 
      forecast, 
      summary: { 
        projectedIncome: Math.round(avgIncome), 
        projectedExpenses: Math.round(avgExpenses), 
        netCashFlow: Math.round(avgIncome - avgExpenses)
      } 
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
