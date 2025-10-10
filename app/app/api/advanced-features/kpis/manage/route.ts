
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { addMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns'

// Create and manage KPI targets
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const kpiData = await req.json()
    const userId = session.user.id

    // Calculate initial current value based on KPI type
    const currentValue = await calculateKPICurrentValue(userId, kpiData.kpiType, kpiData.startDate, kpiData.endDate)
    
    // Calculate progress percentage
    const progress = kpiData.targetValue > 0 ? Math.min(100, (currentValue / kpiData.targetValue) * 100) : 0
    
    // Determine status based on progress
    const status = progress >= 100 ? 'ACHIEVED' : 
                   progress >= 75 ? 'ON_TRACK' :
                   progress >= 50 ? 'IN_PROGRESS' :
                   progress >= 25 ? 'AT_RISK' : 'NOT_STARTED'

    // AI prediction of achievability
    const isAchievable = await predictKPIAchievability(userId, kpiData, currentValue)

    const kpiTarget = await prisma.kPITarget.create({
      data: {
        userId,
        name: kpiData.name,
        description: kpiData.description,
        kpiType: kpiData.kpiType.toUpperCase(),
        targetValue: kpiData.targetValue,
        currentValue,
        unit: kpiData.unit,
        period: kpiData.period,
        startDate: new Date(kpiData.startDate),
        endDate: new Date(kpiData.endDate),
        status: status as any,
        progress,
        isAchievable,
        lastUpdate: new Date()
      }
    })

    return NextResponse.json({ success: true, kpiTarget })

  } catch (error) {
    console.error('Create KPI target error:', error)
    return NextResponse.json({ error: 'Failed to create KPI target' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const kpiType = searchParams.get('kpiType')
    const period = searchParams.get('period')

    const kpiTargets = await prisma.kPITarget.findMany({
      where: {
        userId: session.user.id,
        ...(status && { status: status.toUpperCase() as any }),
        ...(kpiType && { kpiType: kpiType.toUpperCase() as any }),
        ...(period && { period })
      },
      orderBy: [
        { status: 'desc' },
        { progress: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // Update current values for active KPIs
    const updatedKPIs = await Promise.all(
      kpiTargets.map(async (kpi) => {
        if (['IN_PROGRESS', 'ON_TRACK', 'AT_RISK'].includes(kpi.status)) {
          const currentValue = await calculateKPICurrentValue(
            session.user.id,
            kpi.kpiType,
            kpi.startDate,
            kpi.endDate
          )
          
          const progress = kpi.targetValue > 0 ? Math.min(100, (currentValue / kpi.targetValue) * 100) : 0
          const newStatus = progress >= 100 ? 'ACHIEVED' : 
                           progress >= 75 ? 'ON_TRACK' :
                           progress >= 50 ? 'IN_PROGRESS' :
                           progress >= 25 ? 'AT_RISK' : 'NOT_STARTED'

          // Update if values changed
          if (Math.abs(currentValue - kpi.currentValue) > 0.01 || newStatus !== kpi.status) {
            const updatedKPI = await prisma.kPITarget.update({
              where: { id: kpi.id },
              data: {
                currentValue,
                progress,
                status: newStatus as any,
                lastUpdate: new Date()
              }
            })
            return updatedKPI
          }
        }
        return kpi
      })
    )

    const summary = {
      totalKPIs: updatedKPIs.length,
      achievedKPIs: updatedKPIs.filter(k => k.status === 'ACHIEVED').length,
      onTrackKPIs: updatedKPIs.filter(k => k.status === 'ON_TRACK').length,
      atRiskKPIs: updatedKPIs.filter(k => k.status === 'AT_RISK').length,
      avgProgress: updatedKPIs.length > 0 ? updatedKPIs.reduce((sum, k) => sum + k.progress, 0) / updatedKPIs.length : 0
    }

    return NextResponse.json({ kpiTargets: updatedKPIs, summary })

  } catch (error) {
    console.error('Get KPI targets error:', error)
    return NextResponse.json({ error: 'Failed to get KPI targets' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { kpiId, ...updateData } = await req.json()

    const updatedKPI = await prisma.kPITarget.update({
      where: {
        id: kpiId,
        userId: session.user.id
      },
      data: {
        ...updateData,
        lastUpdate: new Date()
      }
    })

    return NextResponse.json({ success: true, kpiTarget: updatedKPI })

  } catch (error) {
    console.error('Update KPI target error:', error)
    return NextResponse.json({ error: 'Failed to update KPI target' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const kpiId = searchParams.get('kpiId')

    if (!kpiId) {
      return NextResponse.json({ error: 'KPI ID required' }, { status: 400 })
    }

    await prisma.kPITarget.delete({
      where: {
        id: kpiId,
        userId: session.user.id
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete KPI target error:', error)
    return NextResponse.json({ error: 'Failed to delete KPI target' }, { status: 500 })
  }
}

async function calculateKPICurrentValue(userId: string, kpiType: string, startDate: Date, endDate: Date): Promise<number> {
  const start = new Date(startDate)
  const end = new Date(endDate)

  switch (kpiType) {
    case 'REVENUE':
      const revenue = await prisma.transaction.aggregate({
        where: {
          userId,
          type: 'INCOME',
          date: { gte: start, lte: end }
        },
        _sum: { amount: true }
      })
      return revenue._sum.amount || 0

    case 'PROFIT_MARGIN':
      const [totalRevenue, totalExpenses] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId, type: 'INCOME', date: { gte: start, lte: end } },
          _sum: { amount: true }
        }),
        prisma.transaction.aggregate({
          where: { userId, type: 'EXPENSE', date: { gte: start, lte: end } },
          _sum: { amount: true }
        })
      ])
      
      const revenueTotal = totalRevenue._sum.amount || 0
      const expensesTotal = Math.abs(totalExpenses._sum.amount || 0)
      const profit = revenueTotal - expensesTotal
      return revenueTotal > 0 ? (profit / revenueTotal) * 100 : 0

    case 'CASH_FLOW':
      const [income, expenses] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId, type: 'INCOME', date: { gte: start, lte: end } },
          _sum: { amount: true }
        }),
        prisma.transaction.aggregate({
          where: { userId, type: 'EXPENSE', date: { gte: start, lte: end } },
          _sum: { amount: true }
        })
      ])
      return (income._sum.amount || 0) - Math.abs(expenses._sum.amount || 0)

    case 'CUSTOMER_ACQUISITION':
      const newCustomers = await prisma.customer.count({
        where: {
          userId,
          createdAt: { gte: start, lte: end }
        }
      })
      return newCustomers

    case 'CUSTOMER_RETENTION':
      const [totalCustomers, activeCustomers] = await Promise.all([
        prisma.customer.count({ where: { userId, createdAt: { lt: start } } }),
        prisma.customer.count({
          where: {
            userId,
            createdAt: { lt: start },
            invoices: {
              some: {
                issueDate: { gte: start, lte: end }
              }
            }
          }
        })
      ])
      return totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0

    case 'CURRENT_RATIO':
      // Simplified current ratio calculation
      const metrics = await // @ts-ignore
    prisma.financialMetrics.findFirst({
        where: { userId }
      })
      return metrics?.currentRatio || 0

    case 'DEBT_TO_EQUITY':
      const debtMetrics = await // @ts-ignore
    prisma.financialMetrics.findFirst({
        where: { userId }
      })
      return debtMetrics?.debtToEquityRatio || 0

    case 'ROI':
      const roiMetrics = await // @ts-ignore
    prisma.financialMetrics.findFirst({
        where: { userId }
      })
      return (roiMetrics?.returnOnAssets || 0) * 100

    case 'WORKING_CAPITAL':
      const wcMetrics = await // @ts-ignore
    prisma.financialMetrics.findFirst({
        where: { userId }
      })
      return wcMetrics?.workingCapital || 0

    case 'ACCOUNTS_RECEIVABLE':
      const outstandingInvoices = await prisma.invoice.aggregate({
        where: {
          userId,
          status: { in: ['SENT', 'VIEWED', 'OVERDUE'] }
        },
        _sum: { total: true }
      })
      return outstandingInvoices._sum.total || 0

    case 'MARKET_SHARE':
      // This would require industry data - returning placeholder
      return 5.0 // 5% market share placeholder

    default:
      return 0
  }
}

async function predictKPIAchievability(userId: string, kpiData: any, currentValue: number): Promise<boolean> {
  const timeRemaining = new Date(kpiData.endDate).getTime() - new Date().getTime()
  const totalTime = new Date(kpiData.endDate).getTime() - new Date(kpiData.startDate).getTime()
  const timeProgress = Math.max(0, Math.min(1, 1 - (timeRemaining / totalTime)))
  
  const valueProgress = kpiData.targetValue > 0 ? currentValue / kpiData.targetValue : 0
  
  // Simple achievability prediction based on progress vs time
  if (timeProgress < 0.5) {
    // Early in the period - more optimistic
    return valueProgress >= timeProgress * 0.6
  } else {
    // Later in the period - need closer tracking
    return valueProgress >= timeProgress * 0.8
  }
}
