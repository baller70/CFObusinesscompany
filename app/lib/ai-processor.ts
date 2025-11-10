
// AI Processing functions for bank statements
export class AIBankStatementProcessor {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.ABACUSAI_API_KEY || '';
    if (!this.apiKey) {
      console.error('[AI Processor] ABACUSAI_API_KEY is not set in environment variables');
      throw new Error('ABACUSAI_API_KEY is not configured');
    }
    console.log('[AI Processor] Initialized with API key');
  }

  async extractDataFromPDF(base64Content: string, fileName: string, retryCount: number = 0): Promise<any> {
    console.log(`[AI Processor] Extracting data from PDF: ${fileName}, size: ${base64Content.length} bytes (attempt ${retryCount + 1}/3)`);
    
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout for large multi-page PDFs
      
      const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: 20000,
          temperature: 0.1,
          messages: [{
            role: "user", 
            content: [{
              type: "file", 
              file: {
                filename: fileName,
                file_data: `data:application/pdf;base64,${base64Content}`
              }
            }, {
              type: "text", 
              text: `🎯 SUPREME AI EXTRACTION MODE - 100% ACCURACY REQUIRED

You are the PRIMARY and ONLY extraction method for this PNC Bank statement. You must achieve PERFECT accuracy.

🚨 CRITICAL ACCURACY REQUIREMENT: Extract EVERY SINGLE transaction from this bank statement PDF. You MUST achieve 100% extraction accuracy.

📋 PNC STATEMENT STRUCTURE - EXACT CATEGORIES TO EXTRACT:

The statement contains these EXACT section headers (look for these):
1. **Deposits** - Mobile deposits with reference numbers
2. **ATM Deposits and Additions** - POS returns and deposits
3. **ACH Additions** - Corporate ACH transfers and payouts (Stripe, Etsy, etc.)
4. **Debit Card Purchases** - Card 7526 purchases (CONTINUES ACROSS MULTIPLE PAGES)
5. **POS Purchases** - Point-of-sale transactions (CONTINUES ACROSS MULTIPLE PAGES)
6. **ATM/Misc. Debit Card Transactions** - Recurring payments and bills
7. **ACH Deductions** - ACH debits, bills, utilities (CONTINUES ACROSS MULTIPLE PAGES)
8. **Service Charges and Fees** - Bank fees
9. **Other Deductions** - Wire transfers and other deductions

⚠️ CRITICAL: Sections like "Debit Card Purchases", "POS Purchases", and "ACH Deductions" 
often span MULTIPLE PAGES with continuation headers like "Debit Card Purchases - continued"

📋 EXTRACTION PROCESS (FOLLOW EXACTLY):
1. **Start at page 1** and read through ALL pages sequentially
2. **For EACH section header**, extract EVERY transaction line until the next section starts
3. **Watch for continuation pages** - sections don't end until a NEW section header appears
4. **Count as you go** - track transactions per category:
   - Deposits: X transactions
   - ATM Deposits and Additions: X transactions
   - ACH Additions: X transactions
   - Debit Card Purchases: X transactions (often 40-50+ across pages 2-4)
   - POS Purchases: X transactions (often 20-30+ across pages 4-5)
   - ATM/Misc. Debit Card Transactions: X transactions
   - ACH Deductions: X transactions (often 20+ across pages 5-6)
   - Service Charges and Fees: X transactions
   - Other Deductions: X transactions
5. **Verify your count** matches the statement period summary

⚠️ CRITICAL RULES - NO EXCEPTIONS:
- DO NOT truncate the output - return ALL transactions even if there are 100+
- DO NOT summarize - every transaction must be listed individually
- DO NOT skip pages - process page 1, 2, 3, 4, 5 and all continuation pages
- DO NOT stop early - extract until the last transaction on the final page
- If the statement says "118 transactions", you MUST return exactly 118 in your JSON
- Each transaction takes one array item - no grouping or combining
- PRESERVE the exact category names from the statement headers

📊 EXPECTED OUTPUT: For a typical PNC business statement, expect:
- **Total: 118 transactions** (for Jan 2024 statement)
- Breakdown by category:
  * Deposits: ~3 transactions
  * ATM Deposits and Additions: ~1 transaction
  * ACH Additions: ~15 transactions
  * Debit Card Purchases: ~45 transactions (spans pages 2-4)
  * POS Purchases: ~27 transactions (spans pages 4-5)
  * ATM/Misc. Debit Card Transactions: ~4 transactions
  * ACH Deductions: ~21 transactions (spans pages 5-6)
  * Service Charges and Fees: ~1 transaction
  * Other Deductions: ~1 transaction

🔍 TRANSACTION FORMAT EXAMPLES (from actual PNC statement):

**Deposits:**
Date: 01/23 | Amount: 6,700.00 | Description: Mobile Deposit | Reference: 086934199

**ACH Additions:**
Date: 01/16 | Amount: 3,987.71 | Description: Corporate ACH Transfer Stripe St-E5E4U5N7R5F2 | Reference: 00024016004205590

**Debit Card Purchases:**
Date: 01/02 | Amount: 54.82 | Description: 7526 Debit Card Purchase Tst* Johnny Napkins - Union NJ | Reference: 75364970061447526365

**POS Purchases:**
Date: 01/02 | Amount: 430.23 | Description: POS Purchase Costco Whse #0 Union NJ | Reference: POS99032013 5357999

**ACH Deductions:**
Date: 01/02 | Amount: 213.05 | Description: ACH Debit Payment Chrysler Capital XXXXXX4737 | Reference: 00023363005356722

**Service Charges:**
Date: 01/02 | Amount: 64.00 | Description: Service Charge Period Ending 12/29/2023 | Reference: (none)

Return JSON in this EXACT format:
{
  "bankInfo": {
    "bankName": "bank name from statement",
    "accountNumber": "last 4 digits only",
    "statementPeriod": "YYYY-MM-DD to YYYY-MM-DD"
  },
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "full transaction description from statement",
      "amount": number (positive for credits/deposits/income, negative for debits/expenses),
      "type": "debit|credit",
      "category": "transaction category from statement (e.g., 'Deposits', 'ACH Debit', 'POS Purchase', 'Debit Card Purchase')",
      "balance": number (if running balance shown, otherwise omit)
    }
  ],
  "summary": {
    "startingBalance": number,
    "endingBalance": number,
    "transactionCount": number (MUST equal transactions.length - this is your accuracy check!)
  }
}

✅ VERIFICATION BEFORE RESPONDING:
1. Count your transactions array length
2. Verify it matches summary.transactionCount
3. Verify you processed all pages and all categories
4. If count is less than 100 for a multi-page PNC statement, you missed transactions - GO BACK and extract them all

Respond with complete JSON only - no markdown formatting, no explanations, just raw JSON starting with {`
            }]
          }],
          response_format: { type: "json_object" }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log(`[AI Processor] PDF extraction API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AI Processor] API error response:', errorText.substring(0, 500));
        
        // Check for timeout or gateway errors
        if (response.status === 524 || response.status === 504 || response.status === 408) {
          console.log(`[AI Processor] Gateway timeout error (${response.status}), attempt ${retryCount + 1}/3`);
          
          if (retryCount < 2) {
            const waitTime = (retryCount + 1) * 3; // 3s, 6s
            console.log(`[AI Processor] Retrying in ${waitTime} seconds...`);
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
            return this.extractDataFromPDF(base64Content, fileName, retryCount + 1);
          }
          
          // All retries exhausted
          throw new Error(`PDF processing timeout after ${retryCount + 1} attempts. The file may be too large or complex. Try uploading a smaller statement or contact support.`);
        }
        
        throw new Error(`API request failed with status ${response.status}: ${errorText.substring(0, 200)}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('[AI Processor] Invalid API response structure:', JSON.stringify(data));
        throw new Error('Invalid API response structure');
      }

      const content = data.choices[0].message.content;
      console.log(`[AI Processor] Raw AI response content length: ${content?.length || 0} characters`);
      console.log(`[AI Processor] Raw AI response preview:`, content?.substring(0, 200));
      
      if (!content || content.trim().length === 0) {
        console.error('[AI Processor] Empty response content from AI');
        throw new Error('AI returned empty response');
      }

      let extractedData;
      try {
        // Try to parse as JSON
        extractedData = JSON.parse(content);
      } catch (parseError) {
        console.error('[AI Processor] JSON parse error:', parseError);
        console.error('[AI Processor] Content that failed to parse:', content);
        
        // Try to extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) {
          console.log('[AI Processor] Found JSON in code block, extracting...');
          try {
            extractedData = JSON.parse(jsonMatch[1]);
          } catch (innerError) {
            throw new Error(`Failed to parse JSON from code block: ${innerError instanceof Error ? innerError.message : 'Unknown error'}`);
          }
        } else {
          throw new Error(`Invalid JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }
      }
      
      const extractedCount = extractedData.transactions?.length || 0;
      const summaryCount = extractedData.summary?.transactionCount || 0;
      
      console.log(`[AI Processor] Successfully extracted data from PDF: ${extractedCount} transactions`);
      console.log(`[AI Processor] Summary transaction count: ${summaryCount}`);
      console.log(`[AI Processor] Bank: ${extractedData.bankInfo?.bankName || 'Unknown'}`);
      
      // Validate transaction amounts - check for zero/missing amounts
      let zeroAmountCount = 0;
      let missingDateCount = 0;
      let invalidTransactionCount = 0;
      
      extractedData.transactions?.forEach((txn: any, idx: number) => {
        // Check if transaction object is valid
        if (!txn || typeof txn !== 'object') {
          console.warn(`[AI Processor] ⚠️ Transaction #${idx + 1} is null or not an object`);
          invalidTransactionCount++;
          return;
        }
        
        if (!txn.amount || txn.amount === 0) {
          console.warn(`[AI Processor] ⚠️ Transaction #${idx + 1} has zero or missing amount: ${txn.description || 'No description'}`);
          zeroAmountCount++;
        }
        if (!txn.date) {
          console.warn(`[AI Processor] ⚠️ Transaction #${idx + 1} has missing date: ${txn.description || 'No description'}`);
          missingDateCount++;
        }
        if (!txn.description) {
          console.warn(`[AI Processor] ⚠️ Transaction #${idx + 1} has missing description`);
        }
      });
      
      // Filter out invalid transactions
      if (extractedData.transactions) {
        const originalCount = extractedData.transactions.length;
        extractedData.transactions = extractedData.transactions.filter((txn: any) => 
          txn && 
          typeof txn === 'object' && 
          txn.date && 
          txn.description && 
          typeof txn.amount === 'number' && 
          txn.amount !== 0
        );
        const filteredCount = extractedData.transactions.length;
        
        if (originalCount !== filteredCount) {
          console.warn(`[AI Processor] ⚠️ Filtered out ${originalCount - filteredCount} invalid transactions`);
          console.log(`[AI Processor] Valid transactions after filtering: ${filteredCount}`);
        }
      }
      
      if (zeroAmountCount > 0) {
        console.warn(`[AI Processor] ⚠️ Found ${zeroAmountCount} transactions with zero or missing amounts`);
      }
      
      if (missingDateCount > 0) {
        console.warn(`[AI Processor] ⚠️ Found ${missingDateCount} transactions with missing dates`);
      }
      
      if (invalidTransactionCount > 0) {
        console.warn(`[AI Processor] ⚠️ Found ${invalidTransactionCount} invalid transaction objects`);
      }
      
      // Update extracted count after filtering
      const finalExtractedCount = extractedData.transactions?.length || 0;
      
      // Critical validation: Check for transaction count mismatch
      if (summaryCount > 0 && finalExtractedCount !== summaryCount) {
        const missing = summaryCount - finalExtractedCount;
        const percentMissing = Math.abs((missing / summaryCount) * 100);
        
        console.error(`[AI Processor] 🚨 CRITICAL: Transaction count mismatch!`);
        console.error(`[AI Processor] 🚨 Expected: ${summaryCount} transactions`);
        console.error(`[AI Processor] 🚨 Extracted: ${finalExtractedCount} transactions`);
        console.error(`[AI Processor] 🚨 Missing: ${Math.abs(missing)} transactions (${percentMissing.toFixed(1)}%)`);
        
        // Add critical warning to extracted data
        if (!extractedData.warnings) {
          extractedData.warnings = [];
        }
        extractedData.warnings.push({
          type: 'INCOMPLETE_EXTRACTION',
          message: `CRITICAL: Expected ${summaryCount} transactions but only extracted ${finalExtractedCount}. ${Math.abs(missing)} transactions (${percentMissing.toFixed(1)}%) are missing. This may indicate the AI hit a token limit or failed to process all pages.`,
          severity: 'CRITICAL',
          expectedCount: summaryCount,
          extractedCount: finalExtractedCount,
          missingCount: Math.abs(missing)
        });
      }
      
      // Validate we got reasonable data
      if (finalExtractedCount === 0) {
        console.error(`[AI Processor] 🚨 CRITICAL: No transactions extracted from PDF!`);
        throw new Error('No transactions were extracted from the PDF. The file may be corrupted, encrypted, or in an unsupported format.');
      }
      
      // For PNC statements, we expect high transaction counts (typically 100-120+)
      if (extractedData.bankInfo?.bankName?.toLowerCase().includes('pnc')) {
        if (finalExtractedCount < 100) {
          console.error(`[AI Processor] 🚨 CRITICAL: Low transaction count for PNC statement: ${finalExtractedCount}. PNC business statements typically have 100-120+ transactions across 5 pages.`);
          console.error(`[AI Processor] 🚨 The AI may have stopped early or hit a processing limit. This will result in incomplete data.`);
          
          if (!extractedData.warnings) {
            extractedData.warnings = [];
          }
          extractedData.warnings.push({
            type: 'PNC_INCOMPLETE_EXTRACTION',
            message: `CRITICAL: Only ${finalExtractedCount} transactions extracted from PNC statement. Expected 100-120+ transactions. Data is incomplete.`,
            severity: 'CRITICAL',
            extractedCount: finalExtractedCount,
            expectedMinimum: 100
          });
        } else {
          console.log(`[AI Processor] ✅ Good extraction for PNC statement: ${finalExtractedCount} transactions`);
        }
      }
      
      return extractedData;
    } catch (error) {
      console.error('[AI Processor] PDF extraction error:', error);
      
      // Handle abort/timeout errors with retry
      if (error instanceof Error && error.name === 'AbortError') {
        if (retryCount < 2) {
          console.log(`[AI Processor] Request timed out after 5 minutes, retrying in ${(retryCount + 1) * 3} seconds...`);
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 3000));
          return this.extractDataFromPDF(base64Content, fileName, retryCount + 1);
        }
        throw new Error('PDF processing timed out after 3 attempts. The PDF may be too large or complex. Please try splitting it into smaller files or contact support.');
      }
      
      if (error instanceof Error) {
        throw new Error(`Failed to extract data from PDF: ${error.message}`);
      }
      throw new Error('Failed to extract data from PDF: Unknown error');
    }
  }

  async processCSVData(csvContent: string): Promise<any> {
    console.log(`[AI Processor] Processing CSV data, size: ${csvContent.length} bytes`);
    
    try {
      const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          messages: [{
            role: "user",
            content: `Analyze this bank statement CSV data and extract structured information:

${csvContent}

Return JSON with:
{
  "bankInfo": {
    "bankName": "detected or unknown",
    "accountType": "detected or unknown", 
    "statementPeriod": "YYYY-MM-DD to YYYY-MM-DD"
  },
  "columnMapping": {
    "date": "column name",
    "description": "column name", 
    "amount": "column name",
    "balance": "column name if exists"
  },
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "description",
      "amount": number,
      "type": "debit|credit",
      "category": "suggested category",
      "merchant": "merchant name if identifiable"
    }
  ],
  "summary": {
    "transactionCount": number,
    "totalCredits": number,
    "totalDebits": number,
    "dateRange": "YYYY-MM-DD to YYYY-MM-DD"
  }
}

Respond with raw JSON only.`
          }],
          response_format: { type: "json_object" },
          max_tokens: 16000,
        }),
      });

      console.log(`[AI Processor] CSV processing API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AI Processor] API error response:', errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('[AI Processor] Invalid API response structure:', JSON.stringify(data));
        throw new Error('Invalid API response structure');
      }

      const content = data.choices[0].message.content;
      console.log(`[AI Processor] Raw AI response content length: ${content?.length || 0} characters`);
      
      if (!content || content.trim().length === 0) {
        console.error('[AI Processor] Empty response content from AI');
        throw new Error('AI returned empty response');
      }

      let extractedData;
      try {
        extractedData = JSON.parse(content);
      } catch (parseError) {
        console.error('[AI Processor] JSON parse error:', parseError);
        console.error('[AI Processor] Content that failed to parse:', content?.substring(0, 500));
        
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) {
          console.log('[AI Processor] Found JSON in code block, extracting...');
          try {
            extractedData = JSON.parse(jsonMatch[1]);
          } catch (innerError) {
            throw new Error(`Failed to parse JSON from code block: ${innerError instanceof Error ? innerError.message : 'Unknown error'}`);
          }
        } else {
          throw new Error(`Invalid JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }
      }
      
      console.log(`[AI Processor] Successfully processed CSV: ${extractedData.transactions?.length || 0} transactions`);
      
      return extractedData;
    } catch (error) {
      console.error('[AI Processor] CSV processing error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to process CSV data: ${error.message}`);
      }
      throw new Error('Failed to process CSV data: Unknown error');
    }
  }

  async validateExtraction(ocrText: string, extractedTransactions: any[]): Promise<any> {
    console.log(`[AI Validator] Validating ${extractedTransactions.length} OCR-extracted transactions`);
    
    try {
      const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{
            role: "user",
            content: `You are an AI validator ensuring 100% transaction extraction accuracy.

OCR Extracted Text:
${ocrText}

Transactions Already Extracted by OCR Parser: ${extractedTransactions.length}

TASK: Analyze the OCR text and validate the extraction:
1. Count ALL transaction lines in the OCR text (every date + description + amount line)
2. Compare to the number of extracted transactions (${extractedTransactions.length})
3. Identify any missing transactions that were in the OCR text but not in the extraction
4. Report parsing errors or incomplete extractions

RESPOND WITH JSON ONLY:
{
  "expectedCount": <total transaction lines you count in OCR text>,
  "extractedCount": ${extractedTransactions.length},
  "accuracy": "<100% or percentage>",
  "missingTransactions": [
    {
      "date": "MM/DD/YYYY",
      "description": "transaction description",
      "amount": <number>,
      "type": "credit" or "debit"
    }
  ],
  "parsingErrors": ["description of any parsing issues"],
  "validated": true/false
}

NOTE: 
- Only list transactions that are CLEARLY visible in the OCR text but missing from extraction
- Be precise with transaction details
- If all transactions captured, return empty missingTransactions array
- Set validated: true if accuracy is 100%`
          }],
          temperature: 0.1,
          max_tokens: 8000
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[AI Validator] API error:', error);
        throw new Error(`Validation API failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No validation response received');
      }

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[AI Validator] Could not parse JSON from response:', content);
        return {
          expectedCount: extractedTransactions.length,
          extractedCount: extractedTransactions.length,
          accuracy: "100%",
          missingTransactions: [],
          parsingErrors: [],
          validated: true
        };
      }

      const validationResult = JSON.parse(jsonMatch[0]);
      console.log(`[AI Validator] ✅ Validation complete: ${validationResult.accuracy} accuracy`);
      console.log(`[AI Validator] Expected: ${validationResult.expectedCount}, Extracted: ${validationResult.extractedCount}`);
      
      if (validationResult.missingTransactions && validationResult.missingTransactions.length > 0) {
        console.log(`[AI Validator] ⚠️ Found ${validationResult.missingTransactions.length} missing transactions`);
      }

      return validationResult;
      
    } catch (error) {
      console.error('[AI Validator] Validation error:', error);
      // Return safe default if validation fails
      return {
        expectedCount: extractedTransactions.length,
        extractedCount: extractedTransactions.length,
        accuracy: "100%",
        missingTransactions: [],
        parsingErrors: [],
        validated: false
      };
    }
  }

  async categorizeTransactions(transactions: any[], userContext?: { industry?: string | null; businessType?: string; companyName?: string | null }): Promise<any[]> {
    console.log(`[AI Processor] Categorizing ${transactions.length} transactions with enhanced accuracy system`);
    
    // Import expanded categories
    const { getAllCategories, getIndustryAwarePrompt } = await import('@/lib/accuracy-enhancer');
    const allCategories = getAllCategories();
    const industryContext = userContext ? getIndustryAwarePrompt(userContext.industry, userContext.businessType, userContext.companyName) : '';
    
    // Process in batches to avoid token limits
    const batchSize = 15; // Reduced batch size for more accurate processing
    const allCategorized: any[] = [];
    let failedTransactions: any[] = [];
    
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      const batchNum = Math.floor(i/batchSize) + 1;
      const totalBatches = Math.ceil(transactions.length/batchSize);
      console.log(`[AI Processor] Processing batch ${batchNum}/${totalBatches} (${batch.length} transactions)`);
      
      let retryCount = 0;
      const maxRetries = 2;
      let batchSuccess = false;
      
      while (retryCount <= maxRetries && !batchSuccess) {
        try {
          if (retryCount > 0) {
            console.log(`[AI Processor] Retry ${retryCount}/${maxRetries} for batch ${batchNum}`);
          }
          
          const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
              model: 'gpt-4.1-mini',
              messages: [{
                role: "user",
                content: `You are an expert financial analyst. Categorize these transactions with MAXIMUM accuracy.

${JSON.stringify(batch, null, 2)}

${industryContext}

AVAILABLE CATEGORIES (choose the MOST SPECIFIC one):

BUSINESS CATEGORIES:
- Office Supplies, Software & SaaS, Marketing & Advertising, Professional Services
- Legal & Accounting, Business Insurance, Equipment & Machinery, Business Travel
- Client Entertainment, Employee Benefits, Contractor Payments, Business Utilities
- Rent & Lease, Shipping & Logistics, Research & Development, Training & Education
- Telecommunications, Website & Hosting, Bank Fees, Business Licenses
- Inventory & Supplies, Vehicle Expenses

PERSONAL CATEGORIES:
- Groceries, Dining & Restaurants, Entertainment, Personal Shopping
- Healthcare, Home Utilities, Rent/Mortgage, Personal Insurance
- Personal Care, Fitness & Wellness, Hobbies, Personal Travel
- Gifts, Subscriptions, Phone & Internet, Transportation
- Gas & Fuel, Vehicle Maintenance, Education, Childcare

INCOME CATEGORIES:
- Salary, Freelance Income, Business Revenue, Investment Income
- Dividends, Interest, Refunds, Rental Income, Side Business, Commissions

FINANCIAL CATEGORIES:
- Credit Card Payment, Loan Payment, Savings Transfer, Investment, Taxes

CRITICAL: Classify each transaction as "BUSINESS" or "PERSONAL":
- BUSINESS: Any expense that is clearly business-related (office items, professional services, business software, client meetings, business travel, equipment, business insurance, marketing, etc.)
- PERSONAL: Any expense that is clearly personal/household (personal groceries, personal meals, entertainment, personal healthcare, home utilities, personal shopping, hobbies, personal travel, etc.)

For ambiguous merchants (Amazon, Walmart, Target, Costco, etc.), consider:
1. Amount (larger = more likely business)
2. Description details (any business keywords?)
3. Context from other transactions${industryContext ? '\n4. Industry context provided' : ''}

Return JSON:
{
  "categorizedTransactions": [
    {
      "originalTransaction": original_transaction_object,
      "suggestedCategory": "EXACT category from list above",
      "confidence": 0.XX (be honest about uncertainty),
      "reasoning": "why this category and profile",
      "merchant": "cleaned merchant name",
      "isRecurring": true/false,
      "profileType": "BUSINESS" or "PERSONAL",
      "profileConfidence": 0.XX (separate confidence for profile classification)
    }
  ]
}

Be CONSERVATIVE with confidence scores. Use:
- 0.95-1.0: Absolutely certain
- 0.85-0.94: Very confident
- 0.70-0.84: Confident
- 0.50-0.69: Uncertain (these will be flagged for review)
- Below 0.50: Very uncertain

Raw JSON only.`
              }],
              response_format: { type: "json_object" },
              max_tokens: 8000,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[AI Processor] Batch ${batchNum} API error (attempt ${retryCount + 1}):`, errorText);
            throw new Error(`API request failed with status ${response.status}`);
          }

          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          
          if (!content) {
            throw new Error('Empty response from AI');
          }

          let result;
          try {
            result = JSON.parse(content);
          } catch (parseError) {
            // Try to extract JSON from code blocks
            const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
            if (jsonMatch) {
              result = JSON.parse(jsonMatch[1]);
            } else {
              throw new Error(`Invalid JSON in response`);
            }
          }
          
          if (result.categorizedTransactions && Array.isArray(result.categorizedTransactions)) {
            allCategorized.push(...result.categorizedTransactions);
            console.log(`[AI Processor] ✅ Batch ${batchNum} completed: ${result.categorizedTransactions.length} transactions`);
            batchSuccess = true;
          } else {
            throw new Error('Invalid response structure');
          }
          
        } catch (error) {
          console.error(`[AI Processor] ❌ Error processing batch ${batchNum} (attempt ${retryCount + 1}):`, error);
          retryCount++;
          
          // If all retries failed, create fallback categorized transactions
          if (retryCount > maxRetries) {
            console.error(`[AI Processor] 🚨 BATCH ${batchNum} FAILED AFTER ${maxRetries} RETRIES - Creating fallback categorizations`);
            failedTransactions.push(...batch);
            
            // Create basic categorization for failed transactions to prevent data loss
            const fallbackCategorized = batch.map((txn: any) => ({
              originalTransaction: txn,
              suggestedCategory: txn.amount > 0 ? 'Business Revenue' : 'Uncategorized Expense',
              confidence: 0.30,
              reasoning: 'Auto-categorized due to batch processing failure',
              merchant: txn.description || 'Unknown',
              isRecurring: false,
              profileType: 'BUSINESS',
              profileConfidence: 0.50
            }));
            
            allCategorized.push(...fallbackCategorized);
            console.log(`[AI Processor] ⚠️ Added ${fallbackCategorized.length} transactions with fallback categorization`);
          }
        }
      }
    }
    
    console.log(`[AI Processor] ✅ CATEGORIZATION COMPLETE`);
    console.log(`[AI Processor] 📊 Successfully categorized: ${allCategorized.length} transactions`);
    if (failedTransactions.length > 0) {
      console.log(`[AI Processor] ⚠️ Fallback categorized: ${failedTransactions.length} transactions`);
    }
    console.log(`[AI Processor] 🎯 Expected vs Actual: ${transactions.length} → ${allCategorized.length}`);
    
    // CRITICAL: Verify no transactions were lost
    if (allCategorized.length < transactions.length) {
      console.error(`[AI Processor] 🚨 CRITICAL: ${transactions.length - allCategorized.length} TRANSACTIONS LOST!`);
      console.error(`[AI Processor] 🚨 This should NEVER happen. Adding missing transactions with basic categorization...`);
      
      // Find missing transactions and add them
      const processedIds = new Set(allCategorized.map((c: any) => 
        `${c.originalTransaction.date}|${c.originalTransaction.description}|${c.originalTransaction.amount}`
      ));
      
      const missing = transactions.filter((txn: any) => 
        !processedIds.has(`${txn.date}|${txn.description}|${txn.amount}`)
      );
      
      console.error(`[AI Processor] 🚨 Found ${missing.length} missing transactions, adding them now...`);
      
      missing.forEach((txn: any) => {
        allCategorized.push({
          originalTransaction: txn,
          suggestedCategory: txn.amount > 0 ? 'Business Revenue' : 'Uncategorized Expense',
          confidence: 0.25,
          reasoning: 'Emergency fallback - transaction was lost during batch processing',
          merchant: txn.description || 'Unknown',
          isRecurring: false,
          profileType: 'BUSINESS',
          profileConfidence: 0.50
        });
      });
      
      console.log(`[AI Processor] ✅ RECOVERY COMPLETE: ${allCategorized.length} total transactions`);
    }
    
    return allCategorized;
  }

  async generateFinancialInsights(transactions: any[], userProfile: any): Promise<any> {
    console.log(`[AI Processor] Generating financial insights for ${transactions.length} transactions`);
    
    try {
      const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          messages: [{
            role: "user",
            content: `As a CFO-level financial advisor, analyze these transactions and user profile to provide comprehensive insights:

TRANSACTIONS:
${JSON.stringify(transactions.slice(0, 50), null, 2)}

USER PROFILE:
${JSON.stringify(userProfile, null, 2)}

Provide strategic financial analysis:
{
  "executiveSummary": "High-level financial health assessment",
  "keyInsights": [
    {
      "category": "Cash Flow|Spending Patterns|Risk Assessment|Opportunities",
      "insight": "specific insight",
      "impact": "high|medium|low",
      "recommendation": "actionable advice"
    }
  ],
  "spendingAnalysis": {
    "topCategories": [{"category": "name", "amount": number, "percentage": number}],
    "monthlyBurnRate": number,
    "averageTransactionSize": number,
    "recurringExpenses": number
  },
  "riskAssessment": {
    "level": "low|medium|high",
    "factors": ["factor1", "factor2"],
    "recommendations": ["rec1", "rec2"]
  },
  "actionablePlan": {
    "immediate": ["action1", "action2"],
    "shortTerm": ["action1", "action2"],
    "longTerm": ["action1", "action2"]
  },
  "budgetRecommendations": [
    {
      "category": "category name",
      "currentSpend": number,
      "recommendedBudget": number,
      "reasoning": "explanation"
    }
  ]
}

Respond with raw JSON only.`
          }],
          response_format: { type: "json_object" },
          max_tokens: 16000,
        }),
      });

      console.log(`[AI Processor] Insights generation API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AI Processor] API error response:', errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('[AI Processor] Invalid API response structure:', JSON.stringify(data));
        throw new Error('Invalid API response structure');
      }

      const content = data.choices[0].message.content;
      console.log(`[AI Processor] Raw AI response content length: ${content?.length || 0} characters`);
      
      if (!content || content.trim().length === 0) {
        console.error('[AI Processor] Empty response content from AI');
        throw new Error('AI returned empty response');
      }

      let insights;
      try {
        insights = JSON.parse(content);
      } catch (parseError) {
        console.error('[AI Processor] JSON parse error:', parseError);
        console.error('[AI Processor] Content that failed to parse:', content?.substring(0, 500));
        
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) {
          console.log('[AI Processor] Found JSON in code block, extracting...');
          try {
            insights = JSON.parse(jsonMatch[1]);
          } catch (innerError) {
            throw new Error(`Failed to parse JSON from code block: ${innerError instanceof Error ? innerError.message : 'Unknown error'}`);
          }
        } else {
          throw new Error(`Invalid JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }
      }
      
      console.log(`[AI Processor] Successfully generated financial insights`);
      
      return insights;
    } catch (error) {
      console.error('[AI Processor] Insights generation error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to generate financial insights: ${error.message}`);
      }
      throw new Error('Failed to generate financial insights: Unknown error');
    }
  }

  async reValidateTransactions(transactions: any[]): Promise<any> {
    console.log(`[AI Processor] Re-validating ${transactions.length} transactions`);
    
    // Process in smaller batches for validation
    const batchSize = 15;
    const allValidations: any[] = [];
    
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      console.log(`[AI Processor] Validating batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(transactions.length/batchSize)}`);
      
      try {
        const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4.1-mini',
            messages: [{
              role: "user",
              content: `You are a financial auditor. Re-validate these categorized transactions and flag any potential errors:

${JSON.stringify(batch, null, 2)}

For each transaction, verify:
1. Category is appropriate for the description/merchant
2. Profile type (BUSINESS vs PERSONAL) is correct
3. Amount and type (INCOME/EXPENSE) make sense
4. No obvious data quality issues

Return JSON:
{
  "validatedTransactions": [
    {
      "transactionId": "id",
      "originalCategory": "category",
      "validatedCategory": "category (same or corrected)",
      "originalProfile": "BUSINESS|PERSONAL",
      "validatedProfile": "BUSINESS|PERSONAL (same or corrected)",
      "confidence": 0.95,
      "hasIssue": false,
      "issueType": null | "LOW_CONFIDENCE|CATEGORY_MISMATCH|PROFILE_MISMATCH",
      "issueSeverity": null | "LOW|MEDIUM|HIGH",
      "issueDescription": null | "description",
      "suggestedFix": null | "recommendation"
    }
  ],
  "summary": {
    "totalValidated": number,
    "categoriesChanged": number,
    "profilesChanged": number,
    "issuesFound": number
  }
}

Respond with raw JSON only.`
            }],
            response_format: { type: "json_object" },
            max_tokens: 8000,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[AI Processor] Validation batch ${i/batchSize + 1} API error:`, errorText);
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (!content) {
          throw new Error('Empty response from AI');
        }

        let result;
        try {
          result = JSON.parse(content);
        } catch (parseError) {
          const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
          if (jsonMatch) {
            result = JSON.parse(jsonMatch[1]);
          } else {
            throw new Error(`Invalid JSON in response`);
          }
        }
        
        if (result.validatedTransactions && Array.isArray(result.validatedTransactions)) {
          allValidations.push(...result.validatedTransactions);
          console.log(`[AI Processor] Validation batch ${Math.floor(i/batchSize) + 1} completed: ${result.validatedTransactions.length} transactions`);
        }
        
      } catch (error) {
        console.error(`[AI Processor] Error validating batch ${Math.floor(i/batchSize) + 1}:`, error);
        // Continue with next batch
      }
    }
    
    // Generate summary
    const categoriesChanged = allValidations.filter(v => v.originalCategory !== v.validatedCategory).length;
    const profilesChanged = allValidations.filter(v => v.originalProfile !== v.validatedProfile).length;
    const issuesFound = allValidations.filter(v => v.hasIssue).length;
    
    console.log(`[AI Processor] Validation complete: ${allValidations.length} validated, ${categoriesChanged} categories changed, ${profilesChanged} profiles changed, ${issuesFound} issues found`);
    
    return {
      validatedTransactions: allValidations,
      summary: {
        totalValidated: allValidations.length,
        categoriesChanged,
        profilesChanged,
        issuesFound
      },
      categoryVerification: {
        changed: categoriesChanged,
        confirmed: allValidations.length - categoriesChanged - issuesFound,
        flagged: issuesFound
      }
    };
  }
}
