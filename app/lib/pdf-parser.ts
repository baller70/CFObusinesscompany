
// @ts-ignore
const { PDFParse } = require('pdf-parse');

export interface ParsedTransaction {
  date: string;
  amount: number;
  description: string;
  type: 'credit' | 'debit';
  category?: string;
  referenceNumber?: string;
  rawText?: string;
}

export interface ParsedStatement {
  statementType: 'personal' | 'business';
  accountNumber: string;
  accountName?: string;
  periodStart: string;
  periodEnd: string;
  beginningBalance: number;
  endingBalance: number;
  transactions: ParsedTransaction[];
}

// Smart categorization based on merchant patterns
function categorizeMerchant(description: string): string {
  const desc = description.toLowerCase();
  
  // Income categories
  if (desc.includes('stripe') || desc.includes('mobile deposit') || desc.includes('ach credit')) {
    return 'Income';
  }
  
  // Expense categories
  if (desc.includes('gas') || desc.includes('costco gas') || desc.includes('shell') || desc.includes('exxon')) {
    return 'Fuel & Gas';
  }
  
  if (desc.includes('walmart') || desc.includes('target') || desc.includes('acme') || desc.includes('aldi') || 
      desc.includes('shoprite') || desc.includes('grocery')) {
    return 'Groceries & Shopping';
  }
  
  if (desc.includes('mcdonald') || desc.includes('wendy') || desc.includes('restaurant') || 
      desc.includes('napkins') || desc.includes('juice')) {
    return 'Food & Dining';
  }
  
  if (desc.includes('amazon') || desc.includes('amzn')) {
    return 'Online Shopping';
  }
  
  if (desc.includes('autozone') || desc.includes('mavis') || desc.includes('car') || desc.includes('auto')) {
    return 'Auto & Transport';
  }
  
  if (desc.includes('petsmart') || desc.includes('pet')) {
    return 'Pets';
  }
  
  if (desc.includes('mortgage') || desc.includes('rent') || desc.includes('pnc pymt')) {
    return 'Housing';
  }
  
  if (desc.includes('american water') || desc.includes('elizabethtown ga') || desc.includes('pseg') || 
      desc.includes('firstenergy') || desc.includes('electric') || desc.includes('water') || desc.includes('utility')) {
    return 'Utilities';
  }
  
  if (desc.includes('tmobile') || desc.includes('verizon') || desc.includes('at&t') || desc.includes('phone')) {
    return 'Phone & Internet';
  }
  
  if (desc.includes('optimum') || desc.includes('cable') || desc.includes('internet')) {
    return 'Cable & Internet';
  }
  
  if (desc.includes('disney') || desc.includes('netflix') || desc.includes('hulu') || desc.includes('spotify')) {
    return 'Entertainment';
  }
  
  if (desc.includes('apple.com') || desc.includes('google one') || desc.includes('software') || desc.includes('subscription')) {
    return 'Subscriptions';
  }
  
  if (desc.includes('sba loan') || desc.includes('loan payment') || desc.includes('chrysler capital')) {
    return 'Loan Payment';
  }
  
  if (desc.includes('irs') || desc.includes('tax') || desc.includes('treasury')) {
    return 'Taxes';
  }
  
  if (desc.includes('credit card pmt') || desc.includes('online credit card')) {
    return 'Credit Card Payment';
  }
  
  if (desc.includes('service charge') || desc.includes('fee') || desc.includes('maintenance')) {
    return 'Bank Fees';
  }
  
  if (desc.includes('school') || desc.includes('education')) {
    return 'Education';
  }
  
  if (desc.includes('homegoods') || desc.includes('cvs') || desc.includes('dollartree')) {
    return 'Shopping';
  }
  
  // Default
  return 'Uncategorized';
}

// Parse date in format MM/DD
function parseStatementDate(dateStr: string, year: number): string {
  const [month, day] = dateStr.split('/').map(num => num.padStart(2, '0'));
  return `${year}-${month}-${day}`;
}

// Extract account number from statement
function extractAccountNumber(text: string): string {
  const match = text.match(/Account Number:\s*XX-XXXX-(\d{4})/i) || 
                text.match(/account number:\s*XX-XXXX-(\d{4})/i);
  return match ? `****${match[1]}` : 'Unknown';
}

// Parse PNC Personal Statement
function parsePersonalStatement(text: string): ParsedStatement {
  const transactions: ParsedTransaction[] = [];
  
  // Extract period
  const periodMatch = text.match(/For the period (\d{2}\/\d{2}\/\d{4}) to\s*(\d{2}\/\d{2}\/\d{4})/);
  const periodStart = periodMatch ? periodMatch[1] : '';
  const periodEnd = periodMatch ? periodMatch[2] : '';
  
  // Extract year from period
  const year = periodEnd ? parseInt(periodEnd.split('/')[2]) : new Date().getFullYear();
  
  // Extract balances
  const balanceMatch = text.match(/Beginning\s+balance.*?\n([\d,.-]+)\s+([\d,.-]+)\s+([\d,.-]+)\s+([\d,.-]+)/s);
  const beginningBalance = balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '').replace('-', '')) * -1 : 0;
  const endingBalance = balanceMatch ? parseFloat(balanceMatch[4].replace(/,/g, '').replace('-', '')) * -1 : 0;
  
  // Parse Deposits and Other Additions
  const depositSection = text.match(/Deposits and Other Additions.*?(?=Banking\/Debit Card Withdrawals|Online and Electronic Banking|Other Deductions|$)/s);
  if (depositSection) {
    const depositLines = depositSection[0].split('\n');
    for (let i = 0; i < depositLines.length; i++) {
      const line = depositLines[i];
      const match = line.match(/^(\d{2}\/\d{2})\s+([\d,.]+)\s+(.+)$/);
      if (match) {
        const [, date, amount, description] = match;
        transactions.push({
          date: parseStatementDate(date, year),
          amount: parseFloat(amount.replace(/,/g, '')),
          description: description.trim(),
          type: 'credit',
          category: categorizeMerchant(description),
          rawText: line,
        });
      }
    }
  }
  
  // Parse Banking/Debit Card Withdrawals
  const debitCardSection = text.match(/Banking\/Debit Card Withdrawals and Purchases.*?(?=Online and Electronic Banking|Other Deductions|$)/s);
  if (debitCardSection) {
    const debitLines = debitCardSection[0].split('\n');
    for (let i = 0; i < debitLines.length; i++) {
      const line = debitLines[i];
      const match = line.match(/^(\d{2}\/\d{2})\s+([\d,.]+)\s+(.+)$/);
      if (match) {
        const [, date, amount, description] = match;
        transactions.push({
          date: parseStatementDate(date, year),
          amount: parseFloat(amount.replace(/,/g, '')) * -1,
          description: description.trim(),
          type: 'debit',
          category: categorizeMerchant(description),
          rawText: line,
        });
      }
    }
  }
  
  // Parse Online and Electronic Banking Deductions
  const electronicSection = text.match(/Online and Electronic Banking Deductions.*?(?=Other Deductions|Daily Balance|$)/s);
  if (electronicSection) {
    const electronicLines = electronicSection[0].split('\n');
    for (let i = 0; i < electronicLines.length; i++) {
      const line = electronicLines[i];
      const match = line.match(/^(\d{2}\/\d{2})\s+([\d,.]+)\s+(.+)$/);
      if (match) {
        const [, date, amount, description] = match;
        transactions.push({
          date: parseStatementDate(date, year),
          amount: parseFloat(amount.replace(/,/g, '')) * -1,
          description: description.trim(),
          type: 'debit',
          category: categorizeMerchant(description),
          rawText: line,
        });
      }
    }
  }
  
  // Parse Other Deductions
  const otherSection = text.match(/Other Deductions.*?(?=Daily Balance|Service Charge|$)/s);
  if (otherSection) {
    const otherLines = otherSection[0].split('\n');
    for (let i = 0; i < otherLines.length; i++) {
      const line = otherLines[i];
      const match = line.match(/^(\d{2}\/\d{2})\s+([\d,.]+)\s+(.+)$/);
      if (match) {
        const [, date, amount, description] = match;
        transactions.push({
          date: parseStatementDate(date, year),
          amount: parseFloat(amount.replace(/,/g, '')) * -1,
          description: description.trim(),
          type: 'debit',
          category: categorizeMerchant(description),
          rawText: line,
        });
      }
    }
  }
  
  return {
    statementType: 'personal',
    accountNumber: extractAccountNumber(text),
    periodStart,
    periodEnd,
    beginningBalance,
    endingBalance,
    transactions: transactions.sort((a, b) => a.date.localeCompare(b.date)),
  };
}

// Parse PNC Business Statement with MULTI-LINE transaction support
function parseBusinessStatement(text: string): ParsedStatement {
  const transactions: ParsedTransaction[] = [];
  
  console.log('[Parser] Starting PNC Business Statement parsing');
  console.log('[Parser] Text length:', text.length);
  
  // Extract business name
  const nameMatch = text.match(/For the Period.*?\n(.+?)\n/s);
  const accountName = nameMatch ? nameMatch[1].trim() : '';
  
  // Extract period
  const periodMatch = text.match(/For the Period (\d{2}\/\d{2}\/\d{4}) to (\d{2}\/\d{2}\/\d{4})/);
  const periodStart = periodMatch ? periodMatch[1] : '';
  const periodEnd = periodMatch ? periodMatch[2] : '';
  
  // Extract year
  const year = periodEnd ? parseInt(periodEnd.split('/')[2]) : new Date().getFullYear();
  console.log('[Parser] Statement year:', year);
  
  // Extract balances
  const balanceMatch = text.match(/Beginning\s+balance.*?\n([\d,.-]+)\s+([\d,.-]+)\s+([\d,.-]+)\s+([\d,.-]+)/s);
  const beginningBalance = balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '')) : 0;
  const endingBalance = balanceMatch ? parseFloat(balanceMatch[4].replace(/,/g, '')) : 0;
  
  console.log('[Parser] Beginning Balance:', beginningBalance);
  console.log('[Parser] Ending Balance:', endingBalance);
  
  // Split text into lines for processing
  const lines = text.split('\n');
  let currentSection = '';
  let inTransactionSection = false;
  let inDailyBalanceSection = false;
  
  // Variables for multi-line transaction handling
  let pendingTransaction: ParsedTransaction | null = null;
  let descriptionBuffer: string[] = [];
  
  // Helper function to finalize a pending transaction
  const finalizePendingTransaction = () => {
    if (pendingTransaction) {
      // Combine all description lines
      const fullDescription = descriptionBuffer.join(' ').trim();
      
      // Extract reference number if present (usually at the end)
      const refMatch = fullDescription.match(/(\d{10,})\s*$/);
      const referenceNumber = refMatch ? refMatch[1] : undefined;
      const cleanDescription = refMatch ? fullDescription.replace(/\s*\d{10,}\s*$/, '').trim() : fullDescription;
      
      pendingTransaction.description = cleanDescription;
      pendingTransaction.referenceNumber = referenceNumber;
      pendingTransaction.category = categorizeMerchant(cleanDescription);
      
      transactions.push(pendingTransaction);
      
      if (transactions.length % 20 === 0) {
        console.log(`[Parser] Extracted ${transactions.length} transactions so far...`);
      }
      
      pendingTransaction = null;
      descriptionBuffer = [];
    }
  };
  
  // Process line by line to capture ALL transactions across all pages
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Detect Daily Balance section (skip these - they're not transactions)
    if (trimmed === 'Daily Balance' || trimmed.includes('Daily Balance')) {
      finalizePendingTransaction();
      inDailyBalanceSection = true;
      inTransactionSection = false;
      currentSection = '';
      console.log('[Parser] Entering Daily Balance section (skipping)');
      continue;
    }
    
    // Exit Daily Balance section when we hit Activity Detail
    if (inDailyBalanceSection && trimmed.includes('Activity Detail')) {
      inDailyBalanceSection = false;
      console.log('[Parser] Exiting Daily Balance section');
      continue;
    }
    
    // Skip all lines in Daily Balance section
    if (inDailyBalanceSection) {
      continue;
    }
    
    // Detect transaction section headers and START EXTRACTION IMMEDIATELY
    if (trimmed.match(/^(Deposits)$/) && !trimmed.includes('ATM')) {
      finalizePendingTransaction();
      currentSection = 'Deposits';
      inTransactionSection = true; // Start extracting immediately
      console.log('[Parser] Found section: Deposits (extraction started)');
      continue;
    }
    if (trimmed === 'ATM Deposits and Additions') {
      finalizePendingTransaction();
      currentSection = 'ATM Deposits';
      inTransactionSection = true;
      console.log('[Parser] Found section: ATM Deposits (extraction started)');
      continue;
    }
    if (trimmed === 'ACH Additions') {
      finalizePendingTransaction();
      currentSection = 'ACH Additions';
      inTransactionSection = true;
      console.log('[Parser] Found section: ACH Additions (extraction started)');
      continue;
    }
    if (trimmed === 'Checks and Substitute Checks') {
      finalizePendingTransaction();
      currentSection = 'Checks';
      inTransactionSection = true;
      console.log('[Parser] Found section: Checks (extraction started)');
      continue;
    }
    if (trimmed === 'Debit Card Purchases') {
      finalizePendingTransaction();
      currentSection = 'Debit Card Purchases';
      inTransactionSection = true;
      console.log('[Parser] Found section: Debit Card Purchases (extraction started)');
      continue;
    }
    if (trimmed === 'POS Purchases') {
      finalizePendingTransaction();
      currentSection = 'POS Purchases';
      inTransactionSection = true;
      console.log('[Parser] Found section: POS Purchases (extraction started)');
      continue;
    }
    if (trimmed.includes('ATM') && trimmed.includes('Debit Card') && trimmed.includes('Transactions')) {
      finalizePendingTransaction();
      currentSection = 'ATM/Misc';
      inTransactionSection = true;
      console.log('[Parser] Found section: ATM/Misc (extraction started)');
      continue;
    }
    if (trimmed === 'ACH Deductions') {
      finalizePendingTransaction();
      currentSection = 'ACH Deductions';
      inTransactionSection = true;
      console.log('[Parser] Found section: ACH Deductions (extraction started)');
      continue;
    }
    if (trimmed === 'Service Charges and Fees') {
      finalizePendingTransaction();
      currentSection = 'Service Charges';
      inTransactionSection = true;
      console.log('[Parser] Found section: Service Charges (extraction started)');
      continue;
    }
    if (trimmed === 'Other Deductions') {
      finalizePendingTransaction();
      currentSection = 'Other Deductions';
      inTransactionSection = true;
      console.log('[Parser] Found section: Other Deductions (extraction started)');
      continue;
    }
    
    // Skip header lines like "Date posted Amount Transaction description"
    if ((line.includes('Date') && (line.includes('Transaction') || line.includes('Check'))) || 
        line.includes('posted') || line.includes('Reference') || line.includes('number')) {
      // These are header lines, skip them but keep extraction mode active
      continue;
    }
    
    // Look for continuation markers
    if (trimmed.includes('continued on next page') || trimmed.includes('- continued')) {
      finalizePendingTransaction();
      console.log('[Parser] Found continuation marker for:', currentSection);
      continue;
    }
    
    // Skip page headers and footers
    if (trimmed.includes('Page') && trimmed.includes('of')) {
      continue;
    }
    if (trimmed.includes('For the Period') && trimmed.includes('Primary Account Number')) {
      continue;
    }
    if (trimmed.includes('For 24-hour account information')) {
      continue;
    }
    if (trimmed.includes('Member FDIC')) {
      continue;
    }
    if (trimmed.includes('Business Checking Plus') && trimmed.includes('Account Number')) {
      continue;
    }
    
    // Check for section end markers  
    if (inTransactionSection && (
      trimmed.includes('Detail of Services') ||
      (trimmed === 'Checks and Other Deductions' || trimmed === 'Checks') && currentSection !== 'Checks'
    )) {
      if (currentSection) {
        finalizePendingTransaction();
        console.log('[Parser] Ending section:', currentSection);
        inTransactionSection = false;
        currentSection = '';
      }
      continue;
    }
    
    // Parse transaction lines - look for date pattern at start (with layout-preserved spacing)
    if (inTransactionSection && currentSection) {
      let isNewTransaction = false;
      let dateStr = '';
      let amountStr = '';
      let description = '';
      let checkNumber = '';
      
      // Special handling for Checks section (has check number between date and amount)
      if (currentSection === 'Checks' && line.match(/^\d{2}\/\d{2}\s+\d+/)) {
        // Format: DATE CHECK_NUMBER AMOUNT DESCRIPTION REFERENCE
        // Example: 01/03      1157 *                         1,000.00       013138290
        const checkMatch = line.match(/^(\d{2}\/\d{2})\s+(\d+)\s*\*?\s+([\d,]+\.\d{2})\s*(.*)$/);
        if (checkMatch) {
          finalizePendingTransaction(); // Finish previous transaction
          
          dateStr = checkMatch[1];
          checkNumber = checkMatch[2];
          amountStr = checkMatch[3];
          description = `Check #${checkNumber}` + (checkMatch[4] ? ' ' + checkMatch[4].trim() : '');
          isNewTransaction = true;
          
          // Parse date
          const [month, day] = dateStr.split('/');
          const date = new Date(year, parseInt(month) - 1, parseInt(day));
          const formattedDate = date.toISOString().split('T')[0];
          
          // Parse amount
          const amount = parseFloat(amountStr.replace(/,/g, ''));
          
          pendingTransaction = {
            date: formattedDate,
            amount: -amount, // Checks are debits
            description: '',
            type: 'debit',
            category: '',
            rawText: line,
          };
          
          descriptionBuffer = [description];
        }
      } else if (line.match(/^\d{2}\/\d{2}\s+[\d,]+\.\d{2}/)) {
        // Standard format: DATE AMOUNT DESCRIPTION
        // This is a NEW transaction line
        const standardMatch = line.match(/^(\d{2}\/\d{2})\s+([\d,]+\.\d{2})\s+(.*)$/);
        if (standardMatch) {
          finalizePendingTransaction(); // Finish previous transaction
          
          dateStr = standardMatch[1];
          amountStr = standardMatch[2];
          description = standardMatch[3].trim();
          isNewTransaction = true;
          
          // Parse date
          const [month, day] = dateStr.split('/');
          const date = new Date(year, parseInt(month) - 1, parseInt(day));
          const formattedDate = date.toISOString().split('T')[0];
          
          // Parse amount
          const amount = parseFloat(amountStr.replace(/,/g, ''));
          
          // Determine transaction type based on section
          const isCredit = currentSection === 'Deposits' || 
                           currentSection === 'ATM Deposits' || 
                           currentSection === 'ACH Additions';
          
          const finalAmount = isCredit ? amount : -amount;
          
          pendingTransaction = {
            date: formattedDate,
            amount: finalAmount,
            description: '',
            type: isCredit ? 'credit' : 'debit',
            category: '',
            rawText: line,
          };
          
          descriptionBuffer = [description];
        }
      } else if (pendingTransaction && trimmed && !trimmed.match(/^Page \d+ of \d+/)) {
        // This is a CONTINUATION line for the previous transaction
        // Only add if it's not empty and not a page marker
        descriptionBuffer.push(trimmed);
      }
    }
  }
  
  // Don't forget to finalize the last transaction!
  finalizePendingTransaction();
  
  console.log(`[Parser] ✅ Total transactions extracted: ${transactions.length}`);
  
  // Log count by section
  const sectionCounts: Record<string, number> = {};
  transactions.forEach(t => {
    // Try to determine original section from description
    let section = 'Unknown';
    if (t.amount > 0) {
      if (t.description.includes('Mobile Deposit') || t.description.includes('Deposit')) {
        section = 'Deposits';
      } else if (t.description.includes('POS Return') || t.description.includes('ATM Deposit')) {
        section = 'ATM Deposits';
      } else if (t.description.includes('ACH') || t.description.includes('Corporate ACH') || t.description.includes('Stripe') || t.description.includes('Etsy')) {
        section = 'ACH Additions';
      }
    } else {
      if (t.description.includes('Check')) {
        section = 'Checks';
      } else if (t.description.includes('7526 Debit Card')) {
        section = 'Debit Card Purchases';
      } else if (t.description.includes('POS Purchase')) {
        section = 'POS Purchases';
      } else if (t.description.includes('ATM Withdrawal') || t.description.includes('Misc')) {
        section = 'ATM/Misc';
      } else if (t.description.includes('Corporate ACH')) {
        section = 'ACH Deductions';
      } else if (t.description.includes('Service Charge') || t.description.includes('Fee')) {
        section = 'Service Charges';
      } else if (t.description.includes('Zelle') || t.description.includes('Wire')) {
        section = 'Other Deductions';
      }
    }
    sectionCounts[section] = (sectionCounts[section] || 0) + 1;
  });
  
  console.log('[Parser] Transactions by section:');
  Object.entries(sectionCounts).sort((a, b) => b[1] - a[1]).forEach(([section, count]) => {
    console.log(`[Parser]   ${section}: ${count}`);
  });
  
  // Log count by category
  const categoryCounts: Record<string, number> = {};
  transactions.forEach(t => {
    const cat = t.category || 'Unknown';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  console.log('[Parser] Transactions by category:');
  Object.entries(categoryCounts).forEach(([cat, count]) => {
    console.log(`[Parser]   ${cat}: ${count}`);
  });
  
  return {
    statementType: 'business',
    accountNumber: extractAccountNumber(text),
    accountName,
    periodStart,
    periodEnd,
    beginningBalance,
    endingBalance,
    transactions: transactions.sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export async function parsePNCStatement(buffer: Buffer): Promise<ParsedStatement> {
  try {
    // First, try using pdftotext with layout preservation for better extraction
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const { writeFile, unlink } = require('fs/promises');
    const path = require('path');
    const execAsync = promisify(exec);
    
    const tempPdfPath = path.join('/tmp', `pnc_${Date.now()}.pdf`);
    
    try {
      // Write buffer to temp file
      await writeFile(tempPdfPath, buffer);
      
      // Use pdftotext with -layout flag for better column preservation
      const { stdout } = await execAsync(`pdftotext -layout "${tempPdfPath}" -`);
      const text = stdout;
      
      // Clean up
      await unlink(tempPdfPath).catch(() => {});
      
      // Determine statement type
      if (text.includes('Virtual Wallet Spend Statement') || text.includes('Virtual Wallet')) {
        console.log('[Parser] Detected: Personal statement');
        return parsePersonalStatement(text);
      } else if (text.includes('Business Checking Plus') || text.includes('Business Checking')) {
        console.log('[Parser] Detected: Business statement');
        return parseBusinessStatement(text);
      } else {
        throw new Error('Unknown statement format. Please upload a PNC Bank statement.');
      }
    } catch (pdftotextError) {
      console.warn('[Parser] pdftotext failed, falling back to PDFParse:', pdftotextError);
      // Fallback to original method
      const data = await PDFParse(buffer);
      const text = data.text;
      
      if (text.includes('Virtual Wallet Spend Statement') || text.includes('Virtual Wallet')) {
        return parsePersonalStatement(text);
      } else if (text.includes('Business Checking Plus') || text.includes('Business Checking')) {
        return parseBusinessStatement(text);
      } else {
        throw new Error('Unknown statement format. Please upload a PNC Bank statement.');
      }
    }
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF statement. Please ensure it is a valid PNC Bank statement.');
  }
}
