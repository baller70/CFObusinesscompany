
/**
 * Automatic Credit Score Calculator
 * Simulates how a credit union would calculate credit scores based on financial data
 * 
 * Credit Score Factors (similar to FICO):
 * - Payment History: 35%
 * - Credit Utilization: 30%
 * - Length of Credit History: 15%
 * - Credit Mix: 10%
 * - New Credit: 10%
 */

import { prisma } from '@/lib/db';

export interface CreditScoreFactors {
  paymentHistory: {
    score: number;
    weight: number;
    details: string;
  };
  creditUtilization: {
    score: number;
    weight: number;
    details: string;
  };
  creditHistoryLength: {
    score: number;
    weight: number;
    details: string;
  };
  creditMix: {
    score: number;
    weight: number;
    details: string;
  };
  newCredit: {
    score: number;
    weight: number;
    details: string;
  };
}

export interface CreditScoreResult {
  score: number;
  rating: string;
  factors: CreditScoreFactors;
  accounts: number;
  inquiries: number;
  creditUtilization: number;
  totalDebt: number;
  avgAccountAge: number;
}

/**
 * Calculate credit score for a user's business profile
 */
export async function calculateCreditScore(
  userId: string,
  businessProfileId?: string | null
): Promise<CreditScoreResult> {
  // Get all financial data needed for calculation
  const [recurringCharges, debts, transactions, income, expenses] = await Promise.all([
    // Get recurring charges (for payment history)
    prisma.recurringCharge.findMany({
      where: { userId, businessProfileId: businessProfileId || null },
      orderBy: { nextDueDate: 'desc' },
      take: 100
    }),
    // Get debts (for credit utilization and credit mix)
    prisma.debt.findMany({
      where: { userId, businessProfileId: businessProfileId || null }
    }),
    // Get transactions (for credit history length)
    prisma.transaction.findMany({
      where: { userId, businessProfileId: businessProfileId || null },
      orderBy: { date: 'asc' },
      take: 1
    }),
    // Get income transactions
    prisma.transaction.aggregate({
      where: {
        userId,
        businessProfileId: businessProfileId || null,
        type: 'INCOME'
      },
      _sum: { amount: true }
    }),
    // Get expense transactions
    prisma.transaction.aggregate({
      where: {
        userId,
        businessProfileId: businessProfileId || null,
        type: 'EXPENSE'
      },
      _sum: { amount: true }
    })
  ]);

  // Calculate each factor
  const paymentHistoryFactor = calculatePaymentHistory(recurringCharges);
  const creditUtilizationFactor = calculateCreditUtilization(debts, income._sum.amount || 0);
  const creditHistoryLengthFactor = calculateCreditHistoryLength(transactions);
  const creditMixFactor = calculateCreditMix(debts, recurringCharges);
  const newCreditFactor = calculateNewCredit(debts);

  // Calculate weighted score (300-850 range, similar to FICO)
  const baseScore = 300;
  const maxAdditionalPoints = 550;
  
  const weightedScore = 
    (paymentHistoryFactor.score * paymentHistoryFactor.weight) +
    (creditUtilizationFactor.score * creditUtilizationFactor.weight) +
    (creditHistoryLengthFactor.score * creditHistoryLengthFactor.weight) +
    (creditMixFactor.score * creditMixFactor.weight) +
    (newCreditFactor.score * newCreditFactor.weight);

  const finalScore = Math.round(baseScore + (weightedScore * maxAdditionalPoints));

  // Calculate summary metrics
  const totalDebt = debts.reduce((sum, debt) => sum + (debt.balance || 0), 0);
  const totalIncome = income._sum.amount || 0;
  const utilizationPercent = totalIncome > 0 ? (totalDebt / totalIncome) * 100 : 0;
  
  // Calculate average account age (in months)
  const oldestDate = transactions[0]?.date || new Date();
  const monthsSinceOldest = Math.max(1, 
    (new Date().getTime() - new Date(oldestDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  const rating = getScoreRating(finalScore);

  return {
    score: finalScore,
    rating,
    factors: {
      paymentHistory: paymentHistoryFactor,
      creditUtilization: creditUtilizationFactor,
      creditHistoryLength: creditHistoryLengthFactor,
      creditMix: creditMixFactor,
      newCredit: newCreditFactor
    },
    accounts: debts.length + recurringCharges.length,
    inquiries: 0, // Simulated - could be based on new debts in last 6 months
    creditUtilization: Math.round(utilizationPercent),
    totalDebt,
    avgAccountAge: Math.round(monthsSinceOldest)
  };
}

/**
 * Payment History (35%) - Most important factor
 * Based on recurring charges paid on time
 */
function calculatePaymentHistory(recurringCharges: any[]): {
  score: number;
  weight: number;
  details: string;
} {
  if (recurringCharges.length === 0) {
    return {
      score: 0.5,
      weight: 0.35,
      details: 'No payment history available'
    };
  }

  // Count on-time payments
  const paidOnTime = recurringCharges.filter(charge => {
    if (charge.status === 'PAID' && charge.lastPaidDate) {
      return new Date(charge.lastPaidDate) <= new Date(charge.nextDueDate);
    }
    return false;
  }).length;

  const onTimePercentage = paidOnTime / recurringCharges.length;
  
  let score = 0;
  let details = '';
  
  if (onTimePercentage >= 0.95) {
    score = 1.0;
    details = `Excellent payment history (${Math.round(onTimePercentage * 100)}% on-time)`;
  } else if (onTimePercentage >= 0.85) {
    score = 0.85;
    details = `Good payment history (${Math.round(onTimePercentage * 100)}% on-time)`;
  } else if (onTimePercentage >= 0.70) {
    score = 0.70;
    details = `Fair payment history (${Math.round(onTimePercentage * 100)}% on-time)`;
  } else {
    score = 0.50;
    details = `Needs improvement (${Math.round(onTimePercentage * 100)}% on-time)`;
  }

  return { score, weight: 0.35, details };
}

/**
 * Credit Utilization (30%) - Debt to income ratio
 * Lower is better (ideally under 30%)
 */
function calculateCreditUtilization(debts: any[], totalIncome: number): {
  score: number;
  weight: number;
  details: string;
} {
  const totalDebt = debts.reduce((sum, debt) => sum + (debt.balance || 0), 0);
  
  if (totalIncome === 0) {
    return {
      score: 0.5,
      weight: 0.30,
      details: 'No income data available'
    };
  }

  const utilizationRatio = totalDebt / totalIncome;
  
  let score = 0;
  let details = '';
  
  if (utilizationRatio <= 0.10) {
    score = 1.0;
    details = `Excellent utilization (${Math.round(utilizationRatio * 100)}%)`;
  } else if (utilizationRatio <= 0.30) {
    score = 0.85;
    details = `Good utilization (${Math.round(utilizationRatio * 100)}%)`;
  } else if (utilizationRatio <= 0.50) {
    score = 0.65;
    details = `Fair utilization (${Math.round(utilizationRatio * 100)}%)`;
  } else {
    score = 0.40;
    details = `High utilization (${Math.round(utilizationRatio * 100)}%)`;
  }

  return { score, weight: 0.30, details };
}

/**
 * Length of Credit History (15%) - Age of oldest account
 * Longer is better
 */
function calculateCreditHistoryLength(transactions: any[]): {
  score: number;
  weight: number;
  details: string;
} {
  if (transactions.length === 0) {
    return {
      score: 0.3,
      weight: 0.15,
      details: 'No credit history'
    };
  }

  const oldestDate = transactions[0].date;
  const monthsOld = (new Date().getTime() - new Date(oldestDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
  
  let score = 0;
  let details = '';
  
  if (monthsOld >= 84) { // 7+ years
    score = 1.0;
    details = `Excellent history (${Math.round(monthsOld / 12)} years)`;
  } else if (monthsOld >= 60) { // 5+ years
    score = 0.85;
    details = `Good history (${Math.round(monthsOld / 12)} years)`;
  } else if (monthsOld >= 36) { // 3+ years
    score = 0.70;
    details = `Fair history (${Math.round(monthsOld / 12)} years)`;
  } else if (monthsOld >= 12) { // 1+ year
    score = 0.50;
    details = `Limited history (${Math.round(monthsOld)} months)`;
  } else {
    score = 0.30;
    details = `Very limited history (${Math.round(monthsOld)} months)`;
  }

  return { score, weight: 0.15, details };
}

/**
 * Credit Mix (10%) - Variety of credit types
 * More variety is better
 */
function calculateCreditMix(debts: any[], recurringCharges: any[]): {
  score: number;
  weight: number;
  details: string;
} {
  const creditTypes = new Set<string>();
  
  // Add debt types
  debts.forEach(debt => {
    if (debt.type) creditTypes.add(debt.type);
  });
  
  // Add recurring charge types as credit types
  recurringCharges.forEach(charge => {
    creditTypes.add('SUBSCRIPTION');
  });

  const typeCount = creditTypes.size;
  
  let score = 0;
  let details = '';
  
  if (typeCount >= 5) {
    score = 1.0;
    details = `Excellent mix (${typeCount} types)`;
  } else if (typeCount >= 3) {
    score = 0.80;
    details = `Good mix (${typeCount} types)`;
  } else if (typeCount >= 2) {
    score = 0.60;
    details = `Fair mix (${typeCount} types)`;
  } else if (typeCount === 1) {
    score = 0.40;
    details = `Limited mix (${typeCount} type)`;
  } else {
    score = 0.30;
    details = 'No credit accounts';
  }

  return { score, weight: 0.10, details };
}

/**
 * New Credit (10%) - Recent credit inquiries
 * Too many new accounts can lower score
 */
function calculateNewCredit(debts: any[]): {
  score: number;
  weight: number;
  details: string;
} {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const recentDebts = debts.filter(debt => 
    new Date(debt.createdAt) > sixMonthsAgo
  );

  const recentCount = recentDebts.length;
  
  let score = 0;
  let details = '';
  
  if (recentCount === 0) {
    score = 1.0;
    details = 'No recent credit inquiries';
  } else if (recentCount === 1) {
    score = 0.85;
    details = `${recentCount} recent inquiry`;
  } else if (recentCount <= 3) {
    score = 0.70;
    details = `${recentCount} recent inquiries`;
  } else {
    score = 0.50;
    details = `${recentCount} recent inquiries (high)`;
  }

  return { score, weight: 0.10, details };
}

/**
 * Get rating based on score
 */
function getScoreRating(score: number): string {
  if (score >= 800) return 'Exceptional';
  if (score >= 740) return 'Very Good';
  if (score >= 670) return 'Good';
  if (score >= 580) return 'Fair';
  if (score >= 300) return 'Poor';
  return 'Very Poor';
}

/**
 * Save calculated credit score to database
 */
export async function saveCalculatedCreditScore(
  userId: string,
  businessProfileId: string | null,
  result: CreditScoreResult
) {
  return await prisma.creditScore.create({
    data: {
      userId,
      businessProfileId,
      score: result.score,
      provider: 'Auto-Calculated',
      scoreDate: new Date(),
      scoreType: 'FICO',
      factors: result.factors as any, // Cast to any for JSON field
      accounts: result.accounts,
      inquiries: result.inquiries,
      creditUtilization: result.creditUtilization,
      totalDebt: result.totalDebt,
      avgAccountAge: result.avgAccountAge,
      paymentHistory: result.factors.paymentHistory.score * 100
    }
  });
}
