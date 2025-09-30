
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic';

// Validation schema for recurring charges
const recurringChargeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required"),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'SEMIANNUALLY', 'ANNUALLY', 'CUSTOM']),
  nextDueDate: z.string().refine(date => !isNaN(Date.parse(date)), "Invalid date"),
  vendor: z.string().optional(),
  billingCycle: z.number().positive().default(1),
  reminderEnabled: z.boolean().default(true),
  reminderDays: z.number().int().min(0).default(3),
  taxDeductible: z.boolean().default(false),
  businessExpense: z.boolean().default(true),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  autoPayEnabled: z.boolean().default(false),
  paymentMethod: z.string().optional()
})

// Helper function to calculate annual amount based on frequency
function calculateAnnualAmount(amount: number, frequency: string, billingCycle: number = 1): number {
  const multipliers = {
    DAILY: 365,
    WEEKLY: 52,
    BIWEEKLY: 26,
    MONTHLY: 12,
    BIMONTHLY: 6,
    QUARTERLY: 4,
    SEMIANNUALLY: 2,
    ANNUALLY: 1,
    CUSTOM: 12 // Default to monthly for custom
  }
  
  const multiplier = multipliers[frequency as keyof typeof multipliers] || 12
  return amount * (multiplier / billingCycle)
}

// Helper function to calculate next due date after payment
function calculateNextDueDate(currentDate: Date, frequency: string, billingCycle: number = 1): Date {
  const nextDate = new Date(currentDate)
  
  switch (frequency) {
    case 'DAILY':
      nextDate.setDate(nextDate.getDate() + billingCycle)
      break
    case 'WEEKLY':
      nextDate.setDate(nextDate.getDate() + (7 * billingCycle))
      break
    case 'BIWEEKLY':
      nextDate.setDate(nextDate.getDate() + (14 * billingCycle))
      break
    case 'MONTHLY':
      nextDate.setMonth(nextDate.getMonth() + billingCycle)
      break
    case 'BIMONTHLY':
      nextDate.setMonth(nextDate.getMonth() + (2 * billingCycle))
      break
    case 'QUARTERLY':
      nextDate.setMonth(nextDate.getMonth() + (3 * billingCycle))
      break
    case 'SEMIANNUALLY':
      nextDate.setMonth(nextDate.getMonth() + (6 * billingCycle))
      break
    case 'ANNUALLY':
      nextDate.setFullYear(nextDate.getFullYear() + billingCycle)
      break
    default:
      nextDate.setMonth(nextDate.getMonth() + billingCycle)
  }
  
  return nextDate
}

// GET - List all recurring charges
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const activeOnly = url.searchParams.get('active') === 'true'
    const category = url.searchParams.get('category')
    const upcomingDays = url.searchParams.get('upcoming')

    let whereClause: any = {
      userId: session.user.id
    }

    if (activeOnly) {
      whereClause.isActive = true
      whereClause.isPaused = false
    }

    if (category && category !== 'all') {
      whereClause.category = category
    }

    if (upcomingDays) {
      const days = parseInt(upcomingDays)
      if (!isNaN(days)) {
        const upcomingDate = new Date()
        upcomingDate.setDate(upcomingDate.getDate() + days)
        whereClause.nextDueDate = {
          lte: upcomingDate
        }
      }
    }

    const recurringCharges = await prisma.recurringCharge.findMany({
      where: whereClause,
      orderBy: [
        { isPaused: 'asc' },
        { nextDueDate: 'asc' }
      ]
    })

    // Calculate summary statistics
    const totalMonthlyAmount = recurringCharges
      .filter(charge => charge.isActive && !charge.isPaused)
      .reduce((sum, charge) => {
        const monthlyAmount = charge.frequency === 'MONTHLY' ? charge.amount :
                             charge.frequency === 'ANNUALLY' ? charge.amount / 12 :
                             charge.frequency === 'QUARTERLY' ? charge.amount / 3 :
                             charge.frequency === 'WEEKLY' ? charge.amount * 4.33 :
                             charge.frequency === 'BIWEEKLY' ? charge.amount * 2.17 :
                             charge.frequency === 'DAILY' ? charge.amount * 30 :
                             charge.amount / charge.billingCycle
        return sum + monthlyAmount
      }, 0)

    const totalAnnualAmount = recurringCharges
      .filter(charge => charge.isActive && !charge.isPaused)
      .reduce((sum, charge) => sum + charge.annualAmount, 0)

    const dueSoon = recurringCharges.filter(charge => {
      if (!charge.isActive || charge.isPaused) return false
      const dueDate = new Date(charge.nextDueDate)
      const today = new Date()
      const daysDifference = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
      return daysDifference <= 7
    }).length

    const overdue = recurringCharges.filter(charge => {
      if (!charge.isActive || charge.isPaused) return false
      return new Date(charge.nextDueDate) < new Date()
    }).length

    const summary = {
      totalCharges: recurringCharges.length,
      activeCharges: recurringCharges.filter(c => c.isActive && !c.isPaused).length,
      totalMonthlyAmount,
      totalAnnualAmount,
      dueSoon,
      overdue,
      categories: [...new Set(recurringCharges.map(c => c.category))]
    }

    return NextResponse.json({ 
      recurringCharges,
      summary
    })

  } catch (error) {
    console.error('Error fetching recurring charges:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch recurring charges' 
    }, { status: 500 })
  }
}

// POST - Create new recurring charge
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = recurringChargeSchema.parse(body)

    const annualAmount = calculateAnnualAmount(
      validatedData.amount, 
      validatedData.frequency, 
      validatedData.billingCycle
    )

    const recurringCharge = await prisma.recurringCharge.create({
      data: {
        userId: session.user.id,
        name: validatedData.name,
        description: validatedData.description,
        amount: validatedData.amount,
        category: validatedData.category,
        frequency: validatedData.frequency as any,
        nextDueDate: new Date(validatedData.nextDueDate),
        vendor: validatedData.vendor,
        billingCycle: validatedData.billingCycle,
        reminderEnabled: validatedData.reminderEnabled,
        reminderDays: validatedData.reminderDays,
        taxDeductible: validatedData.taxDeductible,
        businessExpense: validatedData.businessExpense,
        notes: validatedData.notes,
        tags: validatedData.tags || [],
        autoPayEnabled: validatedData.autoPayEnabled,
        paymentMethod: validatedData.paymentMethod,
        annualAmount
      }
    })

    return NextResponse.json(recurringCharge, { status: 201 })

  } catch (error) {
    console.error('Error creating recurring charge:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Failed to create recurring charge' 
    }, { status: 500 })
  }
}
