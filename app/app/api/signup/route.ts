
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().optional()
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName } = signupSchema.parse(body)

    // Normalize email to lowercase and trim whitespace
    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }

    // Hash password with consistent salt rounds
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName?.trim(),
        name: `${firstName} ${lastName || ''}`.trim()
      }
    })

    // Create default categories
    const defaultCategories = [
      { name: 'Housing', type: 'EXPENSE', color: '#3B82F6', icon: 'home' },
      { name: 'Transportation', type: 'EXPENSE', color: '#10B981', icon: 'car' },
      { name: 'Food & Dining', type: 'EXPENSE', color: '#F59E0B', icon: 'utensils' },
      { name: 'Shopping', type: 'EXPENSE', color: '#EF4444', icon: 'shopping-bag' },
      { name: 'Healthcare', type: 'EXPENSE', color: '#8B5CF6', icon: 'heart' },
      { name: 'Entertainment', type: 'EXPENSE', color: '#F97316', icon: 'play' },
      { name: 'Bills & Utilities', type: 'EXPENSE', color: '#6366F1', icon: 'file-text' },
      { name: 'Salary', type: 'INCOME', color: '#059669', icon: 'dollar-sign' },
      { name: 'Other Income', type: 'INCOME', color: '#0D9488', icon: 'plus' },
      { name: 'Other Expenses', type: 'EXPENSE', color: '#64748B', icon: 'more-horizontal' }
    ]

    for (const category of defaultCategories) {
      await prisma.category.create({
        data: {
          userId: user.id,
          name: category.name,
          type: category.type as 'EXPENSE' | 'INCOME',
          color: category.color,
          icon: category.icon,
          isDefault: true
        }
      })
    }

    // Create initial financial metrics
    await prisma.financialMetrics.create({
      data: {
        userId: user.id,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        totalDebt: 0,
        totalAssets: 0,
        netWorth: 0
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
