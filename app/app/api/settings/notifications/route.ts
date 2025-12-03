
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic';

// We'll store notification preferences in a separate table or in JSON format
// For now, we'll create a simple preferences store

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return default notification settings
    // In a real app, you'd fetch from a preferences table
    const defaultSettings = {
      emailNotifications: true,
      invoicePayments: true,
      budgetAlerts: true,
      cashFlowWarnings: true,
      monthlyReports: true,
      systemUpdates: false,
      securityAlerts: true,
      marketingUpdates: false,
    }

    return NextResponse.json(defaultSettings)
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json({ error: 'Failed to fetch notification settings' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await request.json()

    // In a real app, you'd save these to a preferences table or JSON column
    // For now, we'll just return success
    return NextResponse.json({ message: 'Notification settings updated', settings })
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return NextResponse.json({ error: 'Failed to update notification settings' }, { status: 500 })
  }
}
