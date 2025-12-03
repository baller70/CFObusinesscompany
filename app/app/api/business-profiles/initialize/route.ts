
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST initialize default business profiles for a user (Personal/Household)
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        businessProfiles: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already has business profiles
    if (user.businessProfiles.length > 0) {
      return NextResponse.json({ 
        message: 'User already has business profiles', 
        profiles: user.businessProfiles 
      });
    }

    // Create default Personal/Household profile
    const personalProfile = await prisma.businessProfile.create({
      data: {
        userId: user.id,
        name: 'Personal/Household',
        type: 'PERSONAL',
        description: 'Personal and household expenses',
        icon: 'Home',
        color: '#3B82F6',
        isDefault: true,
        isActive: true
      }
    });

    // Set it as the current profile
    await prisma.user.update({
      where: { id: user.id },
      data: { currentBusinessProfileId: personalProfile.id }
    });

    return NextResponse.json({ 
      success: true, 
      profile: personalProfile,
      message: 'Default Personal/Household profile created' 
    });
  } catch (error) {
    console.error('Error initializing business profiles:', error);
    return NextResponse.json({ error: 'Failed to initialize business profiles' }, { status: 500 });
  }
}
