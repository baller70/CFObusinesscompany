
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
    const { transactions } = body as { transactions: TransactionInput[] };

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: "Transactions array is required" },
        { status: 400 }
      );
    }

    console.log(`[Load Transactions] Processing ${transactions.length} transactions for user ${session.user.email}`);

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
        // Determine which profile to use
        const profileType = transaction.profileType?.toUpperCase();
        const targetProfile = profileType === 'BUSINESS' ? businessProfile : personalProfile;
        
        if (profileType === 'BUSINESS') {
          businessCount++;
        } else {
          personalCount++;
        }

        // Find or create category
        let category = categories.find((c: any) => 
          c.name.toLowerCase() === transaction.category?.toLowerCase()
        );

        if (!category && transaction.category) {
          category = await prisma.category.create({
            data: {
              name: transaction.category,
              userId: session.user.id,
              type: 'EXPENSE',
            },
          });
          categories.push(category);
        }

        // Parse date
        const transactionDate = new Date(transaction.date);

        // Determine transaction type based on amount
        const transactionType = transaction.amount >= 0 ? 'INCOME' : 'EXPENSE';

        // Create transaction
        const savedTransaction = await prisma.transaction.create({
          data: {
            userId: session.user.id,
            businessProfileId: targetProfile.id,
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
      }
    }

    console.log(`[Load Transactions] 🎯 Complete: ${savedTransactions.length}/${transactions.length} transactions saved`);
    console.log(`[Load Transactions] 🏢 Business: ${businessCount} | 🏠 Personal: ${personalCount}`);

    return NextResponse.json({
      success: true,
      count: savedTransactions.length,
      businessCount,
      personalCount,
      transactions: savedTransactions,
    });

  } catch (error) {
    console.error("[Load Transactions] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to load transactions";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
