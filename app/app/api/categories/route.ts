
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getDefaultCategories } from '@/lib/default-categories';

export const dynamic = 'force-dynamic';

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

    // Fetch user-created categories (no include for transactions since there's no FK relationship)
    const userCategories = await prisma.category.findMany({
      where: {
        businessProfileId: activeProfileId
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Fetch all transactions for this profile
    const transactions = await prisma.transaction.findMany({
      where: {
        businessProfileId: activeProfileId
      },
      select: {
        id: true,
        amount: true,
        category: true,
        type: true,
        description: true,
        date: true
      }
    });

    // Group transactions by category name and calculate totals
    const categoriesWithTransactions = userCategories.map(category => {
      // Find all transactions that match this category name
      const categoryTransactions = transactions.filter(
        tx => tx.category && tx.category.trim() === category.name
      );

      return {
        ...category,
        transactions: categoryTransactions,
        _count: {
          transactions: categoryTransactions.length
        }
      };
    });

    return NextResponse.json({ categories: categoriesWithTransactions });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
