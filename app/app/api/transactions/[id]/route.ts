
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: {
        id: params.id
      },
      include: {
        businessProfile: true
      }
    });

    if (!transaction || transaction.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);

  } catch (error) {
    console.error("Get transaction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { date, amount, description, category, type, account, merchant } = body;

    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: params.id }
    });

    if (!existingTransaction || existingTransaction.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    const transaction = await prisma.transaction.update({
      where: {
        id: params.id
      },
      data: {
        ...(date && { date: new Date(date) }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(description && { description: description.trim() }),
        ...(category && { category: category.trim() }),
        ...(type && { type }),
        ...(account !== undefined && { account: account?.trim() || null }),
        ...(merchant !== undefined && { merchant: merchant?.trim() || null })
      },
      include: {
        businessProfile: true
      }
    });

    return NextResponse.json(transaction);

  } catch (error) {
    console.error("Update transaction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: params.id }
    });

    if (!existingTransaction || existingTransaction.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Delete the transaction
    await prisma.transaction.delete({
      where: {
        id: params.id
      }
    });

    // Check if there are any remaining transactions for this user/profile
    const remainingTransactions = await prisma.transaction.count({
      where: {
        userId: session.user.id,
        businessProfileId: existingTransaction.businessProfileId
      }
    });

    // If no remaining transactions, clean up related data
    if (remainingTransactions === 0 && existingTransaction.businessProfileId) {
      // Delete budgets for this profile
      await prisma.budget.deleteMany({
        where: {
          userId: session.user.id,
          businessProfileId: existingTransaction.businessProfileId
        }
      });

      // Delete recurring charges for this profile
      await prisma.recurringCharge.deleteMany({
        where: {
          userId: session.user.id,
          businessProfileId: existingTransaction.businessProfileId
        }
      });

      // Delete recurring patterns for this profile
      await prisma.recurringPattern.deleteMany({
        where: {
          userId: session.user.id,
          businessProfileId: existingTransaction.businessProfileId
        }
      });

      // Reset financial metrics for this profile
      await prisma.financialMetrics.updateMany({
        where: {
          userId: session.user.id,
          businessProfileId: existingTransaction.businessProfileId
        },
        data: {
          monthlyIncome: 0,
          monthlyExpenses: 0,
          monthlyBurnRate: 0,
          lastCalculated: new Date()
        }
      });

      console.log(`[Delete Transaction] Cleaned up related data for empty profile`);
    }

    return NextResponse.json({
      success: true,
      message: "Transaction deleted successfully",
      remainingTransactions
    });

  } catch (error) {
    console.error("Delete transaction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
