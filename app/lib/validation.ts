
import { prisma } from '@/lib/db';

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  confidence: number; // 0-1
  issues: ValidationIssue[];
  summary: {
    totalTransactions: number;
    validatedTransactions: number;
    flaggedTransactions: number;
    balanceReconciled: boolean;
    duplicatesFound: number;
    lowConfidenceCount: number;
  };
  details: {
    mathematicalCheck: {
      passed: boolean;
      expectedBalance: number;
      actualBalance: number;
      difference: number;
    };
    categoryVerification: {
      changed: number;
      confirmed: number;
      flagged: number;
    };
    duplicateCheck: {
      duplicates: Array<{
        transactionIds: string[];
        reason: string;
      }>;
    };
  };
}

export interface ValidationIssue {
  type: 'LOW_CONFIDENCE' | 'DUPLICATE' | 'CATEGORY_MISMATCH' | 'MATH_ERROR' | 'MISSING_DATA' | 'PROFILE_MISMATCH';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  transactionId?: string;
  description: string;
  suggestedFix?: string;
}

// Rule-based validation
export async function performRuleBasedValidation(
  statementId: string,
  extractedData: any,
  transactions: any[]
): Promise<Partial<ValidationResult>> {
  console.log(`[Validation] Running rule-based validation for statement ${statementId}`);
  
  const issues: ValidationIssue[] = [];
  
  // 1. Data Completeness Check
  const missingDataIssues = checkDataCompleteness(transactions);
  issues.push(...missingDataIssues);
  
  // 2. Duplicate Detection
  const duplicateIssues = detectDuplicates(transactions);
  issues.push(...duplicateIssues);
  
  // 3. Mathematical Reconciliation
  const mathCheck = performMathematicalReconciliation(extractedData, transactions);
  if (!mathCheck.passed) {
    issues.push({
      type: 'MATH_ERROR',
      severity: 'HIGH',
      description: `Balance doesn't reconcile. Expected: $${mathCheck.expectedBalance.toFixed(2)}, Got: $${mathCheck.actualBalance.toFixed(2)}, Difference: $${mathCheck.difference.toFixed(2)}`,
      suggestedFix: 'Review transactions for missing or incorrect amounts'
    });
  }
  
  // 4. Transaction Count Verification
  const expectedCount = extractedData.summary?.transactionCount || extractedData.transactions?.length || 0;
  if (transactions.length !== expectedCount && expectedCount > 0) {
    issues.push({
      type: 'MISSING_DATA',
      severity: 'HIGH',
      description: `Transaction count mismatch. Expected: ${expectedCount}, Found: ${transactions.length}`,
      suggestedFix: 'Re-process the statement or manually review'
    });
  }
  
  return {
    issues,
    details: {
      mathematicalCheck: mathCheck,
      duplicateCheck: {
        duplicates: duplicateIssues.map(issue => ({
          transactionIds: [],
          reason: issue.description
        }))
      },
      categoryVerification: {
        changed: 0,
        confirmed: 0,
        flagged: 0
      }
    }
  };
}

function checkDataCompleteness(transactions: any[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  transactions.forEach((txn, index) => {
    if (!txn.date) {
      issues.push({
        type: 'MISSING_DATA',
        severity: 'HIGH',
        transactionId: txn.id,
        description: `Transaction #${index + 1} missing date`,
        suggestedFix: 'Add date manually or re-process'
      });
    }
    
    if (!txn.amount || txn.amount === 0) {
      issues.push({
        type: 'MISSING_DATA',
        severity: 'HIGH',
        transactionId: txn.id,
        description: `Transaction #${index + 1} missing or zero amount`,
        suggestedFix: 'Verify and add amount'
      });
    }
    
    if (!txn.description || txn.description.trim().length === 0) {
      issues.push({
        type: 'MISSING_DATA',
        severity: 'MEDIUM',
        transactionId: txn.id,
        description: `Transaction #${index + 1} missing description`,
        suggestedFix: 'Add description for clarity'
      });
    }
  });
  
  return issues;
}

function detectDuplicates(transactions: any[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Map<string, number>();
  
  transactions.forEach((txn, index) => {
    // Create a key based on date + amount + description
    const key = `${txn.date}_${Math.abs(txn.amount)}_${txn.description?.substring(0, 20)}`;
    
    if (seen.has(key)) {
      issues.push({
        type: 'DUPLICATE',
        severity: 'MEDIUM',
        transactionId: txn.id,
        description: `Possible duplicate transaction: ${txn.description} ($${Math.abs(txn.amount).toFixed(2)}) on ${txn.date}`,
        suggestedFix: 'Review and remove if duplicate'
      });
    }
    
    seen.set(key, index);
  });
  
  return issues;
}

function performMathematicalReconciliation(extractedData: any, transactions: any[]): any {
  // Calculate from transactions
  const credits = transactions
    .filter(t => t.type === 'INCOME' || (t.amount && t.amount > 0))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const debits = transactions
    .filter(t => t.type === 'EXPENSE' || (t.amount && t.amount < 0))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const beginningBalance = extractedData.summary?.startingBalance || 0;
  const endingBalance = extractedData.summary?.endingBalance || 0;
  
  // Expected: Beginning + Credits - Debits = Ending
  const calculatedEnding = beginningBalance + credits - debits;
  const difference = Math.abs(calculatedEnding - endingBalance);
  
  // Allow small rounding differences (< $0.10)
  const passed = difference < 0.10;
  
  return {
    passed,
    expectedBalance: endingBalance,
    actualBalance: calculatedEnding,
    difference
  };
}

// Generate validation summary
export function generateValidationSummary(
  ruleBasedResult: Partial<ValidationResult>,
  aiValidationResult: any,
  transactions: any[]
): ValidationResult {
  const allIssues = [
    ...(ruleBasedResult.issues || []),
    ...(aiValidationResult.issues || [])
  ];
  
  // Calculate overall confidence
  const highSeverityCount = allIssues.filter(i => i.severity === 'HIGH').length;
  const mediumSeverityCount = allIssues.filter(i => i.severity === 'MEDIUM').length;
  const lowSeverityCount = allIssues.filter(i => i.severity === 'LOW').length;
  
  // Confidence calculation: Start at 1.0, reduce based on issues
  let confidence = 1.0;
  confidence -= (highSeverityCount * 0.15); // High severity: -15% each
  confidence -= (mediumSeverityCount * 0.05); // Medium severity: -5% each
  confidence -= (lowSeverityCount * 0.02); // Low severity: -2% each
  confidence = Math.max(0, Math.min(1.0, confidence)); // Clamp between 0-1
  
  const flaggedTransactions = allIssues.filter(i => i.transactionId).length;
  
  return {
    isValid: highSeverityCount === 0,
    confidence,
    issues: allIssues,
    summary: {
      totalTransactions: transactions.length,
      validatedTransactions: transactions.length - flaggedTransactions,
      flaggedTransactions,
      balanceReconciled: ruleBasedResult.details?.mathematicalCheck?.passed || false,
      duplicatesFound: allIssues.filter(i => i.type === 'DUPLICATE').length,
      lowConfidenceCount: allIssues.filter(i => i.type === 'LOW_CONFIDENCE').length
    },
    details: {
      mathematicalCheck: ruleBasedResult.details?.mathematicalCheck || {
        passed: true,
        expectedBalance: 0,
        actualBalance: 0,
        difference: 0
      },
      categoryVerification: aiValidationResult.categoryVerification || {
        changed: 0,
        confirmed: 0,
        flagged: 0
      },
      duplicateCheck: ruleBasedResult.details?.duplicateCheck || {
        duplicates: []
      }
    }
  };
}
