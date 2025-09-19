
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        name: `${firstName || ''} ${lastName || ''}`.trim() || null,
      }
    });

    // Create default categories for the user
    const defaultCategories = [
      { name: "Food & Dining", color: "#FF6B6B", icon: "utensils", type: "EXPENSE" as const },
      { name: "Transportation", color: "#4ECDC4", icon: "car", type: "EXPENSE" as const },
      { name: "Shopping", color: "#45B7D1", icon: "shopping-bag", type: "EXPENSE" as const },
      { name: "Entertainment", color: "#96CEB4", icon: "music", type: "EXPENSE" as const },
      { name: "Bills & Utilities", color: "#FECA57", icon: "zap", type: "EXPENSE" as const },
      { name: "Healthcare", color: "#FF9FF3", icon: "heart", type: "EXPENSE" as const },
      { name: "Education", color: "#54A0FF", icon: "book", type: "EXPENSE" as const },
      { name: "Personal Care", color: "#5F27CD", icon: "user", type: "EXPENSE" as const },
      { name: "Gifts & Donations", color: "#00D2D3", icon: "gift", type: "EXPENSE" as const },
      { name: "Other Expenses", color: "#FF9F43", icon: "more-horizontal", type: "EXPENSE" as const },
      { name: "Salary", color: "#2ED573", icon: "dollar-sign", type: "INCOME" as const },
      { name: "Freelance", color: "#3742FA", icon: "briefcase", type: "INCOME" as const },
      { name: "Other Income", color: "#2F3542", icon: "trending-up", type: "INCOME" as const },
    ];

    await prisma.category.createMany({
      data: defaultCategories.map(cat => ({
        ...cat,
        userId: user.id,
        isDefault: true
      }))
    });

    // Initialize financial metrics
    await prisma.financialMetrics.create({
      data: {
        userId: user.id,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        monthlyBurnRate: 0,
        totalDebt: 0,
        totalAssets: 0,
        netWorth: 0,
        emergencyFundGoal: 1000, // Default emergency fund goal
        debtToIncomeRatio: 0,
      }
    });

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    );

  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
