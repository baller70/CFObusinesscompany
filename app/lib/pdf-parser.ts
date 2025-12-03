
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
// Enhanced with comprehensive merchant rules for PNC Business Checking Plus statements
function categorizeMerchant(description: string): string {
  const desc = description.toLowerCase();

  // ========================================
  // INCOME CATEGORIES (Credits/Deposits)
  // ========================================

  // Payment processors & business income
  if (desc.includes('stripe') || desc.includes('corporate ach transfer stripe')) {
    return 'Business Revenue';
  }
  if (desc.includes('etsy') || desc.includes('ach payout etsy')) {
    return 'Business Revenue';
  }
  if (desc.includes('paypal') || desc.includes('venmo') || desc.includes('square')) {
    return 'Business Revenue';
  }
  if (desc.includes('mobile deposit')) {
    return 'Deposits';
  }
  if (desc.includes('ach credit') || desc.includes('ach addition') || desc.includes('corporate ach')) {
    return 'Business Revenue';
  }
  if (desc.includes('pos return') || desc.includes('refund') || desc.includes('credit memo')) {
    return 'Returns & Refunds';
  }

  // ========================================
  // FOOD & DINING
  // ========================================

  // Quick service & fast food
  if (desc.includes('jersey mike') || desc.includes('jersey mikes')) {
    return 'Food & Dining';
  }
  if (desc.includes('chick-fil-a') || desc.includes('chick fil a') || desc.includes('chickfila')) {
    return 'Food & Dining';
  }
  if (desc.includes('johnny napkins') || desc.includes('tst* johnny')) {
    return 'Food & Dining';
  }
  if (desc.includes('manhattan bagel')) {
    return 'Food & Dining';
  }
  if (desc.includes('dunkin') || desc.includes('starbucks') || desc.includes('coffee')) {
    return 'Food & Dining';
  }
  if (desc.includes('mcdonald') || desc.includes('wendy') || desc.includes('burger king') ||
      desc.includes('taco bell') || desc.includes('chipotle') || desc.includes('panera')) {
    return 'Food & Dining';
  }
  if (desc.includes('restaurant') || desc.includes('cafe') || desc.includes('diner') ||
      desc.includes('pizza') || desc.includes('sushi') || desc.includes('grill')) {
    return 'Food & Dining';
  }
  if (desc.includes('mazzella') || desc.includes('gourmet')) {
    return 'Food & Dining';
  }
  if (desc.includes('perrotts quality meat') || desc.includes('quality meat')) {
    return 'Groceries';
  }

  // ========================================
  // RETAIL & SHOPPING
  // ========================================

  // Warehouse & big box stores
  if (desc.includes('costco') && !desc.includes('gas')) {
    return 'Shopping';
  }
  if (desc.includes('target') && !desc.includes('gas')) {
    return 'Shopping';
  }
  if (desc.includes('walmart') || desc.includes('wal-mart')) {
    return 'Shopping';
  }
  if (desc.includes('home depot')) {
    return 'Home Improvement';
  }
  if (desc.includes('homegoods') || desc.includes('home goods')) {
    return 'Shopping';
  }
  if (desc.includes('hobby lobby') || desc.includes('hobby-lobby')) {
    return 'Shopping';
  }
  if (desc.includes('dicks sporting') || desc.includes('dick\'s sporting')) {
    return 'Sporting Goods';
  }

  // Grocery stores
  if (desc.includes('acme') || desc.includes('shoprite') || desc.includes('stop & shop') ||
      desc.includes('aldi') || desc.includes('wegmans') || desc.includes('whole foods') ||
      desc.includes('trader joe') || desc.includes('publix') || desc.includes('kroger')) {
    return 'Groceries';
  }
  if (desc.includes('petsmart') || desc.includes('petco') || desc.includes('pet supplies')) {
    return 'Pets';
  }

  // Discount & dollar stores
  if (desc.includes('dollartree') || desc.includes('dollar tree') || desc.includes('dollar general') ||
      desc.includes('five below') || desc.includes('99 cent')) {
    return 'Shopping';
  }

  // Beverages & liquor
  if (desc.includes('total wine') || desc.includes('wine depot') || desc.includes('liquor')) {
    return 'Shopping';
  }

  // ========================================
  // ONLINE SHOPPING
  // ========================================

  if (desc.includes('amazon') || desc.includes('amzn') || desc.includes('amazon prime')) {
    return 'Online Shopping';
  }
  if (desc.includes('ebay') || desc.includes('wish.com') || desc.includes('aliexpress')) {
    return 'Online Shopping';
  }

  // ========================================
  // APPAREL & CLOTHING
  // ========================================

  if (desc.includes('suspenders') || desc.includes('ludus.com') || desc.includes('ludus ')) {
    return 'Apparel & Clothing';
  }
  if (desc.includes('pose cuts') || desc.includes('pose cuts llp')) {
    return 'Personal Care';
  }
  if (desc.includes('clothing') || desc.includes('apparel') || desc.includes('fashion')) {
    return 'Apparel & Clothing';
  }

  // ========================================
  // FUEL & GAS
  // ========================================

  if (desc.includes('us gas') || desc.includes('us gas union')) {
    return 'Fuel & Gas';
  }
  if (desc.includes('shell') || desc.includes('exxon') || desc.includes('mobil') ||
      desc.includes('bp ') || desc.includes('chevron') || desc.includes('sunoco') ||
      desc.includes('wawa') || desc.includes('speedway') || desc.includes('gas station')) {
    return 'Fuel & Gas';
  }
  if (desc.includes('costco gas')) {
    return 'Fuel & Gas';
  }

  // ========================================
  // AUTO & TRANSPORT
  // ========================================

  if (desc.includes('kenilworth car wash') || desc.includes('car wash')) {
    return 'Auto & Transport';
  }
  if (desc.includes('lyft') || desc.includes('uber') && !desc.includes('uber eats')) {
    return 'Auto & Transport';
  }
  if (desc.includes('autozone') || desc.includes('advance auto') || desc.includes('napa auto') ||
      desc.includes('jiffy lube') || desc.includes('mavis') || desc.includes('tire')) {
    return 'Auto & Transport';
  }
  if (desc.includes('parking') || desc.includes('toll') || desc.includes('ez pass')) {
    return 'Auto & Transport';
  }

  // ========================================
  // SPORTS & RECREATION
  // ========================================

  if (desc.includes('union little league') || desc.includes('little league') ||
      desc.includes('ymca') || desc.includes('sports') || desc.includes('gym') ||
      desc.includes('fitness') || desc.includes('planet fitness')) {
    return 'Sports & Recreation';
  }

  // ========================================
  // BUSINESS EXPENSES
  // ========================================

  if (desc.includes('unioncountyfc') || desc.includes('union county')) {
    return 'Business Expenses';
  }
  if (desc.includes('sba loan') || desc.includes('loan payment')) {
    return 'Loan Payment';
  }
  if (desc.includes('office') || desc.includes('staples') || desc.includes('office depot')) {
    return 'Office Supplies';
  }

  // ========================================
  // UTILITIES & BILLS
  // ========================================

  if (desc.includes('american water') || desc.includes('elizabethtown ga') || desc.includes('pseg') ||
      desc.includes('firstenergy') || desc.includes('electric') || desc.includes('water') ||
      desc.includes('utility') || desc.includes('gas bill') || desc.includes('internet service')) {
    return 'Utilities';
  }
  if (desc.includes('town of westfield') || desc.includes('town of ') || desc.includes('township')) {
    return 'Taxes & Fees';
  }

  // ========================================
  // PHONE & COMMUNICATIONS
  // ========================================

  if (desc.includes('tmobile') || desc.includes('t-mobile') || desc.includes('verizon') ||
      desc.includes('at&t') || desc.includes('att ') || desc.includes('sprint') ||
      desc.includes('phone') || desc.includes('wireless')) {
    return 'Phone & Internet';
  }
  if (desc.includes('optimum') || desc.includes('comcast') || desc.includes('xfinity') ||
      desc.includes('cable') || desc.includes('spectrum') || desc.includes('fios')) {
    return 'Cable & Internet';
  }

  // ========================================
  // ENTERTAINMENT & SUBSCRIPTIONS
  // ========================================

  if (desc.includes('disney') || desc.includes('netflix') || desc.includes('hulu') ||
      desc.includes('spotify') || desc.includes('youtube') || desc.includes('hbo') ||
      desc.includes('paramount') || desc.includes('apple tv') || desc.includes('peacock')) {
    return 'Entertainment';
  }
  if (desc.includes('apple.com') || desc.includes('google one') || desc.includes('software') ||
      desc.includes('subscription') || desc.includes('membership')) {
    return 'Subscriptions';
  }

  // ========================================
  // HOUSING & MORTGAGE
  // ========================================

  if (desc.includes('mortgage') || desc.includes('rent') || desc.includes('pnc pymt') ||
      desc.includes('housing') || desc.includes('hoa') || desc.includes('condo')) {
    return 'Housing';
  }

  // ========================================
  // HEALTHCARE
  // ========================================

  if (desc.includes('cvs') || desc.includes('walgreens') || desc.includes('pharmacy') ||
      desc.includes('doctor') || desc.includes('medical') || desc.includes('health') ||
      desc.includes('dental') || desc.includes('vision') || desc.includes('hospital')) {
    return 'Healthcare';
  }

  // ========================================
  // TAXES & GOVERNMENT
  // ========================================

  if (desc.includes('irs') || desc.includes('tax') || desc.includes('treasury') ||
      desc.includes('dmv') || desc.includes('license') || desc.includes('state of')) {
    return 'Taxes';
  }

  // ========================================
  // BANK FEES & CHARGES
  // ========================================

  if (desc.includes('service charge') || desc.includes('fee') || desc.includes('maintenance') ||
      desc.includes('overdraft') || desc.includes('nsf') || desc.includes('wire fee')) {
    return 'Bank Fees';
  }

  // ========================================
  // TRANSFERS & PAYMENTS
  // ========================================

  if (desc.includes('credit card pmt') || desc.includes('online credit card') ||
      desc.includes('card payment') || desc.includes('bill pay')) {
    return 'Credit Card Payment';
  }
  if (desc.includes('zelle') || desc.includes('wire transfer') || desc.includes('ach deduction')) {
    return 'Transfers';
  }
  if (desc.includes('check #') || desc.includes('check number') || /check\s*\d+/.test(desc)) {
    return 'Checks';
  }

  // ========================================
  // EDUCATION
  // ========================================

  if (desc.includes('school') || desc.includes('education') || desc.includes('university') ||
      desc.includes('college') || desc.includes('tuition')) {
    return 'Education';
  }

  // ========================================
  // INSURANCE
  // ========================================

  if (desc.includes('insurance') || desc.includes('geico') || desc.includes('progressive') ||
      desc.includes('state farm') || desc.includes('allstate')) {
    return 'Insurance';
  }

  // ========================================
  // DEBIT CARD PURCHASES (Generic)
  // ========================================

  if (desc.includes('7526 debit card') || desc.includes('debit card purchase')) {
    return 'Debit Card Purchase';
  }
  if (desc.includes('pos purchase')) {
    return 'POS Purchase';
  }
  if (desc.includes('atm withdrawal') || desc.includes('atm ')) {
    return 'ATM Withdrawal';
  }

  // Default
  return 'Uncategorized';
}

// Parse date in format MM/DD
function parseStatementDate(dateStr: string, year: number): string {
  const [month, day] = dateStr.split('/').map(num => num.padStart(2, '0'));
  return `${year}-${month}-${day}`;
}

// Extract account number from statement (supports multiple formats)
function extractAccountNumber(text: string): string {
  // Try to extract FULL account number format: 80-6434-4474
  const fullMatch = text.match(/(?:Primary\s+)?Account\s+Number:\s*(\d{2}-\d{4}-\d{4})/i);
  if (fullMatch) {
    return fullMatch[1];
  }

  // Try alternate full format without dashes: 8064344474
  const noHyphensMatch = text.match(/(?:Primary\s+)?Account\s+Number:\s*(\d{10})/i);
  if (noHyphensMatch) {
    const num = noHyphensMatch[1];
    return `${num.slice(0, 2)}-${num.slice(2, 6)}-${num.slice(6)}`;
  }

  // Try masked format with last 4 digits: XX-XXXX-4474
  const maskedMatch = text.match(/Account\s+Number:\s*XX-XXXX-(\d{4})/i);
  if (maskedMatch) {
    return `****${maskedMatch[1]}`;
  }

  // Try to find any account number pattern in the text
  const anyMatch = text.match(/\b(\d{2}-\d{4}-\d{4})\b/);
  if (anyMatch) {
    return anyMatch[1];
  }

  return 'Unknown';
}

// Extract business name from PNC Business statement
function extractBusinessName(text: string): string {
  // Try to find business name after account number line
  // Format: "THE HOUSE OF SPORTS CORP" appears after account info
  const businessNamePatterns = [
    // Pattern 1: Business name on its own line after account info
    /Account\s+Number:.*?\n([A-Z][A-Z\s&,.']+(?:LLC|INC|CORP|CO|LTD|LP|LLP)?)\s*\n/i,
    // Pattern 2: Business name before address
    /([A-Z][A-Z\s&,.']+(?:LLC|INC|CORP|CO|LTD|LP|LLP)?)\s*\n\s*\d+\s+[A-Z]/i,
    // Pattern 3: Look for common business suffixes
    /\b([A-Z][A-Z\s&,.']+(?:LLC|INC|CORP|CORPORATION|COMPANY|CO|LTD|LP|LLP))\b/i,
    // Pattern 4: "THE HOUSE OF SPORTS CORP" specific pattern
    /\b(THE\s+HOUSE\s+OF\s+SPORTS\s+CORP)\b/i,
  ];

  for (const pattern of businessNamePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Clean up the business name
      const name = match[1].trim().replace(/\s+/g, ' ');
      // Skip if it's just a generic word
      if (name.length > 5 && !['BUSINESS', 'CHECKING', 'ACCOUNT', 'STATEMENT'].includes(name.toUpperCase())) {
        return name;
      }
    }
  }

  return 'Unknown Business';
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
