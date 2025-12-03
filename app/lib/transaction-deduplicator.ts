/**
 * Transaction Deduplicator
 * 
 * Handles intelligent deduplication of transactions from multiple sources
 * (PDF extraction + Manual entry) using fuzzy matching and confidence scoring.
 */

import crypto from 'crypto';

export interface StagedTransactionInput {
  id?: string;
  date: Date | string;
  amount: number;
  description: string;
  merchant?: string;
  category?: string;
  type: string;
  source: 'PDF' | 'MANUAL' | 'CSV';
  confidence?: number;
  rawText?: string;
}

export interface DeduplicationMatch {
  transaction1: StagedTransactionInput;
  transaction2: StagedTransactionInput;
  matchScore: number;
  matchReasons: string[];
  recommendation: 'AUTO_MERGE' | 'REVIEW_NEEDED' | 'NO_MATCH';
}

export interface DeduplicationResult {
  autoMerged: Array<{
    pdf: StagedTransactionInput;
    manual: StagedTransactionInput;
    merged: StagedTransactionInput;
    matchScore: number;
  }>;
  needsReview: Array<{
    pdf: StagedTransactionInput;
    manual: StagedTransactionInput;
    matchScore: number;
    reasons: string[];
  }>;
  pdfOnly: StagedTransactionInput[];
  manualOnly: StagedTransactionInput[];
  totalPdf: number;
  totalManual: number;
  duplicatesFound: number;
}

// Thresholds for matching decisions
const THRESHOLDS = {
  AUTO_MERGE: 85,      // Score >= 85: Auto-merge without user review
  LIKELY_MATCH: 60,    // Score 60-84: Show as potential match for review
  NO_MATCH: 59         // Score < 60: Treat as different transactions
};

/**
 * Generate a deduplication hash for a transaction
 * Uses normalized date + amount + description prefix
 */
export function generateDedupHash(transaction: StagedTransactionInput): string {
  const normalizedDate = normalizeDate(transaction.date);
  const normalizedAmount = normalizeAmount(transaction.amount);
  const normalizedDesc = normalizeDescription(transaction.description).substring(0, 30);
  
  const hashInput = `${normalizedDate}|${normalizedAmount}|${normalizedDesc}`;
  return crypto.createHash('md5').update(hashInput.toLowerCase()).digest('hex');
}

/**
 * Normalize date to YYYY-MM-DD format
 */
export function normalizeDate(date: Date | string): string {
  try {
    if (!date) return 'unknown';
    
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return 'unknown';
    
    return d.toISOString().split('T')[0];
  } catch {
    return 'unknown';
  }
}

/**
 * Normalize amount to 2 decimal places, absolute value
 */
export function normalizeAmount(amount: number): string {
  return Math.abs(amount).toFixed(2);
}

/**
 * Normalize description for comparison
 * - Lowercase
 * - Remove extra whitespace
 * - Remove common prefixes/suffixes
 */
export function normalizeDescription(description: string): string {
  if (!description) return '';
  
  return description
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/\b(debit|credit|card|purchase|payment|pos|ach|web)\b/gi, '')
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  
  if (m === 0) return n;
  if (n === 0) return m;
  
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  
  return dp[m][n];
}

/**
 * Calculate string similarity (0-1) using Levenshtein distance
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(str1, str2);
  return 1 - (distance / maxLen);
}

/**
 * Calculate match score between two transactions (0-100)
 */
export function calculateMatchScore(
  t1: StagedTransactionInput, 
  t2: StagedTransactionInput
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  
  // Date comparison (max 40 points)
  const date1 = new Date(t1.date);
  const date2 = new Date(t2.date);
  const daysDiff = Math.abs((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) {
    score += 40;
    reasons.push('Exact date match');
  } else if (daysDiff <= 1) {
    score += 35;
    reasons.push('Date within 1 day');
  } else if (daysDiff <= 3) {
    score += 20;
    reasons.push('Date within 3 days');
  }
  
  // Amount comparison (max 40 points)
  const amt1 = Math.abs(t1.amount);
  const amt2 = Math.abs(t2.amount);
  const amountDiff = Math.abs(amt1 - amt2);
  const amountPercent = amountDiff / Math.max(amt1, amt2, 0.01);
  
  if (amountDiff === 0) {
    score += 40;
    reasons.push('Exact amount match');
  } else if (amountPercent <= 0.01) {
    score += 35;
    reasons.push('Amount within 1%');
  } else if (amountPercent <= 0.05) {
    score += 20;
    reasons.push('Amount within 5%');
  }
  
  // Description similarity (max 20 points)
  const desc1 = normalizeDescription(t1.description);
  const desc2 = normalizeDescription(t2.description);
  const descSimilarity = calculateStringSimilarity(desc1, desc2);
  
  const descPoints = Math.round(descSimilarity * 20);
  score += descPoints;
  
  if (descSimilarity >= 0.8) {
    reasons.push(`Description highly similar (${Math.round(descSimilarity * 100)}%)`);
  } else if (descSimilarity >= 0.5) {
    reasons.push(`Description partially similar (${Math.round(descSimilarity * 100)}%)`);
  }
  
  // Merchant match bonus (extra 5 points if both have merchant and they match)
  if (t1.merchant && t2.merchant) {
    const merchSim = calculateStringSimilarity(
      t1.merchant.toLowerCase(), 
      t2.merchant.toLowerCase()
    );
    if (merchSim >= 0.8) {
      score += 5;
      reasons.push('Merchant names match');
    }
  }
  
  return { score: Math.min(score, 100), reasons };
}

/**
 * Determine recommendation based on match score
 */
export function getMatchRecommendation(score: number): 'AUTO_MERGE' | 'REVIEW_NEEDED' | 'NO_MATCH' {
  if (score >= THRESHOLDS.AUTO_MERGE) return 'AUTO_MERGE';
  if (score >= THRESHOLDS.LIKELY_MATCH) return 'REVIEW_NEEDED';
  return 'NO_MATCH';
}

/**
 * Merge two transactions, keeping the best data from each
 */
export function mergeTransactions(
  pdf: StagedTransactionInput, 
  manual: StagedTransactionInput
): StagedTransactionInput {
  // Prefer PDF for date/amount (more reliable extraction)
  // Prefer manual for description if more complete
  // Use higher confidence source for category
  
  const pdfConfidence = pdf.confidence || 0.5;
  const manualConfidence = manual.confidence || 0.8; // Manual entry assumed higher confidence
  
  return {
    date: pdf.date, // PDF date is usually more accurate
    amount: pdf.amount, // PDF amount is usually more accurate
    description: pdf.description.length >= manual.description.length ? pdf.description : manual.description,
    merchant: pdf.merchant || manual.merchant,
    category: pdfConfidence >= manualConfidence ? pdf.category : manual.category,
    type: pdf.type || manual.type,
    source: 'PDF' as const, // Mark as PDF since we prefer PDF data
    confidence: Math.max(pdfConfidence, manualConfidence),
    rawText: manual.rawText
  };
}

/**
 * Main deduplication function
 * Compares PDF transactions with Manual transactions and identifies matches
 */
export function deduplicateTransactions(
  pdfTransactions: StagedTransactionInput[],
  manualTransactions: StagedTransactionInput[]
): DeduplicationResult {
  const result: DeduplicationResult = {
    autoMerged: [],
    needsReview: [],
    pdfOnly: [],
    manualOnly: [],
    totalPdf: pdfTransactions.length,
    totalManual: manualTransactions.length,
    duplicatesFound: 0
  };
  
  // Track which transactions have been matched
  const matchedPdfIds = new Set<number>();
  const matchedManualIds = new Set<number>();
  
  // Compare each PDF transaction with each Manual transaction
  for (let i = 0; i < pdfTransactions.length; i++) {
    const pdfTxn = pdfTransactions[i];
    let bestMatch: { index: number; score: number; reasons: string[] } | null = null;
    
    for (let j = 0; j < manualTransactions.length; j++) {
      if (matchedManualIds.has(j)) continue; // Already matched
      
      const manualTxn = manualTransactions[j];
      const { score, reasons } = calculateMatchScore(pdfTxn, manualTxn);
      
      if (score >= THRESHOLDS.LIKELY_MATCH) {
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { index: j, score, reasons };
        }
      }
    }
    
    if (bestMatch) {
      const manualTxn = manualTransactions[bestMatch.index];
      const recommendation = getMatchRecommendation(bestMatch.score);
      
      if (recommendation === 'AUTO_MERGE') {
        result.autoMerged.push({
          pdf: pdfTxn,
          manual: manualTxn,
          merged: mergeTransactions(pdfTxn, manualTxn),
          matchScore: bestMatch.score
        });
        matchedPdfIds.add(i);
        matchedManualIds.add(bestMatch.index);
        result.duplicatesFound++;
      } else if (recommendation === 'REVIEW_NEEDED') {
        result.needsReview.push({
          pdf: pdfTxn,
          manual: manualTxn,
          matchScore: bestMatch.score,
          reasons: bestMatch.reasons
        });
        matchedPdfIds.add(i);
        matchedManualIds.add(bestMatch.index);
      }
    }
  }
  
  // Collect unmatched transactions
  pdfTransactions.forEach((txn, i) => {
    if (!matchedPdfIds.has(i)) {
      result.pdfOnly.push(txn);
    }
  });
  
  manualTransactions.forEach((txn, i) => {
    if (!matchedManualIds.has(i)) {
      result.manualOnly.push(txn);
    }
  });
  
  return result;
}

/**
 * Parse raw text input into transaction objects
 * Supports multiple formats: tab-separated, CSV, space-separated, bank statement formats
 */
export function parseManualInput(rawText: string): StagedTransactionInput[] {
  const transactions: StagedTransactionInput[] = [];

  // First, try to parse as a PNC-style bank statement
  const pncTransactions = parsePNCBankStatement(rawText);
  if (pncTransactions.length > 0) {
    console.log(`[Parser] Found ${pncTransactions.length} transactions using PNC parser`);
    return pncTransactions.map(t => ({
      ...t,
      source: 'MANUAL' as const,
      confidence: 0.9
    }));
  }

  // Fallback to line-by-line parsing
  const lines = rawText.trim().split('\n').filter(line => line.trim());

  for (const line of lines) {
    const parsed = parseLine(line);
    if (parsed) {
      transactions.push({
        ...parsed,
        source: 'MANUAL',
        confidence: 0.9,
        rawText: line
      });
    }
  }

  console.log(`[Parser] Parsed ${transactions.length} transactions from ${lines.length} lines`);
  return transactions;
}

/**
 * Parse PNC bank statement format - COMPREHENSIVE PARSER
 *
 * PNC Statement Structure:
 * - Deposits: DATE AMOUNT Description Reference
 * - ACH: DATE AMOUNT ACH... Description Reference
 * - Debit Card: DATE AMOUNT 7526 Debit Card Purchase MERCHANT REF
 * - POS: DATE AMOUNT POS Purchase MERCHANT REF
 * - Checks: DATE CHECK# * AMOUNT REF
 *
 * CRITICAL: Multiple transactions can be MERGED on ONE LINE
 * Example: "01/08 01/08 01/08 56.34 DESC1 36.28 DESC2 43.11 DESC3"
 */
export function parsePNCBankStatement(rawText: string): Omit<StagedTransactionInput, 'source' | 'confidence'>[] {
  const transactions: Omit<StagedTransactionInput, 'source' | 'confidence'>[] = [];

  // Detect year from statement period - handle cross-year statements
  // Format: "Period 12/30/2023 to 01/31/2024"
  const periodMatch = rawText.match(/Period\s+(\d{1,2})\/(\d{1,2})\/(\d{4})\s+to\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
  let startYear: number;
  let endYear: number;

  if (periodMatch) {
    const startMonth = parseInt(periodMatch[1]);
    startYear = parseInt(periodMatch[3]);
    const endMonth = parseInt(periodMatch[4]);
    endYear = parseInt(periodMatch[6]);
    console.log(`[PNC Parser] Statement period: ${startMonth}/${periodMatch[3]} to ${endMonth}/${periodMatch[6]}`);
  } else {
    // Fallback: try to find any 4-digit year
    const yearMatch = rawText.match(/\b(202[0-9])\b/);
    startYear = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
    endYear = startYear;
  }

  console.log(`[PNC Parser] Detected statement year range: ${startYear}-${endYear}`);

  // Helper to determine correct year for a transaction based on month
  // For cross-year statements (e.g., 12/30/2023 to 01/31/2024), Jan transactions = endYear
  function getYearForMonth(month: number): number {
    // If start and end years are different and this is January, use endYear
    if (startYear !== endYear && month === 1) {
      return endYear;
    }
    // For December, always use startYear
    if (month === 12) {
      return startYear;
    }
    // For other months, use endYear if it's greater, otherwise startYear
    return endYear;
  }

  // Split into lines and normalize
  const lines = rawText.split('\n');
  const normalizedLines: string[] = [];

  // Skip header/footer patterns
  const skipPatterns = [
    /^Business Checking/i,
    /^PNC Bank/i,
    /^For the Period/i,
    /^Page \d/i,
    /^Account number/i,
    /^Balance Summary/i,
    /^Beginning balance/i,
    /^Average/i,
    /^Daily Balance/i,
    /^Date\s+Ledger/i,
    /^Description\s+Items/i,
    /^Total\s+(For|Service|\d)/i,
    /^Detail of Services/i,
    /^Note:/i,
    /^Member FDIC/i,
    /continued on next page/i,
    /^Deposits and Other/i,
    /^Checks and Other/i,
    /^\*\*/i,
    /^These accounts/i,
    /^Account Type/i,
    /^Credit Card/i,
    /^Combined/i,
    /IMPORTANT INFORMATION/i,
    /Primary Account/i,
    /Overdraft Protection/i,
    // PDF-specific patterns to skip
    /^--\s*\d+\s*(of|\/)\s*\d+\s*--$/i, // Page markers like "-- 1 of 6 --"
    /^\d+\s*of\s*\d+$/i, // Simple page markers like "1 of 6"
    /^pnc\.com/i, // URL references
    /^THE HOUSE OF SPORTS/i, // Company name in header
    /^SPARTA NJ/i, // Address lines
    /^For customer service/i,
    /^Para servicio/i,
    /^Moving\? Please/i,
    /^Write to:/i,
    /^Visit us at/i,
    /^PO Box/i,
    /^Pittsburgh/i,
    /^Customer Service/i,
    /^Please contact us/i,
    /^Number of enclosures/i,
    /All Business Products/i,
    /ATM Withdrawal:/i,
    /your daily ATM/i,
    /Please review the limits/i,
    /FREE Online Bill Pay/i,
    /PNC accepts Telecommunications/i,
    /calls\./i,
    /Activity Detail/i,
    /^Date$/i,
    /^posted$/i,
    /^Amount$/i,
    /^Transaction$/i,
    /^description$/i,
    /^Reference$/i,
    /^number$/i,
    /^Check$/i,
  ];

  // Pattern to detect Daily Balance lines: just DATE and AMOUNT with no description
  // These are ledger balance entries, not transactions
  const isDailyBalanceLine = (line: string): boolean => {
    // Pattern: MM/DD followed by just an amount (no other text)
    const dailyBalancePattern = /^\d{1,2}\/\d{1,2}\s+[\d,]+\.\d{2}\s*$/;
    if (dailyBalancePattern.test(line)) return true;

    // Pattern: Multiple balance entries on one line (Daily Balance table)
    // e.g., "01/02 88,424.04 01/03 87,132.98 01/04 86,844.88"
    const multiBalancePattern = /^(\d{1,2}\/\d{1,2}\s+[\d,]+\.\d{2}\s*)+$/;
    if (multiBalancePattern.test(line.trim())) return true;

    return false;
  };

  // Pattern to detect summary lines with just amounts
  // e.g., "91,906.77 16,648.71 21,030.47 87,525.01"
  const isSummaryAmountLine = (line: string): boolean => {
    // Line with only amounts separated by spaces (no dates, no text descriptions)
    const onlyAmountsPattern = /^[\d,]+\.\d{2}(\s+[\d,]+\.\d{2})+\s*$/;
    return onlyAmountsPattern.test(line.trim());
  };

  // Pattern to detect Total lines
  // e.g., "Total 19 16,648.71 Total 99 21,030.47"
  const isTotalLine = (line: string): boolean => {
    return /\bTotal\s+\d+\s+[\d,]+\.\d{2}/i.test(line);
  };

  // Pattern to detect category summary lines from PDF extraction
  // e.g., "Deposits 3 8,771.66", "ACH Additions 15 7,818.96"
  const isCategorySummaryLine = (line: string): boolean => {
    const categorySummaryPattern = /^(Deposits|ATM Deposits|ATM\/Misc|ACH Additions|Checks|Debit Card Purchases|POS Purchases|ACH Deductions|Service Charges|Other Deductions|Transactions)\s+\d+\s+[\d,]+\.\d{2}\s*$/i;
    return categorySummaryPattern.test(line.trim());
  };

  // Section headers to track transaction type
  let currentSection = 'UNKNOWN';
  const sectionPatterns: { [key: string]: RegExp } = {
    'DEPOSIT': /^Deposits$/i,
    'ATM_DEPOSIT': /^ATM Deposits/i,
    'ACH_CREDIT': /^ACH Additions/i,
    'CHECK': /^Checks and Substitute/i,
    'DEBIT_CARD': /^Debit Card Purchases/i,
    'POS': /^POS Purchases/i,
    'ATM_DEBIT': /^ATM\/Misc/i,
    'ACH_DEBIT': /^ACH Deductions/i,
    'SERVICE_CHARGE': /^Service Charges/i,
    'OTHER': /^Other Deductions/i,
  };

  // Section headers that may get concatenated with descriptions when copy-pasting
  // These need to be stripped from the END of transaction descriptions
  const sectionHeadersToStrip = [
    'ATM Deposits and Additions',
    'Checks and Substitute Checks',
    'Debit Card Purchases',
    'POS Purchases',
    'ATM and Miscellaneous Deductions',
    'ATM/Miscellaneous Deductions',
    'ATM/Misc. Deductions',
    'ATM/Misc Deductions',
    'ACH Deductions',
    'Service Charges',
    'Other Deductions',
    'Deposits',
    'ACH Additions',
  ];

  // Helper function to strip section headers from description
  const stripSectionHeaders = (desc: string): string => {
    let cleaned = desc;
    for (const header of sectionHeadersToStrip) {
      // Case-insensitive match at the end of description
      const regex = new RegExp(`\\s*${header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i');
      cleaned = cleaned.replace(regex, '');
    }
    return cleaned.trim();
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check for section headers
    for (const [section, pattern] of Object.entries(sectionPatterns)) {
      if (pattern.test(line)) {
        currentSection = section;
        continue;
      }
    }

    // Skip non-transaction lines
    if (skipPatterns.some(p => p.test(line))) continue;

    // Skip Daily Balance lines (just date + amount, no description)
    if (isDailyBalanceLine(line)) continue;

    // Skip summary amount lines (just multiple amounts, no dates or descriptions)
    if (isSummaryAmountLine(line)) continue;

    // Skip Total lines
    if (isTotalLine(line)) continue;

    // Skip category summary lines (e.g., "Deposits 3 8,771.66")
    if (isCategorySummaryLine(line)) continue;

    // Check if this line starts with a date pattern (MM/DD)
    if (/^\d{1,2}\/\d{1,2}\s/.test(line)) {
      normalizedLines.push(line + '|||SECTION:' + currentSection);
    } else if (normalizedLines.length > 0 && !line.match(/^\d{1,2}\/\d{1,2}/)) {
      // Continuation line - append to previous (but not if it's a new date)
      // Only append if it looks like merchant info (not a header)
      if (line.length < 100 && !skipPatterns.some(p => p.test(line))) {
        const lastIdx = normalizedLines.length - 1;
        const sectionMarker = normalizedLines[lastIdx].match(/\|\|\|SECTION:\w+$/)?.[0] || '';
        normalizedLines[lastIdx] = normalizedLines[lastIdx].replace(/\|\|\|SECTION:\w+$/, '') + ' ' + line + sectionMarker;
      }
    }
  }

  console.log(`[PNC Parser] Found ${normalizedLines.length} potential transaction lines`);

  // Parse each normalized line
  for (const rawLine of normalizedLines) {
    // Extract section info
    const sectionMatch = rawLine.match(/\|\|\|SECTION:(\w+)$/);
    const section = sectionMatch ? sectionMatch[1] : 'UNKNOWN';
    const line = rawLine.replace(/\|\|\|SECTION:\w+$/, '').trim();

    // Determine if income or expense based on section
    const isIncome = ['DEPOSIT', 'ATM_DEPOSIT', 'ACH_CREDIT'].includes(section);
    const type = isIncome ? 'INCOME' : 'EXPENSE';

    // Count dates at the start of line to detect merged transactions
    const leadingDates = line.match(/^((?:\d{1,2}\/\d{1,2}\s+)+)/);
    const dateCount = leadingDates ? (leadingDates[1].match(/\d{1,2}\/\d{1,2}/g) || []).length : 0;

    // Find all amounts in the line
    const amounts = [...line.matchAll(/(\d{1,3}(?:,\d{3})*\.\d{2})/g)].map(m => ({
      value: parseFloat(m[1].replace(/,/g, '')),
      index: m.index!,
      raw: m[1]
    }));

    if (amounts.length === 0) continue;

    // Special case: Check format "DATE CHECK# * AMOUNT REF"
    const checkMatch = line.match(/^(\d{1,2}\/\d{1,2})\s+(\d+)\s+\*\s+([\d,]+\.\d{2})\s+(\d+)/);
    if (checkMatch) {
      const [, dateStr, checkNum, amountStr, ref] = checkMatch;
      const [month, day] = dateStr.split('/').map(n => parseInt(n));
      const date = new Date(getYearForMonth(month), month - 1, day);

      transactions.push({
        date,
        amount: parseFloat(amountStr.replace(/,/g, '')),
        description: `Check #${checkNum}`,
        type: 'EXPENSE',
        rawText: line.substring(0, 500)
      });
      continue;
    }

    // If multiple dates at start AND multiple amounts, it's merged transactions
    if (dateCount >= 2 && amounts.length >= 2) {
      // Extract all dates - but filter to unique dates at the start of the line
      const allDates = [...line.matchAll(/(\d{1,2}\/\d{1,2})/g)].map(m => m[1]);
      // Get unique dates (often the same date is repeated for transaction date + posting date)
      const uniqueDates = [...new Set(allDates)];
      // Use the first date for all transactions on this line (they all happened on the same day)
      const transactionDate = uniqueDates[0];

      // Parse merged transactions by finding AMOUNT DESCRIPTION patterns
      for (let i = 0; i < amounts.length; i++) {
        const amount = amounts[i];

        // Find description: text after this amount until next amount or end
        let descStart = amount.index + amount.raw.length;
        let descEnd = i + 1 < amounts.length ? amounts[i + 1].index : line.length;
        let description = line.substring(descStart, descEnd).trim();

        // Clean up description - remove reference numbers at end
        description = description.replace(/\s+\d{10,}\s*$/, '').trim();
        // Remove trailing location abbreviations that got cut
        description = description.replace(/\s+[A-Z]{2}\s*$/, '').trim();
        // Strip any section headers that got concatenated to the description
        description = stripSectionHeaders(description);

        if (description && amount.value > 0) {
          const [month, day] = transactionDate.split('/').map(n => parseInt(n));
          const date = new Date(getYearForMonth(month), month - 1, day);

          if (!isNaN(date.getTime())) {
            transactions.push({
              date,
              amount: amount.value,
              description: description.substring(0, 500),
              type,
              rawText: `${transactionDate} ${amount.raw} ${description}`.substring(0, 500)
            });
          }
        }
      }
      continue;
    }

    // Single transaction: DATE [DATE] AMOUNT DESCRIPTION
    const singleMatch = line.match(/^(\d{1,2}\/\d{1,2})(?:\s+\d{1,2}\/\d{1,2})?\s+([\d,]+\.\d{2})\s+(.+)/);
    if (singleMatch) {
      const [, dateStr, amountStr, description] = singleMatch;
      const [month, day] = dateStr.split('/').map(n => parseInt(n));
      const date = new Date(getYearForMonth(month), month - 1, day);
      const amount = parseFloat(amountStr.replace(/,/g, ''));

      // Clean description - remove reference numbers and strip section headers
      let cleanDesc = description.replace(/\s+\d{10,}\s*$/, '').trim();
      cleanDesc = stripSectionHeaders(cleanDesc);

      if (!isNaN(date.getTime()) && cleanDesc && amount > 0) {
        transactions.push({
          date,
          amount,
          description: cleanDesc.substring(0, 500),
          type,
          rawText: line.substring(0, 500)
        });
      }
    }
  }

  console.log(`[PNC Parser] Extracted ${transactions.length} transactions`);

  // Log breakdown
  const income = transactions.filter(t => t.type === 'INCOME');
  const expenses = transactions.filter(t => t.type === 'EXPENSE');
  console.log(`[PNC Parser] Income: ${income.length}, Expenses: ${expenses.length}`);

  return transactions;
}

/**
 * Parse a single line of transaction text
 */
function parseLine(line: string): Omit<StagedTransactionInput, 'source' | 'confidence' | 'rawText'> | null {
  // Try different delimiters
  const delimiters = ['\t', ',', '  ']; // Tab, comma, double-space
  
  for (const delimiter of delimiters) {
    const parts = line.split(delimiter).map(p => p.trim()).filter(p => p);
    
    if (parts.length >= 2) {
      // Try to identify date, description, and amount
      const result = extractTransactionParts(parts);
      if (result) return result;
    }
  }
  
  // Fallback: try to extract from unstructured text
  return extractFromUnstructured(line);
}

/**
 * Extract transaction parts from an array of values
 */
function extractTransactionParts(parts: string[]): Omit<StagedTransactionInput, 'source' | 'confidence' | 'rawText'> | null {
  let date: Date | null = null;
  let amount: number | null = null;
  let description = '';
  
  for (const part of parts) {
    // Try to parse as date
    if (!date) {
      const parsedDate = tryParseDate(part);
      if (parsedDate) {
        date = parsedDate;
        continue;
      }
    }
    
    // Try to parse as amount
    if (amount === null) {
      const parsedAmount = tryParseAmount(part);
      if (parsedAmount !== null) {
        amount = parsedAmount;
        continue;
      }
    }
    
    // Otherwise, it's part of the description
    description += (description ? ' ' : '') + part;
  }
  
  if (date && amount !== null && description) {
    return {
      date,
      amount: Math.abs(amount),
      description,
      type: amount < 0 ? 'EXPENSE' : 'INCOME'
    };
  }
  
  return null;
}

/**
 * Try to parse a string as a date
 */
function tryParseDate(str: string): Date | null {
  // Common date formats
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/, // MM/DD/YYYY or M/D/YY
    /^(\d{4})-(\d{2})-(\d{2})$/,          // YYYY-MM-DD
    /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/,   // MM-DD-YYYY
  ];
  
  for (const format of formats) {
    const match = str.match(format);
    if (match) {
      const d = new Date(str);
      if (!isNaN(d.getTime())) return d;
    }
  }
  
  // Try native Date parsing
  const d = new Date(str);
  if (!isNaN(d.getTime()) && str.length >= 6) return d;
  
  return null;
}

/**
 * Try to parse a string as an amount
 */
function tryParseAmount(str: string): number | null {
  // Remove currency symbols and commas
  const cleaned = str.replace(/[$,]/g, '').trim();
  
  // Check if it looks like a number
  if (/^-?\d+\.?\d*$/.test(cleaned)) {
    const num = parseFloat(cleaned);
    if (!isNaN(num)) return num;
  }
  
  // Handle parentheses for negative numbers
  const parenMatch = cleaned.match(/^\((\d+\.?\d*)\)$/);
  if (parenMatch) {
    return -parseFloat(parenMatch[1]);
  }
  
  return null;
}

/**
 * Extract transaction from unstructured text
 */
function extractFromUnstructured(line: string): Omit<StagedTransactionInput, 'source' | 'confidence' | 'rawText'> | null {
  // Try to find a date pattern anywhere in the line
  const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
  
  // Try to find an amount pattern anywhere in the line
  const amountMatch = line.match(/\$?-?([\d,]+\.?\d*)/);
  
  if (dateMatch && amountMatch) {
    const date = new Date(dateMatch[1]);
    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    
    // Description is everything else
    let description = line
      .replace(dateMatch[0], '')
      .replace(amountMatch[0], '')
      .trim();
    
    if (!isNaN(date.getTime()) && !isNaN(amount) && description) {
      return {
        date,
        amount: Math.abs(amount),
        description,
        type: line.includes('-') || line.includes('(') ? 'EXPENSE' : 'INCOME'
      };
    }
  }
  
  return null;
}

