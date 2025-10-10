
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET a specific business profile
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const profile = await prisma.businessProfile.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!profile) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching business profile:', error);
    return NextResponse.json({ error: 'Failed to fetch business profile' }, { status: 500 });
  }
}

// PATCH update a business profile
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const { name, description, industry, icon, color, isActive } = body;

    // Check if profile exists and belongs to user
    const existingProfile = await prisma.businessProfile.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!existingProfile) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 });
    }

    // Update the profile
    const profile = await prisma.businessProfile.update({
      where: { id: params.id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        industry: industry !== undefined ? industry : undefined,
        icon: icon !== undefined ? icon : undefined,
        color: color !== undefined ? color : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error updating business profile:', error);
    return NextResponse.json({ error: 'Failed to update business profile' }, { status: 500 });
  }
}

// DELETE a business profile
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if profile exists and belongs to user
    const existingProfile = await prisma.businessProfile.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!existingProfile) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    const profile = await prisma.businessProfile.update({
      where: { id: params.id },
      data: { isActive: false }
    });

    // If this was the current profile, switch to another active profile
    if (user.currentBusinessProfileId === params.id) {
      const anotherProfile = await prisma.businessProfile.findFirst({
        where: {
          userId: user.id,
          isActive: true,
          id: { not: params.id }
        }
      });

      if (anotherProfile) {
        await prisma.user.update({
          where: { id: user.id },
          data: { currentBusinessProfileId: anotherProfile.id }
        });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { currentBusinessProfileId: null }
        });
      }
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error deleting business profile:', error);
    return NextResponse.json({ error: 'Failed to delete business profile' }, { status: 500 });
  }
}
