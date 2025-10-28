
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getDefaultCategories } from '@/lib/default-categories';

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

    const activeProfile = user.businessProfiles[0];
    const activeProfileId = activeProfile.id;
    const profileType = activeProfile.type || 'BUSINESS';

    // Fetch user-created categories with transaction counts
    const userCategories = await prisma.category.findMany({
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

    // Get default categories based on profile type
    const defaultCategories = getDefaultCategories(profileType as 'PERSONAL' | 'BUSINESS');
    
    // Convert default categories to the expected format
    const defaultCategoriesFormatted = defaultCategories.map((cat, index) => ({
      id: `default-${index}`,
      name: cat.name,
      type: cat.type,
      color: cat.color,
      icon: cat.icon,
      description: `Default ${cat.type.toLowerCase()} category`,
      isDefault: true,
      isActive: true,
      transactions: [],
      _count: { transactions: 0 },
      budgetLimit: null,
      taxDeductible: false
    }));

    // Combine user categories and default categories
    const allCategories = [...userCategories, ...defaultCategoriesFormatted];

    return NextResponse.json({ categories: allCategories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
