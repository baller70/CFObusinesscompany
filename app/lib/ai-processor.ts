
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

  async extractDataFromPDF(base64Content: string, fileName: string): Promise<any> {
    console.log(`[AI Processor] Extracting data from PDF: ${fileName}, size: ${base64Content.length} bytes`);
    
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
            content: [{
              type: "file", 
              file: {
                filename: fileName,
                file_data: `data:application/pdf;base64,${base64Content}`
              }
            }, {
              type: "text", 
              text: `Extract key transaction data from this bank statement. Be concise.

Return JSON with:
{
  "bankInfo": {
    "bankName": "name",
    "accountNumber": "last 4 digits",
    "statementPeriod": "YYYY-MM-DD to YYYY-MM-DD"
  },
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "brief description (max 50 chars)",
      "amount": number,
      "type": "debit|credit"
    }
  ],
  "summary": {
    "startingBalance": number,
    "endingBalance": number,
    "transactionCount": number
  }
}

Keep descriptions brief. Respond with raw JSON only.`
            }]
          }],
          response_format: { type: "json_object" },
          max_tokens: 16000,
        }),
      });

      console.log(`[AI Processor] PDF extraction API response status: ${response.status}`);

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
      
      console.log(`[AI Processor] Successfully extracted data from PDF: ${extractedData.transactions?.length || 0} transactions`);
      
      return extractedData;
    } catch (error) {
      console.error('[AI Processor] PDF extraction error:', error);
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

  async categorizeTransactions(transactions: any[]): Promise<any[]> {
    console.log(`[AI Processor] Categorizing ${transactions.length} transactions`);
    
    // Process in batches to avoid token limits
    const batchSize = 20;
    const allCategorized: any[] = [];
    
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      console.log(`[AI Processor] Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(transactions.length/batchSize)} (${batch.length} transactions)`);
      
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
              content: `Categorize these financial transactions. For each, provide category, confidence, AND determine if it's a business or personal/household expense:

${JSON.stringify(batch, null, 2)}

Categories: Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Education, Travel, Income, Transfers, Fees & Charges, Groceries, Gas & Fuel, Restaurants, Insurance, Rent/Mortgage, Phone, Internet, Subscriptions, ATM, Interest, Dividends, Salary, Freelance, Business, Other

IMPORTANT: Also classify each transaction as either "BUSINESS" or "PERSONAL":
- BUSINESS: Office supplies, business services, professional fees, business travel, client meals, equipment, software licenses, advertising, etc.
- PERSONAL: Personal groceries, personal dining, entertainment, personal healthcare, household bills, personal shopping, etc.

Return JSON:
{
  "categorizedTransactions": [
    {
      "originalTransaction": original_transaction_object,
      "suggestedCategory": "category",
      "confidence": 0.95,
      "reasoning": "brief",
      "merchant": "merchant name",
      "isRecurring": false,
      "profileType": "BUSINESS" or "PERSONAL"
    }
  ]
}

Raw JSON only.`
            }],
            response_format: { type: "json_object" },
            max_tokens: 8000,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[AI Processor] Batch ${i/batchSize + 1} API error:`, errorText);
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
          console.log(`[AI Processor] Batch ${Math.floor(i/batchSize) + 1} completed: ${result.categorizedTransactions.length} transactions`);
        }
        
      } catch (error) {
        console.error(`[AI Processor] Error processing batch ${Math.floor(i/batchSize) + 1}:`, error);
        // Continue with next batch instead of failing completely
      }
    }
    
    console.log(`[AI Processor] Successfully categorized ${allCategorized.length} transactions total`);
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
