
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createDefaultCategoriesForProfile } from '@/lib/default-categories';

// GET all business profiles for the current user
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
          orderBy: [
            { type: 'asc' }, // PERSONAL first, then BUSINESS
            { name: 'asc' }
          ]
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      profiles: user.businessProfiles,
      currentBusinessProfileId: user.currentBusinessProfileId
    });
  } catch (error) {
    console.error('Error fetching business profiles:', error);
    return NextResponse.json({ error: 'Failed to fetch business profiles' }, { status: 500 });
  }
}

// POST create a new business profile
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, type, description, industry, icon, color } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    // Validate type
    if (type !== 'PERSONAL' && type !== 'BUSINESS') {
      return NextResponse.json({ error: 'Type must be PERSONAL or BUSINESS' }, { status: 400 });
    }

    // Check if a profile with this name already exists for the user
    const existing = await prisma.businessProfile.findUnique({
      where: {
        userId_name: {
          userId: user.id,
          name: name
        }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'A business profile with this name already exists' }, { status: 400 });
    }

    // Create the new business profile
    const profile = await prisma.businessProfile.create({
      data: {
        userId: user.id,
        name,
        type,
        description,
        industry,
        icon,
        color,
        isDefault: false,
        isActive: true
      }
    });

    // Create default categories based on profile type
    await createDefaultCategoriesForProfile(prisma, user.id, profile.id, type);

    // Create initial financial metrics for this profile
    await prisma.financialMetrics.create({
      data: {
        userId: user.id,
        businessProfileId: profile.id,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        totalDebt: 0,
        totalAssets: 0,
        netWorth: 0
      }
    });

    // If this is the first business profile, set it as current
    if (!user.currentBusinessProfileId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { currentBusinessProfileId: profile.id }
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error creating business profile:', error);
    return NextResponse.json({ error: 'Failed to create business profile' }, { status: 500 });
  }
}
