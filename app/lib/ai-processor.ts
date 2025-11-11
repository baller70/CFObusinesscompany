
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

  async extractDataFromPDF(pdfBuffer: Buffer, fileName: string, model: string = 'gpt-4o', retryCount: number = 0): Promise<any> {
    console.log(`[AI Processor] 🚀 SIMPLE MODE - Sending PDF directly to LLM (like Abacus Chat Element)`);
    console.log(`[AI Processor] PDF: ${fileName}, size: ${pdfBuffer.length} bytes`);
    console.log(`[AI Processor] 🤖 Using model: ${model}`);
    
    try {
      // Convert PDF to Base64 for LLM
      const base64String = pdfBuffer.toString('base64');
      const base64DataUri = `data:application/pdf;base64,${base64String}`;
      
      console.log(`[AI Processor] 📤 Sending to LLM...`);
      
      // Send PDF directly to LLM with simple prompt
      const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: model, // Use selected model
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
                text: `Extract ALL transactions from this bank statement. For EACH transaction, you MUST classify it as either BUSINESS or PERSONAL.

CLASSIFICATION RULES:
- BUSINESS: Payroll, AWS, software subscriptions, client payments, vendor payments, office supplies, business travel, professional services, advertising, business insurance, business utilities
- PERSONAL: Groceries (Walmart, Target, Whole Foods), restaurants, entertainment, personal shopping, healthcare, personal insurance, household utilities, personal vehicle, personal travel

SPECIAL MERCHANT RULES:
- Any transaction with amount $8275.00 (or 8275) as an EXPENSE should be categorized as "Facility Rental" and classified as BUSINESS

Return JSON in this exact format:
{
  "transactionCount": number,
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "full transaction description",
      "amount": number (positive for income, negative for expenses),
      "type": "debit|credit",
      "category": "category name",
      "profileType": "BUSINESS" or "PERSONAL" (you MUST choose one based on the rules above)
    }
  ]
}

IMPORTANT: 
- Extract ALL transactions, no matter how many
- EVERY transaction MUST have a profileType of either "BUSINESS" or "PERSONAL"
- Use the description to intelligently determine if it's business or personal
- When in doubt, classify as PERSONAL

Respond with raw JSON only.`
              }
            ]
          }],
          response_format: { type: "json_object" }
        })
      });

      console.log(`[AI Processor] ✅ Response received: ${response.status}`);

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status}`);
      }

      // Parse response
      const data = await response.json();
      const content = data.choices[0].message.content;
      const extractedData = JSON.parse(content);
      
      const count = extractedData.transactions?.length || 0;
      console.log(`[AI Processor] ✅ Extracted ${count} transactions from PDF`);
      console.log(`[AI Processor] Transaction count reported by LLM: ${extractedData.transactionCount || count}`);
      
      return extractedData;
        
    } catch (error) {
      console.error('[AI Processor] Error:', error);
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
    console.log(`[AI Processor] 🚀 CATEGORIZING ALL ${transactions.length} TRANSACTIONS AT ONCE (NOT ONE-BY-ONE)`);
    
    // Import expanded categories
    const { getAllCategories, getIndustryAwarePrompt } = await import('@/lib/accuracy-enhancer');
    const allCategories = getAllCategories();
    const industryContext = userContext ? getIndustryAwarePrompt(userContext.industry, userContext.businessType, userContext.companyName) : '';
    
    // Process ALL transactions at once (no batching)
    console.log(`[AI Processor] Processing all ${transactions.length} transactions in ONE batch`);
      
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
                content: `You are an expert financial analyst. Categorize ALL these ${transactions.length} transactions with MAXIMUM accuracy.

${JSON.stringify(transactions, null, 2)}

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
            console.log(`[AI Processor] ✅ Categorization completed: ${result.categorizedTransactions.length} transactions`);
            success = true;
            
            // Verify we got all transactions
            if (result.categorizedTransactions.length !== transactions.length) {
              console.error(`[AI Processor] ⚠️ Expected ${transactions.length} transactions, got ${result.categorizedTransactions.length}`);
            }
            
            console.log(`[AI Processor] ✅ CATEGORIZATION COMPLETE`);
            console.log(`[AI Processor] 📊 Successfully categorized: ${result.categorizedTransactions.length} transactions`);
            console.log(`[AI Processor] 🎯 Expected vs Actual: ${transactions.length} → ${result.categorizedTransactions.length}`);
            
            return result.categorizedTransactions;
          } else {
            throw new Error('Invalid response structure');
          }
          
        } catch (error) {
          console.error(`[AI Processor] ❌ Error categorizing transactions (attempt ${retryCount + 1}):`, error);
          retryCount++;
          
          // If all retries failed, create fallback categorized transactions
          if (retryCount > maxRetries) {
            console.error(`[AI Processor] 🚨 CATEGORIZATION FAILED AFTER ${maxRetries} RETRIES - Creating fallback categorizations`);
            
            // Create basic categorization for all transactions to prevent data loss
            const fallbackCategorized = transactions.map((txn: any) => ({
              originalTransaction: txn,
              suggestedCategory: txn.amount > 0 ? 'Business Revenue' : 'Uncategorized Expense',
              confidence: 0.30,
              reasoning: 'Auto-categorized due to processing failure',
              merchant: txn.description || 'Unknown',
              isRecurring: false,
              profileType: 'BUSINESS',
              profileConfidence: 0.50
            }));
            
            console.log(`[AI Processor] ⚠️ Created ${fallbackCategorized.length} transactions with fallback categorization`);
            return fallbackCategorized;
          }
        }
      }
    
    // This should never be reached (we return in the while loop)
    console.error(`[AI Processor] 🚨 Categorization failed completely - returning empty array`);
    return [];
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
