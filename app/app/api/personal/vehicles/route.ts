
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

    const vehicles = await prisma.vehicle.findMany({
      where: {
        userId: user.id,
        businessProfileId: businessProfileId,
        isActive: true
      },
      include: {
        expenses: {
          orderBy: { date: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ vehicles })
  } catch (error) {
    console.error('Error fetching vehicles:', error)
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

    const vehicle = await prisma.vehicle.create({
      data: {
        userId: user.id,
        businessProfileId: businessProfileId,
        make: body.make,
        model: body.model,
        year: parseInt(body.year),
        vin: body.vin || null,
        licensePlate: body.licensePlate || null,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        purchasePrice: body.purchasePrice ? parseFloat(body.purchasePrice) : null,
        currentValue: body.currentValue ? parseFloat(body.currentValue) : null,
        mileage: body.mileage ? parseInt(body.mileage) : null,
        color: body.color || null,
        fuelType: body.fuelType || null,
        insurancePolicy: body.insurancePolicy || null,
        registrationExpiry: body.registrationExpiry ? new Date(body.registrationExpiry) : null,
        inspectionExpiry: body.inspectionExpiry ? new Date(body.inspectionExpiry) : null,
        notes: body.notes || null
      }
    })

    return NextResponse.json({ vehicle }, { status: 201 })
  } catch (error) {
    console.error('Error creating vehicle:', error)
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
      return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 })
    }

    // Verify ownership
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!existingVehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: id },
      data: {
        make: updateData.make,
        model: updateData.model,
        year: parseInt(updateData.year),
        vin: updateData.vin || null,
        licensePlate: updateData.licensePlate || null,
        purchaseDate: updateData.purchaseDate ? new Date(updateData.purchaseDate) : null,
        purchasePrice: updateData.purchasePrice ? parseFloat(updateData.purchasePrice) : null,
        currentValue: updateData.currentValue ? parseFloat(updateData.currentValue) : null,
        mileage: updateData.mileage ? parseInt(updateData.mileage) : null,
        color: updateData.color || null,
        fuelType: updateData.fuelType || null,
        insurancePolicy: updateData.insurancePolicy || null,
        registrationExpiry: updateData.registrationExpiry ? new Date(updateData.registrationExpiry) : null,
        inspectionExpiry: updateData.inspectionExpiry ? new Date(updateData.inspectionExpiry) : null,
        notes: updateData.notes || null
      }
    })

    return NextResponse.json({ vehicle })
  } catch (error) {
    console.error('Error updating vehicle:', error)
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
      return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 })
    }

    // Verify ownership
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!existingVehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    await prisma.vehicle.update({
      where: { id: id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting vehicle:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
