
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

      // Get all categories for the user
      const categories = await prisma.category.findMany({
        where: { userId: session.user.id },
      });

      // Categorize and save transactions with INTELLIGENT ROUTING
      let savedCount = 0;
      const errors: string[] = [];
      let businessCount = 0;
      let personalCount = 0;

      for (const transaction of validTransactions) {
        try {
          // ========================================
          // INTELLIGENT PROFILE ROUTING (from statement-processor.ts)
          // ========================================
          let targetProfileId: string | null = null;
          const aiProfileType = transaction.profileType?.toUpperCase();
          
          if (aiProfileType === 'BUSINESS' && businessProfile) {
            targetProfileId = businessProfile.id;
            businessCount++;
            console.log(`[Process Text] 🏢 Routing to BUSINESS profile: ${transaction.description}`);
          } else if (aiProfileType === 'PERSONAL' && personalProfile) {
            targetProfileId = personalProfile.id;
            personalCount++;
            console.log(`[Process Text] 🏠 Routing to PERSONAL profile: ${transaction.description}`);
          } else {
            // Fallback to default profile if AI didn't classify
            targetProfileId = defaultProfileId;
            console.log(`[Process Text] ⚠️ Using default profile (no AI classification): ${transaction.description}`);
          }

          // Find matching category
          const category = categories.find(
            (c: any) => c.name.toLowerCase() === transaction.category?.toLowerCase()
          );

          // Determine transaction type from AI or amount
          let type = 'EXPENSE';
          if (transaction.type?.toUpperCase() === 'INCOME') {
            type = 'INCOME';
          } else if (transaction.type?.toUpperCase() === 'TRANSFER') {
            type = 'TRANSFER';
          } else if (transaction.amount > 0) {
            type = 'INCOME';
          }

          // Ensure we have a valid date
          let transactionDate;
          try {
            transactionDate = new Date(transaction.date);
            if (isNaN(transactionDate.getTime())) {
              // If date is invalid, use statement date
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
              category: category?.name || transaction.category || 'Uncategorized',
              merchant: transaction.merchant || transaction.description || '',
              userId: session.user.id,
              businessProfileId: targetProfileId, // INTELLIGENT ROUTING
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
          console.error('[Process Text] Error saving transaction:', transaction.description, error);
          errors.push(`Failed to save: ${transaction.description}`);
        }
      }

      console.log(`[Process Text] ✅ Saved ${savedCount} transactions`);
      console.log(`[Process Text] 🏢 Business transactions: ${businessCount}`);
      console.log(`[Process Text] 🏠 Personal transactions: ${personalCount}`);

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
