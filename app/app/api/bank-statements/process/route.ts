
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

    // ========================================
    // GET BUSINESS AND PERSONAL PROFILES FOR INTELLIGENT ROUTING
    // ========================================
    const businessProfiles = await prisma.businessProfile.findMany({
      where: { 
        userId: statement.userId,
        isActive: true
      }
    });
    
    const businessProfile = businessProfiles.find(bp => bp.type === 'BUSINESS');
    const personalProfile = businessProfiles.find(bp => bp.type === 'PERSONAL');
    
    console.log(`[Process Route] Found profiles - Business: ${businessProfile?.name || 'None'}, Personal: ${personalProfile?.name || 'None'}`);

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
      console.log('[Process Route] 🚀 SIMPLE PDF EXTRACTION - Like Abacus Chat Element');
      
      const arrayBuffer = await fileResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Send PDF directly to LLM
      const aiResult = await aiProcessor.extractDataFromPDF(buffer, statement.fileName);
      
      console.log(`[Process Route] ✅ Extracted ${aiResult.transactions?.length || 0} transactions`);
      console.log(`[Process Route] LLM reported count: ${aiResult.transactionCount}`);
      
      extractedData = aiResult;
      
    } else {
      // Process CSV
      const csvContent = await fileResponse.text();
      extractedData = await aiProcessor.processCSVData(csvContent);
    }
    
    // Log what we got
    console.log(`[Process Route] 📊 Total Transactions: ${extractedData.transactions?.length || 0}`);

    const transactions = extractedData.transactions || [];
    
    // ========================================
    // CRITICAL: CATEGORIZE TRANSACTIONS WITH AI
    // This is the ROUTING STEP - classifies as BUSINESS/PERSONAL
    // ========================================
    console.log('[Process Route] 🤖 Starting AI categorization (THIS IS THE ROUTING STEP)...');
    const categorizedTransactions = await aiProcessor.categorizeTransactions(transactions, {
      industry: null,
      businessType: 'BUSINESS',
      companyName: null
    });
    console.log(`[Process Route] ✅ Categorization complete: ${categorizedTransactions.length} transactions`);
    
    console.log(`[Process Route] 💾 Saving ${categorizedTransactions.length} transactions to database`);
    
    let businessCount = 0;
    let personalCount = 0;

    const transactionPromises = categorizedTransactions.map(async (catTxn: any) => {
      const txn = catTxn.originalTransaction;
      
      // Route based on AI categorization's profileType (THIS IS THE ROUTING)
      let targetProfileId = statement.businessProfileId; // Default
      const aiProfileType = catTxn.profileType?.toUpperCase();
      
      if (aiProfileType === 'BUSINESS' && businessProfile) {
        targetProfileId = businessProfile.id;
        businessCount++;
        console.log(`[Process Route] 🏢 BUSINESS: ${txn.description} (confidence: ${catTxn.profileConfidence})`);
      } else if (aiProfileType === 'PERSONAL' && personalProfile) {
        targetProfileId = personalProfile.id;
        personalCount++;
        console.log(`[Process Route] 🏠 PERSONAL: ${txn.description} (confidence: ${catTxn.profileConfidence})`);
      } else {
        console.log(`[Process Route] ⚠️ UNCLASSIFIED: ${txn.description} - using default profile`);
      }

      // Determine transaction type
      let type: 'INCOME' | 'EXPENSE' | 'TRANSFER' = txn.amount > 0 ? 'INCOME' : 'EXPENSE';
      if (txn.type?.toUpperCase() === 'TRANSFER') {
        type = 'TRANSFER';
      }

      // Find or create category (use AI suggested category)
      let category = await prisma.category.findFirst({
        where: {
          userId: statement.userId,
          name: catTxn.suggestedCategory || txn.category || 'Uncategorized'
        }
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            userId: statement.userId,
            name: catTxn.suggestedCategory || txn.category || 'Uncategorized',
            type: type === 'INCOME' ? 'INCOME' : 'EXPENSE',
            color: '#94a3b8',
            icon: 'tag'
          }
        });
      }

      // Ensure valid date
      let transactionDate;
      try {
        transactionDate = new Date(txn.date);
        if (isNaN(transactionDate.getTime())) {
          transactionDate = new Date();
        }
      } catch {
        transactionDate = new Date();
      }

      return prisma.transaction.create({
        data: {
          userId: statement.userId,
          businessProfileId: targetProfileId,
          bankStatementId: statementId,
          date: transactionDate,
          amount: Math.abs(txn.amount),
          description: txn.description || 'Unknown',
          category: category.name,
          categoryId: category.id,
          merchant: catTxn.merchant || txn.description || '',
          type: type,
          aiCategorized: true,
          confidence: catTxn.confidence || 0.9,
          isRecurring: catTxn.isRecurring || false
        }
      });
    });

    await Promise.all(transactionPromises);
    
    console.log(`[Process Route] ✅ Created ${transactions.length} transactions`);
    console.log(`[Process Route] 🏢 Business: ${businessCount}`);
    console.log(`[Process Route] 🏠 Personal: ${personalCount}`);

    // Update statement status
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        transactionCount: transactions.length,
        status: 'COMPLETED',
        processedAt: new Date()
      }
    });

    console.log(`[Process Route] ✅ DONE! Transactions saved and routed correctly`);

  } catch (error) {
    console.error('[Process Route] Error:', error);
    
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        status: 'FAILED',
        errorLog: error instanceof Error ? error.message : 'Unknown error'
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
