
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
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

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    
    // Default to current month/year if not specified
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    // Fetch budgets for the specified period
    const budgets = await prisma.budget.findMany({
      where: {
        userId: user.id,
        month: targetMonth,
        year: targetYear,
      },
      include: {
        businessProfile: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        category: 'asc'
      }
    });

    // Calculate summary stats
    // Identify income categories (typically "Income" or similar)
    const incomeBudgets = budgets.filter(b => 
      b.category.toLowerCase().includes('income') || 
      b.category.toLowerCase().includes('salary') ||
      b.category.toLowerCase().includes('revenue')
    );
    const expenseBudgets = budgets.filter(b => !incomeBudgets.includes(b));
    
    const totalBudget = expenseBudgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = expenseBudgets.reduce((sum, b) => sum + b.spent, 0);
    const totalIncome = incomeBudgets.reduce((sum, b) => sum + b.spent, 0);
    
    return NextResponse.json({
      budgets,
      summary: {
        totalBudget,
        totalSpent,
        totalIncome,
        remaining: totalBudget - totalSpent,
        percentUsed: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
      },
      period: {
        month: targetMonth,
        year: targetYear
      }
    });

  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budgets' },
      { status: 500 }
    );
  }
}
