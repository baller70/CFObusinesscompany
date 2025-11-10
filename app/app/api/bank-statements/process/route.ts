
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
    let extractionMethods: string[] = ['ai_processor'];

    if (statement.fileType === 'PDF') {
      const arrayBuffer = await fileResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // ========================================
      // 🎯 AI-ONLY EXTRACTION MODE
      // Using GPT-4o with maximum accuracy settings
      // ========================================
      
      console.log('[Process Route] 🚀 Starting AI-ONLY EXTRACTION MODE');
      console.log('[Process Route] 🤖 Using GPT-4o (strongest model) with supreme accuracy settings');
      console.log('[Process Route] 📄 Bypassing PDF parser and OCR - AI handles everything');
      
      // Update status to show extraction is starting
      await prisma.bankStatement.update({
        where: { id: statementId },
        data: {
          processingStage: 'EXTRACTING_DATA',
          recordCount: 0
        }
      });
      
      // ========================================
      // AI-POWERED EXTRACTION (ONLY METHOD)
      // ========================================
      console.log('[Process Route] 🔍 Starting AI extraction (text-based)...');
      
      // Pass buffer directly to AI processor (it will use pdftotext internally)
      const aiResult = await aiProcessor.extractDataFromPDF(buffer, statement.fileName);
      
      console.log(`[Process Route] ✅ AI EXTRACTION COMPLETE: ${aiResult.transactions?.length || 0} transactions`);
      
      if (!aiResult.transactions || aiResult.transactions.length === 0) {
        throw new Error('AI extraction failed. No transactions were extracted from the PDF.');
      }
      
      // Log category breakdown
      const categoryCounts: Record<string, number> = {};
      aiResult.transactions.forEach((t: any) => {
        const cat = t.category || 'Uncategorized';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
      console.log('[Process Route] 📋 Transaction categories:');
      Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
        console.log(`[Process Route]   ${cat}: ${count}`);
      });
      
      // Update record count
      await prisma.bankStatement.update({
        where: { id: statementId },
        data: {
          recordCount: aiResult.transactions.length
        }
      });
      
      // Validation: Check if transaction count seems suspiciously low
      const fileSizeKB = (statement.fileSize || 0) / 1024;
      const expectedMinTransactions = Math.floor(fileSizeKB / 3); // Rough estimate: 1 transaction per 3KB
      
      if (aiResult.transactions.length < expectedMinTransactions && fileSizeKB > 50) {
        console.warn(`[Process Route] ⚠️ WARNING: Low transaction count (${aiResult.transactions.length}) for file size (${fileSizeKB.toFixed(1)}KB)`);
        console.warn(`[Process Route] ⚠️ Expected at least ${expectedMinTransactions} transactions`);
        console.warn(`[Process Route] ⚠️ This may indicate incomplete extraction`);
      }
      
      // Prepare final extracted data (no deduplication needed with single method)
      extractedData = {
        bankInfo: aiResult.bankInfo || {
          bankName: 'PNC Bank',
          accountNumber: 'Unknown',
          statementPeriod: 'Unknown',
          accountType: 'business'
        },
        transactions: aiResult.transactions.map((t: any) => ({
          date: t.date,
          description: t.description,
          amount: t.amount,
          type: t.type,
          category: t.category || 'Uncategorized',
          balance: t.balance
        })),
        summary: aiResult.summary || {
          startingBalance: 0,
          endingBalance: 0,
          transactionCount: aiResult.transactions.length
        },
        extractionMethods: extractionMethods
      };
      
    } else {
      // Process CSV
      const csvContent = await fileResponse.text();
      extractedData = await aiProcessor.processCSVData(csvContent);
      extractionMethods = ['csv_parser'];
    }
    
    // Log extraction summary
    console.log(`[Process Route] 🎉 EXTRACTION COMPLETE`);
    console.log(`[Process Route] 📊 Methods used: ${extractionMethods.join(' + ')}`);
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

/**
 * Deduplicates transactions from multiple extraction sources
 * Intelligently merges duplicates by keeping the best quality transaction
 */
function deduplicateTransactions(transactions: any[]): any[] {
  if (transactions.length === 0) return [];
  
  console.log('[Deduplication] Starting deduplication process...');
  
  // Sort transactions by source priority (PDF parser > OCR > AI)
  const sourcePriority: Record<string, number> = {
    'pdf_parser': 1,
    'azure_ocr': 2,
    'ai_processor': 3
  };
  
  // Create a map to track unique transactions
  // Key format: "date|amount|description_prefix"
  const transactionMap = new Map<string, any>();
  
  transactions.forEach(txn => {
    // Normalize data for comparison
    const date = normalizeDate(txn.date);
    const amount = normalizeAmount(txn.amount);
    const description = normalizeDescription(txn.description);
    
    // Create a unique key using date, amount, and FULL description
    // This prevents legitimate different transactions from being incorrectly deduplicated
    const key = `${date}|${amount}|${description.toLowerCase()}`;
    
    // Check if this transaction already exists
    const existing = transactionMap.get(key);
    
    if (!existing) {
      // New transaction, add it
      transactionMap.set(key, txn);
    } else {
      // Duplicate found, keep the one from the higher priority source
      const existingPriority = sourcePriority[existing.source] || 999;
      const newPriority = sourcePriority[txn.source] || 999;
      
      if (newPriority < existingPriority) {
        // New transaction has higher priority, replace
        console.log(`[Deduplication] Replacing ${existing.source} with ${txn.source} for: ${description.substring(0, 30)}...`);
        transactionMap.set(key, txn);
      } else {
        console.log(`[Deduplication] Keeping ${existing.source} over ${txn.source} for: ${description.substring(0, 30)}...`);
      }
    }
  });
  
  const deduplicated = Array.from(transactionMap.values());
  console.log(`[Deduplication] Reduced ${transactions.length} transactions to ${deduplicated.length} unique transactions`);
  
  return deduplicated;
}

/**
 * Normalizes date to YYYY-MM-DD format for comparison
 */
function normalizeDate(date: any): string {
  try {
    if (!date) return 'unknown';
    
    // If it's already a Date object
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    
    // If it's a string, try to parse it
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    
    return 'unknown';
  } catch (e) {
    return 'unknown';
  }
}

/**
 * Normalizes amount to a fixed precision for comparison
 */
function normalizeAmount(amount: any): string {
  try {
    if (typeof amount === 'number') {
      return amount.toFixed(2);
    }
    if (typeof amount === 'string') {
      const parsed = parseFloat(amount);
      if (!isNaN(parsed)) {
        return parsed.toFixed(2);
      }
    }
    return '0.00';
  } catch (e) {
    return '0.00';
  }
}

/**
 * Normalizes description by removing extra whitespace and special characters
 */
function normalizeDescription(description: any): string {
  try {
    if (!description) return 'unknown';
    
    return String(description)
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '');
  } catch (e) {
    return 'unknown';
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
