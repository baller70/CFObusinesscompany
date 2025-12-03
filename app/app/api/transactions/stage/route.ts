/**
 * Stage Transactions API
 * 
 * Stages transactions from manual entry or PDF extraction
 * before final commit to the Transaction table.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { 
  generateDedupHash, 
  parseManualInput,
  StagedTransactionInput 
} from '@/lib/transaction-deduplicator';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      sessionId, 
      bankStatementId, 
      source, 
      transactions, 
      rawText 
    } = body;

    // Generate session ID if not provided
    const importSessionId = sessionId || uuidv4();

    let transactionsToStage: StagedTransactionInput[] = [];

    // If raw text is provided, parse it
    if (rawText && source === 'MANUAL') {
      transactionsToStage = parseManualInput(rawText);
    } else if (transactions && Array.isArray(transactions)) {
      transactionsToStage = transactions;
    }

    if (transactionsToStage.length === 0) {
      return NextResponse.json({ 
        error: 'No valid transactions found',
        hint: 'Provide either rawText for manual parsing or a transactions array'
      }, { status: 400 });
    }

    // Stage all transactions
    const staged = await Promise.all(
      transactionsToStage.map(async (txn) => {
        const dedupHash = generateDedupHash(txn);
        
        return prisma.stagedTransaction.create({
          data: {
            userId: session.user.id,
            bankStatementId: bankStatementId || null,
            sessionId: importSessionId,
            date: new Date(txn.date),
            amount: Math.abs(txn.amount),
            description: txn.description,
            merchant: txn.merchant || null,
            category: txn.category || null,
            type: txn.type || (txn.amount < 0 ? 'EXPENSE' : 'INCOME'),
            source: source || txn.source || 'MANUAL',
            confidence: txn.confidence || 0.9,
            rawText: txn.rawText || null,
            dedupHash,
            status: 'PENDING'
          }
        });
      })
    );

    return NextResponse.json({
      success: true,
      sessionId: importSessionId,
      stagedCount: staged.length,
      transactions: staged
    });

  } catch (error) {
    console.error('[Stage API] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to stage transactions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET: Retrieve staged transactions for a session
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const bankStatementId = searchParams.get('bankStatementId');

    const where: any = { userId: session.user.id };
    if (sessionId) where.sessionId = sessionId;
    if (bankStatementId) where.bankStatementId = bankStatementId;

    const staged = await prisma.stagedTransaction.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    // Group by source
    const bySource = {
      PDF: staged.filter(t => t.source === 'PDF'),
      MANUAL: staged.filter(t => t.source === 'MANUAL'),
      CSV: staged.filter(t => t.source === 'CSV')
    };

    return NextResponse.json({
      total: staged.length,
      bySource: {
        pdf: bySource.PDF.length,
        manual: bySource.MANUAL.length,
        csv: bySource.CSV.length
      },
      transactions: staged
    });

  } catch (error) {
    console.error('[Stage API] GET Error:', error);
    return NextResponse.json({ error: 'Failed to retrieve staged transactions' }, { status: 500 });
  }
}

// DELETE: Clear staged transactions for a session
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const deleted = await prisma.stagedTransaction.deleteMany({
      where: {
        userId: session.user.id,
        sessionId
      }
    });

    return NextResponse.json({
      success: true,
      deletedCount: deleted.count
    });

  } catch (error) {
    console.error('[Stage API] DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete staged transactions' }, { status: 500 });
  }
}

