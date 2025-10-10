
import * as PdfParse from 'pdf-parse';
import Papa from 'papaparse';
import { PrismaClient, Prisma } from '@prisma/client';
import { downloadFileBuffer } from './s3';

const prisma = new PrismaClient();

interface ParsedTransaction {
  date: Date;
  amount: number;
  description: string;
  merchant?: string;
  category?: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
}

interface ProcessingResult {
  transactions: ParsedTransaction[];
  metadata: {
    totalTransactions: number;
    dateRange: { start: Date; end: Date };
    totalIncome: number;
    totalExpense: number;
  };
}

/**
 * Intelligently detect household expenses using AI patterns
 */
export function detectHouseholdExpense(transaction: ParsedTransaction): boolean {
  const description = transaction.description.toLowerCase();
  const merchant = (transaction.merchant || '').toLowerCase();
  
  // Household expense patterns
  const householdPatterns = [
    // Housing & Utilities
    'rent', 'mortgage', 'property', 'electric', 'gas bill', 'water bill', 'internet', 'cable',
    'phone bill', 'utility', 'hoa', 'homeowners', 'apartment',
    
    // Groceries & Food
    'grocery', 'safeway', 'whole foods', 'trader joe', 'kroger', 'walmart', 'target',
    'costco', 'sam\'s club', 'food', 'supermarket',
    
    // Personal Care
    'pharmacy', 'cvs', 'walgreens', 'rite aid', 'doctor', 'dentist', 'medical',
    'hospital', 'clinic', 'insurance', 'gym', 'fitness',
    
    // Entertainment & Lifestyle
    'netflix', 'spotify', 'hulu', 'disney', 'amazon prime', 'subscription',
    'movie', 'theater', 'restaurant', 'dining', 'starbucks', 'coffee',
    
    // Transportation (Personal)
    'gas station', 'shell', 'exxon', 'chevron', 'bp', 'auto', 'car payment',
    'dmv', 'parking', 'uber', 'lyft', 'taxi',
    
    // Household Items
    'home depot', 'lowe\'s', 'ikea', 'bed bath', 'furniture',
    'cleaning', 'laundry',
    
    // Personal Shopping
    'clothing', 'shoes', 'fashion', 'mall', 'department store',
    'nordstrom', 'macy', 'tj maxx'
  ];
  
  // Business expense patterns (to exclude)
  const businessPatterns = [
    'payroll', 'employee', 'contractor', 'vendor', 'supplier', 'inventory',
    'office', 'equipment', 'software license', 'saas', 'business',
    'client', 'professional service', 'consulting', 'marketing',
    'advertising', 'legal', 'accounting', 'tax', 'license',
    'incorporation', 'llc', 'trademark', 'patent'
  ];
  
  const combinedText = `${description} ${merchant}`;
  
  // Check if it's clearly a business expense
  const isBusinessExpense = businessPatterns.some(pattern => 
    combinedText.includes(pattern)
  );
  
  if (isBusinessExpense) {
    return false;
  }
  
  // Check if it's a household expense
  const isHouseholdExpense = householdPatterns.some(pattern => 
    combinedText.includes(pattern)
  );
  
  return isHouseholdExpense;
}

/**
 * Categorize transaction using AI patterns
 */
export function categorizeTransaction(transaction: ParsedTransaction): {
  category: string;
  isHousehold: boolean;
  confidence: number;
} {
  const description = transaction.description.toLowerCase();
  const merchant = (transaction.merchant || '').toLowerCase();
  const combinedText = `${description} ${merchant}`;
  
  const isHousehold = detectHouseholdExpense(transaction);
  
  // Income categories
  if (transaction.amount > 0 || transaction.type === 'INCOME') {
    if (combinedText.includes('salary') || combinedText.includes('payroll') || combinedText.includes('direct deposit')) {
      return { category: 'Salary', isHousehold: true, confidence: 0.98 };
    }
    if (combinedText.includes('dividend') || combinedText.includes('interest')) {
      return { category: 'Investment Income', isHousehold: false, confidence: 0.95 };
    }
    if (combinedText.includes('client') || combinedText.includes('invoice') || combinedText.includes('revenue')) {
      return { category: 'Business Revenue', isHousehold: false, confidence: 0.92 };
    }
    return { category: 'Other Income', isHousehold, confidence: 0.70 };
  }
  
  // Expense categories
  const categoryMap: { [key: string]: { patterns: string[]; category: string; household: boolean; confidence: number } } = {
    housing: {
      patterns: ['rent', 'mortgage', 'property', 'hoa', 'homeowners'],
      category: 'Housing',
      household: true,
      confidence: 0.95
    },
    utilities: {
      patterns: ['electric', 'gas bill', 'water', 'internet', 'cable', 'phone bill', 'utility'],
      category: 'Utilities',
      household: true,
      confidence: 0.94
    },
    groceries: {
      patterns: ['grocery', 'safeway', 'whole foods', 'trader joe', 'kroger', 'walmart grocery', 'food'],
      category: 'Groceries',
      household: true,
      confidence: 0.92
    },
    dining: {
      patterns: ['restaurant', 'dining', 'starbucks', 'coffee', 'cafe', 'bar', 'food delivery'],
      category: 'Dining Out',
      household: true,
      confidence: 0.90
    },
    transportation: {
      patterns: ['gas station', 'shell', 'exxon', 'chevron', 'uber', 'lyft', 'taxi', 'parking'],
      category: 'Transportation',
      household: true,
      confidence: 0.89
    },
    healthcare: {
      patterns: ['pharmacy', 'cvs', 'walgreens', 'doctor', 'dentist', 'medical', 'hospital', 'clinic'],
      category: 'Healthcare',
      household: true,
      confidence: 0.93
    },
    entertainment: {
      patterns: ['netflix', 'spotify', 'hulu', 'disney', 'movie', 'theater', 'entertainment'],
      category: 'Entertainment',
      household: true,
      confidence: 0.91
    },
    shopping: {
      patterns: ['amazon', 'target', 'walmart', 'shopping', 'retail', 'mall'],
      category: 'Shopping',
      household: true,
      confidence: 0.85
    },
    businessExpenses: {
      patterns: ['office', 'equipment', 'software', 'saas', 'license', 'subscription'],
      category: 'Business Expenses',
      household: false,
      confidence: 0.88
    },
    payroll: {
      patterns: ['payroll', 'employee', 'contractor', 'wages'],
      category: 'Payroll',
      household: false,
      confidence: 0.96
    },
    marketing: {
      patterns: ['marketing', 'advertising', 'social media', 'ads'],
      category: 'Marketing',
      household: false,
      confidence: 0.87
    },
    professional: {
      patterns: ['legal', 'accounting', 'consulting', 'professional service'],
      category: 'Professional Services',
      household: false,
      confidence: 0.90
    }
  };
  
  for (const key in categoryMap) {
    const { patterns, category, household, confidence } = categoryMap[key];
    if (patterns.some(pattern => combinedText.includes(pattern))) {
      return { category, isHousehold: household, confidence };
    }
  }
  
  return { 
    category: isHousehold ? 'Other Personal' : 'Other Business', 
    isHousehold, 
    confidence: 0.60 
  };
}

/**
 * Parse CSV bank statement
 */
export async function parseCsvStatement(fileContent: string): Promise<ProcessingResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const transactions: ParsedTransaction[] = [];
          let totalIncome = 0;
          let totalExpense = 0;
          const dates: Date[] = [];
          
          results.data.forEach((row: any) => {
            // Try to identify columns (flexible mapping)
            const dateStr = row.Date || row.date || row['Transaction Date'] || row['Posting Date'];
            const amountStr = row.Amount || row.amount || row.Debit || row.Credit;
            const description = row.Description || row.description || row['Transaction Description'] || row.Memo || '';
            const merchant = row.Merchant || row.merchant || row.Vendor || '';
            
            if (!dateStr || !amountStr) return;
            
            const date = new Date(dateStr);
            let amount = parseFloat(String(amountStr).replace(/[,$]/g, ''));
            
            // Handle debit/credit columns
            if (row.Debit && !row.Credit) {
              amount = -Math.abs(amount);
            } else if (row.Credit && !row.Debit) {
              amount = Math.abs(amount);
            }
            
            if (isNaN(amount) || isNaN(date.getTime())) return;
            
            const type: 'INCOME' | 'EXPENSE' | 'TRANSFER' = 
              amount > 0 ? 'INCOME' : 'EXPENSE';
            
            transactions.push({
              date,
              amount,
              description,
              merchant,
              type
            });
            
            dates.push(date);
            if (amount > 0) totalIncome += amount;
            else totalExpense += Math.abs(amount);
          });
          
          const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
          
          resolve({
            transactions,
            metadata: {
              totalTransactions: transactions.length,
              dateRange: {
                start: sortedDates[0] || new Date(),
                end: sortedDates[sortedDates.length - 1] || new Date()
              },
              totalIncome,
              totalExpense
            }
          });
        } catch (error) {
          reject(error);
        }
      },
      error: (error: any) => {
        reject(error);
      }
    });
  });
}

/**
 * Parse PDF bank statement
 */
export async function parsePdfStatement(buffer: Buffer): Promise<ProcessingResult> {
  //@ts-ignore
  const data = await PdfParse(buffer);
  const text = data.text;
  
  const transactions: ParsedTransaction[] = [];
  let totalIncome = 0;
  let totalExpense = 0;
  const dates: Date[] = [];
  
  // Common date patterns
  const datePattern = /(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/g;
  
  // Split by lines and process
  const lines = text.split('\n');
  
  for (const line of lines) {
    // Skip empty lines and headers
    if (!line.trim() || line.length < 10) continue;
    
    // Try to extract transaction components
    const dateMatch = line.match(datePattern);
    if (!dateMatch) continue;
    
    // Extract amount (look for patterns like $123.45 or -$123.45)
    const amountMatch = line.match(/[-]?\$?[\d,]+\.\d{2}/g);
    if (!amountMatch) continue;
    
    const date = new Date(dateMatch[0]);
    if (isNaN(date.getTime())) continue;
    
    // Get the last amount match (usually the final amount)
    const amountStr = amountMatch[amountMatch.length - 1];
    const amount = parseFloat(amountStr.replace(/[$,]/g, ''));
    
    if (isNaN(amount)) continue;
    
    // Extract description (text between date and amount)
    const description = line
      .replace(dateMatch[0], '')
      .replace(amountStr, '')
      .trim();
    
    const type: 'INCOME' | 'EXPENSE' | 'TRANSFER' = 
      amount > 0 ? 'INCOME' : 'EXPENSE';
    
    transactions.push({
      date,
      amount,
      description,
      type
    });
    
    dates.push(date);
    if (amount > 0) totalIncome += amount;
    else totalExpense += Math.abs(amount);
  }
  
  const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
  
  return {
    transactions,
    metadata: {
      totalTransactions: transactions.length,
      dateRange: {
        start: sortedDates[0] || new Date(),
        end: sortedDates[sortedDates.length - 1] || new Date()
      },
      totalIncome,
      totalExpense
    }
  };
}

/**
 * Main processing function for bank statements
 */
export async function processStatement(
  statementId: string,
  userId: string
): Promise<void> {
  try {
    // Get statement from database
    const statement = await prisma.bankStatement.findUnique({
      where: { id: statementId }
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
    
    // Download file from S3
    // @ts-ignore
    const fileBuffer = await downloadFileBuffer(statement.cloudStoragePath);
    
    // Parse based on file type
    let result: ProcessingResult;
    if (statement.fileType === 'PDF') {
      result = await parsePdfStatement(fileBuffer);
    } else {
      const fileContent = fileBuffer.toString('utf-8');
      result = await parseCsvStatement(fileContent);
    }
    
    // Update processing stage
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: { processingStage: 'CATEGORIZING_TRANSACTIONS' }
    });
    
    // Get user's business profiles
    const profiles = await prisma.businessProfile.findMany({
      where: { userId }
    });
    
    const personalProfile = profiles.find(p => p.type === 'PERSONAL');
    const businessProfile = profiles.find(p => p.type === 'BUSINESS' && p.isDefault);
    
    // Categorize and create transactions
    const categorizedTransactions = result.transactions.map(t => {
      const categorization = categorizeTransaction(t);
      return {
        ...t,
        ...categorization
      };
    });
    
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: { processingStage: 'DISTRIBUTING_DATA' }
    });
    
    // Create transactions in database
    const createdTransactions = await Promise.all(
      categorizedTransactions.map(async (t) => {
        // Determine which business profile this belongs to
        const profileId = t.isHousehold 
          ? personalProfile?.id 
          : businessProfile?.id;
        
        // Get or create category
        let category = await prisma.category.findFirst({
          where: {
            userId,
            businessProfileId: profileId,
            name: t.category
          }
        });
        
        if (!category) {
          category = await prisma.category.create({
            data: {
              userId,
              businessProfileId: profileId,
              name: t.category,
              type: t.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
              color: getRandomColor(),
              icon: getCategoryIcon(t.category)
            }
          });
        }
        
        return prisma.transaction.create({
          data: {
            userId,
            businessProfileId: profileId,
            bankStatementId: statementId,
            date: t.date,
            amount: t.amount,
            description: t.description,
            merchant: t.merchant,
            category: t.category,
            categoryId: category.id,
            type: t.type,
            account: statement.sourceType === 'CREDIT_CARD' ? 'Credit Card' : 'Checking',
            aiCategorized: true,
            confidence: t.confidence
          }
        });
      })
    );
    
    // Generate AI insights
    const householdCount = categorizedTransactions.filter(t => t.isHousehold).length;
    const businessCount = categorizedTransactions.length - householdCount;
    
    const aiAnalysis = {
      insights: [
        `Processed ${result.metadata.totalTransactions} transactions from ${statement.fileType} statement`,
        `Automatically categorized ${householdCount} household expenses and ${businessCount} business expenses`,
        `Total income: $${result.metadata.totalIncome.toFixed(2)}`,
        `Total expenses: $${result.metadata.totalExpense.toFixed(2)}`,
        `Net cash flow: $${(result.metadata.totalIncome - result.metadata.totalExpense).toFixed(2)}`
      ],
      recommendations: [
        householdCount > 0 ? 'Review household expenses moved to Personal profile' : 'No household expenses detected',
        businessCount > 0 ? 'Business expenses automatically categorized' : 'No business expenses detected',
        'Check Transactions tab to review and adjust categories if needed',
        'Use bulk operations to move similar expenses quickly'
      ],
      totalTransactions: result.metadata.totalTransactions,
      totalAmount: result.metadata.totalIncome + result.metadata.totalExpense,
      categoriesCreated: [...new Set(categorizedTransactions.map(t => t.category))].length,
      householdCount,
      businessCount
    };
    
    // Complete processing
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        status: 'COMPLETED',
        processingStage: 'COMPLETED',
        recordCount: result.metadata.totalTransactions,
        processedCount: createdTransactions.length,
        aiAnalysis
      }
    });
    
  } catch (error) {
    console.error('Statement processing error:', error);
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

function getRandomColor(): string {
  const colors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', 
    '#10B981', '#06B6D4', '#6366F1', '#EF4444'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getCategoryIcon(category: string): string {
  const iconMap: { [key: string]: string } = {
    'Salary': 'dollar-sign',
    'Housing': 'home',
    'Utilities': 'zap',
    'Groceries': 'shopping-cart',
    'Dining Out': 'utensils',
    'Transportation': 'car',
    'Healthcare': 'heart',
    'Entertainment': 'tv',
    'Shopping': 'shopping-bag',
    'Business Expenses': 'briefcase',
    'Payroll': 'users',
    'Marketing': 'megaphone',
    'Professional Services': 'file-text'
  };
  return iconMap[category] || 'folder';
}
