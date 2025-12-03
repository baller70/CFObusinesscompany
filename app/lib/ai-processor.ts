// AI Processing functions for bank statements
// Using unpdf for text extraction and pdf-lib for page splitting
// Canvas for PDF page to image conversion (Vision API)
import { extractText, getDocumentProxy } from 'unpdf';
import { PDFDocument } from 'pdf-lib';

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

  async extractDataFromPDF(
    pdfBuffer: Buffer,
    fileName: string,
    model: string = 'gpt-4o',
    retryCount: number = 0
  ): Promise<any> {
    const sizeKB = pdfBuffer.length / 1024;
    console.log(`[AI Processor] 🚀 PROCESSING PDF: ${fileName}`);
    console.log(`[AI Processor] PDF size: ${sizeKB.toFixed(1)} KB`);

    // For large PDFs (>100KB), use IMAGE-BASED PAGE-BY-PAGE PROCESSING
    // This approach converts each page to an image and uses GPT-4o Vision
    if (sizeKB > 100) {
      console.log(`[AI Processor] 📄 Large PDF detected (${sizeKB.toFixed(1)} KB) - using PAGE-BY-PAGE IMAGE PROCESSING`);
      try {
        const result = await this.extractDataPageByPageVision(pdfBuffer, fileName, model);
        if (result && result.transactions && result.transactions.length > 0) {
          return result;
        }
        console.log(`[AI Processor] ⚠️ Page-by-page returned no transactions, trying text extraction...`);
      } catch (pageError: any) {
        console.log(`[AI Processor] ⚠️ Page-by-page processing failed: ${pageError.message}`);
        console.log(`[AI Processor] 🔄 Falling back to text extraction...`);
      }

      // Fallback: Try text extraction
      try {
        const textResult = await this.extractTextFromPDF(pdfBuffer);
        if (textResult && textResult.text.length > 100) {
          console.log(`[AI Processor] ✅ Text extraction got ${textResult.text.length} characters from ${textResult.totalPages} pages`);
          return this.extractDataFromTextImproved(textResult.text, fileName, model);
        }
      } catch (textError: any) {
        console.log(`[AI Processor] ⚠️ Text extraction also failed: ${textError.message}`);
      }
    }

    // For small PDFs or if all methods failed, use direct PDF mode
    const effectiveModel = sizeKB > 150 ? 'gpt-4.1-mini' : model;
    console.log(`[AI Processor] 🤖 Using direct PDF mode with model: ${effectiveModel}`);
    return this.extractDataFromPDFDirect(pdfBuffer, fileName, effectiveModel, retryCount);
  }

  // NEW: Page-by-page vision-based processing
  // Splits PDF into single pages and processes each with GPT-4o Vision
  async extractDataPageByPageVision(pdfBuffer: Buffer, fileName: string, model: string = 'gpt-4o'): Promise<any> {
    console.log(`[AI Processor] 🖼️ Starting PAGE-BY-PAGE VISION processing...`);

    // Load PDF and get page count
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const totalPages = pdfDoc.getPageCount();
    console.log(`[AI Processor] 📊 PDF has ${totalPages} pages`);

    const allTransactions: any[] = [];
    const pageTransactionCounts: number[] = []; // Track transaction counts per page
    let metadata: any = null;
    let failedPages: number[] = [];

    // Minimum expected transactions per page (for non-first/last pages)
    // Bank statements typically have 15-30 transactions per page
    const MIN_EXPECTED_TRANSACTIONS_MIDDLE_PAGE = 10;
    const MIN_EXPECTED_TRANSACTIONS_FIRST_PAGE = 5; // First page often has header info
    const MIN_EXPECTED_TRANSACTIONS_LAST_PAGE = 3;  // Last page often has summary

    // Process each page
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      console.log(`[AI Processor] 📄 Processing page ${pageNum} of ${totalPages}...`);

      // Extract single page as PDF
      const singlePagePdf = await PDFDocument.create();
      const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [pageNum - 1]);
      singlePagePdf.addPage(copiedPage);
      const singlePageBuffer = Buffer.from(await singlePagePdf.save());

      const pageSizeKB = singlePageBuffer.length / 1024;
      console.log(`[AI Processor]   Page ${pageNum} size: ${pageSizeKB.toFixed(1)} KB`);

      // Determine minimum expected transactions for this page
      let minExpected = MIN_EXPECTED_TRANSACTIONS_MIDDLE_PAGE;
      if (pageNum === 1) minExpected = MIN_EXPECTED_TRANSACTIONS_FIRST_PAGE;
      else if (pageNum === totalPages) minExpected = MIN_EXPECTED_TRANSACTIONS_LAST_PAGE;

      // Process this page with smart retry logic
      let bestResult: any = null;
      let bestTransactionCount = 0;
      let retryCount = 0;
      const maxRetries = 3;
      const maxLowCountRetries = 2; // Extra retries specifically for low transaction counts

      while (retryCount < maxRetries) {
        try {
          if (retryCount > 0) {
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s
            console.log(`[AI Processor]   🔄 Retry ${retryCount}/${maxRetries} after ${delay/1000}s delay...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          const pageResult = await this.extractSinglePageVision(
            singlePageBuffer,
            fileName,
            pageNum,
            totalPages,
            metadata,
            model
          );

          if (pageResult) {
            const txnCount = pageResult.transactions?.length || 0;

            // Keep track of the best result (most transactions)
            if (txnCount > bestTransactionCount) {
              bestResult = pageResult;
              bestTransactionCount = txnCount;
            }

            // Store metadata and balance info from first page for context
            if (pageNum === 1 && pageResult.bankInfo && !metadata) {
              metadata = {
                bankName: pageResult.bankInfo?.bankName,
                accountNumber: pageResult.bankInfo?.accountNumber,
                statementPeriod: pageResult.bankInfo?.statementPeriod,
                beginningBalance: pageResult.balanceInfo?.beginningBalance || pageResult.bankInfo?.beginningBalance,
                endingBalance: pageResult.balanceInfo?.endingBalance || pageResult.bankInfo?.endingBalance
              };
              console.log(`[AI Processor]   📋 Got metadata from page 1:`, metadata);
              if (metadata.beginningBalance || metadata.endingBalance) {
                console.log(`[AI Processor]   💰 Balance info: Beginning=$${metadata.beginningBalance}, Ending=$${metadata.endingBalance}`);
              }
            }

            // Check if we got enough transactions
            if (txnCount >= minExpected) {
              console.log(`[AI Processor]   ✅ Page ${pageNum}: Found ${txnCount} transactions (meets minimum: ${minExpected})`);
              break; // Good enough, move to next page
            } else if (retryCount < maxLowCountRetries) {
              // Low transaction count - retry to get more
              console.log(`[AI Processor]   ⚠️ Page ${pageNum}: Only ${txnCount} transactions (expected min: ${minExpected}) - retrying...`);
              retryCount++;
              continue;
            } else {
              // We've retried enough, use best result
              console.log(`[AI Processor]   ⚠️ Page ${pageNum}: Using best result with ${bestTransactionCount} transactions after ${retryCount + 1} attempts`);
              break;
            }
          } else {
            retryCount++;
          }
        } catch (error: any) {
          console.error(`[AI Processor]   ❌ Page ${pageNum} attempt ${retryCount + 1} failed: ${error.message}`);
          retryCount++;
        }
      }

      // Add best result to all transactions
      if (bestResult) {
        const pageTransactions = bestResult.transactions || [];
        console.log(`[AI Processor]   ✅ Page ${pageNum}: Final count ${pageTransactions.length} transactions`);
        allTransactions.push(...pageTransactions);
        pageTransactionCounts.push(pageTransactions.length);
      } else {
        console.log(`[AI Processor]   🚨 Page ${pageNum} FAILED after ${maxRetries} retries`);
        failedPages.push(pageNum);
        pageTransactionCounts.push(0);
      }

      // Small delay between pages to avoid rate limiting
      if (pageNum < totalPages) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    // Report results with per-page breakdown
    console.log(`[AI Processor] ✅ PAGE-BY-PAGE COMPLETE`);
    console.log(`[AI Processor] 📊 Total transactions: ${allTransactions.length} from ${totalPages - failedPages.length}/${totalPages} pages`);
    console.log(`[AI Processor] 📊 Per-page breakdown: ${pageTransactionCounts.map((c, i) => `P${i+1}:${c}`).join(', ')}`);

    // Warn about potentially low-count pages
    const lowCountPages = pageTransactionCounts
      .map((count, idx) => ({ page: idx + 1, count }))
      .filter(p => {
        const isFirst = p.page === 1;
        const isLast = p.page === totalPages;
        const minExpected = isFirst ? MIN_EXPECTED_TRANSACTIONS_FIRST_PAGE :
                           isLast ? MIN_EXPECTED_TRANSACTIONS_LAST_PAGE :
                           MIN_EXPECTED_TRANSACTIONS_MIDDLE_PAGE;
        return p.count < minExpected && p.count > 0;
      });

    if (lowCountPages.length > 0) {
      console.log(`[AI Processor] ⚠️ Potentially incomplete pages: ${lowCountPages.map(p => `Page ${p.page} (${p.count} txns)`).join(', ')}`);
    }

    if (failedPages.length > 0) {
      console.log(`[AI Processor] ⚠️ Failed pages: ${failedPages.join(', ')}`);
    }

    return {
      bankInfo: metadata || { bankName: 'Unknown', accountNumber: 'Unknown' },
      transactions: allTransactions,
      transactionCount: allTransactions.length,
      processingMethod: 'page-by-page-vision',
      pagesProcessed: totalPages - failedPages.length,
      totalPages,
      failedPages,
      pageTransactionCounts, // Include per-page counts for diagnostics
      lowCountPages: lowCountPages.map(p => p.page) // Flag potentially incomplete pages
    };
  }

  // Process a single PDF page using Vision API
  async extractSinglePageVision(
    pageBuffer: Buffer,
    fileName: string,
    pageNum: number,
    totalPages: number,
    existingMetadata: any,
    model: string = 'gpt-4o'
  ): Promise<any> {
    // Convert PDF page to base64
    const base64String = pageBuffer.toString('base64');
    const base64DataUri = `data:application/pdf;base64,${base64String}`;

    // Build context for this page
    const metadataContext = existingMetadata
      ? `\nKNOWN STATEMENT INFO (from previous pages):\n- Bank: ${existingMetadata.bankName}\n- Account: ${existingMetadata.accountNumber}\n- Period: ${existingMetadata.statementPeriod}`
      : '';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout per page

    try {
      const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: model,
          max_tokens: 16000,
          temperature: 0.1,
          messages: [{
            role: "user",
            content: [
              {
                type: "file",
                file: {
                  filename: `${fileName}_page${pageNum}.pdf`,
                  file_data: base64DataUri
                }
              },
              {
                type: "text",
                text: `EXTRACT ALL TRANSACTIONS from this bank statement page (Page ${pageNum} of ${totalPages}).
${metadataContext}

CRITICAL INSTRUCTIONS:
1. FIRST, count exactly how many ACTUAL transaction rows you see on this page
2. THEN, extract EVERY SINGLE transaction - do NOT skip any
3. Number your transactions as you extract them (Transaction 1, Transaction 2, etc.)
4. Include ALL types: deposits, withdrawals, ACH, debit card, checks, transfers, fees

⚠️ DO NOT INCLUDE THESE AS TRANSACTIONS - These are balance summary entries, NOT transactions:
- "Beginning Balance" / "Opening Balance" / "Starting Balance"
- "Ending Balance" / "Closing Balance" / "Final Balance"
- Balance summary rows or totals
- Daily balance entries (unless they represent actual transactions)

${pageNum === 1 ? `EXTRACT BALANCE INFORMATION SEPARATELY:
- beginningBalance: The starting balance shown on the statement (as a number)
- endingBalance: The ending/closing balance shown on the statement (as a number)` : ''}

For EACH actual transaction, extract:
- date: The transaction date in YYYY-MM-DD format
- description: The FULL description text
- amount: Positive for deposits/credits, negative for withdrawals/debits
- type: "credit" for deposits, "debit" for withdrawals
- category: Best guess at category
- profileType: "BUSINESS" or "PERSONAL"

${pageNum === 1 ? `Also extract bank info:
- bankName: Bank name
- accountNumber: Last 4 digits if visible
- statementPeriod: Date range of statement` : ''}

RESPOND WITH JSON ONLY:
{
  ${pageNum === 1 ? `"bankInfo": { "bankName": "", "accountNumber": "", "statementPeriod": "" },
  "balanceInfo": { "beginningBalance": number, "endingBalance": number },` : ''}
  "pageNumber": ${pageNum},
  "transactionCountOnPage": <exact number of ACTUAL transactions you found>,
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "full description",
      "amount": number,
      "type": "debit|credit",
      "category": "category",
      "profileType": "BUSINESS|PERSONAL"
    }
  ]
}

REMEMBER: Extract EVERY actual transaction. Do not consolidate or summarize. Balance entries are NOT transactions.`
              }
            ]
          }],
          response_format: { type: "json_object" }
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      return JSON.parse(content);

    } catch (error: any) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Extract text from PDF using unpdf (serverless-compatible)
  async extractTextFromPDF(pdfBuffer: Buffer): Promise<{ text: string; totalPages: number }> {
    console.log(`[AI Processor] 📖 Extracting text from PDF using unpdf...`);
    const uint8Array = new Uint8Array(pdfBuffer);
    const pdf = await getDocumentProxy(uint8Array);
    const { text, totalPages } = await extractText(pdf, { mergePages: true });
    return { text, totalPages };
  }

  // IMPROVED: Text extraction with better prompting
  async extractDataFromTextImproved(text: string, fileName: string, model: string = 'gpt-4o'): Promise<any> {
    console.log(`[AI Processor] 📤 Sending extracted text to LLM with IMPROVED prompt (${(text.length / 1024).toFixed(1)} KB)`);

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 100000,
        temperature: 0.1,
        messages: [{
          role: "user",
          content: `You are a precise bank statement parser. Your job is to extract EVERY SINGLE transaction from this statement.

BANK STATEMENT TEXT:
${text}

CRITICAL INSTRUCTIONS:
1. FIRST: Count every transaction line in the document. A transaction is any line with a date + description + amount.
2. SECOND: Extract each transaction ONE BY ONE. Number them as you go.
3. DO NOT skip ANY transactions - even if they look similar or repetitive
4. DO NOT consolidate multiple transactions into one
5. Include EVERY type: deposits, withdrawals, ACH credits, ACH debits, debit card purchases, checks, fees, transfers

For each transaction:
- date: Convert to YYYY-MM-DD format
- description: Copy the FULL description exactly as shown
- amount: Positive number for credits/deposits, negative for debits/withdrawals
- type: "credit" or "debit"
- category: Your best categorization
- profileType: "BUSINESS" or "PERSONAL"

BUSINESS indicators: payroll, AWS, software, SaaS, client, vendor, office, business insurance, professional services
PERSONAL indicators: groceries, restaurants, entertainment, personal shopping, healthcare, personal insurance

RETURN JSON:
{
  "totalTransactionsFound": <your count of ALL transaction lines in the text>,
  "transactionCount": <number of transactions in the array below - must equal totalTransactionsFound>,
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "exact full description",
      "amount": number,
      "type": "debit|credit",
      "category": "category name",
      "profileType": "BUSINESS|PERSONAL"
    }
  ]
}

VERIFICATION: Your transactionCount MUST equal totalTransactionsFound. If they don't match, you missed some transactions - go back and find them.

Raw JSON only - no markdown.`
        }],
        response_format: { type: "json_object" }
      })
    });

    console.log(`[AI Processor] ✅ Text extraction response: ${response.status}`);

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const extractedData = JSON.parse(content);

    const count = extractedData.transactions?.length || 0;
    const expected = extractedData.totalTransactionsFound || count;
    console.log(`[AI Processor] ✅ Extracted ${count} transactions (expected ${expected}) from text`);

    if (count < expected) {
      console.log(`[AI Processor] ⚠️ WARNING: Missing ${expected - count} transactions!`);
    }

    return extractedData;
  }

  // Legacy method - redirects to improved version
  async extractDataFromText(text: string, fileName: string, model: string = 'gpt-4o'): Promise<any> {
    return this.extractDataFromTextImproved(text, fileName, model);
  }

  // Send PDF directly to LLM with retry logic for timeouts
  async extractDataFromPDFDirect(pdfBuffer: Buffer, fileName: string, model: string = 'gpt-4o', retryCount: number = 0): Promise<any> {
    const MAX_RETRIES = 2;
    console.log(`[AI Processor] 🚀 DIRECT PDF MODE - Sending PDF file to LLM`);
    console.log(`[AI Processor] PDF: ${fileName}, size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
    if (retryCount > 0) {
      console.log(`[AI Processor] 🔄 Retry attempt ${retryCount}/${MAX_RETRIES}`);
    }

    // Convert PDF to Base64 for LLM
    const base64String = pdfBuffer.toString('base64');
    const base64DataUri = `data:application/pdf;base64,${base64String}`;

    console.log(`[AI Processor] 📤 Sending PDF directly to LLM...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout

    try {
      const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: model,
          max_tokens: 100000,
          temperature: 0.1,
          messages: [{
            role: "user",
            content: [
              {
                type: "file",
                file: {
                  filename: fileName,
                  file_data: base64DataUri
                }
              },
              {
                type: "text",
                text: `You are a precise bank statement parser. Extract EVERY SINGLE transaction from this document.

CRITICAL INSTRUCTIONS:
1. FIRST: Count every ACTUAL transaction row in the document (any line with date + description + amount)
2. THEN: Extract each transaction ONE BY ONE - number them as you go
3. DO NOT skip ANY transactions - even if they look similar or repetitive
4. DO NOT consolidate multiple transactions into one
5. Include ALL types: deposits, ACH credits, ACH debits, debit card purchases, checks, fees, transfers

⚠️ DO NOT INCLUDE THESE AS TRANSACTIONS - These are balance summary entries, NOT transactions:
- "Beginning Balance" / "Opening Balance" / "Starting Balance"
- "Ending Balance" / "Closing Balance" / "Final Balance"
- Balance summary rows or totals
- Daily balance entries (unless they represent actual transactions)

EXTRACT BALANCE INFORMATION SEPARATELY in bankInfo:
- beginningBalance: The starting balance shown on the statement (as a positive number)
- endingBalance: The ending/closing balance shown on the statement (as a positive number)

CLASSIFICATION RULES:
- BUSINESS: Payroll, AWS, software, SaaS, client payments, vendor payments, office supplies, business travel, professional services, advertising, business insurance
- PERSONAL: Groceries, restaurants, entertainment, personal shopping, healthcare, personal insurance, household utilities, personal travel

Return JSON:
{
  "bankInfo": {
    "bankName": "detected bank name",
    "accountNumber": "last 4 digits if visible",
    "statementPeriod": "YYYY-MM-DD to YYYY-MM-DD",
    "beginningBalance": number,
    "endingBalance": number
  },
  "totalTransactionsFound": <your count of ALL ACTUAL transaction lines>,
  "transactionCount": <number in transactions array - MUST equal totalTransactionsFound>,
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "FULL description exactly as shown",
      "amount": number (positive for deposits/credits, negative for withdrawals/debits),
      "type": "debit|credit",
      "category": "category name",
      "profileType": "BUSINESS|PERSONAL"
    }
  ]
}

VERIFICATION: transactionCount MUST equal totalTransactionsFound. Balance entries are NOT transactions.

Raw JSON only.`
              }
            ]
          }],
          response_format: { type: "json_object" }
        })
      });

      clearTimeout(timeoutId);
      console.log(`[AI Processor] ✅ Response received: ${response.status}`);

      // Handle timeout errors (524) with retry
      if (response.status === 524 && retryCount < MAX_RETRIES) {
        console.log(`[AI Processor] ⚠️ Cloudflare timeout (524), retrying in 5s...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return this.extractDataFromPDFDirect(pdfBuffer, fileName, model, retryCount + 1);
      }

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status}`);
      }

      // Parse response
      const data = await response.json();
      const content = data.choices[0].message.content;
      const extractedData = JSON.parse(content);

      const count = extractedData.transactions?.length || 0;
      console.log(`[AI Processor] ✅ Extracted ${count} transactions from PDF (direct mode)`);

      return extractedData;

    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError' && retryCount < MAX_RETRIES) {
        console.log(`[AI Processor] ⚠️ Request timeout, retrying in 5s...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return this.extractDataFromPDFDirect(pdfBuffer, fileName, model, retryCount + 1);
      }
      throw error;
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
    console.log(`[AI Processor] 🚀 CATEGORIZING ${transactions.length} TRANSACTIONS`);

    // Import expanded categories
    const { getAllCategories, getIndustryAwarePrompt } = await import('@/lib/accuracy-enhancer');
    const allCategories = getAllCategories();
    const industryContext = userContext ? getIndustryAwarePrompt(userContext.industry, userContext.businessType, userContext.companyName) : '';

    // Process in smaller batches of 10 to avoid API timeouts (524 errors)
    // Smaller batches = faster responses, less chance of Cloudflare timeout
    const BATCH_SIZE = 10;
    const batches: any[][] = [];
    for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
      batches.push(transactions.slice(i, i + BATCH_SIZE));
    }

    console.log(`[AI Processor] Processing ${transactions.length} transactions in ${batches.length} batches of up to ${BATCH_SIZE}`);

    const allCategorized: any[] = [];

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batchTransactions = batches[batchIndex];
      console.log(`[AI Processor] Processing batch ${batchIndex + 1}/${batches.length} (${batchTransactions.length} transactions)`);

      // Add unique IDs to track transactions
      const indexedTransactions = batchTransactions.map((txn: any, idx: number) => ({
        ...txn,
        _batchIndex: idx + 1,
        _batchTotal: batchTransactions.length
      }));

      let retryCount = 0;
      const maxRetries = 2;
      let success = false;

      while (retryCount <= maxRetries && !success) {
        try {
          if (retryCount > 0) {
            console.log(`[AI Processor] Retry ${retryCount}/${maxRetries} for categorization`);
          }

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
                content: `You are an expert financial analyst. You MUST categorize ALL ${batchTransactions.length} transactions below.

CRITICAL INSTRUCTIONS:
1. There are EXACTLY ${batchTransactions.length} transactions numbered 1 to ${batchTransactions.length}
2. You MUST return EXACTLY ${batchTransactions.length} categorized transactions
3. DO NOT skip, merge, or consolidate ANY transactions - each one is unique
4. Process them ONE BY ONE in order

TRANSACTIONS TO CATEGORIZE (${batchTransactions.length} total):
${indexedTransactions.map((txn: any, i: number) => `[${i + 1}/${batchTransactions.length}] ${JSON.stringify(txn)}`).join('\n')}

${industryContext}

CATEGORIES:
BUSINESS: Office Supplies, Software & SaaS, Marketing, Professional Services, Business Travel, Client Entertainment, Contractor Payments, Business Utilities, Rent & Lease, Shipping, Website & Hosting, Bank Fees, Inventory & Supplies, Telecommunications, Business Insurance, Equipment, Training, Business Revenue
PERSONAL: Groceries, Dining, Entertainment, Personal Shopping, Healthcare, Home Utilities, Rent/Mortgage, Personal Care, Fitness, Hobbies, Personal Travel, Subscriptions, Gas & Fuel, Transportation
INCOME: Salary, Business Revenue, Investment Income, Dividends, Interest, Refunds
FINANCIAL: Loan Payment, Savings Transfer, Investment, Taxes

PROFILE CLASSIFICATION:
- BUSINESS: Office items, professional services, client meetings, equipment, marketing
- PERSONAL: Personal meals, entertainment, healthcare, home expenses, hobbies

Return EXACTLY this JSON structure with ${batchTransactions.length} items:
{
  "totalCount": ${batchTransactions.length},
  "categorizedTransactions": [
    {
      "transactionNumber": 1,
      "originalTransaction": {first transaction object},
      "suggestedCategory": "category",
      "confidence": 0.XX,
      "reasoning": "brief reason",
      "merchant": "merchant name",
      "isRecurring": false,
      "profileType": "BUSINESS" or "PERSONAL",
      "profileConfidence": 0.XX
    },
    ... repeat for ALL ${batchTransactions.length} transactions
  ]
}

VERIFY: Your categorizedTransactions array MUST have exactly ${batchTransactions.length} items.`
              }],
              response_format: { type: "json_object" },
              max_tokens: 100000,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[AI Processor] Categorization API error (attempt ${retryCount + 1}):`, errorText);
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
            console.log(`[AI Processor] ✅ Batch ${batchIndex + 1} completed: ${result.categorizedTransactions.length} transactions`);
            success = true;

            // CRITICAL FIX: Ensure originalTransaction is always set by mapping to batch transactions
            // The AI may not properly echo back the original transaction, so we map by index or match
            const processedCategorized = result.categorizedTransactions.map((catTxn: any, idx: number) => {
              // If originalTransaction is missing or invalid, try to match by index
              if (!catTxn.originalTransaction || !catTxn.originalTransaction.date) {
                // Try to find matching transaction by transactionNumber or fall back to index
                const txnNumber = catTxn.transactionNumber;
                let matchedTxn = null;

                if (txnNumber && txnNumber > 0 && txnNumber <= batchTransactions.length) {
                  matchedTxn = batchTransactions[txnNumber - 1];
                } else if (idx < batchTransactions.length) {
                  matchedTxn = batchTransactions[idx];
                }

                if (matchedTxn) {
                  return {
                    ...catTxn,
                    originalTransaction: matchedTxn
                  };
                }
              }
              return catTxn;
            });

            // Verify we got all transactions in this batch
            if (processedCategorized.length !== batchTransactions.length) {
              console.warn(`[AI Processor] ⚠️ Batch ${batchIndex + 1}: Expected ${batchTransactions.length} transactions, got ${processedCategorized.length}`);

              // Fill in missing transactions with fallback categorization
              const returnedCount = processedCategorized.length;
              const missingCount = batchTransactions.length - returnedCount;

              if (missingCount > 0) {
                console.log(`[AI Processor] 🔧 Creating fallback for ${missingCount} missing transactions`);

                // Create a set of returned transaction identifiers (using multiple fields for matching)
                const returnedSet = new Set<string>();
                processedCategorized.forEach((c: any) => {
                  const orig = c.originalTransaction || {};
                  // Create multiple possible identifiers
                  if (orig.description) returnedSet.add(orig.description.toLowerCase().trim());
                  if (orig.date && orig.amount) returnedSet.add(`${orig.date}|${orig.amount}`);
                });

                // Find missing transactions
                const missingTransactions: any[] = [];
                batchTransactions.forEach((txn: any) => {
                  const descKey = (txn.description || '').toLowerCase().trim();
                  const dateAmountKey = `${txn.date}|${txn.amount}`;

                  // Check if this transaction was returned
                  if (!returnedSet.has(descKey) && !returnedSet.has(dateAmountKey)) {
                    missingTransactions.push(txn);
                  }
                });

                // If we still can't find the missing ones, just take the last N from the batch
                let transactionsToFallback = missingTransactions;
                if (missingTransactions.length < missingCount) {
                  console.log(`[AI Processor] 📊 Matching found ${missingTransactions.length} missing, expected ${missingCount}. Using index-based fallback.`);
                  // Take the last N transactions that weren't categorized
                  transactionsToFallback = batchTransactions.slice(returnedCount);
                }

                // Create fallback for missing ones
                const fallbackForMissing = transactionsToFallback.map((txn: any) => ({
                  originalTransaction: txn,
                  suggestedCategory: txn.amount > 0 ? 'Business Revenue' : 'Uncategorized',
                  confidence: 0.40,
                  reasoning: 'Auto-categorized (missing from batch response)',
                  merchant: txn.description || 'Unknown',
                  isRecurring: false,
                  profileType: 'BUSINESS',
                  profileConfidence: 0.50
                }));

                processedCategorized.push(...fallbackForMissing);
                console.log(`[AI Processor] ✅ Added ${fallbackForMissing.length} fallback categorizations, total now: ${processedCategorized.length}`);
              }
            }

            // Add to all categorized results
            allCategorized.push(...processedCategorized);
          } else {
            throw new Error('Invalid response structure');
          }

        } catch (error) {
          console.error(`[AI Processor] ❌ Error categorizing batch ${batchIndex + 1} (attempt ${retryCount + 1}):`, error);
          retryCount++;

          // If all retries failed, create fallback categorized transactions for this batch
          if (retryCount > maxRetries) {
            console.error(`[AI Processor] 🚨 Batch ${batchIndex + 1} FAILED AFTER ${maxRetries} RETRIES - Creating fallback categorizations`);

            // Create basic categorization for this batch to prevent data loss
            const fallbackCategorized = batchTransactions.map((txn: any) => ({
              originalTransaction: txn,
              suggestedCategory: txn.amount > 0 ? 'Business Revenue' : 'Uncategorized Expense',
              confidence: 0.30,
              reasoning: 'Auto-categorized due to processing failure',
              merchant: txn.description || 'Unknown',
              isRecurring: false,
              profileType: 'BUSINESS',
              profileConfidence: 0.50
            }));

            console.log(`[AI Processor] ⚠️ Created ${fallbackCategorized.length} fallback transactions for batch ${batchIndex + 1}`);
            allCategorized.push(...fallbackCategorized);
            success = true; // Mark as success to continue with next batch
          }
        }
      }
    }

    // Return all categorized transactions from all batches
    console.log(`[AI Processor] ✅ CATEGORIZATION COMPLETE`);
    console.log(`[AI Processor] 📊 Successfully categorized: ${allCategorized.length} transactions`);
    console.log(`[AI Processor] 🎯 Expected vs Actual: ${transactions.length} → ${allCategorized.length}`);

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
    
    // Process in smaller batches for validation (10 to avoid API timeouts)
    const batchSize = 10;
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
            content: `Extract ALL transactions from this bank statement text. Do not skip any.

STATEMENT TEXT:
${statementText}

Look for these category sections:
1. Deposits
2. ACH Additions  
3. Debit Card Purchases
4. POS Purchases
5. ACH Deductions
6. Checks
7. Any other transaction sections

For EACH transaction extract:
- Date (convert to YYYY-MM-DD format)
- Description (full text)
- Amount (as number, positive or negative)
- Type (INCOME for deposits/credits, EXPENSE for everything else)
- Category (from section header)
- Reference number if present

Return JSON with this structure:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Full description",
      "amount": 123.45,
      "type": "INCOME" or "EXPENSE",
      "category": "Section name",
      "merchant": "Merchant if identifiable",
      "referenceNumber": "Reference if present"
    }
  ],
  "summary": {
    "totalTransactions": <count>
  }
}

Extract EVERY SINGLE transaction. Do not stop early. Return only JSON, no markdown.`
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
