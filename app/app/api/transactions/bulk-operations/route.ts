
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// Helper function to build OR conditions for similar transaction search
function buildSimilarTransactionConditions(
  merchantPattern: string,
  descriptionPattern: string
): Prisma.TransactionWhereInput[] {
  const conditions: Prisma.TransactionWhereInput[] = [];
  
  if (merchantPattern) {
    conditions.push({
      merchant: {
        contains: merchantPattern,
        mode: Prisma.QueryMode.insensitive
      }
    });
  }
  
  conditions.push({
    description: {
      contains: descriptionPattern,
      mode: Prisma.QueryMode.insensitive
    }
  });
  
  return conditions;
}


/**
 * Bulk operations for transactions
 * - Move similar transactions to different business profile
 * - Delete similar transactions
 * - Recategorize similar transactions
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { operation, transactionId, targetProfileId, targetCategory } = body;

    if (!transactionId || !operation) {
      return NextResponse.json(
        { success: false, message: 'MISSING REQUIRED FIELDS' },
        { status: 400 }
      );
    }

    // Get the reference transaction
    const refTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { businessProfile: true }
    });

    if (!refTransaction || refTransaction.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'TRANSACTION NOT FOUND' },
        { status: 404 }
      );
    }

    let affectedCount = 0;
    let message = '';

    switch (operation) {
      case 'move_similar': {
        if (!targetProfileId) {
          return NextResponse.json(
            { success: false, message: 'TARGET_PROFILE_ID REQUIRED' },
            { status: 400 }
          );
        }

        // Find similar transactions based on merchant or description pattern
        const merchantPattern = refTransaction.merchant || '';
        const descriptionPattern = refTransaction.description.split(' ')[0]; // First word

        const similarTransactions = await prisma.transaction.findMany({
          where: {
            userId: session.user.id,
            OR: buildSimilarTransactionConditions(merchantPattern, descriptionPattern),
            businessProfileId: refTransaction.businessProfileId
          }
        });

        // Move all similar transactions
        const result = await prisma.transaction.updateMany({
          where: {
            id: { in: similarTransactions.map(t => t.id) }
          },
          data: {
            businessProfileId: targetProfileId
          }
        });

        affectedCount = result.count;
        message = `MOVED ${affectedCount} SIMILAR TRANSACTIONS`;
        break;
      }

      case 'delete_similar': {
        // Find similar transactions
        const merchantPattern = refTransaction.merchant || '';
        const descriptionPattern = refTransaction.description.split(' ')[0];

        const similarTransactions = await prisma.transaction.findMany({
          where: {
            userId: session.user.id,
            OR: buildSimilarTransactionConditions(merchantPattern, descriptionPattern),
            businessProfileId: refTransaction.businessProfileId
          }
        });

        // Delete all similar transactions
        const result = await prisma.transaction.deleteMany({
          where: {
            id: { in: similarTransactions.map(t => t.id) }
          }
        });

        affectedCount = result.count;
        message = `DELETED ${affectedCount} SIMILAR TRANSACTIONS`;
        break;
      }

      case 'recategorize_similar': {
        if (!targetCategory) {
          return NextResponse.json(
            { success: false, message: 'TARGET_CATEGORY REQUIRED' },
            { status: 400 }
          );
        }

        // Find similar transactions
        const merchantPattern = refTransaction.merchant || '';
        const descriptionPattern = refTransaction.description.split(' ')[0];

        const similarTransactions = await prisma.transaction.findMany({
          where: {
            userId: session.user.id,
            OR: buildSimilarTransactionConditions(merchantPattern, descriptionPattern),
            businessProfileId: refTransaction.businessProfileId
          }
        });

        // Get or create the target category
        let category = await prisma.category.findFirst({
          where: {
            userId: session.user.id,
            businessProfileId: refTransaction.businessProfileId,
            name: targetCategory
          }
        });

        if (!category) {
          category = await prisma.category.create({
            data: {
              userId: session.user.id,
              businessProfileId: refTransaction.businessProfileId,
              name: targetCategory,
              type: refTransaction.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
              color: '#3B82F6',
              icon: 'folder'
            }
          });
        }

        // Recategorize all similar transactions
        const result = await prisma.transaction.updateMany({
          where: {
            id: { in: similarTransactions.map(t => t.id) }
          },
          data: {
            category: targetCategory,
            categoryId: category.id
          }
        });

        affectedCount = result.count;
        message = `RECATEGORIZED ${affectedCount} SIMILAR TRANSACTIONS`;
        break;
      }

      case 'preview_similar': {
        // Find similar transactions (preview only)
        const merchantPattern = refTransaction.merchant || '';
        const descriptionPattern = refTransaction.description.split(' ')[0];

        const similarTransactions = await prisma.transaction.findMany({
          where: {
            userId: session.user.id,
            OR: buildSimilarTransactionConditions(merchantPattern, descriptionPattern),
            businessProfileId: refTransaction.businessProfileId
          },
          take: 50,
          orderBy: { date: 'desc' }
        });

        return NextResponse.json({
          success: true,
          count: similarTransactions.length,
          transactions: similarTransactions,
          message: `FOUND ${similarTransactions.length} SIMILAR TRANSACTIONS`
        });
      }

      default:
        return NextResponse.json(
          { success: false, message: 'INVALID OPERATION' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      affectedCount,
      message
    });

  } catch (error) {
    console.error('BULK OPERATIONS ERROR:', error);
    return NextResponse.json(
      { success: false, message: 'INTERNAL SERVER ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Get suggestion for which business profile a transaction should belong to
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { success: false, message: 'TRANSACTION_ID REQUIRED' },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!transaction || transaction.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'TRANSACTION NOT FOUND' },
        { status: 404 }
      );
    }

    // Get business profiles
    const profiles = await prisma.businessProfile.findMany({
      where: { userId: session.user.id }
    });

    const personalProfile = profiles.find(p => p.type === 'PERSONAL');
    const businessProfile = profiles.find(p => p.type === 'BUSINESS');

    // Analyze transaction to determine if it's household or business
    const description = transaction.description.toLowerCase();
    const merchant = (transaction.merchant || '').toLowerCase();
    const combinedText = `${description} ${merchant}`;

    const householdPatterns = [
      'rent', 'mortgage', 'electric', 'gas bill', 'water bill', 'grocery',
      'restaurant', 'dining', 'netflix', 'spotify', 'gym', 'personal'
    ];

    const businessPatterns = [
      'payroll', 'vendor', 'supplier', 'office', 'equipment',
      'software', 'license', 'marketing', 'advertising', 'client'
    ];

    const isHousehold = householdPatterns.some(p => combinedText.includes(p));
    const isBusiness = businessPatterns.some(p => combinedText.includes(p));

    let suggestion = null;
    let confidence = 0;

    if (isHousehold && !isBusiness) {
      suggestion = personalProfile;
      confidence = 0.85;
    } else if (isBusiness && !isHousehold) {
      suggestion = businessProfile;
      confidence = 0.90;
    } else {
      // Default to current profile
      suggestion = profiles.find(p => p.id === transaction.businessProfileId);
      confidence = 0.50;
    }

    return NextResponse.json({
      success: true,
      suggestion,
      confidence,
      allProfiles: profiles
    });

  } catch (error) {
    console.error('GET SUGGESTION ERROR:', error);
    return NextResponse.json(
      { success: false, message: 'INTERNAL SERVER ERROR' },
      { status: 500 }
    );
  }
}
