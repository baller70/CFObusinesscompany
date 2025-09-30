
// AI Processing functions for bank statements
export class AIBankStatementProcessor {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.ABACUSAI_API_KEY!;
  }

  async extractDataFromPDF(base64Content: string, fileName: string): Promise<any> {
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
              text: `Extract all transaction data from this bank statement. Return structured JSON with:
              {
                "bankInfo": {
                  "bankName": "bank name",
                  "accountType": "checking/savings/etc",
                  "accountNumber": "last 4 digits only",
                  "statementPeriod": "YYYY-MM-DD to YYYY-MM-DD"
                },
                "transactions": [
                  {
                    "date": "YYYY-MM-DD",
                    "description": "transaction description",
                    "amount": number (positive for credits, negative for debits),
                    "balance": number,
                    "type": "debit|credit",
                    "category": "suggested category",
                    "merchant": "merchant name if identifiable"
                  }
                ],
                "summary": {
                  "startingBalance": number,
                  "endingBalance": number,
                  "totalCredits": number,
                  "totalDebits": number,
                  "transactionCount": number
                }
              }
              
              Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`
            }]
          }],
          response_format: { type: "json_object" },
          max_tokens: 4000,
        }),
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract data from PDF');
    }
  }

  async processCSVData(csvContent: string): Promise<any> {
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
          max_tokens: 4000,
        }),
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('CSV processing error:', error);
      throw new Error('Failed to process CSV data');
    }
  }

  async categorizeTransactions(transactions: any[]): Promise<any[]> {
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
            content: `Categorize these financial transactions using professional accounting categories. For each transaction, provide the best category and confidence score:

${JSON.stringify(transactions, null, 2)}

Available categories: Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Education, Travel, Income, Transfers, Fees & Charges, Groceries, Gas & Fuel, Restaurants, Insurance, Rent/Mortgage, Phone, Internet, Subscriptions, ATM, Interest, Dividends, Salary, Freelance, Business, Other

Return JSON:
{
  "categorizedTransactions": [
    {
      "originalTransaction": original_transaction_object,
      "suggestedCategory": "category name",
      "confidence": 0.95,
      "reasoning": "brief explanation",
      "merchant": "cleaned merchant name",
      "isRecurring": true/false
    }
  ]
}

Respond with raw JSON only.`
          }],
          response_format: { type: "json_object" },
          max_tokens: 4000,
        }),
      });

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      return result.categorizedTransactions;
    } catch (error) {
      console.error('Categorization error:', error);
      throw new Error('Failed to categorize transactions');
    }
  }

  async generateFinancialInsights(transactions: any[], userProfile: any): Promise<any> {
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
          max_tokens: 4000,
        }),
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Insights generation error:', error);
      throw new Error('Failed to generate financial insights');
    }
  }
}
