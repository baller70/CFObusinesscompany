
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statementId = searchParams.get('id');

    if (!statementId) {
      return NextResponse.json({ error: 'Statement ID is required' }, { status: 400 });
    }

    // Get the bank statement with transactions
    const statement = await prisma.bankStatement.findUnique({
      where: {
        id: statementId,
        userId: session.user.id
      },
      include: {
        transactions: {
          orderBy: { date: 'desc' }
        },
        businessProfile: true
      }
    });

    if (!statement) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 });
    }

    // Format transactions for review
    const formattedTransactions = statement.transactions.map(txn => ({
      id: txn.id,
      date: txn.date.toISOString(),
      description: txn.description,
      amount: txn.amount,
      category: txn.category,
      merchant: txn.merchant,
      type: txn.amount >= 0 ? 'credit' : 'debit'
    }));

    // Create parsedData structure for compatibility
    const parsedData = {
      statementType: statement.statementType || 'unknown',
      accountNumber: statement.accountNumber || 'N/A',
      accountName: statement.accountName,
      periodStart: statement.periodStart?.toISOString() || new Date().toISOString(),
      periodEnd: statement.periodEnd?.toISOString() || new Date().toISOString(),
      beginningBalance: statement.beginningBalance || 0,
      endingBalance: statement.endingBalance || 0,
      transactions: formattedTransactions
    };

    return NextResponse.json({
      statement: {
        id: statement.id,
        fileName: statement.fileName,
        originalName: statement.originalName,
        status: statement.status,
        transactionCount: statement.transactions.length,
        parsedData,
        businessProfile: statement.businessProfile
      }
    });

  } catch (error) {
    console.error('Review route error:', error);
    return NextResponse.json(
      { error: 'Failed to load statement for review' },
      { status: 500 }
    );
  }
}
