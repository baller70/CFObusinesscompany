
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
    let extractionMethod = 'unknown';

    if (statement.fileType === 'PDF') {
      const arrayBuffer = await fileResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // TIER 1: Try direct PDF text extraction first
      console.log('[Process Route] 🔍 TIER 1: Attempting direct PDF text extraction');
      try {
        const { parsePNCStatement } = await import('@/lib/pdf-parser');
        const parsed = await parsePNCStatement(buffer);
        
        extractedData = {
          bankInfo: {
            bankName: 'PNC Bank',
            accountNumber: parsed.accountNumber,
            statementPeriod: `${parsed.periodStart} to ${parsed.periodEnd}`,
            accountType: parsed.statementType
          },
          transactions: parsed.transactions.map(t => ({
            date: t.date,
            description: t.description,
            amount: t.amount,
            type: t.type,
            category: t.category || 'Uncategorized',
            balance: undefined
          })),
          summary: {
            startingBalance: parsed.beginningBalance,
            endingBalance: parsed.endingBalance,
            transactionCount: parsed.transactions.length
          }
        };
        
        const txCount = extractedData.transactions.length;
        console.log(`[Process Route] TIER 1 Result: ${txCount} transactions extracted`);
        
        // Check if extraction was successful (should have at least 50 transactions for typical statements)
        if (txCount >= 50) {
          console.log(`[Process Route] ✅ TIER 1 SUCCESS: ${txCount} transactions (above threshold)`);
          extractionMethod = 'direct_pdf_parser';
        } else {
          console.log(`[Process Route] ⚠️ TIER 1 LOW COUNT: ${txCount} transactions (below 50, trying OCR)`);
          throw new Error('Transaction count below threshold, falling back to OCR');
        }
      } catch (pdfError) {
        console.log(`[Process Route] ❌ TIER 1 FAILED: ${pdfError}`);
        
        // TIER 2: Fall back to Azure OCR
        console.log('[Process Route] 🔍 TIER 2: Attempting Azure OCR extraction');
        try {
          const { processBankStatementWithOCR } = await import('@/lib/azure-ocr');
          const ocrResult = await processBankStatementWithOCR(buffer, statement.fileName);
          
          extractedData = {
            bankInfo: {
              bankName: ocrResult.accountInfo.bankName || 'Unknown Bank',
              accountNumber: ocrResult.accountInfo.accountNumber || 'Unknown',
              statementPeriod: ocrResult.accountInfo.periodStart && ocrResult.accountInfo.periodEnd 
                ? `${ocrResult.accountInfo.periodStart} to ${ocrResult.accountInfo.periodEnd}`
                : 'Unknown Period',
              accountType: 'business'
            },
            transactions: ocrResult.transactions.map(t => ({
              date: t.date,
              description: t.description,
              amount: t.type === 'credit' ? t.amount : -t.amount,
              type: t.type,
              category: 'Uncategorized',
              balance: undefined
            })),
            summary: {
              startingBalance: 0,
              endingBalance: 0,
              transactionCount: ocrResult.transactions.length
            }
          };
          
          const txCount = extractedData.transactions.length;
          console.log(`[Process Route] ✅ TIER 2 SUCCESS: ${txCount} transactions via OCR (confidence: ${(ocrResult.confidence * 100).toFixed(1)}%)`);
          extractionMethod = 'azure_ocr';
          
          if (txCount === 0) {
            throw new Error('OCR extracted 0 transactions');
          }
        } catch (ocrError) {
          console.log(`[Process Route] ❌ TIER 2 FAILED: ${ocrError}`);
          
          // TIER 3: Last resort - AI extraction
          console.log('[Process Route] 🔍 TIER 3: Attempting AI extraction (last resort)');
          try {
            // Convert buffer to base64 for AI processor
            const base64Content = buffer.toString('base64');
            const pdfData = await aiProcessor.extractDataFromPDF(base64Content, statement.fileName);
            extractedData = pdfData;
            extractionMethod = 'ai_extraction';
            console.log(`[Process Route] ✅ TIER 3 SUCCESS: ${extractedData.transactions?.length || 0} transactions via AI`);
          } catch (aiError) {
            console.error(`[Process Route] ❌ TIER 3 FAILED: ${aiError}`);
            throw new Error('All extraction methods failed. Please check if the PDF is a valid bank statement.');
          }
        }
      }
    } else {
      // Process CSV
      const csvContent = await fileResponse.text();
      extractedData = await aiProcessor.processCSVData(csvContent);
      extractionMethod = 'csv_parser';
    }
    
    // Log extraction method used
    console.log(`[Process Route] 📊 Final Extraction Method: ${extractionMethod}`);
    console.log(`[Process Route] 📊 Total Transactions: ${extractedData.transactions?.length || 0}`);

    // Update with extracted data (note: extraction method logged in console)
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
