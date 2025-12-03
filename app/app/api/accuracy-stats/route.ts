
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Fetch accuracy statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total transactions
    const totalTransactions = await prisma.transaction.count({
      where: { userId: session.user.id }
    });

    // Get high-confidence transactions (>= 0.85)
    const highConfidenceCount = await prisma.transaction.count({
      where: {
        userId: session.user.id,
        confidence: { gte: 0.85 }
      }
    });

    // Get review queue stats
    const pendingReviews = await prisma.transactionReview.count({
      where: {
        userId: session.user.id,
        status: 'PENDING'
      }
    });

    const completedReviews = await prisma.transactionReview.count({
      where: {
        userId: session.user.id,
        status: { in: ['APPROVED', 'CORRECTED'] }
      }
    });

    // Get merchant rules count
    const merchantRulesCount = await prisma.merchantRule.count({
      where: {
        userId: session.user.id,
        isActive: true
      }
    });

    // Get user corrections count (learning data)
    const userCorrectionsCount = await prisma.userCorrection.count({
      where: { userId: session.user.id }
    });

    // Get recurring patterns detected
    const recurringPatternsCount = await prisma.recurringPattern.count({
      where: {
        userId: session.user.id,
        isActive: true
      }
    });

    // Calculate accuracy percentage
    const accuracyPercentage = totalTransactions > 0
      ? (highConfidenceCount / totalTransactions) * 100
      : 0;

    // Calculate improvement from corrections
    const correctionImpact = userCorrectionsCount > 0
      ? Math.min(10, userCorrectionsCount * 0.5) // Each correction adds ~0.5% accuracy, max 10%
      : 0;

    // Calculate merchant rule impact
    const ruleImpact = merchantRulesCount > 0
      ? Math.min(15, merchantRulesCount * 3) // Each rule adds ~3% accuracy, max 15%
      : 0;

    // Calculate pattern recognition impact
    const patternImpact = recurringPatternsCount > 0
      ? Math.min(5, recurringPatternsCount * 0.5) // Each pattern adds ~0.5% accuracy, max 5%
      : 0;

    // Final estimated accuracy
    const estimatedAccuracy = Math.min(100, accuracyPercentage + correctionImpact + ruleImpact + patternImpact);

    // Get recent high-impact corrections
    const recentCorrections = await prisma.userCorrection.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return NextResponse.json({
      stats: {
        totalTransactions,
        highConfidenceCount,
        lowConfidenceCount: totalTransactions - highConfidenceCount,
        baseAccuracy: accuracyPercentage,
        estimatedAccuracy,
        improvements: {
          fromCorrections: correctionImpact,
          fromRules: ruleImpact,
          fromPatterns: patternImpact
        },
        reviewQueue: {
          pending: pendingReviews,
          completed: completedReviews,
          total: pendingReviews + completedReviews
        },
        learning: {
          merchantRules: merchantRulesCount,
          userCorrections: userCorrectionsCount,
          recurringPatterns: recurringPatternsCount
        }
      },
      recentCorrections
    });
  } catch (error) {
    console.error('Accuracy stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accuracy statistics' },
      { status: 500 }
    );
  }
}
