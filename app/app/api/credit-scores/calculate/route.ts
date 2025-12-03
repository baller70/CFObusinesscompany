
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { calculateCreditScore, saveCalculatedCreditScore } from '@/lib/credit-score-calculator';

export const dynamic = 'force-dynamic';

/**
 * POST /api/credit-scores/calculate
 * Automatically calculate and save credit score for current profile
 */
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

    const { businessProfileId } = await request.json();

    // Calculate credit score
    const result = await calculateCreditScore(
      user.id, 
      businessProfileId === 'personal' ? null : businessProfileId
    );

    // Save to database
    const savedScore = await saveCalculatedCreditScore(
      user.id,
      businessProfileId === 'personal' ? null : businessProfileId,
      result
    );

    return NextResponse.json({ 
      success: true,
      score: savedScore,
      result
    });
  } catch (error) {
    console.error('Error calculating credit score:', error);
    return NextResponse.json({ 
      error: 'Failed to calculate credit score',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/credit-scores/calculate
 * Preview credit score calculation without saving
 */
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
    const businessProfileId = searchParams.get('businessProfileId');

    // Calculate credit score (preview only)
    const result = await calculateCreditScore(
      user.id, 
      businessProfileId === 'personal' || !businessProfileId ? null : businessProfileId
    );

    return NextResponse.json({ 
      success: true,
      result,
      preview: true
    });
  } catch (error) {
    console.error('Error calculating credit score:', error);
    return NextResponse.json({ 
      error: 'Failed to calculate credit score',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
