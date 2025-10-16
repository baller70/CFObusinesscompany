
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { calculateCreditScore, saveCalculatedCreditScore } from '@/lib/credit-score-calculator';

/**
 * POST /api/credit-scores/auto-update
 * Automatically calculate and update credit scores for all profiles
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        businessProfiles: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedScores: any[] = [];

    // Calculate for personal profile
    try {
      const personalResult = await calculateCreditScore(user.id, null);
      const personalScore = await saveCalculatedCreditScore(user.id, null, personalResult);
      updatedScores.push({
        profile: 'Personal',
        score: personalScore.score,
        rating: personalResult.rating
      });
    } catch (error) {
      console.error('Error calculating personal credit score:', error);
    }

    // Calculate for each business profile
    for (const profile of user.businessProfiles) {
      try {
        const result = await calculateCreditScore(user.id, profile.id);
        const score = await saveCalculatedCreditScore(user.id, profile.id, result);
        updatedScores.push({
          profile: profile.name,
          score: score.score,
          rating: result.rating
        });
      } catch (error) {
        console.error(`Error calculating credit score for ${profile.name}:`, error);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Credit scores updated successfully',
      updatedScores
    });
  } catch (error) {
    console.error('Error auto-updating credit scores:', error);
    return NextResponse.json({ 
      error: 'Failed to auto-update credit scores',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
