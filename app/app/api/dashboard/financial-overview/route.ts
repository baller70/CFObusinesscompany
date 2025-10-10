
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";
import { getCurrentBusinessProfileId } from "../../../../lib/business-profile-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current business profile ID
    const businessProfileId = await getCurrentBusinessProfileId();

    // Get or create financial metrics
    let financialMetrics = await prisma.financialMetrics.findFirst({
      where: { 
        userId: session.user.id,
        businessProfileId: businessProfileId || null
      }
    });

    if (!financialMetrics && businessProfileId) {
      financialMetrics = await prisma.financialMetrics.create({
        data: {
          userId: session.user.id,
          businessProfileId,
          monthlyIncome: 0,
          monthlyExpenses: 0,
          monthlyBurnRate: 0,
          totalDebt: 0,
          totalAssets: 0,
          netWorth: 0,
          emergencyFundGoal: 1000,
          debtToIncomeRatio: 0,
        }
      });
    }

    // Calculate current month statistics from transactions
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        businessProfileId: businessProfileId || null,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        }
      }
    });

    const monthlyIncome = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Get total debt from debt records
    const totalDebt = await prisma.debt.aggregate({
      where: {
        userId: session.user.id,
        businessProfileId: businessProfileId || null,
        isActive: true
      },
      _sum: {
        balance: true
      }
    });

    const netWorth = (financialMetrics?.totalAssets || 0) - (totalDebt._sum.balance || 0);
    const monthlyBurnRate = monthlyExpenses - monthlyIncome;

    // Update financial metrics if we have new data and financialMetrics exists
    if (transactions.length > 0 && financialMetrics && businessProfileId) {
      await prisma.financialMetrics.update({
        where: { businessProfileId },
        data: {
          monthlyIncome,
          monthlyExpenses,
          monthlyBurnRate,
          totalDebt: totalDebt._sum.balance || 0,
          netWorth,
          debtToIncomeRatio: monthlyIncome > 0 ? (totalDebt._sum.balance || 0) / (monthlyIncome * 12) : 0,
          lastCalculated: now,
        }
      });
    }

    return NextResponse.json({
      monthlyIncome,
      monthlyExpenses,
      monthlyBurnRate,
      totalDebt: totalDebt._sum.balance || 0,
      totalAssets: financialMetrics?.totalAssets || 0,
      netWorth,
      emergencyFundGoal: financialMetrics?.emergencyFundGoal || 1000,
      debtToIncomeRatio: monthlyIncome > 0 ? (totalDebt._sum.balance || 0) / (monthlyIncome * 12) : 0,
    });

  } catch (error) {
    console.error("Financial overview error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
