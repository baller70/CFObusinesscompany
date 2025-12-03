
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic';

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
        homeEquityAccounts: true,
        debts: {
          where: {
            businessProfileId: null,
            type: 'STUDENT_LOAN',
            isActive: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate income
    const income = user.transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    // Calculate deductions
    const charitableDeductions = user.charitableGivings
      .filter(d => d.taxDeductible)
      .reduce((sum, d) => sum + d.amount, 0)

    const healthcareExpenses = user.healthcareExpenses
      .reduce((sum, h) => sum + h.amount, 0)

    const mortgageInterest = user.homeEquityAccounts
      .reduce((sum, h) => sum + ((h.interestRate || 0) * h.currentBalance / 100), 0)

    const studentLoanInterest = Math.min(
      2500,
      user.debts.reduce((sum, d) => sum + (d.interestRate * d.balance / 100), 0)
    )

    const propertyTaxes = 10000 // Placeholder - would need to come from user data

    const standardDeduction = 13850 // 2024 standard deduction for single filer
    const itemizedDeductions = charitableDeductions + Math.min(10000, mortgageInterest + propertyTaxes)

    const totalDeductions = Math.max(standardDeduction, itemizedDeductions) + studentLoanInterest

    // Calculate taxable income
    const taxableIncome = Math.max(0, income - totalDeductions)

    // Simple tax calculation (2024 brackets for single filer)
    let estimatedTax = 0
    if (taxableIncome <= 11000) {
      estimatedTax = taxableIncome * 0.10
    } else if (taxableIncome <= 44725) {
      estimatedTax = 1100 + (taxableIncome - 11000) * 0.12
    } else if (taxableIncome <= 95375) {
      estimatedTax = 5147 + (taxableIncome - 44725) * 0.22
    } else if (taxableIncome <= 182100) {
      estimatedTax = 16290 + (taxableIncome - 95375) * 0.24
    } else if (taxableIncome <= 231250) {
      estimatedTax = 37104 + (taxableIncome - 182100) * 0.32
    } else if (taxableIncome <= 578125) {
      estimatedTax = 52832 + (taxableIncome - 231250) * 0.35
    } else {
      estimatedTax = 174238.25 + (taxableIncome - 578125) * 0.37
    }

    // Quarterly estimate
    const quarterlyEstimate = Math.ceil(estimatedTax / 4)

    return NextResponse.json({ 
      income,
      taxableIncome,
      estimatedTax: Math.ceil(estimatedTax),
      quarterlyEstimate,
      deductions: {
        standard: standardDeduction,
        itemized: itemizedDeductions,
        used: totalDeductions,
        charitable: charitableDeductions,
        mortgageInterest,
        studentLoanInterest,
        healthcareExpenses
      },
      effectiveTaxRate: income > 0 ? ((estimatedTax / income) * 100).toFixed(2) : 0
    })
  } catch (error) {
    console.error('Error calculating tax planning:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
