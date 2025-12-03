/**
 * Reconcile Transactions API
 * 
 * Runs deduplication on staged transactions and identifies
 * matches between PDF and Manual sources.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { 
  deduplicateTransactions,
  StagedTransactionInput,
  DeduplicationResult
} from '@/lib/transaction-deduplicator';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, bankStatementId } = body;

    if (!sessionId && !bankStatementId) {
      return NextResponse.json({ 
        error: 'Either sessionId or bankStatementId is required' 
      }, { status: 400 });
    }

    // Fetch all staged transactions
    const where: any = { userId: session.user.id, status: 'PENDING' };
    if (sessionId) where.sessionId = sessionId;
    if (bankStatementId) where.bankStatementId = bankStatementId;

    const staged = await prisma.stagedTransaction.findMany({ where });

    // Separate by source
    const pdfTransactions: StagedTransactionInput[] = staged
      .filter(t => t.source === 'PDF')
      .map(t => ({
        id: t.id,
        date: t.date,
        amount: t.amount,
        description: t.description,
        merchant: t.merchant || undefined,
        category: t.category || undefined,
        type: t.type,
        source: 'PDF' as const,
        confidence: t.confidence || 0.5
      }));

    const manualTransactions: StagedTransactionInput[] = staged
      .filter(t => t.source === 'MANUAL')
      .map(t => ({
        id: t.id,
        date: t.date,
        amount: t.amount,
        description: t.description,
        merchant: t.merchant || undefined,
        category: t.category || undefined,
        type: t.type,
        source: 'MANUAL' as const,
        confidence: t.confidence || 0.9,
        rawText: t.rawText || undefined
      }));

    // Run deduplication
    const result = deduplicateTransactions(pdfTransactions, manualTransactions);

    // Update staged transactions with match info
    const matchGroupId = `match_${Date.now()}`;
    
    // Update auto-merged pairs
    for (const match of result.autoMerged) {
      const pdfId = (match.pdf as any).id;
      const manualId = (match.manual as any).id;
      
      if (pdfId) {
        await prisma.stagedTransaction.update({
          where: { id: pdfId },
          data: { 
            status: 'MATCHED',
            matchGroupId,
            matchScore: match.matchScore,
            matchedWithId: manualId
          }
        });
      }
      if (manualId) {
        await prisma.stagedTransaction.update({
          where: { id: manualId },
          data: { 
            status: 'MATCHED',
            matchGroupId,
            matchScore: match.matchScore,
            matchedWithId: pdfId
          }
        });
      }
    }

    // Update needs-review pairs
    for (const review of result.needsReview) {
      const pdfId = (review.pdf as any).id;
      const manualId = (review.manual as any).id;
      
      if (pdfId) {
        await prisma.stagedTransaction.update({
          where: { id: pdfId },
          data: { 
            status: 'PENDING',
            matchGroupId,
            matchScore: review.matchScore,
            matchedWithId: manualId
          }
        });
      }
      if (manualId) {
        await prisma.stagedTransaction.update({
          where: { id: manualId },
          data: { 
            status: 'PENDING',
            matchGroupId,
            matchScore: review.matchScore,
            matchedWithId: pdfId
          }
        });
      }
    }

    // Mark unique transactions
    for (const txn of result.pdfOnly) {
      const id = (txn as any).id;
      if (id) {
        await prisma.stagedTransaction.update({
          where: { id },
          data: { status: 'UNIQUE' }
        });
      }
    }
    for (const txn of result.manualOnly) {
      const id = (txn as any).id;
      if (id) {
        await prisma.stagedTransaction.update({
          where: { id },
          data: { status: 'UNIQUE' }
        });
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalPdf: result.totalPdf,
        totalManual: result.totalManual,
        autoMerged: result.autoMerged.length,
        needsReview: result.needsReview.length,
        pdfOnly: result.pdfOnly.length,
        manualOnly: result.manualOnly.length,
        duplicatesFound: result.duplicatesFound
      },
      autoMerged: result.autoMerged,
      needsReview: result.needsReview,
      pdfOnly: result.pdfOnly,
      manualOnly: result.manualOnly
    });

  } catch (error) {
    console.error('[Reconcile API] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to reconcile transactions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

