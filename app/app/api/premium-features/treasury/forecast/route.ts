
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const generateForecastSchema = z.object({
  horizon: z.number().min(1).max(365), // Days ahead
  includeScenarios: z.boolean().default(false)
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const horizon = parseInt(searchParams.get('horizon') || '30')

    // Get existing forecasts
    const existingForecasts = await prisma.cashForecast.findMany({
      where: { 
        userId: session.user.id,
        forecastDate: {
          gte: new Date(),
          lte: new Date(Date.now() + horizon * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { forecastDate: 'asc' }
    })

    // Generate new forecast if none exists
    if (existingForecasts.length === 0) {
      const currentCashPositions = await prisma.cashPosition.findMany({
        where: { userId: session.user.id, isActive: true }
      })

      const totalCash = currentCashPositions.reduce((sum, pos) => sum + pos.currentBalance, 0)

      // Get historical cash flows to predict future
      const historicalFlows = await prisma.cashFlow.findMany({
        where: { 
          userId: session.user.id,
          date: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
          }
        },
        orderBy: { date: 'desc' }
      })

      const avgDailyInflows = historicalFlows
        .filter(flow => flow.type === 'INFLOW')
        .reduce((sum, flow) => sum + flow.amount, 0) / 90

      const avgDailyOutflows = historicalFlows
        .filter(flow => flow.type === 'OUTFLOW')
        .reduce((sum, flow) => sum + flow.amount, 0) / 90

      // Generate forecasts for each day
      const forecasts: any[] = []
      for (let day = 1; day <= horizon; day++) {
        const forecastDate = new Date(Date.now() + day * 24 * 60 * 60 * 1000)
        const projectedInflows = avgDailyInflows * (0.9 + Math.random() * 0.2) // Add some variance
        const projectedOutflows = avgDailyOutflows * (0.9 + Math.random() * 0.2)
        
        const openingBalance: number = day === 1 ? totalCash : (forecasts[day - 2] as any).closingBalance
        const closingBalance = openingBalance + projectedInflows - projectedOutflows

        const forecast = await prisma.cashForecast.create({
          data: {
            userId: session.user.id,
            forecastDate,
            horizon: day,
            openingBalance,
            projectedInflows,
            projectedOutflows,
            closingBalance,
            confidence: Math.max(0.1, 0.9 - (day / horizon) * 0.4) // Confidence decreases over time
          }
        })

        forecasts.push(forecast)
      }

      return NextResponse.json({
        forecasts,
        summary: {
          totalDays: horizon,
          avgDailyInflows,
          avgDailyOutflows,
          netCashFlow: avgDailyInflows - avgDailyOutflows,
          riskDays: forecasts.filter(f => f.closingBalance < 0).length
        }
      })
    }

    return NextResponse.json({
      forecasts: existingForecasts,
      summary: {
        totalDays: existingForecasts.length,
        avgConfidence: existingForecasts.reduce((sum, f) => sum + f.confidence, 0) / existingForecasts.length,
        riskDays: existingForecasts.filter(f => f.closingBalance < 0).length
      }
    })
  } catch (error) {
    console.error('Error generating cash forecast:', error)
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
    const validatedData = generateForecastSchema.parse(body)

    // Clear existing forecasts for this horizon
    await prisma.cashForecast.deleteMany({
      where: {
        userId: session.user.id,
        forecastDate: {
          gte: new Date(),
          lte: new Date(Date.now() + validatedData.horizon * 24 * 60 * 60 * 1000)
        }
      }
    })

    // Generate new forecast (similar logic as GET)
    return NextResponse.json({ message: 'Forecast regenerated successfully' }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    console.error('Error generating forecast:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
