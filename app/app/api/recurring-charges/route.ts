
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

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
      return NextResponse.json({ 
        charges: [],
        recurringCharges: [],
        summary: {
          totalCharges: 0,
          activeCharges: 0,
          totalMonthlyAmount: 0,
          totalAnnualAmount: 0,
          dueSoon: 0,
          overdue: 0,
          categories: []
        }
      });
    }

    const activeProfileId = user.businessProfiles[0].id;

    // Fetch recurring charges
    const recurringCharges = await prisma.recurringCharge.findMany({
      where: {
        businessProfileId: activeProfileId
      },
      orderBy: {
        nextDueDate: 'asc'
      }
    });

    // Calculate summary
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const activeCharges = recurringCharges.filter(c => c.isActive && !c.isPaused);
    const totalMonthlyAmount = activeCharges.reduce((sum, c) => {
      // Convert to monthly based on frequency
      const frequencyMultipliers: { [key: string]: number } = {
        DAILY: 30,
        WEEKLY: 4.33,
        BIWEEKLY: 2.17,
        MONTHLY: 1,
        BIMONTHLY: 0.5,
        QUARTERLY: 0.33,
        SEMIANNUALLY: 0.17,
        ANNUALLY: 0.08
      };
      const multiplier = frequencyMultipliers[c.frequency] || 1;
      return sum + (c.amount * multiplier);
    }, 0);
    
    const totalAnnualAmount = activeCharges.reduce((sum, c) => sum + c.annualAmount, 0);
    
    const dueSoon = activeCharges.filter(c => {
      const dueDate = new Date(c.nextDueDate);
      return dueDate <= sevenDaysFromNow && dueDate > now;
    }).length;
    
    const overdue = activeCharges.filter(c => {
      const dueDate = new Date(c.nextDueDate);
      return dueDate < now;
    }).length;
    
    const categories = [...new Set(recurringCharges.map(c => c.category))];

    const summary = {
      totalCharges: recurringCharges.length,
      activeCharges: activeCharges.length,
      totalMonthlyAmount,
      totalAnnualAmount,
      dueSoon,
      overdue,
      categories
    };

    return NextResponse.json({ charges: recurringCharges, recurringCharges, summary });
  } catch (error) {
    console.error('Error fetching recurring charges:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      charges: [],
      recurringCharges: [],
      summary: {
        totalCharges: 0,
        activeCharges: 0,
        totalMonthlyAmount: 0,
        totalAnnualAmount: 0,
        dueSoon: 0,
        overdue: 0,
        categories: []
      }
    }, { status: 500 });
  }
}
