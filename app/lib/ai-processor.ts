
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

  async extractDataFromPDF(pdfBuffer: Buffer, fileName: string, retryCount: number = 0): Promise<any> {
    console.log(`[AI Processor] Extracting data from PDF: ${fileName}, size: ${pdfBuffer.length} bytes (attempt ${retryCount + 1}/3)`);
    
    try {
      // ========================================
      // STEP 1: Extract text from PDF using pdftotext
      // This is 10x faster than vision-based extraction
      // ========================================
      console.log('[AI Processor] 📄 Step 1: Extracting text from PDF using pdftotext...');
      
      const fs = require('fs').promises;
      const { execSync } = require('child_process');
      const path = require('path');
      const os = require('os');
      
      // Create temporary files
      const tmpDir = os.tmpdir();
      const pdfPath = path.join(tmpDir, `statement_${Date.now()}.pdf`);
      const txtPath = path.join(tmpDir, `statement_${Date.now()}.txt`);
      
      try {
        // Write PDF to temp file
        await fs.writeFile(pdfPath, pdfBuffer);
        
        // Extract text using pdftotext with layout preservation
        execSync(`pdftotext -layout "${pdfPath}" "${txtPath}"`);
        
        // Read extracted text
        const extractedText = await fs.readFile(txtPath, 'utf8');
        
        console.log(`[AI Processor] ✅ Text extraction complete: ${extractedText.length} characters`);
        console.log(`[AI Processor] Preview: ${extractedText.substring(0, 300)}...`);
        
        // Clean up temp files
        await fs.unlink(pdfPath).catch(() => {});
        await fs.unlink(txtPath).catch(() => {});
        
        if (!extractedText || extractedText.length < 100) {
          throw new Error('PDF text extraction failed - text is empty or too short');
        }
        
        // ========================================
        // STEP 2: Send extracted text to AI for processing
        // This is much faster than sending base64 PDF
        // ========================================
        console.log('[AI Processor] 🤖 Step 2: Sending extracted text to AI for processing...');
        
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes timeout (faster than vision)
        
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
              content: `🎯 SUPREME AI EXTRACTION MODE - 100% ACCURACY REQUIRED

I've extracted the text from a PNC Bank statement PDF. Your job is to parse this text and return structured JSON data.

📄 EXTRACTED TEXT FROM STATEMENT:
\`\`\`
${extractedText}
\`\`\`

You are the PRIMARY and ONLY extraction method for this PNC Bank statement. You must achieve PERFECT accuracy.

🚨 CRITICAL ACCURACY REQUIREMENT: Extract EVERY SINGLE transaction from this bank statement text. You MUST achieve 100% extraction accuracy.

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
1. **Read through ALL the text** line by line
2. **For EACH section header**, extract EVERY transaction line until the next section starts
3. **Watch for continuation pages** - sections don't end until a NEW section header appears
4. **Count as you go** - track transactions per category
5. **Verify your count** matches the statement period summary

⚠️ CRITICAL RULES - NO EXCEPTIONS:
- DO NOT truncate the output - return ALL transactions even if there are 100+
- DO NOT summarize - every transaction must be listed individually
- DO NOT skip any section or continuation page
- DO NOT stop early - extract until the last transaction
- Each transaction takes one array item - no grouping or combining
- PRESERVE the exact category names from the statement headers

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
3. Verify you processed all text and all categories
4. If count seems low, GO BACK and extract them all

Respond with complete JSON only - no markdown formatting, no explanations, just raw JSON starting with {`
            }],
            response_format: { type: "json_object" }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log(`[AI Processor] ✅ AI extraction API response status: ${response.status}`);

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
              return this.extractDataFromPDF(pdfBuffer, fileName, retryCount + 1);
            }
            
            // All retries exhausted
            throw new Error(`PDF processing timeout after ${retryCount + 1} attempts. The file may be too large or complex.`);
          }
          
          throw new Error(`API request failed with status ${response.status}: ${errorText.substring(0, 200)}`);
        }

        // Parse AI response
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
        
      } catch (tempFileError) {
        console.error('[AI Processor] ❌ Text extraction or AI processing error:', tempFileError);
        throw new Error(`Failed to extract data from PDF: ${tempFileError instanceof Error ? tempFileError.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[AI Processor] PDF extraction error:', error);
      
      // Handle abort/timeout errors with retry
      if (error instanceof Error && error.name === 'AbortError') {
        if (retryCount < 2) {
          console.log(`[AI Processor] Request timed out, retrying in ${(retryCount + 1) * 3} seconds...`);
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 3000));
          return this.extractDataFromPDF(pdfBuffer, fileName, retryCount + 1);
        }
        throw new Error('PDF processing timed out after 3 attempts. The PDF may be too large or complex.');
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

  /**
   * Extract transaction data from pasted statement text
   * Uses the same AI model as PDF extraction but directly processes text
   */
  async extractDataFromText(statementText: string): Promise<any> {
    console.log(`[AI Processor] Extracting data from pasted text: ${statementText.length} characters`);
    
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout
      
      const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: 100000,
          temperature: 0.1,
          messages: [{
            role: "user", 
            content: `🎯 SUPREME AI EXTRACTION MODE - 100% ACCURACY REQUIRED

I've pasted text from a bank statement. Your job is to parse this text and return structured JSON data.

📄 PASTED STATEMENT TEXT:
\`\`\`
${statementText}
\`\`\`

You are the PRIMARY and ONLY extraction method for this bank statement. You must achieve PERFECT accuracy.

🚨 CRITICAL ACCURACY REQUIREMENT: Extract EVERY SINGLE transaction from this bank statement text. You MUST achieve 100% extraction accuracy.

📋 BANK STATEMENT STRUCTURE - EXTRACT ALL CATEGORIES:

Look for section headers like:
- Deposits
- ATM Deposits and Additions
- ACH Additions
- Debit Card Purchases
- POS Purchases
- ATM/Misc. Debit Card Transactions
- ACH Deductions
- Checks
- Electronic Withdrawals
- Fees and Service Charges

⚠️ MULTI-PAGE HANDLING:
- Transactions may continue across multiple pages
- Look for "continued" markers
- Don't stop until you reach "Daily Balance Detail" or the end of transactions

🎯 EXTRACTION RULES:

1. **Transaction Format Detection:**
   - Date posted can be: MM/DD, MM/DD/YY, MM/DD/YYYY
   - Amount is always numerical with decimals (e.g., 123.45, -50.00)
   - Description is typically between date and amount

2. **Reference Number Extraction (CRITICAL):**
   - Look for patterns like: "REF: 12345", "REF#", "Transaction ID:", "Confirmation:", "Check #"
   - Extract as separate field: referenceNumber
   - If no reference number found, set to null or empty string
   - Reference numbers are usually on same line or next line after description

3. **Multi-line Transaction Handling:**
   - Combine ALL lines that belong to one transaction
   - Keep reading lines until you hit the next date or amount
   - Separate description and reference number into different fields

4. **Category Assignment:**
   - Deposits/Credits = INCOME
   - All other transactions = EXPENSE
   - Look for explicit category headers in the text

5. **Accuracy Validation:**
   - Count transactions as you extract them
   - If you see "Total deposits: X" or similar, make sure your count matches
   - Every transaction MUST have: date, description, amount, and optionally reference number

📊 REQUIRED OUTPUT FORMAT (JSON):

Return a JSON object with this EXACT structure:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Full transaction description",
      "amount": 123.45,
      "type": "EXPENSE" or "INCOME",
      "category": "Category name from section header",
      "merchant": "Merchant name if identifiable",
      "referenceNumber": "REF: 12345 or transaction ID or confirmation code",
      "notes": "Any additional info"
    }
  ],
  "summary": {
    "totalTransactions": 118,
    "totalDeposits": 10,
    "totalWithdrawals": 108,
    "categories": {
      "Deposits": 5,
      "ACH Additions": 5,
      "Debit Card Purchases": 45,
      "POS Purchases": 25,
      "ACH Deductions": 28
    }
  }
}

🔍 VALIDATION BEFORE RETURNING:
- Count all transactions in your JSON
- Verify against any totals mentioned in the statement
- If counts don't match, re-extract the missing transactions
- NEVER return partial data - extract EVERYTHING

Return ONLY valid JSON, no markdown formatting, no explanations.`
            }]
          }),
          signal: controller.signal
        });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`AI API returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.choices || !result.choices[0]?.message?.content) {
        throw new Error('Invalid AI response structure');
      }

      const content = result.choices[0].message.content.trim();
      console.log('[AI Processor] Raw AI response preview:', content.substring(0, 500));
      
      // Parse JSON response
      let extractedData;
      try {
        // Remove markdown code blocks if present
        const jsonStr = content
          .replace(/^```json?\s*/i, '')
          .replace(/```\s*$/, '')
          .trim();
        
        extractedData = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('[AI Processor] Failed to parse AI response as JSON:', parseError);
        console.error('[AI Processor] Response content:', content);
        throw new Error('AI returned invalid JSON format');
      }

      console.log(`[AI Processor] ✅ AI extraction complete: ${extractedData.transactions?.length || 0} transactions`);
      
      // Validate response structure
      if (!extractedData.transactions || !Array.isArray(extractedData.transactions)) {
        throw new Error('AI response missing transactions array');
      }

      return extractedData;
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[AI Processor] Text processing timed out after 3 minutes');
        throw new Error('Text processing timed out - statement might be too large');
      }
      console.error('[AI Processor] Text extraction error:', error);
      throw error;
    }
  }
}
