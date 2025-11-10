
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AIBankStatementProcessor } from '@/lib/ai-processor';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { statementDate, statementText } = await request.json();

    if (!statementDate || !statementText) {
      return NextResponse.json(
        { error: 'Statement date and text are required' },
        { status: 400 }
      );
    }

    console.log(`[Process Text] Starting processing for date: ${statementDate}`);
    console.log(`[Process Text] Text length: ${statementText.length} characters`);

    // Get user's active business profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        businessProfiles: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!user || user.businessProfiles.length === 0) {
      return NextResponse.json(
        { error: 'No active business profile found' },
        { status: 400 }
      );
    }

    const activeProfile = user.businessProfiles[0];

    // Create a bank statement record
    const bankStatement = await prisma.bankStatement.create({
      data: {
        fileName: `Manual Entry - ${new Date(statementDate).toLocaleDateString()}`,
        originalName: `Manual Entry - ${new Date(statementDate).toLocaleDateString()}`,
        fileSize: statementText.length,
        cloudStoragePath: '', // No file upload for text entry
        status: 'PROCESSING',
        processingStage: 'EXTRACTING_DATA',
        userId: session.user.id,
        businessProfileId: activeProfile.id,
        periodStart: new Date(statementDate),
        periodEnd: new Date(statementDate),
      },
    });

    console.log(`[Process Text] Created bank statement record: ${bankStatement.id}`);

    // Process the text using AI
    try {
      const aiProcessor = new AIBankStatementProcessor();
      
      console.log('[Process Text] Sending text to AI for extraction...');
      const extractedData = await aiProcessor.extractDataFromText(statementText);

      console.log(`[Process Text] AI extraction complete: ${extractedData.transactions.length} transactions`);
      
      // Log sample transactions with reference numbers
      if (extractedData.transactions.length > 0) {
        console.log('[Process Text] Sample transactions with reference numbers:');
        extractedData.transactions.slice(0, 3).forEach((t: any, idx: number) => {
          console.log(`  ${idx + 1}. Date: ${t.date}, Amount: ${t.amount}, Description: ${t.description}`);
          console.log(`     Reference: ${t.referenceNumber || 'N/A'}`);
        });
      }

      // Validate and filter transactions
      const validTransactions = extractedData.transactions.filter((t: any) => {
        if (!t.date) {
          console.warn('[Process Text] Skipping transaction with no date:', t);
          return false;
        }
        if (t.amount === 0) {
          console.warn('[Process Text] Skipping transaction with zero amount:', t);
          return false;
        }
        return true;
      });

      console.log(`[Process Text] Valid transactions: ${validTransactions.length}`);

      // Get all categories for the business profile
      const categories = await prisma.category.findMany({
        where: { businessProfileId: activeProfile.id },
      });

      // Categorize and save transactions
      let savedCount = 0;
      const errors: string[] = [];

      for (const transaction of validTransactions) {
        try {
          // Find matching category
          const category = categories.find(
            (c: any) => c.name.toLowerCase() === transaction.category?.toLowerCase()
          );

          // Determine transaction type
          let type = 'EXPENSE';
          if (transaction.amount > 0) {
            type = 'INCOME';
          } else if (transaction.type?.toUpperCase() === 'TRANSFER') {
            type = 'TRANSFER';
          }

          await prisma.transaction.create({
            data: {
              date: new Date(transaction.date),
              description: transaction.description || 'No description',
              amount: Math.abs(transaction.amount),
              type: type as 'INCOME' | 'EXPENSE' | 'TRANSFER',
              category: category?.name || transaction.category || 'Uncategorized',
              merchant: transaction.merchant || transaction.description || '',
              userId: session.user.id,
              businessProfileId: activeProfile.id,
              bankStatementId: bankStatement.id,
              categoryId: category?.id,
              metadata: transaction.referenceNumber ? {
                referenceNumber: transaction.referenceNumber,
                notes: transaction.notes || undefined
              } : undefined,
            },
          });

          savedCount++;
        } catch (error) {
          console.error('[Process Text] Error saving transaction:', error);
          errors.push(`Failed to save transaction: ${transaction.description}`);
        }
      }

      console.log(`[Process Text] Saved ${savedCount} transactions`);

      // Update bank statement status
      await prisma.bankStatement.update({
        where: { id: bankStatement.id },
        data: {
          status: 'COMPLETED',
          processingStage: 'COMPLETED',
          transactionCount: savedCount,
          errorLog: errors.length > 0 ? JSON.stringify(errors) : undefined,
        },
      });

      return NextResponse.json({
        success: true,
        transactionCount: savedCount,
        statementId: bankStatement.id,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error('[Process Text] Processing error:', error);
      
      // Update statement status to failed
      await prisma.bankStatement.update({
        where: { id: bankStatement.id },
        data: {
          status: 'FAILED',
          processingStage: 'FAILED',
          errorLog: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      return NextResponse.json(
        { error: 'Failed to process statement text' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Process Text] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
