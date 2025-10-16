
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        transactions: {
          where: {
            businessProfileId: null,
            date: {
              gte: new Date(new Date().getFullYear(), 0, 1),
            }
          }
        },
        charitableGivings: {
          where: {
            businessProfileId: null,
            date: {
              gte: new Date(new Date().getFullYear(), 0, 1),
            }
          }
        },
        retirementAccounts: {
          where: {
            businessProfileId: null,
          }
        },
        healthcareExpenses: {
          where: {
            businessProfileId: null,
            date: {
              gte: new Date(new Date().getFullYear(), 0, 1),
            }
          }
        },
        educationSavings: {
          where: {
            businessProfileId: null,
          }
        },
        homeEquityAccounts: true,
        debts: {
          where: {
            businessProfileId: null,
            isActive: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate financial data
    const income = user.transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = user.transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const charitableDonations = user.charitableGivings
      .reduce((sum, d) => sum + d.amount, 0)

    const healthcareExpenses = user.healthcareExpenses
      .reduce((sum, h) => sum + h.amount, 0)

    const retirementContributions = user.retirementAccounts
      .reduce((sum, r) => sum + (r.annualContribution || 0), 0)

    const educationSavings = user.educationSavings
      .reduce((sum, e) => sum + (e.currentBalance || 0), 0)

    const mortgageInterest = user.homeEquityAccounts
      .reduce((sum, h) => sum + ((h.interestRate || 0) * h.currentBalance / 100), 0)

    const studentLoanInterest = user.debts
      .filter(d => d.type === 'STUDENT_LOAN')
      .reduce((sum, d) => sum + (d.interestRate * d.balance / 100), 0)

    const financialData = {
      income,
      expenses,
      charitableDonations,
      healthcareExpenses,
      retirementContributions,
      educationSavings,
      mortgageInterest,
      studentLoanInterest,
      filingStatus: user.businessType || 'SINGLE',
      hasChildren: false, // This could be derived from householdMembers
      age: 30, // This could be calculated from user profile
    }

    return NextResponse.json({ 
      success: true,
      financialData,
      userId: user.id
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
