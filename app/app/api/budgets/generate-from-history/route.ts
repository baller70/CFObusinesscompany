
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { year, targetYear } = await request.json()
    
    // Get user's current business profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { businessProfiles: true }
    })

    if (!user?.currentBusinessProfileId) {
      return NextResponse.json(
        { error: 'No active business profile' },
        { status: 400 }
      )
    }

    // Get all transactions for the source year (e.g., 2024)
    const startDate = new Date(`${year}-01-01`)
    const endDate = new Date(`${year}-12-31T23:59:59`)

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        businessProfileId: user.currentBusinessProfileId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    console.log(`[Budget Generator] Found ${transactions.length} transactions from ${year}`)

    // Group transactions by category and calculate monthly averages
    const categoryStats: { [key: string]: { total: number; count: number; type: string } } = {}

    transactions.forEach(tx => {
      if (!tx.category) return

      if (!categoryStats[tx.category]) {
        categoryStats[tx.category] = {
          total: 0,
          count: 0,
          type: tx.type || 'EXPENSE'
        }
      }

      categoryStats[tx.category].total += Math.abs(tx.amount)
      categoryStats[tx.category].count += 1
    })

    // Calculate monthly average for each category
    const monthsInYear = 12
    const budgetsToCreate: any[] = []

    for (const [category, stats] of Object.entries(categoryStats)) {
      const monthlyAverage = stats.total / monthsInYear
      
      // For expenses, add 10% buffer; for income, use 90% to be conservative
      let budgetAmount = stats.type === 'EXPENSE' 
        ? monthlyAverage * 1.1  // 10% buffer for expenses
        : monthlyAverage * 0.9  // 90% for income to be conservative

      // Round to 2 decimal places
      budgetAmount = Math.round(budgetAmount * 100) / 100

      // Only create budgets for categories with meaningful amounts
      if (budgetAmount >= 1) {
        // Create budgets for all 12 months of target year
        for (let month = 1; month <= 12; month++) {
          budgetsToCreate.push({
            userId: session.user.id,
            businessProfileId: user.currentBusinessProfileId,
            category: category,
            amount: budgetAmount,
            spent: 0,
            type: 'MONTHLY',
            month: month,
            year: targetYear
          })
        }
      }
    }

    console.log(`[Budget Generator] Creating ${budgetsToCreate.length} budgets for ${targetYear}`)

    // Delete existing budgets for the target year to avoid conflicts
    await prisma.budget.deleteMany({
      where: {
        userId: session.user.id,
        businessProfileId: user.currentBusinessProfileId,
        year: targetYear
      }
    })

    // Create all budgets in bulk
    const result = await prisma.budget.createMany({
      data: budgetsToCreate,
      skipDuplicates: true
    })

    console.log(`[Budget Generator] Successfully created ${result.count} budgets`)

    return NextResponse.json({
      success: true,
      message: `Generated ${result.count} monthly budgets for ${targetYear} based on ${year} data`,
      budgetsCreated: result.count,
      categoriesAnalyzed: Object.keys(categoryStats).length,
      transactionsAnalyzed: transactions.length
    })

  } catch (error) {
    console.error('[Budget Generator] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate budgets', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
