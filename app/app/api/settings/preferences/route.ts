
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return default preferences
    const defaultPreferences = {
      theme: 'light',
      currency: 'usd',
      dateFormat: 'mdy',
      fiscalYearStart: 'january',
      showBudgetAlerts: true,
      autoRefreshData: true,
      showDecimalPlaces: true,
    }

    return NextResponse.json(defaultPreferences)
  } catch (error) {
    console.error('Error fetching preferences:', error)
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preferences = await request.json()

    // In a real app, you'd save these to a preferences table
    return NextResponse.json({ message: 'Preferences updated', preferences })
  } catch (error) {
    console.error('Error updating preferences:', error)
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
  }
}
