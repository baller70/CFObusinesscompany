import { prisma } from '@/lib/db';
import { downloadFile } from '@/lib/s3';
import { AIBankStatementProcessor } from '@/lib/ai-processor';

export async function processStatement(statementId: string) {
  let aiProcessor: AIBankStatementProcessor;
  
  try {
    console.log(`[Processing] Initializing AI processor for statement ${statementId}`);
    aiProcessor = new AIBankStatementProcessor();
  } catch (error) {
    console.error('[Processing] Failed to initialize AI processor:', error);
    
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        status: 'FAILED',
        processingStage: 'FAILED',
        errorLog: `Failed to initialize AI processor: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }).catch(console.error);
    
    throw error;
  }
  
  try {
    // Get statement from database
    const statement = await prisma.bankStatement.findUnique({
      where: { id: statementId },
      include: { user: true }
    });

    if (!statement) {
      throw new Error('Statement not found');
    }

    console.log(`[Processing] Starting processing for ${statement.fileName}`);

    // Update status to processing
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        status: 'PROCESSING',
        processingStage: 'EXTRACTING_DATA'
      }
    });

    // Get file from S3
    if (!statement.cloudStoragePath) {
      throw new Error('No cloud storage path found');
    }

    console.log(`[Processing] Downloading file from S3: ${statement.cloudStoragePath}`);
    const signedUrl = await downloadFile(statement.cloudStoragePath);
    const fileResponse = await fetch(signedUrl);
    
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file from storage: ${fileResponse.statusText}`);
    }

    let extractedData: any;

    if (statement.fileType === 'PDF') {
      // Process PDF
      console.log(`[Processing] Extracting data from PDF`);
      const arrayBuffer = await fileResponse.arrayBuffer();
      const base64Content = Buffer.from(arrayBuffer).toString('base64');
      extractedData = await aiProcessor.extractDataFromPDF(base64Content, statement.fileName || 'statement.pdf');
    } else {
      // Process CSV
      console.log(`[Processing] Processing CSV data`);
      const csvContent = await fileResponse.text();
      extractedData = await aiProcessor.processCSVData(csvContent);
    }

    if (!extractedData || !extractedData.transactions) {
      throw new Error('No transactions extracted from file');
    }

    console.log(`[Processing] Extracted ${extractedData.transactions.length} transactions`);

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

    // Categorize transactions
    console.log(`[Processing] Categorizing transactions`);
    const categorizedTransactions = await aiProcessor.categorizeTransactions(extractedData.transactions || []);

    // Update processing stage
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        processingStage: 'ANALYZING_PATTERNS'
      }
    });

    // Generate insights
    console.log(`[Processing] Generating financial insights`);
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

    // Create transactions in database
    console.log(`[Processing] Creating ${categorizedTransactions.length} transactions in database`);
    const transactionPromises = categorizedTransactions.map(async (catTxn: any) => {
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

    // Update processed count
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        processedCount: categorizedTransactions.length,
        processingStage: 'COMPLETED',
        status: 'COMPLETED',
        processedAt: new Date()
      }
    });

    console.log(`[Processing] Successfully completed processing for ${statement.fileName}`);

    // Update budgets with actual spending
    await updateBudgetsFromTransactions(statement.userId);

    // Update user's financial metrics
    await updateFinancialMetrics(statement.userId);

    // Create success notification
    await prisma.notification.create({
      data: {
        userId: statement.userId,
        type: 'CSV_PROCESSED',
        title: 'Bank Statement Processed',
        message: `Successfully processed ${categorizedTransactions.length} transactions from ${statement.fileName}`,
        isActive: true
      }
    });

  } catch (error) {
    console.error('[Processing] Statement processing error:', error);
    
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        status: 'FAILED',
        processingStage: 'FAILED',
        errorLog: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    throw error;
  }
}

async function updateBudgetsFromTransactions(userId: string) {
  try {
    console.log('[Processing] Updating budgets from transactions');
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Get all transactions for the current month
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    
    const monthlyTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      include: {
        categoryRelation: true
      }
    });
    
    console.log(`[Processing] Found ${monthlyTransactions.length} transactions for ${currentMonth}/${currentYear}`);
    
    // Group transactions by category and calculate spending
    const categorySpending = new Map<string, { amount: number; type: 'INCOME' | 'EXPENSE' }>();
    
    for (const txn of monthlyTransactions) {
      const category = txn.category;
      const type = txn.type;
      
      if (!categorySpending.has(category)) {
        categorySpending.set(category, { amount: 0, type: type as 'INCOME' | 'EXPENSE' });
      }
      
      const current = categorySpending.get(category)!;
      current.amount += txn.amount;
    }
    
    console.log(`[Processing] Updating budgets for ${categorySpending.size} categories`);
    
    // Create or update budgets for each category
    for (const [category, data] of categorySpending.entries()) {
      const spent = data.amount;
      
      // Calculate a suggested budget amount (20% more than spent, or minimum $100)
      const suggestedBudget = Math.max(spent * 1.2, 100);
      
      // Check if budget exists
      const existingBudget = await prisma.budget.findFirst({
        where: {
          userId,
          category,
          month: currentMonth,
          year: currentYear
        }
      });
      
      if (existingBudget) {
        // Update existing budget with actual spending
        await prisma.budget.update({
          where: { id: existingBudget.id },
          data: {
            spent: spent
          }
        });
        console.log(`[Processing] Updated budget for ${category}: $${spent.toFixed(2)} spent`);
      } else {
        // Create new budget with suggested amount and actual spending
        await prisma.budget.create({
          data: {
            userId,
            category,
            month: currentMonth,
            year: currentYear,
            amount: suggestedBudget,
            spent: spent,
            type: 'MONTHLY',
            name: `${category} - ${currentMonth}/${currentYear}`
          }
        });
        console.log(`[Processing] Created budget for ${category}: $${suggestedBudget.toFixed(2)} budget, $${spent.toFixed(2)} spent`);
      }
    }
    
    console.log('[Processing] Budget update completed');
  } catch (error) {
    console.error('[Processing] Error updating budgets:', error);
    // Don't throw - this is not critical
  }
}

async function updateFinancialMetrics(userId: string) {
  try {
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
  } catch (error) {
    console.error('[Processing] Error updating financial metrics:', error);
    // Don't throw - this is not critical
  }
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
