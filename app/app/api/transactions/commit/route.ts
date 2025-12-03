/**
 * Commit Transactions API
 * 
 * Commits staged transactions to the final Transaction table
 * after user review and approval.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, bankStatementId, decisions } = body;

    if (!sessionId && !bankStatementId) {
      return NextResponse.json({ 
        error: 'Either sessionId or bankStatementId is required' 
      }, { status: 400 });
    }

    // Get user's business profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { currentBusinessProfileId: true }
    });
    const businessProfileId = user?.currentBusinessProfileId;

    // Fetch staged transactions to commit
    const where: any = {
      userId: session.user.id,
      status: { in: ['MATCHED', 'UNIQUE', 'PENDING'] }
    };
    if (sessionId) where.sessionId = sessionId;
    if (bankStatementId) where.bankStatementId = bankStatementId;

    console.log('[Commit API] Query where:', JSON.stringify(where));
    const staged = await prisma.stagedTransaction.findMany({ where });
    console.log('[Commit API] Found', staged.length, 'staged transactions');
    console.log('[Commit API] By status:', {
      MATCHED: staged.filter(t => t.status === 'MATCHED').length,
      UNIQUE: staged.filter(t => t.status === 'UNIQUE').length,
      PENDING: staged.filter(t => t.status === 'PENDING').length,
    });

    // Apply user decisions if provided
    const decisionsMap = new Map(
      (decisions || []).map((d: any) => [d.id, d.decision])
    );

    // Group matched pairs to avoid duplicates
    const processedMatches = new Set<string>();
    const toCommit: any[] = [];

    for (const txn of staged) {
      // Check user decision
      const decision = decisionsMap.get(txn.id);
      if (decision === 'DISCARD') {
        await prisma.stagedTransaction.update({
          where: { id: txn.id },
          data: { status: 'DISCARDED', userDecision: 'DISCARD' }
        });
        continue;
      }

      // For matched pairs, only commit once (prefer PDF data)
      if (txn.status === 'MATCHED' && txn.matchedWithId) {
        const matchKey = [txn.id, txn.matchedWithId].sort().join('|');
        if (processedMatches.has(matchKey)) continue;
        processedMatches.add(matchKey);

        // Get both transactions
        const matched = staged.find(t => t.id === txn.matchedWithId);
        const pdfTxn = txn.source === 'PDF' ? txn : matched;
        const manualTxn = txn.source === 'MANUAL' ? txn : matched;

        // Merge: prefer PDF for date/amount, use best description
        toCommit.push({
          userId: session.user.id,
          businessProfileId,
          bankStatementId: txn.bankStatementId,
          date: pdfTxn?.date || txn.date,
          amount: pdfTxn?.amount || txn.amount,
          description: (pdfTxn?.description?.length || 0) >= (manualTxn?.description?.length || 0)
            ? pdfTxn?.description : manualTxn?.description,
          merchant: pdfTxn?.merchant || manualTxn?.merchant,
          category: pdfTxn?.category || manualTxn?.category || 'Uncategorized',
          type: pdfTxn?.type || txn.type,
          source: 'HYBRID',
          aiCategorized: true,
          confidence: Math.max(pdfTxn?.confidence || 0, manualTxn?.confidence || 0),
          metadata: { mergedFrom: 'PDF+MANUAL', matchScore: txn.matchScore }
        });
      } else if (txn.status === 'UNIQUE' || txn.status === 'PENDING' || decision === 'KEEP') {
        // Unique or pending transactions - commit directly
        toCommit.push({
          userId: session.user.id,
          businessProfileId,
          bankStatementId: txn.bankStatementId,
          date: txn.date,
          amount: txn.amount,
          description: txn.description,
          merchant: txn.merchant,
          category: txn.category || 'Uncategorized',
          type: txn.type,
          source: txn.source,
          aiCategorized: txn.source === 'PDF',
          confidence: txn.confidence,
          metadata: { source: txn.source }
        });
      }
    }

    console.log('[Commit API] Prepared', toCommit.length, 'transactions to commit');

    // Create all transactions
    let committed = 0;
    const errors: string[] = [];

    for (const txnData of toCommit) {
      try {
        await prisma.transaction.create({ data: txnData });
        committed++;
      } catch (err) {
        console.error('[Commit API] Failed to create transaction:', txnData, err);
        errors.push(`Failed: ${txnData.description?.substring(0, 30)} - ${err instanceof Error ? err.message : 'Unknown'}`);
      }
    }

    console.log('[Commit API] Created', committed, 'of', toCommit.length, 'transactions');
    if (errors.length > 0) {
      console.log('[Commit API] Errors:', errors.slice(0, 5));
    }

    // Mark all staged as committed (include PENDING for items that were committed)
    await prisma.stagedTransaction.updateMany({
      where: {
        userId: session.user.id,
        sessionId: sessionId || undefined,
        bankStatementId: bankStatementId || undefined,
        status: { in: ['MATCHED', 'UNIQUE', 'PENDING'] }
      },
      data: { status: 'COMMITTED' }
    });

    // Update bank statement transaction count if applicable
    if (bankStatementId) {
      await prisma.bankStatement.update({
        where: { id: bankStatementId },
        data: { transactionCount: committed }
      });
    }

    return NextResponse.json({
      success: true,
      committedCount: committed,
      message: `Successfully committed ${committed} transactions`,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined
    });

  } catch (error) {
    console.error('[Commit API] Error:', error);
    return NextResponse.json({
      error: 'Failed to commit transactions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

