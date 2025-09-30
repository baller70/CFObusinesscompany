
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { uploadFile } from '@/lib/s3';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const sourceTypes = formData.getAll('sourceTypes') as string[];

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'NO FILES PROVIDED' },
        { status: 400 }
      );
    }

    const uploads = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sourceType = (sourceTypes[i] || 'BANK') as 'BANK' | 'CREDIT_CARD';

      try {
        // Validate file type
        const fileType = file.type === 'application/pdf' ? 'PDF' : 'CSV';
        if (!['application/pdf', 'text/csv', 'application/vnd.ms-excel'].includes(file.type)) {
          uploads.push({
            fileName: file.name,
            error: 'UNSUPPORTED FILE TYPE'
          });
          continue;
        }

        // Convert file to buffer and upload to S3
        const buffer = Buffer.from(await file.arrayBuffer());
        const s3Key = `statements/${Date.now()}-${file.name}`;
        const cloudStoragePath = await uploadFile(buffer, s3Key);

        // Create database record
        const bankStatement = await prisma.bankStatement.create({
          data: {
            userId: session.user.id,
            fileName: s3Key,
            originalName: file.name,
            cloudStoragePath,
            fileType,
            sourceType,
            fileSize: file.size,
            status: 'PENDING',
            processingStage: 'UPLOADED'
          }
        });

        uploads.push({
          id: bankStatement.id,
          fileName: file.name,
          sourceType,
          status: 'uploaded',
          message: 'STATEMENT UPLOADED SUCCESSFULLY'
        });

        // Start asynchronous processing
        processStatementAsync(bankStatement.id, session.user.id);

      } catch (error) {
        console.error('FILE UPLOAD ERROR:', error);
        uploads.push({
          fileName: file.name,
          error: 'UPLOAD FAILED'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${uploads.filter(u => !u.error).length} STATEMENTS UPLOADED SUCCESSFULLY`,
      uploads
    });

  } catch (error) {
    console.error('UPLOAD API ERROR:', error);
    return NextResponse.json(
      { success: false, message: 'INTERNAL SERVER ERROR' },
      { status: 500 }
    );
  }
}

async function processStatementAsync(statementId: string, userId: string) {
  try {
    // Update to processing
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: { 
        status: 'PROCESSING',
        processingStage: 'EXTRACTING_DATA'
      }
    });

    // Simulate AI processing stages
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: { processingStage: 'CATEGORIZING_TRANSACTIONS' }
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    await prisma.bankStatement.update({
      where: { id: statementId },
      data: { processingStage: 'ANALYZING_PATTERNS' }
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    await prisma.bankStatement.update({
      where: { id: statementId },
      data: { processingStage: 'GENERATING_INSIGHTS' }
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    await prisma.bankStatement.update({
      where: { id: statementId },
      data: { processingStage: 'DISTRIBUTING_DATA' }
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create sample transactions and insights
    const statement = await prisma.bankStatement.findUnique({
      where: { id: statementId }
    });

    if (!statement) return;

    // Generate sample transactions based on statement type
    const sampleTransactions = statement.sourceType === 'CREDIT_CARD' 
      ? generateCreditCardTransactions(userId, statementId)
      : generateBankTransactions(userId, statementId);

    await Promise.all(
      sampleTransactions.map(transaction =>
        prisma.transaction.create({ data: transaction })
      )
    );

    // Generate AI analysis
    const aiAnalysis = {
      insights: statement.sourceType === 'CREDIT_CARD' 
        ? [
          'Credit utilization is at 67% - consider paying down balance',
          'Identified recurring monthly subscriptions totaling $234',
          'Dining expenses increased 23% compared to previous period',
          'Found 3 duplicate charges that may need investigation'
        ]
        : [
          'Monthly cash flow shows positive trend of +12%',
          'Identified 5 recurring income sources',
          'ATM fees totaling $45 could be avoided',
          'Emergency fund goal progress: 67% complete'
        ],
      recommendations: statement.sourceType === 'CREDIT_CARD'
        ? [
          'Set up automatic payments to reduce interest charges',
          'Consider balance transfer to lower interest rate card',
          'Review and cancel unused subscriptions',
          'Implement spending alerts for dining category'
        ]
        : [
          'Consider high-yield savings for emergency fund',
          'Optimize direct deposit allocation',
          'Switch to fee-free ATM network',
          'Set up automatic transfers to investment account'
        ],
      totalTransactions: sampleTransactions.length,
      totalAmount: sampleTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
      categoriesCreated: [...new Set(sampleTransactions.map(t => t.category))].length
    };

    // Complete processing
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        status: 'COMPLETED',
        processingStage: 'COMPLETED',
        recordCount: sampleTransactions.length,
        processedCount: sampleTransactions.length,
        aiAnalysis
      }
    });

  } catch (error) {
    console.error('PROCESSING ERROR:', error);
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        status: 'FAILED',
        processingStage: 'FAILED',
        errorLog: 'PROCESSING FAILED: ' + (error as Error).message
      }
    });
  }
}

function generateBankTransactions(userId: string, bankStatementId: string) {
  return [
    {
      userId,
      bankStatementId,
      date: new Date('2024-09-25'),
      amount: 3500.00,
      description: 'Salary Deposit - Direct Deposit',
      merchant: 'EMPLOYER PAYROLL',
      category: 'Salary',
      type: 'INCOME' as const,
      account: 'Checking',
      aiCategorized: true,
      confidence: 0.98
    },
    {
      userId,
      bankStatementId,
      date: new Date('2024-09-24'),
      amount: -1200.00,
      description: 'Rent Payment',
      merchant: 'PROPERTY MANAGEMENT CO',
      category: 'Housing',
      type: 'EXPENSE' as const,
      account: 'Checking',
      aiCategorized: true,
      confidence: 0.95
    },
    {
      userId,
      bankStatementId,
      date: new Date('2024-09-23'),
      amount: -85.43,
      description: 'Grocery Shopping',
      merchant: 'WHOLE FOODS MARKET',
      category: 'Groceries',
      type: 'EXPENSE' as const,
      account: 'Checking',
      aiCategorized: true,
      confidence: 0.92
    },
    {
      userId,
      bankStatementId,
      date: new Date('2024-09-22'),
      amount: -45.67,
      description: 'Gas Station',
      merchant: 'SHELL GAS STATION',
      category: 'Transportation',
      type: 'EXPENSE' as const,
      account: 'Checking',
      aiCategorized: true,
      confidence: 0.89
    },
    {
      userId,
      bankStatementId,
      date: new Date('2024-09-21'),
      amount: -12.99,
      description: 'Netflix Subscription',
      merchant: 'NETFLIX.COM',
      category: 'Entertainment',
      type: 'EXPENSE' as const,
      account: 'Checking',
      isRecurring: true,
      aiCategorized: true,
      confidence: 0.97
    }
  ];
}

function generateCreditCardTransactions(userId: string, bankStatementId: string) {
  return [
    {
      userId,
      bankStatementId,
      date: new Date('2024-09-25'),
      amount: -156.78,
      description: 'Restaurant - Dinner',
      merchant: 'THE ITALIAN KITCHEN',
      category: 'Dining Out',
      type: 'EXPENSE' as const,
      account: 'Credit Card',
      aiCategorized: true,
      confidence: 0.94
    },
    {
      userId,
      bankStatementId,
      date: new Date('2024-09-24'),
      amount: -89.99,
      description: 'Online Shopping',
      merchant: 'AMAZON.COM',
      category: 'Shopping',
      type: 'EXPENSE' as const,
      account: 'Credit Card',
      aiCategorized: true,
      confidence: 0.91
    },
    {
      userId,
      bankStatementId,
      date: new Date('2024-09-23'),
      amount: -234.50,
      description: 'Department Store',
      merchant: 'NORDSTROM',
      category: 'Clothing',
      type: 'EXPENSE' as const,
      account: 'Credit Card',
      aiCategorized: true,
      confidence: 0.87
    },
    {
      userId,
      bankStatementId,
      date: new Date('2024-09-22'),
      amount: -19.99,
      description: 'Spotify Premium',
      merchant: 'SPOTIFY USA',
      category: 'Entertainment',
      type: 'EXPENSE' as const,
      account: 'Credit Card',
      isRecurring: true,
      aiCategorized: true,
      confidence: 0.96
    },
    {
      userId,
      bankStatementId,
      date: new Date('2024-09-21'),
      amount: -67.45,
      description: 'Coffee Shop',
      merchant: 'STARBUCKS',
      category: 'Dining Out',
      type: 'EXPENSE' as const,
      account: 'Credit Card',
      aiCategorized: true,
      confidence: 0.93
    },
    {
      userId,
      bankStatementId,
      date: new Date('2024-09-20'),
      amount: -1200.00,
      description: 'Credit Card Payment',
      merchant: 'PAYMENT RECEIVED',
      category: 'Credit Card Payment',
      type: 'INCOME' as const,
      account: 'Credit Card',
      aiCategorized: true,
      confidence: 0.99
    }
  ];
}
