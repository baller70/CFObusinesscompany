
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { getCurrentBusinessProfileId } from '@/lib/business-profile-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    const businessProfileId = await getCurrentBusinessProfileId()

    const now = new Date()
    const threeMonthsAgo = subMonths(now, 3)

    // Calculate monthly income and expenses for last 3 months
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: threeMonthsAgo,
          lte: now
        }
      }
    })

    // Group by month and type
    const monthlyData = new Map()
    
    recentTransactions.forEach(transaction => {
      const monthKey = `${transaction.date.getFullYear()}-${transaction.date.getMonth()}`
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { income: 0, expenses: 0 })
      }
      
      const monthData = monthlyData.get(monthKey)
      if (transaction.type === 'INCOME') {
        monthData.income += transaction.amount
      } else if (transaction.type === 'EXPENSE') {
        monthData.expenses += transaction.amount
      }
    })

    // Calculate averages
    const months = Array.from(monthlyData.values())
    const monthlyIncome = months.length > 0 
      ? months.reduce((sum, month) => sum + month.income, 0) / months.length 
      : 0
    const monthlyExpenses = months.length > 0 
      ? months.reduce((sum, month) => sum + month.expenses, 0) / months.length 
      : 0

    // Calculate burn rate (net outflow)
    const monthlyBurnRate = Math.max(0, monthlyExpenses - monthlyIncome)

    // Get total debt
    const totalDebt = await prisma.debt.aggregate({
      where: {
        userId,
        isActive: true
      },
      _sum: {
        balance: true
      }
    })

    // Calculate total assets (simplified - just current balance from recent income/expense)
    const totalAssets = Math.max(0, monthlyIncome * 3 - monthlyExpenses * 3) // Rough estimate

    // Calculate net worth
    const netWorth = totalAssets - (totalDebt._sum.balance || 0)

    // Calculate debt-to-income ratio
    const debtToIncomeRatio = monthlyIncome > 0 
      ? (totalDebt._sum.balance || 0) / (monthlyIncome * 12) 
      : 0

    // Find or create financial metrics
    let metrics = await prisma.financialMetrics.findFirst({
      where: { userId, businessProfileId }
    })

    if (metrics) {
      // Update existing metrics
      metrics = await prisma.financialMetrics.update({
        where: { id: metrics.id },
        data: {
          monthlyIncome,
          monthlyExpenses,
          monthlyBurnRate,
          totalDebt: totalDebt._sum.balance || 0,
          totalAssets,
          netWorth,
          debtToIncomeRatio,
          lastCalculated: now
        }
      })
    } else {
      // Create new metrics
      metrics = await prisma.financialMetrics.create({
        data: {
          userId,
          businessProfileId,
          monthlyIncome,
          monthlyExpenses,
          monthlyBurnRate,
          totalDebt: totalDebt._sum.balance || 0,
          totalAssets,
          netWorth,
          debtToIncomeRatio,
          lastCalculated: now
        }
      })
    }

    return NextResponse.json({
      success: true,
      metrics
    })
  } catch (error) {
    console.error('Financial metrics calculation error:', error)
    return NextResponse.json(
      { error: 'Calculation failed' },
      { status: 500 }
    )
  }
}
