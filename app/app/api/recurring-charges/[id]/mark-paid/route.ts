
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

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

// POST - Mark recurring charge as paid
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const paidDate = body.paidDate ? new Date(body.paidDate) : new Date()

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

    // Calculate the next due date based on the current due date and frequency
    const nextDueDate = calculateNextDueDate(
      existingCharge.nextDueDate,
      existingCharge.frequency,
      existingCharge.billingCycle
    )

    // Update the recurring charge with payment information
    const updatedCharge = await prisma.recurringCharge.update({
      where: {
        id: params.id
      },
      data: {
        lastPaidDate: paidDate,
        nextDueDate: nextDueDate
      }
    })

    // Optionally create a transaction record for this payment
    if (body.createTransaction !== false) {
      try {
        await prisma.transaction.create({
          data: {
            userId: session.user.id,
            date: paidDate,
            amount: existingCharge.amount,
            description: `${existingCharge.name} - Recurring Payment`,
            merchant: existingCharge.vendor || existingCharge.name,
            category: existingCharge.category,
            type: 'EXPENSE',
            isRecurring: true
          }
        })
      } catch (transactionError) {
        console.warn('Failed to create transaction record:', transactionError)
        // Don't fail the main operation if transaction creation fails
      }
    }

    return NextResponse.json({
      message: 'Payment recorded successfully',
      recurringCharge: updatedCharge,
      nextDueDate
    })

  } catch (error) {
    console.error('Error marking recurring charge as paid:', error)
    return NextResponse.json({ 
      error: 'Failed to mark recurring charge as paid' 
    }, { status: 500 })
  }
}
