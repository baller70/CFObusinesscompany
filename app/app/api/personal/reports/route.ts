import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getCurrentBusinessProfileId } from '@/lib/business-profile-utils'
import { generateReportPDF } from '@/lib/pdf-generator'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessProfileId = await getCurrentBusinessProfileId()

    // Get report history
    const reports = await prisma.financialReport.findMany({
      where: { businessProfileId },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessProfileId = await getCurrentBusinessProfileId()
    const body = await request.json()
    const { reportType, startDate, endDate } = body

    // Get user for report
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get the business profile details
    const businessProfile = await prisma.businessProfile.findUnique({
      where: { id: businessProfileId || '' }
    })

    const profileName = businessProfile?.name || 'Unknown Profile'
    const profileType = businessProfile?.type || 'UNKNOWN'

    // Calculate date range based on report type
    let start = new Date()
    let end = new Date()
    let reportName = ''

    switch (reportType) {
      case 'Monthly Summary':
        start.setDate(1) // First day of current month
        end = new Date() // Today
        reportName = `Monthly Summary - ${start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
        break
      case 'Year-End Report':
        start = new Date(new Date().getFullYear(), 0, 1) // Jan 1 of current year
        end = new Date(new Date().getFullYear(), 11, 31) // Dec 31 of current year
        reportName = `Year-End Report ${start.getFullYear()}`
        break
      case 'Net Worth Statement':
        start = new Date(0) // All time
        end = new Date()
        reportName = `Net Worth Statement - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        break
      case 'Custom Report':
        start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1))
        end = endDate ? new Date(endDate) : new Date()
        reportName = `Custom Report - ${start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} to ${end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
        break
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    // Get transactions for the period
    const transactions = await prisma.transaction.findMany({
      where: {
        businessProfileId,
        date: { gte: start, lte: end }
      },
      orderBy: { date: 'desc' }
    })

    // Calculate totals
    const income = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const netIncome = income - expenses

    // Get budget data
    const budgets = await prisma.budget.findMany({
      where: { businessProfileId }
    })

    // Get assets and liabilities for net worth
    const assets = await prisma.asset.findMany({
      where: { businessProfileId }
    })

    const liabilities = await prisma.debt.findMany({
      where: { businessProfileId }
    })

    const totalAssets = assets.reduce((sum, a) => sum + (a.value || 0), 0)
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.balance, 0)
    const netWorth = totalAssets - totalLiabilities

    // Group transactions by category
    const transactionsByCategory = transactions.reduce((acc, t) => {
      const category = t.category || 'Uncategorized'
      if (!acc[category]) {
        acc[category] = { income: 0, expenses: 0, count: 0 }
      }
      if (t.type === 'INCOME') {
        acc[category].income += t.amount
      } else {
        acc[category].expenses += Math.abs(t.amount)
      }
      acc[category].count += 1
      return acc
    }, {} as Record<string, { income: number; expenses: number; count: number }>)

    // Generate PDF
    const pdfBuffer = await generateReportPDF({
      reportName,
      reportType,
      profileName,
      profileType,
      userName: user.name || user.email,
      userEmail: user.email,
      startDate: start,
      endDate: end,
      generatedDate: new Date(),
      summary: {
        income,
        expenses,
        netIncome,
        transactionCount: transactions.length,
        totalAssets,
        totalLiabilities,
        netWorth
      },
      transactions,
      transactionsByCategory,
      budgets,
      assets,
      liabilities
    })

    // Save report record
    const report = await prisma.financialReport.create({
      data: {
        businessProfileId,
        name: reportName,
        type: reportType,
        startDate: start,
        endDate: end,
        summary: {
          income,
          expenses,
          netIncome,
          transactionCount: transactions.length,
          totalAssets,
          totalLiabilities,
          netWorth
        }
      }
    })

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${reportName.replace(/[^a-z0-9]/gi, '_')}.pdf"`
      }
    })

  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
