
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getCurrentBusinessProfileId } from '@/lib/business-profile-utils'

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

    const accounts = await prisma.educationSavings.findMany({
      where: {
        userId: user.id,
        businessProfileId: businessProfileId
      },
      include: {
        contributions: {
          orderBy: { date: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const totalSavings = accounts.reduce((sum, account) => sum + account.currentBalance, 0)

    return NextResponse.json({ accounts, totalSavings })
  } catch (error) {
    console.error('Error fetching education savings:', error)
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
    const businessProfileId = await getCurrentBusinessProfileId()

    const account = await prisma.educationSavings.create({
      data: {
        userId: user.id,
        businessProfileId: businessProfileId,
        beneficiaryName: body.beneficiaryName,
        accountType: body.accountType,
        provider: body.provider || null,
        accountNumber: body.accountNumber || null,
        currentBalance: parseFloat(body.currentBalance) || 0,
        targetAmount: body.targetAmount ? parseFloat(body.targetAmount) : null,
        targetDate: body.targetDate ? new Date(body.targetDate) : null,
        annualContribution: body.annualContribution ? parseFloat(body.annualContribution) : null,
        stateSponsored: body.stateSponsored || false,
        taxBenefits: body.taxBenefits || null,
        investmentOptions: body.investmentOptions || null,
        notes: body.notes || null
      }
    })

    return NextResponse.json({ account }, { status: 201 })
  } catch (error) {
    console.error('Error creating education savings account:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
    }

    // Verify ownership
    const existingAccount = await prisma.educationSavings.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!existingAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const account = await prisma.educationSavings.update({
      where: { id: id },
      data: {
        beneficiaryName: updateData.beneficiaryName,
        accountType: updateData.accountType,
        provider: updateData.provider || null,
        accountNumber: updateData.accountNumber || null,
        currentBalance: parseFloat(updateData.currentBalance) || 0,
        targetAmount: updateData.targetAmount ? parseFloat(updateData.targetAmount) : null,
        targetDate: updateData.targetDate ? new Date(updateData.targetDate) : null,
        annualContribution: updateData.annualContribution ? parseFloat(updateData.annualContribution) : null,
        stateSponsored: updateData.stateSponsored,
        taxBenefits: updateData.taxBenefits || null,
        investmentOptions: updateData.investmentOptions || null,
        notes: updateData.notes || null
      }
    })

    return NextResponse.json({ account })
  } catch (error) {
    console.error('Error updating education savings account:', error)
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
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
    }

    // Verify ownership
    const existingAccount = await prisma.educationSavings.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!existingAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    await prisma.educationSavings.delete({
      where: { id: id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting education savings account:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
