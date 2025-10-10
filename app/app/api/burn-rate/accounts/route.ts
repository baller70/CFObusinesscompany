
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
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const businessProfileId = request.nextUrl.searchParams.get('businessProfileId')

    // Fetch all account types
    const [bankAccounts, creditCards, loans, homeEquity, lineOfCredit] = await Promise.all([
      prisma.bankAccount.findMany({
        where: {
          userId: user.id,
          ...(businessProfileId && { businessProfileId }),
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.creditCardAccount.findMany({
        where: {
          userId: user.id,
          ...(businessProfileId && { businessProfileId }),
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.loanAccount.findMany({
        where: {
          userId: user.id,
          ...(businessProfileId && { businessProfileId }),
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.homeEquityAccount.findMany({
        where: {
          userId: user.id,
          ...(businessProfileId && { businessProfileId }),
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.lineOfCreditAccount.findMany({
        where: {
          userId: user.id,
          ...(businessProfileId && { businessProfileId }),
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      bankAccounts,
      creditCards,
      loans,
      homeEquity,
      lineOfCredit,
    })
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const data = await request.json()
    const { accountType, ...accountData } = data

    let result

    switch (accountType) {
      case 'bank':
        result = await prisma.bankAccount.create({
          data: {
            ...accountData,
            userId: user.id,
          },
        })
        break
      case 'creditCard':
        result = await prisma.creditCardAccount.create({
          data: {
            ...accountData,
            userId: user.id,
            availableCredit: accountData.creditLimit - accountData.currentBalance,
          },
        })
        break
      case 'loan':
        result = await prisma.loanAccount.create({
          data: {
            ...accountData,
            userId: user.id,
          },
        })
        break
      case 'homeEquity':
        result = await prisma.homeEquityAccount.create({
          data: {
            ...accountData,
            userId: user.id,
          },
        })
        break
      case 'lineOfCredit':
        result = await prisma.lineOfCreditAccount.create({
          data: {
            ...accountData,
            userId: user.id,
            availableCredit: accountData.creditLimit - accountData.currentBalance,
          },
        })
        break
      default:
        return NextResponse.json({ error: 'Invalid account type' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating account:', error)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const data = await request.json()
    const { id, accountType, ...updateData } = data

    let result

    switch (accountType) {
      case 'bank':
        result = await prisma.bankAccount.update({
          where: { id, userId: user.id },
          data: updateData,
        })
        break
      case 'creditCard':
        result = await prisma.creditCardAccount.update({
          where: { id, userId: user.id },
          data: {
            ...updateData,
            ...(updateData.creditLimit && updateData.currentBalance && {
              availableCredit: updateData.creditLimit - updateData.currentBalance,
            }),
          },
        })
        break
      case 'loan':
        result = await prisma.loanAccount.update({
          where: { id, userId: user.id },
          data: updateData,
        })
        break
      case 'homeEquity':
        result = await prisma.homeEquityAccount.update({
          where: { id, userId: user.id },
          data: updateData,
        })
        break
      case 'lineOfCredit':
        result = await prisma.lineOfCreditAccount.update({
          where: { id, userId: user.id },
          data: {
            ...updateData,
            ...(updateData.creditLimit && updateData.currentBalance && {
              availableCredit: updateData.creditLimit - updateData.currentBalance,
            }),
          },
        })
        break
      default:
        return NextResponse.json({ error: 'Invalid account type' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating account:', error)
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id, accountType } = await request.json()

    switch (accountType) {
      case 'bank':
        await prisma.bankAccount.update({
          where: { id, userId: user.id },
          data: { isActive: false },
        })
        break
      case 'creditCard':
        await prisma.creditCardAccount.update({
          where: { id, userId: user.id },
          data: { isActive: false },
        })
        break
      case 'loan':
        await prisma.loanAccount.update({
          where: { id, userId: user.id },
          data: { isActive: false },
        })
        break
      case 'homeEquity':
        await prisma.homeEquityAccount.update({
          where: { id, userId: user.id },
          data: { isActive: false },
        })
        break
      case 'lineOfCredit':
        await prisma.lineOfCreditAccount.update({
          where: { id, userId: user.id },
          data: { isActive: false },
        })
        break
      default:
        return NextResponse.json({ error: 'Invalid account type' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
