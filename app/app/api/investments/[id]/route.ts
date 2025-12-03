import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const investment = await prisma.investment.findUnique({
      where: { id: params.id },
      include: {
        businessProfile: { select: { id: true, name: true } },
        transactions: { orderBy: { transactionDate: 'desc' } }
      }
    });

    if (!investment) {
      return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
    }

    return NextResponse.json({ investment });
  } catch (error) {
    console.error('Error fetching investment:', error);
    return NextResponse.json({ error: 'Failed to fetch investment' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, category, symbol, currentValue, originalCost, quantity, pricePerShare,
            purchaseDate, maturityDate, riskRating, sector, geography, notes, isActive,
            targetAllocation, targetPrice, stopLoss } = body;

    // Calculate returns if values changed
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category;
    if (symbol !== undefined) updateData.symbol = symbol;
    if (currentValue !== undefined) updateData.currentValue = parseFloat(currentValue);
    if (originalCost !== undefined) updateData.originalCost = parseFloat(originalCost);
    if (quantity !== undefined) updateData.quantity = parseFloat(quantity);
    if (pricePerShare !== undefined) updateData.pricePerShare = parseFloat(pricePerShare);
    if (purchaseDate !== undefined) updateData.purchaseDate = new Date(purchaseDate);
    if (maturityDate !== undefined) updateData.maturityDate = maturityDate ? new Date(maturityDate) : null;
    if (riskRating !== undefined) updateData.riskRating = riskRating;
    if (sector !== undefined) updateData.sector = sector;
    if (geography !== undefined) updateData.geography = geography;
    if (notes !== undefined) updateData.notes = notes;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (targetAllocation !== undefined) updateData.targetAllocation = parseFloat(targetAllocation);
    if (targetPrice !== undefined) updateData.targetPrice = parseFloat(targetPrice);
    if (stopLoss !== undefined) updateData.stopLoss = parseFloat(stopLoss);

    // Recalculate returns if values changed
    if (updateData.currentValue !== undefined || updateData.originalCost !== undefined) {
      const existing = await prisma.investment.findUnique({ where: { id: params.id } });
      if (existing) {
        const newCurrent = updateData.currentValue ?? existing.currentValue;
        const newCost = updateData.originalCost ?? existing.originalCost;
        updateData.totalReturn = newCurrent - newCost;
        updateData.totalReturnPct = newCost > 0 ? ((newCurrent - newCost) / newCost) * 100 : 0;
      }
    }

    updateData.lastUpdated = new Date();

    const investment = await prisma.investment.update({
      where: { id: params.id },
      data: updateData,
      include: { businessProfile: { select: { id: true, name: true } } }
    });

    return NextResponse.json({ success: true, investment });
  } catch (error) {
    console.error('Error updating investment:', error);
    return NextResponse.json({ error: 'Failed to update investment' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.investment.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true, message: 'Investment deleted successfully' });
  } catch (error) {
    console.error('Error deleting investment:', error);
    return NextResponse.json({ error: 'Failed to delete investment' }, { status: 500 });
  }
}

