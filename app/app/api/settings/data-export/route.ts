
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        transactions: true,
        categories: true,
        budgets: true,
        goals: true,
        debts: true,
        invoices: {
          include: {
            items: true,
          },
        },
        estimates: {
          include: {
            items: true,
          },
        },
        customers: true,
        vendors: true,
        projects: true,
        documents: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Remove sensitive data
    const exportData = {
      ...user,
      password: undefined,
    }

    // Convert to JSON string
    const jsonData = JSON.stringify(exportData, null, 2)

    // Return as downloadable file
    return new NextResponse(jsonData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="data-export-${new Date().toISOString()}.json"`,
      },
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
