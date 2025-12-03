
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

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
    const { name, type, value, description } = body;

    if (!name || !type || value === undefined) {
      return NextResponse.json(
        { error: 'Name, type, and value are required' },
        { status: 400 }
      );
    }

    // Get the active profile ID (can be null for personal assets)
    const activeProfileId = user.businessProfiles[0]?.id || null;

    const asset = await prisma.asset.create({
      data: {
        userId: user.id,
        businessProfileId: activeProfileId,
        name,
        type: type.toUpperCase().replace(/\s+/g, '_'),
        value: parseFloat(value),
        description: description || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, asset });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json(
      { error: 'Failed to create asset' },
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

    const assets = await prisma.asset.findMany({
      where: {
        userId: user.id,
        businessProfileId: activeProfileId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ assets });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}
