
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

// Parse PNC Business Statement
function parseBusinessStatement(text: string): ParsedStatement {
  const transactions: ParsedTransaction[] = [];
  
  // Extract business name
  const nameMatch = text.match(/For the Period.*?\n(.+?)\n/s);
  const accountName = nameMatch ? nameMatch[1].trim() : '';
  
  // Extract period
  const periodMatch = text.match(/For the Period (\d{2}\/\d{2}\/\d{4}) to (\d{2}\/\d{2}\/\d{4})/);
  const periodStart = periodMatch ? periodMatch[1] : '';
  const periodEnd = periodMatch ? periodMatch[2] : '';
  
  // Extract year
  const year = periodEnd ? parseInt(periodEnd.split('/')[2]) : new Date().getFullYear();
  
  // Extract balances
  const balanceMatch = text.match(/Beginning\s+balance.*?\n([\d,.-]+)\s+([\d,.-]+)\s+([\d,.-]+)\s+([\d,.-]+)/s);
  const beginningBalance = balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '')) : 0;
  const endingBalance = balanceMatch ? parseFloat(balanceMatch[4].replace(/,/g, '')) : 0;
  
  // Parse Deposits
  const depositSection = text.match(/Deposits\s+Date\s+posted.*?(?=ATM Deposits|ACH Additions|Checks and Other Deductions)/s);
  if (depositSection) {
    const lines = depositSection[0].split('\n');
    for (const line of lines) {
      const match = line.match(/^(\d{2}\/\d{2})\s+([\d,.]+)\s+(.+?)(?:\s+\d+)?$/);
      if (match) {
        const [, date, amount, description] = match;
        transactions.push({
          date: parseStatementDate(date, year),
          amount: parseFloat(amount.replace(/,/g, '')),
          description: description.trim(),
          type: 'credit',
          category: 'Income',
          rawText: line,
        });
      }
    }
  }
  
  // Parse ACH Additions
  const achAddSection = text.match(/ACH Additions\s+Date\s+posted.*?(?=Checks and Other Deductions|Debit Card)/s);
  if (achAddSection) {
    const lines = achAddSection[0].split('\n');
    for (const line of lines) {
      const match = line.match(/^(\d{2}\/\d{2})\s+([\d,.]+)\s+(.+?)(?:\s+\d+)?$/);
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
  
  // Parse Debit Card Purchases
  const debitSection = text.match(/Debit Card Purchases\s+Date\s+posted.*?(?=POS Purchases|ATM\/Misc|ACH Deductions)/s);
  if (debitSection) {
    const lines = debitSection[0].split('\n');
    for (const line of lines) {
      const match = line.match(/^(\d{2}\/\d{2})\s+([\d,.]+)\s+(.+?)(?:\s+\d+)?$/);
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
  
  // Parse POS Purchases
  const posSection = text.match(/POS Purchases\s+Date\s+posted.*?(?=ATM\/Misc|ACH Deductions|Service Charges)/s);
  if (posSection) {
    const lines = posSection[0].split('\n');
    for (const line of lines) {
      const match = line.match(/^(\d{2}\/\d{2})\s+([\d,.]+)\s+(.+?)(?:\s+\d+)?$/);
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
  
  // Parse ATM/Misc Debit Card Transactions
  const atmSection = text.match(/ATM\/Misc\. Debit Card Transactions\s+Date\s+posted.*?(?=ACH Deductions|Service Charges)/s);
  if (atmSection) {
    const lines = atmSection[0].split('\n');
    for (const line of lines) {
      const match = line.match(/^(\d{2}\/\d{2})\s+([\d,.]+)\s+(.+?)(?:\s+\d+)?$/);
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
  
  // Parse ACH Deductions
  const achDeductSection = text.match(/ACH Deductions\s+Date\s+posted.*?(?=Service Charges|Other Deductions|Detail of Services)/s);
  if (achDeductSection) {
    const lines = achDeductSection[0].split('\n');
    for (const line of lines) {
      const match = line.match(/^(\d{2}\/\d{2})\s+([\d,.]+)\s+(.+?)(?:\s+\d+)?$/);
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
  
  // Parse Service Charges
  const serviceSection = text.match(/Service Charges and Fees\s+Date\s+posted.*?(?=Other Deductions|Detail of Services)/s);
  if (serviceSection) {
    const lines = serviceSection[0].split('\n');
    for (const line of lines) {
      const match = line.match(/^(\d{2}\/\d{2})\s+([\d,.]+)\s+(.+?)(?:\s+\d+)?$/);
      if (match) {
        const [, date, amount, description] = match;
        transactions.push({
          date: parseStatementDate(date, year),
          amount: parseFloat(amount.replace(/,/g, '')) * -1,
          description: description.trim(),
          type: 'debit',
          category: 'Bank Fees',
          rawText: line,
        });
      }
    }
  }
  
  // Parse Other Deductions
  const otherDeductSection = text.match(/Other Deductions\s+Date\s+posted.*?(?=Detail of Services|Member FDIC)/s);
  if (otherDeductSection) {
    const lines = otherDeductSection[0].split('\n');
    for (const line of lines) {
      const match = line.match(/^(\d{2}\/\d{2})\s+([\d,.]+)\s+(.+?)(?:\s+\d+)?$/);
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
    const data = await PDFParse(buffer);
    const text = data.text;
    
    // Determine statement type
    if (text.includes('Virtual Wallet Spend Statement') || text.includes('Virtual Wallet')) {
      return parsePersonalStatement(text);
    } else if (text.includes('Business Checking Plus') || text.includes('Business Checking')) {
      return parseBusinessStatement(text);
    } else {
      throw new Error('Unknown statement format. Please upload a PNC Bank statement.');
    }
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF statement. Please ensure it is a valid PNC Bank statement.');
  }
}
