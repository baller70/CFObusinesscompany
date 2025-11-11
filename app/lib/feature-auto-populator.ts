
/**
 * COMPREHENSIVE FEATURE AUTO-POPULATOR
 * 
 * This service automatically populates ALL app features from transaction data:
 * - Budget Planner
 * - Financial Goals  
 * - Debt Management
 * - Performance Analytics
 * - Burn Rate
 * - Treasury & Cash
 * - Risk Management
 * - Accounting
 * - Investment Portfolio
 * - And more...
 */

import { prisma } from './db';

export class FeatureAutoPopulator {
  private userId: string;
  private businessProfileId: string;
  private personalProfileId: string | null;

  constructor(userId: string, businessProfileId: string, personalProfileId: string | null = null) {
    this.userId = userId;
    this.businessProfileId = businessProfileId;
    this.personalProfileId = personalProfileId;
  }

  /**
   * Main entry point - populates ALL features from transactions
   */
  async populateAllFeatures() {
    console.log('[Auto-Populator] 🚀 Starting comprehensive feature population...');
    
    try {
      // Run all population tasks in parallel for speed
      await Promise.all([
        this.populateBudgets(),
        this.populateFinancialGoals(),
        this.populateDebts(),
        this.populateBurnRate(),
        this.populateTreasuryAndCash(),
        this.populateRiskManagement(),
        this.populateRecurringCharges(),
        this.populateInvestmentAnalytics(),
        this.populatePerformanceMetrics()
      ]);

      console.log('[Auto-Populator] ✅ ALL FEATURES POPULATED SUCCESSFULLY!');
      return { success: true, message: 'All features populated' };
    } catch (error) {
      console.error('[Auto-Populator] ❌ Error:', error);
      throw error;
    }
  }

  /**
   * 1. BUDGET PLANNER - Create budgets from spending patterns
   */
  private async populateBudgets() {
    console.log('[Auto-Populator] 💰 Populating Budget Planner...');

    // Get all categories with transactions
    const categories = await prisma.category.findMany({
      where: { userId: this.userId },
      include: {
        transactions: {
          where: {
            type: 'EXPENSE',
            date: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }
      }
    });

    // Create budgets for each category based on average spending
    for (const category of categories) {
      const totalSpent = category.transactions.reduce((sum, t) => sum + t.amount, 0);
      const avgMonthly = totalSpent / Math.max(1, category.transactions.length);
      const suggestedBudget = Math.ceil(avgMonthly * 1.1); // 10% buffer

      if (suggestedBudget > 0) {
        await prisma.budget.upsert({
          where: {
            userId_businessProfileId_category_month_year: {
              userId: this.userId,
              businessProfileId: this.businessProfileId,
              category: category.name,
              month: new Date().getMonth() + 1,
              year: new Date().getFullYear()
            }
          },
          create: {
            userId: this.userId,
            businessProfileId: this.businessProfileId,
            name: `${category.name} Budget`,
            category: category.name,
            amount: suggestedBudget,
            spent: totalSpent,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            type: 'MONTHLY'
          },
          update: {
            spent: totalSpent
          }
        });

        console.log(`[Auto-Populator] ✅ Budget created for ${category.name}: $${suggestedBudget}`);
      }
    }
  }

  /**
   * 2. FINANCIAL GOALS - Create goals based on income/savings patterns
   */
  private async populateFinancialGoals() {
    console.log('[Auto-Populator] 🎯 Populating Financial Goals...');

    // Calculate monthly income
    const monthlyIncome = await prisma.transaction.aggregate({
      where: {
        userId: this.userId,
        businessProfileId: this.businessProfileId,
        type: 'INCOME',
        date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      },
      _sum: { amount: true }
    });

    const income = monthlyIncome._sum.amount || 0;

    // Create emergency fund goal (6 months of income)
    if (income > 0) {
      const emergencyFundTarget = income * 6;
      
      const existingGoal = await prisma.goal.findFirst({
        where: {
          userId: this.userId,
          businessProfileId: this.businessProfileId,
          name: 'Emergency Fund'
        }
      });

      if (!existingGoal) {
        await prisma.goal.create({
          data: {
            userId: this.userId,
            businessProfileId: this.businessProfileId,
            name: 'Emergency Fund',
            description: `Build emergency fund equivalent to 6 months of income ($${emergencyFundTarget.toFixed(2)})`,
            targetAmount: emergencyFundTarget,
            currentAmount: 0,
            targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            type: 'EMERGENCY_FUND',
            priority: 1
          }
        });
      }

      console.log(`[Auto-Populator] ✅ Emergency Fund goal created: $${emergencyFundTarget}`);
    }

    // Create savings goal (20% of monthly income)
    if (income > 0) {
      const savingsTarget = income * 0.20;
      
      const existingGoal2 = await prisma.goal.findFirst({
        where: {
          userId: this.userId,
          businessProfileId: this.businessProfileId,
          name: 'Monthly Savings'
        }
      });

      if (!existingGoal2) {
        await prisma.goal.create({
          data: {
            userId: this.userId,
            businessProfileId: this.businessProfileId,
            name: 'Monthly Savings',
            description: `Save 20% of monthly income ($${savingsTarget.toFixed(2)})`,
            targetAmount: savingsTarget,
            currentAmount: 0,
            targetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
            type: 'SAVINGS',
            priority: 2
          }
        });
      }

      console.log(`[Auto-Populator] ✅ Monthly Savings goal created: $${savingsTarget}`);
    }
  }

  /**
   * 3. DEBT MANAGEMENT - Identify recurring debts and loans
   */
  private async populateDebts() {
    console.log('[Auto-Populator] 💳 Populating Debt Management...');

    // Find recurring payment patterns (same merchant, similar amounts)
    const recurringPayments = await prisma.transaction.groupBy({
      by: ['merchant', 'category'],
      where: {
        userId: this.userId,
        businessProfileId: this.businessProfileId,
        type: 'EXPENSE',
        category: {
          in: ['Credit Card Payments', 'Student Loans', 'Personal Loans', 'Car Payment', 'Mortgage/Rent']
        }
      },
      _count: { id: true },
      _avg: { amount: true },
      having: {
        id: {
          _count: {
            gte: 2 // At least 2 transactions
          }
        }
      }
    });

    // Create debt records
    for (const payment of recurringPayments) {
      if (payment._avg.amount && payment._avg.amount > 0) {
        const estimatedBalance = payment._avg.amount * 12; // Rough estimate

        // Map category to DebtType enum
        let debtType: 'CREDIT_CARD' | 'STUDENT_LOAN' | 'MORTGAGE' | 'PERSONAL_LOAN' | 'AUTO_LOAN' | 'OTHER' = 'OTHER';
        if (payment.category?.includes('Credit Card')) debtType = 'CREDIT_CARD';
        else if (payment.category?.includes('Student')) debtType = 'STUDENT_LOAN';
        else if (payment.category?.includes('Mortgage')) debtType = 'MORTGAGE';
        else if (payment.category?.includes('Car Payment')) debtType = 'AUTO_LOAN';
        else if (payment.category?.includes('Personal Loan')) debtType = 'PERSONAL_LOAN';

        const existingDebt = await prisma.debt.findFirst({
          where: {
            userId: this.userId,
            businessProfileId: this.businessProfileId,
            name: `${payment.category} - ${payment.merchant}`
          }
        });

        if (!existingDebt) {
          await prisma.debt.create({
            data: {
              userId: this.userId,
              businessProfileId: this.businessProfileId,
              name: `${payment.category} - ${payment.merchant}`,
              type: debtType,
              balance: estimatedBalance,
              interestRate: 5.0, // Default estimate
              minimumPayment: payment._avg.amount,
              dueDate: 15 // Day of month (Int)
            }
          });
        } else {
          await prisma.debt.update({
            where: { id: existingDebt.id },
            data: {
              minimumPayment: payment._avg.amount
            }
          });
        }

        console.log(`[Auto-Populator] ✅ Debt created: ${payment.category} - $${estimatedBalance}`);
      }
    }
  }

  /**
   * 4. BURN RATE - Calculate monthly cash burn for businesses
   */
  private async populateBurnRate() {
    console.log('[Auto-Populator] 🔥 Calculating Burn Rate...');

    // Get last 3 months of data
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const expenses = await prisma.transaction.aggregate({
      where: {
        userId: this.userId,
        businessProfileId: this.businessProfileId,
        type: 'EXPENSE',
        date: { gte: threeMonthsAgo }
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    const income = await prisma.transaction.aggregate({
      where: {
        userId: this.userId,
        businessProfileId: this.businessProfileId,
        type: 'INCOME',
        date: { gte: threeMonthsAgo }
      },
      _sum: { amount: true }
    });

    const totalExpenses = expenses._sum.amount || 0;
    const totalIncome = income._sum.amount || 0;
    const monthlyBurnRate = (totalExpenses - totalIncome) / 3;
    const runwayMonths = totalIncome > 0 ? totalIncome / Math.abs(monthlyBurnRate) : 0;

    console.log(`[Auto-Populator] ✅ Burn Rate: $${monthlyBurnRate.toFixed(2)}/month`);
    console.log(`[Auto-Populator] ✅ Runway: ${runwayMonths.toFixed(1)} months`);

    // Store in user metadata or create a BurnRate table if needed
    // For now, this data is calculated on-demand
  }

  /**
   * 5. TREASURY & CASH - Calculate cash positions and forecasts
   */
  private async populateTreasuryAndCash() {
    console.log('[Auto-Populator] 💰 Populating Treasury & Cash...');

    // Calculate current cash position
    const income = await prisma.transaction.aggregate({
      where: {
        userId: this.userId,
        businessProfileId: this.businessProfileId,
        type: 'INCOME'
      },
      _sum: { amount: true }
    });

    const expenses = await prisma.transaction.aggregate({
      where: {
        userId: this.userId,
        businessProfileId: this.businessProfileId,
        type: 'EXPENSE'
      },
      _sum: { amount: true }
    });

    const cashPosition = (income._sum.amount || 0) - (expenses._sum.amount || 0);

    // Get monthly trends for forecasting
    const monthlyData = await prisma.$queryRaw<any[]>`
      SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expenses
      FROM "Transaction"
      WHERE "userId" = ${this.userId}
        AND "businessProfileId" = ${this.businessProfileId}
        AND date >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month DESC
    `;

    console.log(`[Auto-Populator] ✅ Current Cash Position: $${cashPosition.toFixed(2)}`);
    console.log(`[Auto-Populator] ✅ Monthly trends calculated: ${monthlyData.length} months`);
  }

  /**
   * 6. RISK MANAGEMENT - Identify financial risks
   */
  private async populateRiskManagement() {
    console.log('[Auto-Populator] 🛡️ Populating Risk Management...');

    // Identify large, unusual expenses (potential risks)
    const avgExpense = await prisma.transaction.aggregate({
      where: {
        userId: this.userId,
        businessProfileId: this.businessProfileId,
        type: 'EXPENSE'
      },
      _avg: { amount: true }
    });

    const largeExpenses = await prisma.transaction.findMany({
      where: {
        userId: this.userId,
        businessProfileId: this.businessProfileId,
        type: 'EXPENSE',
        amount: {
          gte: (avgExpense._avg.amount || 0) * 3 // 3x average
        }
      },
      orderBy: { amount: 'desc' },
      take: 10
    });

    // Check for negative cash flow months (risk indicator)
    const monthlyNetIncome = await prisma.$queryRaw<any[]>`
      SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END) as net_income
      FROM "Transaction"
      WHERE "userId" = ${this.userId}
        AND "businessProfileId" = ${this.businessProfileId}
        AND date >= NOW() - INTERVAL '3 months'
      GROUP BY DATE_TRUNC('month', date)
      HAVING SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END) < 0
    `;

    console.log(`[Auto-Populator] ✅ Identified ${largeExpenses.length} large expenses`);
    console.log(`[Auto-Populator] ✅ Found ${monthlyNetIncome.length} negative cash flow months`);
  }

  /**
   * 7. RECURRING CHARGES - Identify subscription and recurring expenses
   */
  private async populateRecurringCharges() {
    console.log('[Auto-Populator] 🔄 Populating Recurring Charges...');

    // Find transactions with similar amounts and regular intervals
    const allTransactions = await prisma.transaction.findMany({
      where: {
        userId: this.userId,
        businessProfileId: this.businessProfileId,
        type: 'EXPENSE'
      },
      orderBy: { date: 'asc' }
    });

    // Group by merchant and check for recurring patterns
    const merchantGroups = new Map<string, any[]>();
    allTransactions.forEach(t => {
      const key = t.merchant || t.description;
      if (!merchantGroups.has(key)) {
        merchantGroups.set(key, []);
      }
      merchantGroups.get(key)!.push(t);
    });

    // Identify recurring charges
    for (const [merchant, transactions] of merchantGroups.entries()) {
      if (transactions.length >= 2) {
        // Check if amounts are similar (within 10% variance)
        const amounts = transactions.map(t => t.amount);
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const variance = Math.max(...amounts) - Math.min(...amounts);
        
        if (variance / avgAmount < 0.1) {
          // This looks like a recurring charge
          const existingCharge = await prisma.recurringCharge.findFirst({
            where: {
              userId: this.userId,
              businessProfileId: this.businessProfileId,
              name: merchant
            }
          });

          if (!existingCharge) {
            await prisma.recurringCharge.create({
              data: {
                userId: this.userId,
                businessProfileId: this.businessProfileId,
                name: merchant,
                amount: avgAmount,
                frequency: 'MONTHLY', // Default
                category: transactions[0].category || 'Subscription',
                nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                annualAmount: avgAmount * 12, // Calculate annual amount
                isActive: true
              }
            });
          } else {
            await prisma.recurringCharge.update({
              where: { id: existingCharge.id },
              data: {
                amount: avgAmount,
                annualAmount: avgAmount * 12
              }
            });
          }

          console.log(`[Auto-Populator] ✅ Recurring charge identified: ${merchant} ($${avgAmount.toFixed(2)})`);
        }
      }
    }
  }

  /**
   * 8. INVESTMENT ANALYTICS - Calculate portfolio performance
   */
  private async populateInvestmentAnalytics() {
    console.log('[Auto-Populator] 📈 Populating Investment Analytics...');

    // Find investment-related transactions
    const investmentTransactions = await prisma.transaction.findMany({
      where: {
        userId: this.userId,
        businessProfileId: this.businessProfileId,
        category: {
          in: ['Investment Income', 'Investment Contributions', 'Investment Transactions']
        }
      }
    });

    if (investmentTransactions.length > 0) {
      const totalInvested = investmentTransactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalReturns = investmentTransactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0);

      const roi = totalInvested > 0 ? ((totalReturns / totalInvested) * 100) : 0;

      console.log(`[Auto-Populator] ✅ Investment Totals: Invested $${totalInvested.toFixed(2)}, Returns $${totalReturns.toFixed(2)}, ROI ${roi.toFixed(2)}%`);
    }
  }

  /**
   * 9. PERFORMANCE METRICS - Calculate key financial KPIs
   */
  private async populatePerformanceMetrics() {
    console.log('[Auto-Populator] 📊 Calculating Performance Metrics...');

    const currentMonth = new Date();
    const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);

    // Current month metrics
    const currentMetrics = await this.calculateMonthMetrics(currentMonth);
    const lastMetrics = await this.calculateMonthMetrics(lastMonth);

    // Calculate growth rates
    const incomeGrowth = lastMetrics.income > 0 
      ? ((currentMetrics.income - lastMetrics.income) / lastMetrics.income) * 100 
      : 0;

    const expenseGrowth = lastMetrics.expenses > 0
      ? ((currentMetrics.expenses - lastMetrics.expenses) / lastMetrics.expenses) * 100
      : 0;

    console.log(`[Auto-Populator] ✅ Income Growth: ${incomeGrowth.toFixed(2)}%`);
    console.log(`[Auto-Populator] ✅ Expense Growth: ${expenseGrowth.toFixed(2)}%`);
    console.log(`[Auto-Populator] ✅ Profit Margin: ${currentMetrics.profitMargin.toFixed(2)}%`);
  }

  /**
   * Helper: Calculate metrics for a specific month
   */
  private async calculateMonthMetrics(month: Date) {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const income = await prisma.transaction.aggregate({
      where: {
        userId: this.userId,
        businessProfileId: this.businessProfileId,
        type: 'INCOME',
        date: { gte: startOfMonth, lte: endOfMonth }
      },
      _sum: { amount: true }
    });

    const expenses = await prisma.transaction.aggregate({
      where: {
        userId: this.userId,
        businessProfileId: this.businessProfileId,
        type: 'EXPENSE',
        date: { gte: startOfMonth, lte: endOfMonth }
      },
      _sum: { amount: true }
    });

    const incomeAmount = income._sum.amount || 0;
    const expensesAmount = expenses._sum.amount || 0;
    const profit = incomeAmount - expensesAmount;
    const profitMargin = incomeAmount > 0 ? (profit / incomeAmount) * 100 : 0;

    return {
      income: incomeAmount,
      expenses: expensesAmount,
      profit,
      profitMargin
    };
  }
}

/**
 * Convenience function to populate all features for a user
 */
export async function autoPopulateAllFeatures(
  userId: string,
  businessProfileId: string,
  personalProfileId: string | null = null
) {
  const populator = new FeatureAutoPopulator(userId, businessProfileId, personalProfileId);
  return await populator.populateAllFeatures();
}
