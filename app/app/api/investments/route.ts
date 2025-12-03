import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId') || user.currentBusinessProfileId;
    const type = searchParams.get('type');
    const isActive = searchParams.get('isActive');

    const investments = await prisma.investment.findMany({
      where: {
        userId: user.id,
        ...(profileId && { businessProfileId: profileId }),
        ...(type && { type: type as any }),
        ...(isActive !== null && { isActive: isActive === 'true' })
      },
      include: {
        businessProfile: { select: { id: true, name: true } },
        transactions: { orderBy: { transactionDate: 'desc' }, take: 5 }
      },
      orderBy: { currentValue: 'desc' }
    });

    // Calculate summary
    const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalCost = investments.reduce((sum, inv) => sum + inv.originalCost, 0);
    const totalReturn = totalValue - totalCost;
    const totalReturnPct = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

    return NextResponse.json({
      investments,
      summary: { totalValue, totalCost, totalReturn, totalReturnPct, count: investments.length }
    });
  } catch (error) {
    console.error('Error fetching investments:', error);
    return NextResponse.json({ error: 'Failed to fetch investments' }, { status: 500 });
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
    const { name, type, category, symbol, currentValue, originalCost, quantity, pricePerShare,
            purchaseDate, businessProfileId, riskRating, sector, geography, notes } = body;

    if (!name || !type || !category || currentValue === undefined || originalCost === undefined || !purchaseDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const investment = await prisma.investment.create({
      data: {
        userId: user.id,
        businessProfileId: businessProfileId || user.currentBusinessProfileId || null,
        name, type, category, symbol: symbol || null,
        currentValue: parseFloat(currentValue),
        originalCost: parseFloat(originalCost),
        quantity: quantity ? parseFloat(quantity) : null,
        pricePerShare: pricePerShare ? parseFloat(pricePerShare) : null,
        purchaseDate: new Date(purchaseDate),
        totalReturn: parseFloat(currentValue) - parseFloat(originalCost),
        totalReturnPct: parseFloat(originalCost) > 0 
          ? ((parseFloat(currentValue) - parseFloat(originalCost)) / parseFloat(originalCost)) * 100 : 0,
        riskRating: riskRating || 'MEDIUM',
        sector: sector || null,
        geography: geography || null,
        notes: notes || null
      },
      include: { businessProfile: { select: { id: true, name: true } } }
    });

    return NextResponse.json({ success: true, investment });
  } catch (error) {
    console.error('Error creating investment:', error);
    return NextResponse.json({ error: 'Failed to create investment' }, { status: 500 });
  }
}

