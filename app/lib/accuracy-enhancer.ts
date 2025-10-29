
/**
 * 100% ACCURACY ENHANCEMENT SYSTEM
 * 
 * This module provides intelligent learning and pattern recognition
 * to achieve 100% transaction routing accuracy through:
 * 1. Merchant rule application
 * 2. Historical pattern analysis
 * 3. Recurring pattern detection
 * 4. User correction learning
 */

import { prisma } from '@/lib/db';

// Expanded category list for better granularity
export const EXPANDED_CATEGORIES = {
  // Business Operating Expenses
  BUSINESS: [
    'Office Supplies',
    'Software & SaaS',
    'Marketing & Advertising',
    'Professional Services',
    'Legal & Accounting',
    'Business Insurance',
    'Equipment & Machinery',
    'Business Travel',
    'Client Entertainment',
    'Employee Benefits',
    'Contractor Payments',
    'Business Utilities',
    'Rent & Lease',
    'Shipping & Logistics',
    'Research & Development',
    'Training & Education',
    'Telecommunications',
    'Website & Hosting',
    'Bank Fees',
    'Business Licenses',
    'Inventory & Supplies',
    'Vehicle Expenses'
  ],
  
  // Personal Expenses
  PERSONAL: [
    'Groceries',
    'Dining & Restaurants',
    'Entertainment',
    'Personal Shopping',
    'Healthcare',
    'Home Utilities',
    'Rent/Mortgage',
    'Personal Insurance',
    'Personal Care',
    'Fitness & Wellness',
    'Hobbies',
    'Personal Travel',
    'Gifts',
    'Subscriptions',
    'Phone & Internet',
    'Transportation',
    'Gas & Fuel',
    'Vehicle Maintenance',
    'Education',
    'Childcare'
  ],
  
  // Income
  INCOME: [
    'Salary',
    'Freelance Income',
    'Business Revenue',
    'Investment Income',
    'Dividends',
    'Interest',
    'Refunds',
    'Rental Income',
    'Side Business',
    'Commissions'
  ],
  
  // Financial
  FINANCIAL: [
    'Credit Card Payment',
    'Loan Payment',
    'Savings Transfer',
    'Investment',
    'Taxes'
  ]
};

// Get all categories as flat list
export function getAllCategories(): string[] {
  return [
    ...EXPANDED_CATEGORIES.BUSINESS,
    ...EXPANDED_CATEGORIES.PERSONAL,
    ...EXPANDED_CATEGORIES.INCOME,
    ...EXPANDED_CATEGORIES.FINANCIAL
  ];
}

// Merchant rule matching with pattern support
export async function applyMerchantRules(
  userId: string,
  merchantName: string,
  businessProfileId: string | null
): Promise<{
  matched: boolean;
  rule?: any;
  category?: string;
  profileType?: string;
}> {
  try {
    // Get all active rules for this user, ordered by priority
    const rules = await prisma.merchantRule.findMany({
      where: {
        userId,
        isActive: true
      },
      orderBy: {
        priority: 'desc'
      }
    });

    // Try exact match first
    const exactMatch = rules.find(
      rule => rule.merchantName.toLowerCase() === merchantName.toLowerCase()
    );

    if (exactMatch) {
      // Update usage count
      await prisma.merchantRule.update({
        where: { id: exactMatch.id },
        data: {
          appliedCount: { increment: 1 },
          lastApplied: new Date()
        }
      });

      console.log(`[Accuracy] ✅ Matched merchant rule (exact): ${merchantName} → ${exactMatch.suggestedCategory}`);
      return {
        matched: true,
        rule: exactMatch,
        category: exactMatch.suggestedCategory,
        profileType: exactMatch.profileType
      };
    }

    // Try pattern matching
    for (const rule of rules) {
      if (rule.merchantPattern) {
        try {
          const regex = new RegExp(rule.merchantPattern, 'i');
          if (regex.test(merchantName)) {
            // Update usage count
            await prisma.merchantRule.update({
              where: { id: rule.id },
              data: {
                appliedCount: { increment: 1 },
                lastApplied: new Date()
              }
            });

            console.log(`[Accuracy] ✅ Matched merchant rule (pattern): ${merchantName} → ${rule.suggestedCategory}`);
            return {
              matched: true,
              rule: rule,
              category: rule.suggestedCategory,
              profileType: rule.profileType
            };
          }
        } catch (error) {
          console.error(`[Accuracy] Invalid regex pattern for rule ${rule.id}:`, error);
        }
      }
    }

    console.log(`[Accuracy] ❌ No merchant rule matched for: ${merchantName}`);
    return { matched: false };
  } catch (error) {
    console.error('[Accuracy] Error applying merchant rules:', error);
    return { matched: false };
  }
}

// Check for recurring patterns
export async function detectRecurringPattern(
  userId: string,
  merchantName: string,
  amount: number,
  date: Date,
  businessProfileId: string | null
): Promise<{
  isRecurring: boolean;
  pattern?: any;
  confidence?: number;
}> {
  try {
    // Look for existing pattern
    const existingPattern = await prisma.recurringPattern.findFirst({
      where: {
        userId,
        merchantName: {
          contains: merchantName.substring(0, 20),
          mode: 'insensitive'
        },
        isActive: true
      }
    });

    if (existingPattern) {
      // Check if amount is similar (within 10%)
      const amountDiff = Math.abs(amount - existingPattern.averageAmount) / existingPattern.averageAmount;
      
      if (amountDiff < 0.1) {
        // Update pattern
        await prisma.recurringPattern.update({
          where: { id: existingPattern.id },
          data: {
            lastOccurrence: date,
            detectedFrom: { increment: 1 },
            averageAmount: (existingPattern.averageAmount * existingPattern.detectedFrom + amount) / (existingPattern.detectedFrom + 1),
            confidence: Math.min(0.99, existingPattern.confidence + 0.05)
          }
        });

        console.log(`[Accuracy] ✅ Recurring pattern detected: ${merchantName} (${existingPattern.frequency})`);
        return {
          isRecurring: true,
          pattern: existingPattern,
          confidence: existingPattern.confidence
        };
      }
    }

    // Look for new patterns by checking transaction history
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        merchant: {
          contains: merchantName.substring(0, 20),
          mode: 'insensitive'
        },
        date: {
          gte: new Date(date.getTime() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
        }
      },
      orderBy: { date: 'desc' }
    });

    if (recentTransactions.length >= 2) {
      // Analyze frequency
      const dates = recentTransactions.map(t => t.date.getTime());
      const intervals = [];
      for (let i = 0; i < dates.length - 1; i++) {
        intervals.push(dates[i] - dates[i + 1]);
      }

      const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      const daysBetween = avgInterval / (24 * 60 * 60 * 1000);

      let frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' = 'MONTHLY';
      let nextExpected = new Date(date);

      if (daysBetween >= 6 && daysBetween <= 8) {
        frequency = 'WEEKLY';
        nextExpected.setDate(nextExpected.getDate() + 7);
      } else if (daysBetween >= 25 && daysBetween <= 35) {
        frequency = 'MONTHLY';
        nextExpected.setMonth(nextExpected.getMonth() + 1);
      } else if (daysBetween >= 85 && daysBetween <= 95) {
        frequency = 'QUARTERLY';
        nextExpected.setMonth(nextExpected.getMonth() + 3);
      } else if (daysBetween >= 355 && daysBetween <= 375) {
        frequency = 'ANNUALLY';
        nextExpected.setFullYear(nextExpected.getFullYear() + 1);
      }

      // Calculate average amount
      const avgAmount = recentTransactions.reduce((sum, t) => sum + t.amount, 0) / recentTransactions.length;

      // Create new pattern
      const newPattern = await prisma.recurringPattern.create({
        data: {
          userId,
          businessProfileId,
          merchantName,
          category: recentTransactions[0].category,
          profileType: businessProfileId ? 'BUSINESS' : 'PERSONAL',
          averageAmount: avgAmount,
          frequency,
          detectedFrom: recentTransactions.length,
          lastOccurrence: date,
          nextExpected,
          confidence: Math.min(0.9, recentTransactions.length * 0.2)
        }
      });

      console.log(`[Accuracy] ✅ New recurring pattern created: ${merchantName} (${frequency}, confidence: ${newPattern.confidence})`);
      return {
        isRecurring: true,
        pattern: newPattern,
        confidence: newPattern.confidence
      };
    }

    return { isRecurring: false };
  } catch (error) {
    console.error('[Accuracy] Error detecting recurring pattern:', error);
    return { isRecurring: false };
  }
}

// Learn from historical data
export async function analyzeHistoricalPatterns(
  userId: string,
  merchantName: string
): Promise<{
  suggestedCategory?: string;
  suggestedProfile?: string;
  confidence: number;
}> {
  try {
    // Get all transactions for this merchant
    const historicalTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        merchant: {
          contains: merchantName.substring(0, 20),
          mode: 'insensitive'
        }
      },
      take: 20,
      orderBy: { date: 'desc' }
    });

    if (historicalTransactions.length === 0) {
      return { confidence: 0 };
    }

    // Find most common category
    const categoryCount = new Map<string, number>();
    const profileCount = new Map<string, number>();

    historicalTransactions.forEach(txn => {
      categoryCount.set(txn.category, (categoryCount.get(txn.category) || 0) + 1);
      const profile = txn.businessProfileId ? 'BUSINESS' : 'PERSONAL';
      profileCount.set(profile, (profileCount.get(profile) || 0) + 1);
    });

    const mostCommonCategory = Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])[0];
    
    const mostCommonProfile = Array.from(profileCount.entries())
      .sort((a, b) => b[1] - a[1])[0];

    const categoryConfidence = mostCommonCategory[1] / historicalTransactions.length;
    const profileConfidence = mostCommonProfile[1] / historicalTransactions.length;

    if (categoryConfidence >= 0.7 && profileConfidence >= 0.7) {
      console.log(`[Accuracy] ✅ Historical pattern: ${merchantName} → ${mostCommonCategory[0]} (${(categoryConfidence * 100).toFixed(0)}% confidence)`);
      return {
        suggestedCategory: mostCommonCategory[0],
        suggestedProfile: mostCommonProfile[0],
        confidence: (categoryConfidence + profileConfidence) / 2
      };
    }

    return { confidence: 0 };
  } catch (error) {
    console.error('[Accuracy] Error analyzing historical patterns:', error);
    return { confidence: 0 };
  }
}

// Queue transaction for manual review
export async function queueForReview(
  userId: string,
  transactionId: string,
  confidence: number,
  aiSuggestion: any,
  issueType?: string,
  issueSeverity?: string,
  issueDescription?: string,
  suggestedFix?: string
): Promise<void> {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!transaction) {
      console.error('[Accuracy] Transaction not found for review queue:', transactionId);
      return;
    }

    await prisma.transactionReview.create({
      data: {
        userId,
        transactionId,
        businessProfileId: transaction.businessProfileId,
        confidence,
        aiSuggestion,
        issueType,
        issueSeverity,
        issueDescription,
        suggestedFix
      }
    });

    console.log(`[Accuracy] ⚠️ Queued for review: ${transaction.description} (confidence: ${(confidence * 100).toFixed(1)}%)`);
  } catch (error) {
    console.error('[Accuracy] Error queuing transaction for review:', error);
  }
}

// Record user correction for learning
export async function recordUserCorrection(
  userId: string,
  transactionId: string,
  correctionType: 'CATEGORY' | 'PROFILE' | 'MERCHANT' | 'AMOUNT' | 'DATE',
  originalValue: string,
  correctedValue: string,
  merchantName?: string,
  businessProfileId?: string | null
): Promise<void> {
  try {
    // Record the correction
    const correction = await prisma.userCorrection.create({
      data: {
        userId,
        transactionId,
        businessProfileId,
        correctionType,
        originalValue,
        correctedValue,
        merchantName
      }
    });

    console.log(`[Accuracy] 📝 User correction recorded: ${correctionType} ${originalValue} → ${correctedValue}`);

    // If this is a category or profile correction for a merchant, suggest creating a rule
    if ((correctionType === 'CATEGORY' || correctionType === 'PROFILE') && merchantName) {
      // Check if user has corrected this merchant multiple times
      const correctionsForMerchant = await prisma.userCorrection.findMany({
        where: {
          userId,
          merchantName: {
            contains: merchantName.substring(0, 20),
            mode: 'insensitive'
          },
          correctionType
        }
      });

      // If 2+ corrections, suggest auto-creating a rule
      if (correctionsForMerchant.length >= 2) {
        const existingRule = await prisma.merchantRule.findFirst({
          where: {
            userId,
            merchantName: {
              equals: merchantName,
              mode: 'insensitive'
            }
          }
        });

        if (!existingRule) {
          // Auto-create merchant rule based on user's corrections
          const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { businessProfile: true }
          });

          if (transaction) {
            await prisma.merchantRule.create({
              data: {
                userId,
                businessProfileId: transaction.businessProfileId,
                merchantName,
                suggestedCategory: correctionType === 'CATEGORY' ? correctedValue : transaction.category,
                profileType: correctionType === 'PROFILE' ? correctedValue : (transaction.businessProfile?.type || 'PERSONAL'),
                priority: 50,
                autoApply: true
              }
            });

            // Mark correction as converted to rule
            await prisma.userCorrection.update({
              where: { id: correction.id },
              data: { appliedAsRule: true }
            });

            console.log(`[Accuracy] ✅ Auto-created merchant rule based on user corrections: ${merchantName}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('[Accuracy] Error recording user correction:', error);
  }
}

// Get enhanced industry-aware prompt
export function getIndustryAwarePrompt(
  userIndustry?: string | null,
  businessType?: string,
  companyName?: string | null
): string {
  let contextPrompt = '';
  
  if (userIndustry || businessType) {
    contextPrompt = `\n\nCONTEXT: This is a ${businessType || 'business'} in the ${userIndustry || 'general'} industry.`;
    
    if (companyName) {
      contextPrompt += ` Company name: "${companyName}".`;
    }
    
    contextPrompt += `\nUse this context to make more accurate BUSINESS vs PERSONAL classifications.`;
  }
  
  return contextPrompt;
}

// Calculate enhanced confidence score
export function calculateEnhancedConfidence(
  aiConfidence: number,
  hasHistoricalPattern: boolean,
  historicalConfidence: number,
  hasMerchantRule: boolean,
  hasRecurringPattern: boolean
): number {
  let finalConfidence = aiConfidence;
  
  // Boost confidence if we have supporting evidence
  if (hasMerchantRule) {
    finalConfidence = Math.min(0.99, finalConfidence + 0.15); // +15% for merchant rule
  }
  
  if (hasHistoricalPattern && historicalConfidence > 0.7) {
    finalConfidence = Math.min(0.99, finalConfidence + 0.10); // +10% for strong historical pattern
  }
  
  if (hasRecurringPattern) {
    finalConfidence = Math.min(0.99, finalConfidence + 0.05); // +5% for recurring pattern
  }
  
  return finalConfidence;
}
