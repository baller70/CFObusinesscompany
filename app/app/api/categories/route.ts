
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

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

    if (!user || !user.businessProfiles[0]) {
      return NextResponse.json({ categories: [] });
    }

    const activeProfileId = user.businessProfiles[0].id;

    // Fetch categories with transaction counts
    const categories = await prisma.category.findMany({
      where: {
        businessProfileId: activeProfileId
      },
      include: {
        transactions: {
          where: {
            businessProfileId: activeProfileId
          }
        },
        _count: {
          select: { transactions: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
