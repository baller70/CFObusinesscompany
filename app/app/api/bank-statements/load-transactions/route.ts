
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface TransactionInput {
  date: string;
  description: string;
  amount: number;
  category?: string;
  profileType: 'BUSINESS' | 'PERSONAL';
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { transactions, statementPeriod } = body as { transactions: TransactionInput[]; statementPeriod?: string };

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: "Transactions array is required" },
        { status: 400 }
      );
    }

    console.log(`[Load Transactions] Processing ${transactions.length} transactions for user ${session.user.email}`);
    console.log(`[Load Transactions] Statement Period: ${statementPeriod || 'Not provided'}`);

    // Get user's business profiles
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        businessProfiles: true,
      },
    });

    if (!user || user.businessProfiles.length === 0) {
      return NextResponse.json(
        { error: "No business profiles found" },
        { status: 400 }
      );
    }

    // Find Business and Personal profiles
    const businessProfile = user.businessProfiles.find((p: any) => p.type === 'BUSINESS');
    const personalProfile = user.businessProfiles.find((p: any) => p.type === 'PERSONAL');

    if (!businessProfile || !personalProfile) {
      return NextResponse.json(
        { error: "Both Business and Personal profiles are required" },
        { status: 400 }
      );
    }

    console.log(`[Load Transactions] Business Profile: ${businessProfile.name} (${businessProfile.id})`);
    console.log(`[Load Transactions] Personal Profile: ${personalProfile.name} (${personalProfile.id})`);

    // Create a BankStatement record for this manual entry
    const bankStatement = await prisma.bankStatement.create({
      data: {
        userId: session.user.id,
        businessProfileId: businessProfile.id, // Use business profile as primary
        fileName: `Manual Entry - ${statementPeriod || new Date().toLocaleDateString()}`,
        originalName: `Manual Entry - ${statementPeriod || new Date().toLocaleDateString()}`,
        sourceType: 'MANUAL',
        statementPeriod: statementPeriod,
        transactionCount: transactions.length,
        status: 'COMPLETED',
        processingStage: 'COMPLETED',
        parsedData: {
          source: 'manual_text_entry',
          extractionMethod: 'manual',
          timestamp: new Date().toISOString(),
        },
      },
    });

    console.log(`[Load Transactions] ✅ Created BankStatement: ${bankStatement.id}`);

    // Get default categories
    const categories = await prisma.category.findMany({
      where: { userId: session.user.id },
    });

    const defaultCategory = categories.find((c: any) => c.name === 'Uncategorized') || categories[0];

    // Save transactions to database
    const savedTransactions = [];
    let businessCount = 0;
    let personalCount = 0;

    for (const transaction of transactions) {
      try {
        // ========================================
        // SPECIAL BUSINESS RULE: $8275 = Facility Rental
        // ========================================
        let categoryName = transaction.category;
        let profileType = transaction.profileType?.toUpperCase();
        const absoluteAmount = Math.abs(transaction.amount);
        
        // Check if this is the $8275 facility rental
        if (absoluteAmount === 8275 && transaction.amount < 0) {
          categoryName = 'Facility Rental';
          profileType = 'BUSINESS'; // Force to BUSINESS
          console.log(`[Load Transactions] 🏢 FACILITY RENTAL RULE: $8275 → Facility Rental (BUSINESS)`);
        }
        
        // Determine which profile to use
        const targetProfile = profileType === 'BUSINESS' ? businessProfile : personalProfile;
        
        if (profileType === 'BUSINESS') {
          businessCount++;
        } else {
          personalCount++;
        }

        // Find or create category
        let category = categories.find((c: any) => 
          c.name.toLowerCase() === categoryName?.toLowerCase()
        );

        if (!category && categoryName) {
          category = await prisma.category.create({
            data: {
              name: categoryName,
              userId: session.user.id,
              type: 'EXPENSE',
              color: categoryName === 'Facility Rental' ? '#3B82F6' : undefined,
              icon: categoryName === 'Facility Rental' ? 'building' : undefined,
            },
          });
          categories.push(category);
        }

        // Parse date - handle multiple date formats
        let transactionDate: Date;
        try {
          // If date is MM/DD or MM/DD/YY format, parse it
          const dateParts = transaction.date.split('/');
          if (dateParts.length === 2) {
            // MM/DD format - assume current year
            const currentYear = new Date().getFullYear();
            transactionDate = new Date(`${currentYear}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`);
          } else if (dateParts.length === 3) {
            // MM/DD/YY or MM/DD/YYYY format
            let year = parseInt(dateParts[2]);
            if (year < 100) {
              year += 2000; // Convert 24 to 2024
            }
            transactionDate = new Date(`${year}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`);
          } else {
            transactionDate = new Date(transaction.date);
          }
        } catch (dateError) {
          console.error(`[Load Transactions] Invalid date format: ${transaction.date}, using current date`);
          transactionDate = new Date();
        }

        // Determine transaction type based on amount
        const transactionType = transaction.amount >= 0 ? 'INCOME' : 'EXPENSE';

        // Create transaction
        const savedTransaction = await prisma.transaction.create({
          data: {
            userId: session.user.id,
            businessProfileId: targetProfile.id,
            bankStatementId: bankStatement.id, // Link to the bank statement
            date: transactionDate,
            description: transaction.description,
            amount: Math.abs(transaction.amount),
            type: transactionType,
            category: category?.name || defaultCategory?.name || 'Uncategorized',
            categoryId: category?.id || defaultCategory?.id,
            merchant: transaction.description,
            isRecurring: false,
            aiCategorized: true,
            metadata: {
              profileType: profileType,
              extractedFromChat: true,
              confidence: 1.0,
            },
          },
        });

        savedTransactions.push(savedTransaction);
        
        console.log(`[Load Transactions] ✅ Saved: ${transaction.description} → ${targetProfile.name} (${profileType})`);
      } catch (error) {
        console.error(`[Load Transactions] ❌ Failed to save transaction:`, error);
        console.error(`[Load Transactions] Transaction data:`, JSON.stringify(transaction));
      }
    }

    console.log(`[Load Transactions] 🎯 Complete: ${savedTransactions.length}/${transactions.length} transactions saved`);
    console.log(`[Load Transactions] 🏢 Business: ${businessCount} | 🏠 Personal: ${personalCount}`);

    // ========================================
    // AUTO-POPULATE ALL FEATURES
    // ========================================
    console.log('[Load Transactions] 🚀 AUTO-POPULATING ALL FEATURES...');
    try {
      const { autoPopulateAllFeatures } = await import('@/lib/feature-auto-populator');
      await autoPopulateAllFeatures(
        session.user.id,
        businessProfile.id,
        personalProfile.id
      );
      console.log('[Load Transactions] ✅ ALL FEATURES POPULATED!');
    } catch (populateError) {
      console.error('[Load Transactions] ⚠️ Feature population error (non-critical):', populateError);
      // Don't fail the entire process if feature population fails
    }

    return NextResponse.json({
      success: true,
      count: savedTransactions.length,
      businessCount,
      personalCount,
      statementId: bankStatement.id,
      transactions: savedTransactions,
    });

  } catch (error) {
    console.error("[Load Transactions] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to load transactions";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
