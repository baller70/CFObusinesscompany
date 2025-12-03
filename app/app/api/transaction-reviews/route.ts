
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Fetch pending transaction reviews
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';
    const businessProfileId = searchParams.get('businessProfileId');

    const whereClause: any = {
      userId: session.user.id,
      status
    };

    if (businessProfileId) {
      whereClause.businessProfileId = businessProfileId;
    }

    const reviews = await prisma.transactionReview.findMany({
      where: whereClause,
      include: {
        businessProfile: true
      },
      orderBy: [
        { issueSeverity: 'desc' }, // HIGH, MEDIUM, LOW
        { createdAt: 'desc' }
      ]
    });

    // Get the actual transactions
    const reviewsWithTransactions = await Promise.all(
      reviews.map(async (review) => {
        const transaction = await prisma.transaction.findUnique({
          where: { id: review.transactionId },
          include: {
            categoryRelation: true
          }
        });
        return {
          ...review,
          transaction
        };
      })
    );

    // Get stats
    const stats = {
      pending: await prisma.transactionReview.count({
        where: { userId: session.user.id, status: 'PENDING' }
      }),
      approved: await prisma.transactionReview.count({
        where: { userId: session.user.id, status: 'APPROVED' }
      }),
      corrected: await prisma.transactionReview.count({
        where: { userId: session.user.id, status: 'CORRECTED' }
      })
    };

    return NextResponse.json({
      reviews: reviewsWithTransactions,
      stats
    });
  } catch (error) {
    console.error('Transaction reviews fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction reviews' },
      { status: 500 }
    );
  }
}

// POST - Approve or correct a transaction review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reviewId, action, corrections } = body; // action: 'approve' or 'correct'

    const review = await prisma.transactionReview.findUnique({
      where: { id: reviewId }
    });

    if (!review || review.userId !== session.user.id) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (action === 'approve') {
      // Mark as approved
      await prisma.transactionReview.update({
        where: { id: reviewId },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: session.user.id
        }
      });

      return NextResponse.json({ success: true, message: 'Transaction approved' });
    } else if (action === 'correct' && corrections) {
      // Apply corrections to transaction
      const transaction = await prisma.transaction.findUnique({
        where: { id: review.transactionId }
      });

      if (!transaction) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }

      const updateData: any = {};
      
      if (corrections.category) {
        // Find or create category
        let category = await prisma.category.findFirst({
          where: {
            userId: session.user.id,
            name: corrections.category
          }
        });

        if (!category) {
          category = await prisma.category.create({
            data: {
              userId: session.user.id,
              name: corrections.category,
              type: transaction.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
              color: '#3B82F6',
              icon: 'folder'
            }
          });
        }

        updateData.category = category.name;
        updateData.categoryId = category.id;

        // Record correction for learning
        const { recordUserCorrection } = await import('@/lib/accuracy-enhancer');
        await recordUserCorrection(
          session.user.id,
          transaction.id,
          'CATEGORY',
          transaction.category,
          corrections.category,
          transaction.merchant || undefined,
          transaction.businessProfileId
        );
      }

      if (corrections.profileType) {
        // Find the appropriate profile
        const profiles = await prisma.businessProfile.findMany({
          where: { userId: session.user.id }
        });
        
        const targetProfile = profiles.find(p => p.type === corrections.profileType);
        if (targetProfile) {
          updateData.businessProfileId = targetProfile.id;

          // Record correction for learning
          const { recordUserCorrection } = await import('@/lib/accuracy-enhancer');
          await recordUserCorrection(
            session.user.id,
            transaction.id,
            'PROFILE',
            transaction.businessProfileId || 'NONE',
            targetProfile.id,
            transaction.merchant || undefined,
            transaction.businessProfileId
          );
        }
      }

      if (corrections.merchant) {
        updateData.merchant = corrections.merchant;

        // Record correction for learning
        const { recordUserCorrection } = await import('@/lib/accuracy-enhancer');
        await recordUserCorrection(
          session.user.id,
          transaction.id,
          'MERCHANT',
          transaction.merchant || '',
          corrections.merchant,
          transaction.merchant || undefined,
          transaction.businessProfileId
        );
      }

      // Update transaction
      await prisma.transaction.update({
        where: { id: review.transactionId },
        data: updateData
      });

      // Update review
      await prisma.transactionReview.update({
        where: { id: reviewId },
        data: {
          status: 'CORRECTED',
          userCorrection: corrections,
          reviewedAt: new Date(),
          reviewedBy: session.user.id
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Transaction corrected successfully. The system will learn from this correction.' 
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Transaction review action error:', error);
    return NextResponse.json(
      { error: 'Failed to process review action' },
      { status: 500 }
    );
  }
}
