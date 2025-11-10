
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { downloadFile } from '@/lib/s3';
import { AIBankStatementProcessor } from '@/lib/ai-processor';

// Increase timeout for large PDF processing
export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { statementId } = await request.json();
    
    if (!statementId) {
      return NextResponse.json({ error: 'Statement ID required' }, { status: 400 });
    }

    await processStatement(statementId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Process route error:', error);
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}

async function processStatement(statementId: string) {
  const aiProcessor = new AIBankStatementProcessor();
  
  try {
    // Get statement from database
    const statement = await prisma.bankStatement.findUnique({
      where: { id: statementId },
      include: { user: true }
    });

    if (!statement) {
      throw new Error('Statement not found');
    }

    // Update status to processing
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        status: 'PROCESSING',
        processingStage: 'EXTRACTING_DATA'
      }
    });

    // Get file from S3
    // @ts-ignore
    const signedUrl = await downloadFile(statement.cloudStoragePath);
    const fileResponse = await fetch(signedUrl);
    
    if (!fileResponse.ok) {
      throw new Error('Failed to download file from storage');
    }

    let extractedData: any;

    if (statement.fileType === 'PDF') {
      // Process PDF
      const arrayBuffer = await fileResponse.arrayBuffer();
      const base64Content = Buffer.from(arrayBuffer).toString('base64');
      extractedData = await aiProcessor.extractDataFromPDF(base64Content, statement.fileName);
    } else {
      // Process CSV
      const csvContent = await fileResponse.text();
      extractedData = await aiProcessor.processCSVData(csvContent);
    }

    // Update with extracted data
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        processingStage: 'CATEGORIZING_TRANSACTIONS',
        extractedData: extractedData,
        bankName: extractedData.bankInfo?.bankName,
        accountType: extractedData.bankInfo?.accountType,
        accountNumber: extractedData.bankInfo?.accountNumber,
        statementPeriod: extractedData.bankInfo?.statementPeriod,
        recordCount: extractedData.transactions?.length || 0
      }
    });

    // Categorize transactions - filter out any invalid entries
    const validTransactions = (extractedData.transactions || []).filter((t: any) => 
      t && t.date && t.description && typeof t.amount === 'number'
    );
    
    console.log(`[Process Route] Valid transactions to categorize: ${validTransactions.length} out of ${extractedData.transactions?.length || 0}`);
    
    if (validTransactions.length === 0) {
      throw new Error('No valid transactions found in the extracted data. The PDF may be corrupted or in an unsupported format.');
    }
    
    const categorizedTransactions = await aiProcessor.categorizeTransactions(validTransactions);

    // Update processing stage
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        processingStage: 'ANALYZING_PATTERNS'
      }
    });

    // Generate insights
    const insights = await aiProcessor.generateFinancialInsights(categorizedTransactions, {
      firstName: statement.user.firstName,
      businessType: statement.user.businessType,
      companyName: statement.user.companyName
    });

    // Update processing stage
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        processingStage: 'DISTRIBUTING_DATA',
        aiAnalysis: insights
      }
    });

    // Create transactions in database - filter out any with missing originalTransaction
    const validCategorizedTransactions = categorizedTransactions.filter((catTxn: any) => 
      catTxn && catTxn.originalTransaction && catTxn.originalTransaction.date && catTxn.originalTransaction.description
    );
    
    console.log(`[Process Route] Creating ${validCategorizedTransactions.length} transactions in database`);
    
    const transactionPromises = validCategorizedTransactions.map(async (catTxn: any) => {
      const originalTxn = catTxn.originalTransaction;
      
      // Determine transaction type based on amount
      let type: 'INCOME' | 'EXPENSE' | 'TRANSFER' = 'EXPENSE';
      if (originalTxn.amount > 0) {
        type = 'INCOME';
      } else if (originalTxn.description?.toLowerCase().includes('transfer')) {
        type = 'TRANSFER';
      }

      // Find or create category
      let category = await prisma.category.findFirst({
        where: {
          userId: statement.userId,
          name: catTxn.suggestedCategory
        }
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            userId: statement.userId,
            name: catTxn.suggestedCategory,
            type: type === 'INCOME' ? 'INCOME' : 'EXPENSE',
            color: getCategoryColor(catTxn.suggestedCategory),
            icon: getCategoryIcon(catTxn.suggestedCategory)
          }
        });
      }

      return prisma.transaction.create({
        data: {
          userId: statement.userId,
          bankStatementId: statementId,
          date: new Date(originalTxn.date),
          amount: Math.abs(originalTxn.amount),
          description: originalTxn.description || 'Unknown transaction',
          merchant: catTxn.merchant,
          category: category.name,
          categoryId: category.id,
          type: type,
          aiCategorized: true,
          confidence: catTxn.confidence,
          isRecurring: catTxn.isRecurring || false
        }
      });
    });

    await Promise.all(transactionPromises);
    
    const processedCount = validCategorizedTransactions.length;
    console.log(`[Process Route] Successfully created ${processedCount} transactions`);

    // Update processed count
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        processedCount: processedCount,
        transactionCount: processedCount,
        processingStage: 'COMPLETED',
        status: 'COMPLETED',
        processedAt: new Date()
      }
    });

    // Update user's financial metrics
    await updateFinancialMetrics(statement.userId);

    // Create success notification
    await prisma.notification.create({
      data: {
        userId: statement.userId,
        type: 'CSV_PROCESSED',
        title: 'Bank Statement Processed',
        message: `Successfully processed ${processedCount} transactions from ${statement.fileName}`,
        isActive: true
      }
    });

  } catch (error) {
    console.error('[Process Route] Statement processing error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during processing';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[Process Route] Error details:', {
      message: errorMessage,
      stack: errorStack
    });
    
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        status: 'FAILED',
        processingStage: 'FAILED',
        errorLog: errorStack || errorMessage
      }
    });

    throw error;
  }
}

async function updateFinancialMetrics(userId: string) {
  // Recalculate financial metrics based on all transactions
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: thirtyDaysAgo }
    }
  });

  const income = recentTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = recentTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyIncome = income / 30 * 30; // Normalize to monthly
  const monthlyExpenses = expenses / 30 * 30;

  //@ts-ignore
  await prisma.financialMetrics.upsert({
    //@ts-ignore
    where: { userId },
    create: {
      userId,
      monthlyIncome,
      monthlyExpenses,
      monthlyBurnRate: monthlyExpenses - monthlyIncome,
      lastCalculated: new Date()
    },
    update: {
      monthlyIncome,
      monthlyExpenses,
      monthlyBurnRate: monthlyExpenses - monthlyIncome,
      lastCalculated: new Date()
    }
  });
}

function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    'Food & Dining': '#FF6B6B',
    'Transportation': '#4ECDC4',
    'Shopping': '#45B7D1',
    'Entertainment': '#96CEB4',
    'Bills & Utilities': '#FFEAA7',
    'Healthcare': '#DDA0DD',
    'Education': '#98D8C8',
    'Travel': '#F7DC6F',
    'Income': '#2ECC71',
    'Salary': '#27AE60',
    'Fees & Charges': '#E74C3C',
    'Groceries': '#F39C12'
  };
  return colorMap[category] || '#3B82F6';
}

function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    'Food & Dining': 'utensils',
    'Transportation': 'car',
    'Shopping': 'shopping-bag',
    'Entertainment': 'film',
    'Bills & Utilities': 'zap',
    'Healthcare': 'heart',
    'Education': 'book',
    'Travel': 'plane',
    'Income': 'trending-up',
    'Salary': 'dollar-sign',
    'Fees & Charges': 'alert-circle',
    'Groceries': 'shopping-cart'
  };
  return iconMap[category] || 'folder';
}
