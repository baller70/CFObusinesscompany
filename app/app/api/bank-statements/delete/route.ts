
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/s3';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get statement ID from query params
    const { searchParams } = new URL(request.url);
    const statementId = searchParams.get('id');

    if (!statementId) {
      return NextResponse.json(
        { success: false, error: 'Statement ID is required' },
        { status: 400 }
      );
    }

    // Get the bank statement with transactions
    const statement = await prisma.bankStatement.findUnique({
      where: { id: statementId },
      include: {
        transactions: true
      }
    });

    if (!statement) {
      return NextResponse.json(
        { success: false, error: 'Statement not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (statement.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to delete this statement' },
        { status: 403 }
      );
    }

    // Delete from S3 if there's a file
    if (statement.cloudStoragePath) {
      try {
        await deleteFile(statement.cloudStoragePath);
        console.log(`[Delete] Deleted file from S3: ${statement.cloudStoragePath}`);
      } catch (error) {
        console.error('[Delete] Error deleting file from S3:', error);
        // Continue with database deletion even if S3 deletion fails
      }
    }

    // Delete transactions first (due to foreign key constraints)
    const transactionCount = statement.transactions?.length || 0;
    if (transactionCount > 0) {
      await prisma.transaction.deleteMany({
        where: { bankStatementId: statementId }
      });
      console.log(`[Delete] Deleted ${transactionCount} transactions`);
    }

    // Delete the bank statement
    await prisma.bankStatement.delete({
      where: { id: statementId }
    });
    console.log(`[Delete] Successfully deleted bank statement: ${statement.fileName}`);

    // ========================================
    // RECALCULATE RELATED DATA AFTER DELETION
    // ========================================

    // Check if there are any remaining bank statements for this user/profile
    const remainingStatements = await prisma.bankStatement.count({
      where: {
        userId: user.id,
        businessProfileId: statement.businessProfileId
      }
    });

    // Check remaining transactions for this user/profile
    const remainingTransactions = await prisma.transaction.count({
      where: {
        userId: user.id,
        businessProfileId: statement.businessProfileId
      }
    });

    console.log(`[Delete] Remaining statements for profile: ${remainingStatements}`);
    console.log(`[Delete] Remaining transactions for profile: ${remainingTransactions}`);

    // If no remaining transactions, clean up related data
    if (remainingTransactions === 0) {
      // Delete budgets for this profile (they were calculated from transactions)
      const deletedBudgets = await prisma.budget.deleteMany({
        where: {
          userId: user.id,
          businessProfileId: statement.businessProfileId
        }
      });
      console.log(`[Delete] Deleted ${deletedBudgets.count} budget records`);

      // Delete recurring charges for this profile
      const deletedRecurringCharges = await prisma.recurringCharge.deleteMany({
        where: {
          userId: user.id,
          businessProfileId: statement.businessProfileId
        }
      });
      console.log(`[Delete] Deleted ${deletedRecurringCharges.count} recurring charges`);

      // Delete recurring patterns for this profile
      const deletedRecurringPatterns = await prisma.recurringPattern.deleteMany({
        where: {
          userId: user.id,
          businessProfileId: statement.businessProfileId
        }
      });
      console.log(`[Delete] Deleted ${deletedRecurringPatterns.count} recurring patterns`);

      // Reset financial metrics for this profile
      if (statement.businessProfileId) {
        await prisma.financialMetrics.updateMany({
          where: {
            userId: user.id,
            businessProfileId: statement.businessProfileId
          },
          data: {
            monthlyIncome: 0,
            monthlyExpenses: 0,
            monthlyBurnRate: 0,
            lastCalculated: new Date()
          }
        });
        console.log(`[Delete] Reset financial metrics for profile`);
      }
    } else {
      // There are still transactions - recalculate metrics
      // Get the current month for recalculation
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Recalculate monthly income and expenses from remaining transactions
      const incomeSum = await prisma.transaction.aggregate({
        where: {
          userId: user.id,
          businessProfileId: statement.businessProfileId,
          type: 'INCOME',
          date: { gte: startOfMonth, lte: endOfMonth }
        },
        _sum: { amount: true }
      });

      const expenseSum = await prisma.transaction.aggregate({
        where: {
          userId: user.id,
          businessProfileId: statement.businessProfileId,
          type: 'EXPENSE',
          date: { gte: startOfMonth, lte: endOfMonth }
        },
        _sum: { amount: true }
      });

      const monthlyIncome = incomeSum._sum.amount || 0;
      const monthlyExpenses = Math.abs(expenseSum._sum.amount || 0);

      // Update financial metrics if profile exists
      if (statement.businessProfileId) {
        await prisma.financialMetrics.updateMany({
          where: {
            userId: user.id,
            businessProfileId: statement.businessProfileId
          },
          data: {
            monthlyIncome,
            monthlyExpenses,
            monthlyBurnRate: monthlyExpenses - monthlyIncome,
            lastCalculated: new Date()
          }
        });
        console.log(`[Delete] Recalculated financial metrics: income=${monthlyIncome}, expenses=${monthlyExpenses}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Bank statement deleted successfully',
      deletedStatement: {
        id: statement.id,
        fileName: statement.fileName,
        transactionsDeleted: transactionCount
      },
      cleanup: {
        remainingStatements,
        remainingTransactions,
        metricsRecalculated: true
      }
    });

  } catch (error) {
    console.error('[Delete] Error deleting bank statement:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete bank statement',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
