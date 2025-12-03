
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getCurrentBusinessProfileId } from '@/lib/business-profile-utils'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const businessProfileId = await getCurrentBusinessProfileId()

    // Get all vehicles for the user
    const vehicles = await prisma.vehicle.findMany({
      where: {
        userId: user.id,
        businessProfileId: businessProfileId,
        isActive: true
      }
    })

    // Get manual vehicle expenses
    const manualExpenses = await prisma.vehicleExpense.findMany({
      where: {
        vehicle: {
          userId: user.id,
          businessProfileId: businessProfileId
        }
      },
      include: {
        vehicle: true
      },
      orderBy: { date: 'desc' }
    })

    // Get vehicle-related transactions from bank statements
    const vehicleKeywords = [
      'gas', 'fuel', 'petrol', 'shell', 'exxon', 'chevron', 'bp', 'mobil',
      'auto', 'car', 'vehicle', 'repair', 'mechanic', 'service', 'maintenance',
      'insurance', 'geico', 'progressive', 'state farm', 'allstate',
      'registration', 'dmv', 'inspection', 'smog',
      'parking', 'toll', 'carwash', 'car wash',
      'tire', 'brake', 'oil change', 'transmission'
    ]

    const transactions = await prisma.transaction.findMany({
      where: {
        businessProfileId: businessProfileId,
        type: 'EXPENSE',
        OR: [
          ...vehicleKeywords.map(keyword => ({
            description: { contains: keyword, mode: 'insensitive' as const }
          })),
          ...vehicleKeywords.map(keyword => ({
            category: { contains: keyword, mode: 'insensitive' as const }
          })),
          { category: { contains: 'transport', mode: 'insensitive' as const } },
          { category: { contains: 'automotive', mode: 'insensitive' as const } }
        ]
      },
      orderBy: { date: 'desc' }
    })

    // Combine both sources
    const allExpenses = [
      ...manualExpenses.map(expense => ({
        id: expense.id,
        type: expense.type,
        amount: expense.amount,
        date: expense.date,
        description: expense.description || '',
        vendor: expense.vendor || '',
        vehicle: `${expense.vehicle.year} ${expense.vehicle.make} ${expense.vehicle.model}`,
        mileage: expense.mileage,
        source: 'manual'
      })),
      ...transactions.map(tx => ({
        id: tx.id,
        type: categorizeTransaction(tx.description || '', tx.category || ''),
        amount: Math.abs(tx.amount),
        date: tx.date,
        description: tx.description || '',
        vendor: tx.merchant || '',
        vehicle: 'Auto-detected',
        source: 'bank_statement'
      }))
    ]

    // Sort by date descending
    allExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const totalExpenses = allExpenses.reduce((sum, expense) => sum + expense.amount, 0)

    // Group expenses by type for summary
    const expensesByType: Record<string, number> = {}
    allExpenses.forEach(expense => {
      expensesByType[expense.type] = (expensesByType[expense.type] || 0) + expense.amount
    })

    return NextResponse.json({ 
      expenses: allExpenses, 
      totalExpenses,
      expensesByType,
      vehicles
    })
  } catch (error) {
    console.error('Error fetching vehicle expenses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()

    if (!body.vehicleId) {
      return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 })
    }

    // Verify vehicle ownership
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: body.vehicleId,
        userId: user.id
      }
    })

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    const expense = await prisma.vehicleExpense.create({
      data: {
        vehicleId: body.vehicleId,
        date: new Date(body.date),
        type: body.type,
        amount: parseFloat(body.amount),
        mileage: body.mileage ? parseInt(body.mileage) : null,
        vendor: body.vendor || null,
        description: body.description || null,
        notes: body.notes || null
      },
      include: {
        vehicle: true
      }
    })

    return NextResponse.json({ expense }, { status: 201 })
  } catch (error) {
    console.error('Error creating vehicle expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 })
    }

    // Verify ownership through vehicle
    const expense = await prisma.vehicleExpense.findFirst({
      where: {
        id: id,
        vehicle: {
          userId: user.id
        }
      }
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    await prisma.vehicleExpense.delete({
      where: { id: id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting vehicle expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to categorize transactions
function categorizeTransaction(description: string, category: string): string {
  const text = `${description} ${category}`.toLowerCase()
  
  if (text.match(/gas|fuel|petrol|shell|exxon|chevron|bp|mobil/)) return 'GAS'
  if (text.match(/insurance|geico|progressive|state farm|allstate/)) return 'INSURANCE'
  if (text.match(/repair|mechanic|transmission|brake|tire/)) return 'REPAIR'
  if (text.match(/maintenance|service|oil change/)) return 'MAINTENANCE'
  if (text.match(/registration|dmv/)) return 'REGISTRATION'
  if (text.match(/inspection|smog/)) return 'INSPECTION'
  if (text.match(/parking/)) return 'PARKING'
  if (text.match(/toll/)) return 'TOLLS'
  if (text.match(/wash/)) return 'CAR_WASH'
  
  return 'OTHER'
}
