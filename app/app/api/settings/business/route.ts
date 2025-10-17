
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        companyName: true,
        businessType: true,
        industry: true,
        address: true,
        city: true,
        state: true,
        country: true,
        zipCode: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching business info:', error)
    return NextResponse.json({ error: 'Failed to fetch business info' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { companyName, businessType, industry, address, city, state, country, zipCode } = data

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        companyName,
        businessType,
        industry,
        address,
        city,
        state,
        country,
        zipCode,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating business info:', error)
    return NextResponse.json({ error: 'Failed to update business info' }, { status: 500 })
  }
}
