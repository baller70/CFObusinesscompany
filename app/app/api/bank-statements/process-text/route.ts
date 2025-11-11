
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

    // Get all business profiles for intelligent routing
    const businessProfiles = await prisma.businessProfile.findMany({
      where: { 
        userId: session.user.id,
        isActive: true
      }
    });
    
    if (businessProfiles.length === 0) {
      return NextResponse.json(
        { error: 'No active business profiles found' },
        { status: 400 }
      );
    }

    // Get BOTH profiles for routing
    const businessProfile = businessProfiles.find(bp => bp.type === 'BUSINESS');
    const personalProfile = businessProfiles.find(bp => bp.type === 'PERSONAL');
    
    console.log(`[Process Text] Found profiles - Business: ${businessProfile?.name || 'None'}, Personal: ${personalProfile?.name || 'None'}`);

    // Use first available profile for the bank statement record (transactions will route intelligently)
    const defaultProfileId = businessProfile?.id || personalProfile?.id || businessProfiles[0].id;

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
        businessProfileId: defaultProfileId,
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

      // NO VALIDATION - Save all extracted transactions
      const validTransactions = extractedData.transactions;

      console.log(`[Process Text] Total transactions to save: ${validTransactions.length}`);

      // ========================================
      // CRITICAL: CATEGORIZE TRANSACTIONS WITH AI
      // This adds profileType (BUSINESS/PERSONAL) classification
      // ========================================
      console.log('[Process Text] 🤖 Starting AI categorization with profile classification...');
      const categorizedTransactions = await aiProcessor.categorizeTransactions(validTransactions, {
        industry: null,
        businessType: 'BUSINESS',
        companyName: null
      });
      console.log(`[Process Text] ✅ Categorization complete: ${categorizedTransactions.length} transactions`);

      // Get all categories for the user
      const categories = await prisma.category.findMany({
        where: { userId: session.user.id },
      });

      // Save categorized transactions with INTELLIGENT ROUTING
      let savedCount = 0;
      const errors: string[] = [];
      let businessCount = 0;
      let personalCount = 0;
      let unclassifiedCount = 0;

      for (const catTxn of categorizedTransactions) {
        try {
          const transaction = catTxn.originalTransaction;
          
          // ========================================
          // INTELLIGENT PROFILE ROUTING 
          // Uses AI's profileType classification
          // ========================================
          let targetProfileId: string | null = null;
          const aiProfileType = catTxn.profileType?.toUpperCase();
          
          if (aiProfileType === 'BUSINESS' && businessProfile) {
            targetProfileId = businessProfile.id;
            businessCount++;
            console.log(`[Process Text] 🏢 BUSINESS: ${transaction.description} (confidence: ${catTxn.profileConfidence})`);
          } else if (aiProfileType === 'PERSONAL' && personalProfile) {
            targetProfileId = personalProfile.id;
            personalCount++;
            console.log(`[Process Text] 🏠 PERSONAL: ${transaction.description} (confidence: ${catTxn.profileConfidence})`);
          } else {
            // Fallback to default profile if AI didn't classify
            targetProfileId = defaultProfileId;
            unclassifiedCount++;
            console.log(`[Process Text] ⚠️ UNCLASSIFIED: ${transaction.description} (no AI classification)`);
          }

          // Find or create category
          let category = categories.find(
            (c: any) => c.name.toLowerCase() === catTxn.suggestedCategory?.toLowerCase()
          );

          if (!category) {
            // Create category if it doesn't exist
            const type = transaction.amount > 0 ? 'INCOME' : 'EXPENSE';
            category = await prisma.category.create({
              data: {
                userId: session.user.id,
                name: catTxn.suggestedCategory || 'Uncategorized',
                type: type as 'INCOME' | 'EXPENSE',
                color: '#6B7280',
                icon: 'CircleDollarSign'
              }
            });
            categories.push(category);
          }

          // Determine transaction type from AI or amount
          let type = 'EXPENSE';
          if (transaction.type?.toUpperCase() === 'INCOME' || transaction.amount > 0) {
            type = 'INCOME';
          } else if (transaction.type?.toUpperCase() === 'TRANSFER') {
            type = 'TRANSFER';
          }

          // Ensure we have a valid date
          let transactionDate;
          try {
            transactionDate = new Date(transaction.date);
            if (isNaN(transactionDate.getTime())) {
              transactionDate = new Date(statementDate);
            }
          } catch {
            transactionDate = new Date(statementDate);
          }

          await prisma.transaction.create({
            data: {
              date: transactionDate,
              description: transaction.description || 'No description',
              amount: Math.abs(transaction.amount || 0),
              type: type as 'INCOME' | 'EXPENSE' | 'TRANSFER',
              category: category.name,
              merchant: catTxn.merchant || transaction.description || '',
              userId: session.user.id,
              businessProfileId: targetProfileId, // INTELLIGENT ROUTING
              bankStatementId: bankStatement.id,
              categoryId: category.id,
              aiCategorized: true, // Mark as AI categorized
              confidence: catTxn.confidence,
              isRecurring: catTxn.isRecurring || false,
              metadata: transaction.referenceNumber ? {
                referenceNumber: transaction.referenceNumber,
                notes: transaction.notes || undefined
              } : undefined,
            },
          });

          savedCount++;
        } catch (error) {
          console.error('[Process Text] Error saving transaction:', catTxn.originalTransaction.description, error);
          errors.push(`Failed to save: ${catTxn.originalTransaction.description}`);
        }
      }

      console.log(`[Process Text] ✅ Saved ${savedCount} transactions`);
      console.log(`[Process Text] 🏢 Business transactions: ${businessCount}`);
      console.log(`[Process Text] 🏠 Personal transactions: ${personalCount}`);
      console.log(`[Process Text] ⚠️ Unclassified transactions: ${unclassifiedCount}`);

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
        businessCount,
        personalCount,
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
