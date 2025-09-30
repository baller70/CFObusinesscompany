
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for updating recurring charges
const updateRecurringChargeSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  amount: z.number().positive().optional(),
  category: z.string().min(1).optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'SEMIANNUALLY', 'ANNUALLY', 'CUSTOM']).optional(),
  nextDueDate: z.string().refine(date => !isNaN(Date.parse(date))).optional(),
  vendor: z.string().optional(),
  billingCycle: z.number().positive().optional(),
  reminderEnabled: z.boolean().optional(),
  reminderDays: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  isPaused: z.boolean().optional(),
  pausedUntil: z.string().refine(date => !isNaN(Date.parse(date))).optional(),
  taxDeductible: z.boolean().optional(),
  businessExpense: z.boolean().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  autoPayEnabled: z.boolean().optional(),
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
    CUSTOM: 12
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

// GET - Get specific recurring charge
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const recurringCharge = await prisma.recurringCharge.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!recurringCharge) {
      return NextResponse.json({ error: 'Recurring charge not found' }, { status: 404 })
    }

    return NextResponse.json(recurringCharge)

  } catch (error) {
    console.error('Error fetching recurring charge:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch recurring charge' 
    }, { status: 500 })
  }
}

// PUT - Update recurring charge
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateRecurringChargeSchema.parse(body)

    // Check if the recurring charge exists and belongs to the user
    const existingCharge = await prisma.recurringCharge.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingCharge) {
      return NextResponse.json({ error: 'Recurring charge not found' }, { status: 404 })
    }

    // Calculate new annual amount if amount or frequency changed
    let annualAmount = existingCharge.annualAmount
    if (validatedData.amount || validatedData.frequency || validatedData.billingCycle) {
      const amount = validatedData.amount || existingCharge.amount
      const frequency = validatedData.frequency || existingCharge.frequency
      const billingCycle = validatedData.billingCycle || existingCharge.billingCycle
      annualAmount = calculateAnnualAmount(amount, frequency, billingCycle)
    }

    const updateData: any = {
      ...validatedData,
      annualAmount
    }

    if (validatedData.nextDueDate) {
      updateData.nextDueDate = new Date(validatedData.nextDueDate)
    }

    if (validatedData.pausedUntil) {
      updateData.pausedUntil = new Date(validatedData.pausedUntil)
    }

    const updatedCharge = await prisma.recurringCharge.update({
      where: {
        id: params.id
      },
      data: updateData
    })

    return NextResponse.json(updatedCharge)

  } catch (error) {
    console.error('Error updating recurring charge:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Failed to update recurring charge' 
    }, { status: 500 })
  }
}

// DELETE - Delete recurring charge
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if the recurring charge exists and belongs to the user
    const existingCharge = await prisma.recurringCharge.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingCharge) {
      return NextResponse.json({ error: 'Recurring charge not found' }, { status: 404 })
    }

    await prisma.recurringCharge.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ message: 'Recurring charge deleted successfully' })

  } catch (error) {
    console.error('Error deleting recurring charge:', error)
    return NextResponse.json({ 
      error: 'Failed to delete recurring charge' 
    }, { status: 500 })
  }
}
