
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic';

const createCustomReportSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['FINANCIAL', 'OPERATIONAL', 'STRATEGIC', 'COMPLIANCE', 'INVESTOR', 'BOARD', 'CUSTOM']),
  reportType: z.enum(['INCOME_STATEMENT', 'BALANCE_SHEET', 'CASH_FLOW', 'BUDGET_VARIANCE', 'KPI_DASHBOARD', 'INVESTOR_DECK', 'BOARD_PACKAGE', 'COMPLIANCE_REPORT', 'CUSTOM_ANALYSIS']),
  dataSource: z.any(),
  filters: z.any(),
  grouping: z.any().optional(),
  sorting: z.any().optional(),
  chartType: z.enum(['BAR', 'LINE', 'PIE', 'DONUT', 'AREA', 'SCATTER', 'RADAR', 'GAUGE', 'TABLE', 'HEATMAP']).optional(),
  visualization: z.any().optional(),
  outputFormat: z.enum(['PDF', 'EXCEL', 'CSV', 'POWERPOINT', 'HTML', 'EMAIL']).default('PDF'),
  pageLayout: z.enum(['PORTRAIT', 'LANDSCAPE']).default('PORTRAIT'),
  isScheduled: z.boolean().default(false),
  schedule: z.any().optional(),
  recipients: z.any().optional(),
  template: z.any().optional()
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customReports = await prisma.customReport.findMany({
      where: { userId: session.user.id, isActive: true },
      include: {
        generations: {
          orderBy: { generatedAt: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const totalReports = customReports.length
    const scheduledReports = customReports.filter(r => r.isScheduled).length
    const recentGenerations = customReports.reduce((sum, r) => sum + r.generations.length, 0)

    const reportsByCategory = customReports.reduce((acc: any, report) => {
      acc[report.category] = (acc[report.category] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      customReports,
      summary: {
        totalReports,
        scheduledReports,
        recentGenerations,
        reportsByCategory,
        mostUsedType: Object.entries(reportsByCategory).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'CUSTOM'
      }
    })
  } catch (error) {
    console.error('Error fetching custom reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createCustomReportSchema.parse(body)

    const customReport = await prisma.customReport.create({
      data: {
        userId: session.user.id,
        ...validatedData,
        dataSource: validatedData.dataSource || {},
        filters: validatedData.filters || {}
      }
    })

    return NextResponse.json(customReport, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    console.error('Error creating custom report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
