
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

    const { year } = await request.json()
    
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

    // Get all EXPENSE transactions for the source year
    const startDate = new Date(`${year}-01-01`)
    const endDate = new Date(`${year}-12-31T23:59:59`)

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        businessProfileId: user.currentBusinessProfileId,
        type: 'EXPENSE',
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    console.log(`[Category Budget Limits] Found ${transactions.length} expense transactions from ${year}`)

    // Group transactions by category and calculate totals
    const categoryTotals: { [key: string]: number } = {}

    transactions.forEach(tx => {
      if (!tx.category) return
      
      if (!categoryTotals[tx.category]) {
        categoryTotals[tx.category] = 0
      }
      
      categoryTotals[tx.category] += Math.abs(tx.amount)
    })

    // Calculate monthly average for each category and update
    const monthsInYear = 12
    const updatedCategories: string[] = []

    for (const [categoryName, total] of Object.entries(categoryTotals)) {
      const monthlyAverage = total / monthsInYear
      
      // Add 10% buffer to help with budget tracking
      const budgetLimit = Math.round(monthlyAverage * 1.1 * 100) / 100

      if (budgetLimit >= 1) {
        // Find or create the category
        const existingCategory = await prisma.category.findFirst({
          where: {
            userId: session.user.id,
            businessProfileId: user.currentBusinessProfileId,
            name: categoryName
          }
        })

        if (existingCategory) {
          // Update existing category with budget limit
          await prisma.category.update({
            where: { id: existingCategory.id },
            data: { budget: budgetLimit }
          })
          updatedCategories.push(categoryName)
          console.log(`[Category Budget Limits] Updated ${categoryName}: $${budgetLimit}/month`)
        } else {
          // Create new category with budget limit
          await prisma.category.create({
            data: {
              userId: session.user.id,
              businessProfileId: user.currentBusinessProfileId,
              name: categoryName,
              type: 'EXPENSE',
              budget: budgetLimit,
              color: '#3B82F6', // Default blue color
              icon: 'DollarSign'
            }
          })
          updatedCategories.push(categoryName)
          console.log(`[Category Budget Limits] Created ${categoryName}: $${budgetLimit}/month`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Set budget limits for ${updatedCategories.length} expense categories based on ${year} data`,
      categoriesUpdated: updatedCategories.length,
      categories: updatedCategories,
      transactionsAnalyzed: transactions.length
    })

  } catch (error) {
    console.error('[Category Budget Limits] Error:', error)
    return NextResponse.json(
      { error: 'Failed to set budget limits', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
