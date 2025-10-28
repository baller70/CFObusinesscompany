
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        businessProfiles: {
          where: { isActive: true },
          take: 1
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, type, balance, interestRate, monthlyPayment } = body;

    if (!name || !type || balance === undefined) {
      return NextResponse.json(
        { error: 'Name, type, and balance are required' },
        { status: 400 }
      );
    }

    // Get the active profile ID (can be null for personal liabilities)
    const activeProfileId = user.businessProfiles[0]?.id || null;

    const liability = await prisma.liability.create({
      data: {
        userId: user.id,
        businessProfileId: activeProfileId,
        name,
        type: type.toUpperCase().replace(/\s+/g, '_'),
        balance: parseFloat(balance),
        interestRate: interestRate ? parseFloat(interestRate) : null,
        minimumPayment: monthlyPayment ? parseFloat(monthlyPayment) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, liability });
  } catch (error) {
    console.error('Error creating liability:', error);
    return NextResponse.json(
      { error: 'Failed to create liability' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        businessProfiles: {
          where: { isActive: true },
          take: 1
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const activeProfileId = user.businessProfiles[0]?.id || null;

    const liabilities = await prisma.liability.findMany({
      where: {
        userId: user.id,
        businessProfileId: activeProfileId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ liabilities });
  } catch (error) {
    console.error('Error fetching liabilities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch liabilities' },
      { status: 500 }
    );
  }
}
