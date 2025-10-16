
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { statementId, transactions } = body;

    if (!statementId) {
      return NextResponse.json({ error: 'Statement ID is required' }, { status: 400 });
    }

    // Verify statement exists and belongs to user
    const statement = await prisma.bankStatement.findUnique({
      where: {
        id: statementId,
        userId: session.user.id
      },
      include: {
        transactions: true
      }
    });

    if (!statement) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 });
    }

    // If transactions are provided, update them
    if (transactions && Array.isArray(transactions)) {
      // Update existing transactions with any edits made during review
      for (const txn of transactions) {
        if (txn.id) {
          // Update existing transaction
          await prisma.transaction.update({
            where: { id: txn.id },
            data: {
              description: txn.description,
              category: txn.category,
              amount: txn.amount,
              // Note: date is already set, keeping it as is
            }
          });
        }
      }
    }

    // Mark statement as COMPLETED
    const updatedStatement = await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        status: 'COMPLETED',
        processedAt: new Date()
      }
    });

    // Get final transaction count
    const finalCount = await prisma.transaction.count({
      where: { bankStatementId: statementId }
    });

    return NextResponse.json({
      success: true,
      message: 'Statement approved and transactions imported',
      transactionsCreated: finalCount,
      statement: updatedStatement
    });

  } catch (error) {
    console.error('Approve route error:', error);
    return NextResponse.json(
      { error: 'Failed to approve statement' },
      { status: 500 }
    );
  }
}
