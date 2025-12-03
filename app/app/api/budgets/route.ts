
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

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

    // Get the currently selected business profile ID from user
    const activeProfileId = user.currentBusinessProfileId;

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    // Default to current month/year if not specified
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    // Build where clause with profile filtering
    const whereClause: any = {
      userId: user.id,
      month: targetMonth,
      year: targetYear,
    };

    // Filter by active profile if exists
    if (activeProfileId) {
      whereClause.businessProfileId = activeProfileId;
    }

    // Fetch budgets for the specified period filtered by active profile
    const budgets = await prisma.budget.findMany({
      where: whereClause,
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

export async function POST(request: NextRequest) {
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
    const { name, category, amount, month, year, businessProfileId, type } = body;

    // Validate required fields
    if (!category || amount === undefined || !month || !year) {
      return NextResponse.json(
        { error: 'Missing required fields: category, amount, month, year' },
        { status: 400 }
      );
    }

    // Use category as name if not provided
    const budgetName = name || category;

    // Check if budget already exists for this category/month/year
    const existingBudget = await prisma.budget.findFirst({
      where: {
        userId: user.id,
        category,
        month: parseInt(month),
        year: parseInt(year),
        businessProfileId: businessProfileId || user.currentBusinessProfileId || null
      }
    });

    if (existingBudget) {
      // Update existing budget
      const updatedBudget = await prisma.budget.update({
        where: { id: existingBudget.id },
        data: {
          amount: parseFloat(amount),
          type: type || 'MONTHLY'
        },
        include: {
          businessProfile: {
            select: { id: true, name: true }
          }
        }
      });
      return NextResponse.json({ budget: updatedBudget, updated: true });
    }

    // Create new budget
    const budget = await prisma.budget.create({
      data: {
        userId: user.id,
        businessProfileId: businessProfileId || user.currentBusinessProfileId || null,
        name: budgetName,
        category,
        amount: parseFloat(amount),
        spent: 0,
        month: parseInt(month),
        year: parseInt(year),
        type: type || 'MONTHLY'
      },
      include: {
        businessProfile: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json({ budget, created: true });

  } catch (error) {
    console.error('Error creating budget:', error);
    return NextResponse.json(
      { error: 'Failed to create budget' },
      { status: 500 }
    );
  }
}
