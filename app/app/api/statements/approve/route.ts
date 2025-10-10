
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { ParsedStatement, ParsedTransaction } from '@/lib/pdf-parser';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { statementId, transactions } = await req.json();

    if (!statementId) {
      return NextResponse.json({ error: 'Statement ID required' }, { status: 400 });
    }

    const statement = await prisma.bankStatement.findFirst({
      where: {
        id: statementId,
        userId: user.id,
      },
    });

    if (!statement) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 });
    }

    // Create transactions from approved data
    const parsedData = statement.parsedData as unknown as ParsedStatement;
    const transactionsToCreate = transactions || parsedData.transactions;

    // Create all transactions
    const createdTransactions = await Promise.all(
      transactionsToCreate.map((txn: ParsedTransaction) =>
        prisma.transaction.create({
          data: {
            userId: user.id,
            businessProfileId: statement.businessProfileId,
            date: new Date(txn.date),
            amount: txn.amount,
            description: txn.description,
            category: txn.category || 'Uncategorized',
            type: txn.amount >= 0 ? 'INCOME' : 'EXPENSE',
            source: 'bank_statement',
            metadata: {
              statementId: statement.id,
              rawText: txn.rawText,
              referenceNumber: txn.referenceNumber,
            },
          },
        })
      )
    );

    // Update statement status
    await prisma.bankStatement.update({
      where: { id: statement.id },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });

    // Recalculate financial metrics
    const allTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        businessProfileId: statement.businessProfileId,
      },
    });

    const income = allTransactions
      .filter((t: any) => t.amount > 0)
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const expenses = allTransactions
      .filter((t: any) => t.amount < 0)
      .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);

    // Update financial metrics if business profile exists
    if (statement.businessProfileId) {
      await prisma.financialMetrics.upsert({
        where: {
          businessProfileId: statement.businessProfileId,
        },
        create: {
          userId: user.id,
          businessProfileId: statement.businessProfileId,
          monthlyIncome: income,
          monthlyExpenses: expenses,
          debtToIncomeRatio: 0,
        },
        update: {
          monthlyIncome: income,
          monthlyExpenses: expenses,
        },
      });
    }

    return NextResponse.json({
      success: true,
      transactionsCreated: createdTransactions.length,
    });
  } catch (error) {
    console.error('Error approving statement:', error);
    return NextResponse.json({ error: 'Failed to approve statement' }, { status: 500 });
  }
}
