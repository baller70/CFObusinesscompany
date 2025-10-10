
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST switch to a different business profile
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
    const { businessProfileId } = body;

    if (!businessProfileId) {
      return NextResponse.json({ error: 'businessProfileId is required' }, { status: 400 });
    }

    // Check if the profile exists and belongs to the user
    const profile = await prisma.businessProfile.findFirst({
      where: {
        id: businessProfileId,
        userId: user.id,
        isActive: true
      }
    });

    if (!profile) {
      return NextResponse.json({ error: 'Business profile not found or inactive' }, { status: 404 });
    }

    // Update the user's current business profile
    await prisma.user.update({
      where: { id: user.id },
      data: { currentBusinessProfileId: businessProfileId }
    });

    return NextResponse.json({ success: true, currentBusinessProfileId: businessProfileId });
  } catch (error) {
    console.error('Error switching business profile:', error);
    return NextResponse.json({ error: 'Failed to switch business profile' }, { status: 500 });
  }
}
