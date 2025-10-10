
import { prisma } from '@/lib/db'
import { CFOAnalysis, CFORecommendation, CFOInsight, FinancialContext, DebtReductionPlan, CFOAnalysisType } from '@/lib/types'

export class CFOAIService {
  static async getFinancialContext(userId: string): Promise<FinancialContext> {
    const [
      transactions,
      debts,
      invoices,
      bills,
      financialMetrics,
      bankStatements,
      categories,
      goals
    ] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' }
      }),
      prisma.debt.findMany({
        where: { userId, isActive: true }
      }),
      prisma.invoice.findMany({
        where: { userId }
      }),
      prisma.bill.findMany({
        where: { userId }
      }),
      // @ts-ignore
    prisma.financialMetrics.findFirst({
        where: { userId }
      }),
      prisma.bankStatement.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.category.findMany({
        where: { userId }
      }),
      prisma.goal.findMany({
        where: { userId, isCompleted: false }
      })
    ])

    // Calculate current month revenue and expenses
    const currentDate = new Date()
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    
    const monthlyRevenue = transactions
      .filter(t => t.type === 'INCOME' && t.date >= currentMonthStart)
      .reduce((sum, t) => sum + t.amount, 0)
    
    const monthlyExpenses = transactions
      .filter(t => t.type === 'EXPENSE' && t.date >= currentMonthStart)
      .reduce((sum, t) => sum + t.amount, 0)

    const totalRevenue = invoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + i.total, 0)

    const totalExpenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0)
    const netIncome = totalRevenue - totalExpenses
    const cashFlow = monthlyRevenue - monthlyExpenses
    
    // Calculate burn rate (average monthly expenses over last 3 months)
    const threeMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1)
    const recentExpenses = transactions
      .filter(t => t.type === 'EXPENSE' && t.date >= threeMonthsAgo)
      .reduce((sum, t) => sum + t.amount, 0)
    const burnRate = recentExpenses / 3

    // Calculate runway (months of expenses covered by current cash)
    const runway = cashFlow > 0 ? Infinity : (netIncome > 0 ? netIncome / Math.abs(burnRate) : 0)
    
    const debtToIncomeRatio = monthlyRevenue > 0 ? (totalDebt / (monthlyRevenue * 12)) : 0
    const profitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0
    
    // Estimate current assets and liabilities
    const currentAssets = Math.max(netIncome, 0) + (monthlyRevenue * 2) // Simplified estimate
    const currentLiabilities = totalDebt + (monthlyExpenses * 1.5) // Simplified estimate
    const workingCapital = currentAssets - currentLiabilities

    // Bank statement insights
    const aiCategorizedTransactions = transactions.filter(t => t.aiCategorized === true).length
    const totalBankStatements = bankStatements.length
    const recentBankStatements = bankStatements.filter(bs => bs.status === 'COMPLETED').length
    
    // Category analysis
    const topExpenseCategories = categories
      .filter(c => c.type === 'EXPENSE')
      .map(cat => ({
        name: cat.name,
        total: transactions
          .filter(t => t.categoryId === cat.id && t.type === 'EXPENSE')
          .reduce((sum, t) => sum + t.amount, 0),
        count: transactions.filter(t => t.categoryId === cat.id && t.type === 'EXPENSE').length
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    // Goal progress
    const totalGoalAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0)
    const currentGoalAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0)
    const goalCompletionRate = totalGoalAmount > 0 ? (currentGoalAmount / totalGoalAmount) * 100 : 0

    return {
      totalRevenue,
      totalExpenses,
      netIncome,
      totalDebt,
      cashFlow,
      burnRate,
      runway,
      debtToIncomeRatio,
      profitMargin,
      currentAssets,
      currentLiabilities,
      workingCapital,
      aiCategorizedTransactions,
      totalBankStatements,
      recentBankStatements,
      topExpenseCategories,
      totalGoalAmount,
      currentGoalAmount,
      goalCompletionRate
    }
  }

  static async generateFinancialAnalysis(userId: string, analysisType: CFOAnalysisType): Promise<string> {
    const context = await this.getFinancialContext(userId)
    
    const prompt = this.buildAnalysisPrompt(analysisType, context)
    
    return prompt
  }

  static buildAnalysisPrompt(analysisType: CFOAnalysisType, context: FinancialContext): string {
    const basePrompt = `You are a world-class Chief Financial Officer with 20+ years of experience helping companies achieve financial stability and growth. Your expertise includes debt management, cash flow optimization, strategic financial planning, and turning around distressed businesses.

Current Financial Context:
- Total Revenue: $${context.totalRevenue?.toLocaleString() || 0}
- Total Expenses: $${context.totalExpenses?.toLocaleString() || 0}
- Net Income: $${context.netIncome?.toLocaleString() || 0}
- Total Debt: $${context.totalDebt?.toLocaleString() || 0}
- Monthly Cash Flow: $${context.cashFlow?.toLocaleString() || 0}
- Monthly Burn Rate: $${context.burnRate?.toLocaleString() || 0}
- Runway: ${context.runway === Infinity ? 'Positive cash flow' : `${context.runway?.toFixed(1)} months`}
- Debt-to-Income Ratio: ${context.debtToIncomeRatio ? (context.debtToIncomeRatio * 100).toFixed(1) + '%' : 'N/A'}
- Profit Margin: ${context.profitMargin?.toFixed(1)}%
- Working Capital: $${context.workingCapital?.toLocaleString() || 0}

Your PRIMARY OBJECTIVE is to help get this company OUT OF DEBT and establish long-term financial stability through strategic decision-making.`

    const analysisSpecificPrompts = {
      CASH_FLOW: `
Analyze the cash flow situation and provide specific recommendations to improve liquidity and cash management. Focus on:
1. Immediate cash flow improvements
2. Accounts receivable acceleration
3. Accounts payable optimization
4. Inventory management (if applicable)
5. Emergency cash reserves needed`,

      DEBT_ANALYSIS: `
Conduct a comprehensive debt analysis and create an aggressive debt reduction strategy. Focus on:
1. Debt consolidation opportunities
2. Interest rate negotiation strategies
3. Payment prioritization (avalanche vs snowball)
4. Debt restructuring options
5. Timeline for becoming debt-free`,

      EXPENSE_OPTIMIZATION: `
Perform a detailed expense audit and identify cost reduction opportunities. Focus on:
1. Immediate cost cuts that won't harm operations
2. Subscription and service audits
3. Vendor renegotiation opportunities
4. Process efficiency improvements
5. ROI analysis of current expenditures`,

      REVENUE_OPTIMIZATION: `
Analyze revenue streams and identify growth opportunities. Focus on:
1. Pricing strategy optimization
2. Customer retention strategies
3. New revenue stream opportunities
4. Sales process improvements
5. Market expansion possibilities`,

      BUDGET_VARIANCE: `
Analyze budget vs actual performance and provide corrective actions. Focus on:
1. Major budget variances and root causes
2. Forecasting accuracy improvements
3. Budget reallocation recommendations
4. Performance metrics to track
5. Process improvements for better planning`,

      FINANCIAL_HEALTH: `
Provide a comprehensive financial health assessment. Focus on:
1. Key financial ratio analysis
2. Benchmarking against industry standards
3. Warning signs and red flags
4. Strengths to leverage
5. Overall financial stability score`,

      RISK_ASSESSMENT: `
Identify financial risks and mitigation strategies. Focus on:
1. Cash flow risks and contingencies
2. Market and industry risks
3. Operational risks affecting finances
4. Credit and counterparty risks
5. Risk mitigation action plan`,

      GROWTH_OPPORTUNITIES: `
Identify strategic growth opportunities within current financial constraints. Focus on:
1. Low-cost growth strategies
2. Partnership opportunities
3. Market penetration tactics
4. Product/service expansion
5. Financial requirements for growth`,

      TAX_OPTIMIZATION: `
Analyze tax strategy and identify optimization opportunities. Focus on:
1. Current tax efficiency analysis
2. Deduction maximization strategies
3. Tax planning for next fiscal year
4. Business structure optimization
5. Quarterly tax planning`,

      INVESTMENT_ANALYSIS: `
Analyze current investments and recommend optimal allocation. Focus on:
1. ROI analysis of current investments
2. Cash allocation priorities
3. Capital expenditure recommendations
4. Working capital optimization
5. Investment timeline strategies`,

      BANK_STATEMENT_ANALYSIS: `
Analyze bank statement data and AI-categorized transactions. Focus on:
1. Transaction pattern analysis from bank statements
2. AI categorization accuracy and insights
3. Spending behavior patterns
4. Income stability analysis
5. Automated financial tracking recommendations`,

      SPENDING_PATTERN_ANALYSIS: `
Analyze spending patterns from imported bank data. Focus on:
1. Monthly spending trends by category
2. Recurring expense identification
3. Unusual spending pattern alerts
4. Seasonal spending variations
5. Budget adherence analysis`,

      GOAL_PROGRESS_ANALYSIS: `
Analyze progress toward financial goals. Focus on:
1. Goal achievement timeline analysis
2. Current progress vs targets
3. Recommended monthly contributions
4. Goal prioritization strategy
5. Achievement probability assessment`,

      COMPREHENSIVE_OVERVIEW: `
Provide a complete financial overview incorporating all data sources. Focus on:
1. Overall financial health score
2. Key performance indicators
3. Progress tracking dashboard insights
4. Priority action items
5. Strategic roadmap for financial improvement`
    }

    return basePrompt + '\n\n' + (analysisSpecificPrompts[analysisType] || analysisSpecificPrompts.FINANCIAL_HEALTH) + `

Please provide your analysis in JSON format with the following structure:
{
  "summary": "Executive summary of the analysis (3-4 sentences)",
  "urgencyLevel": "LOW|MEDIUM|HIGH|CRITICAL",
  "confidenceScore": 0.95,
  "insights": [
    {
      "type": "FINANCIAL_RATIO|TREND_ANALYSIS|CASH_FLOW_PATTERN|etc",
      "title": "Insight title",
      "description": "Detailed description",
      "value": "Key metric or finding",
      "trend": "UP|DOWN|STABLE",
      "changePercentage": 15.5,
      "context": "Why this matters",
      "actionable": true
    }
  ],
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed description",
      "category": "COST_REDUCTION|REVENUE_INCREASE|DEBT_MANAGEMENT|etc",
      "impact": "LOW|MEDIUM|HIGH",
      "timeframe": "Immediate|1-3 months|3-6 months|6-12 months",
      "implementationSteps": ["Step 1", "Step 2", "Step 3"],
      "potentialSavings": 5000,
      "potentialRevenue": 10000,
      "riskLevel": "LOW|MEDIUM|HIGH",
      "priority": 1
    }
  ]
}

Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  static calculateDebtPayoffOrder(debts: any[], strategy: 'SNOWBALL' | 'AVALANCHE'): any[] {
    const sortedDebts = [...debts].sort((a, b) => {
      if (strategy === 'SNOWBALL') {
        return a.balance - b.balance // Smallest balance first
      } else {
        return b.interestRate - a.interestRate // Highest interest rate first
      }
    })

    return sortedDebts.map((debt, index) => ({
      debtId: debt.id,
      debtName: debt.name,
      balance: debt.balance,
      minimumPayment: debt.minimumPayment,
      interestRate: debt.interestRate,
      order: index + 1,
      estimatedPayoffMonths: Math.ceil(debt.balance / Math.max(debt.minimumPayment, 50))
    }))
  }

  static async getUserDebts(userId: string) {
    return await prisma.debt.findMany({
      where: { userId, isActive: true },
      orderBy: { balance: 'desc' }
    })
  }

  static async getRecentTransactions(userId: string, limit: number = 50) {
    return await prisma.transaction.findMany({
      where: { userId },
      take: limit,
      orderBy: { date: 'desc' },
      include: { categoryRelation: true }
    })
  }

  static async getBankStatementInsights(userId: string) {
    const statements = await prisma.bankStatement.findMany({
      where: { userId },
      include: {
        transactions: {
          include: { categoryRelation: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const insights = {
      totalStatementsProcessed: statements.length,
      totalTransactionsProcessed: statements.reduce((sum, s) => sum + s.processedCount, 0),
      aiCategorizedTransactions: statements.reduce((sum, s) => 
        sum + s.transactions.filter(t => t.aiCategorized).length, 0
      ),
      uniqueBanks: [...new Set(statements.map(s => s.bankName).filter(Boolean))],
      processingAccuracy: statements.filter(s => s.status === 'COMPLETED').length / Math.max(statements.length, 1),
      latestProcessingDate: statements[0]?.createdAt,
      totalDataPoints: statements.reduce((sum, s) => sum + (s.recordCount || 0), 0)
    }

    return insights
  }

  static async getSpendingPatterns(userId: string) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: thirtyDaysAgo }
      },
      include: { categoryRelation: true },
      orderBy: { date: 'desc' }
    })

    // Group by category
    const categorySpending = transactions.reduce((acc, t) => {
      const category = t.categoryRelation?.name || 'Uncategorized'
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0, transactions: [] }
      }
      acc[category].total += t.amount
      acc[category].count += 1
      acc[category].transactions.push(t)
      return acc
    }, {} as Record<string, { total: number; count: number; transactions: any[] }>)

    // Identify recurring transactions
    const recurringPatterns = Object.entries(categorySpending)
      .map(([category, data]) => {
        const avgAmount = data.total / data.count
        const frequency = data.count
        const isRecurring = frequency >= 4 && data.transactions.some(t => t.isRecurring)
        
        return {
          category,
          avgAmount,
          frequency,
          isRecurring,
          totalSpent: data.total
        }
      })
      .filter(p => p.isRecurring)

    return {
      categorySpending: Object.entries(categorySpending)
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.total - a.total),
      recurringPatterns,
      totalSpent: transactions.reduce((sum, t) => sum + t.amount, 0),
      averageDailySpending: transactions.reduce((sum, t) => sum + t.amount, 0) / 30
    }
  }

  static async generateBankStatementReport(userId: string) {
    const [context, insights, patterns] = await Promise.all([
      this.getFinancialContext(userId),
      this.getBankStatementInsights(userId),
      this.getSpendingPatterns(userId)
    ])

    return {
      summary: {
        totalStatementsProcessed: insights.totalStatementsProcessed,
        totalTransactions: insights.totalTransactionsProcessed,
        processingAccuracy: insights.processingAccuracy,
        aiCategorized: insights.aiCategorizedTransactions
      },
      spendingAnalysis: patterns,
      financialHealth: {
        cashFlow: context.cashFlow,
        burnRate: context.burnRate,
        debtToIncome: context.debtToIncomeRatio
      },
      recommendations: await this.generateActionableRecommendations(context, patterns)
    }
  }

  static async generateActionableRecommendations(context: any, patterns: any) {
    // Generate specific recommendations based on spending patterns and financial context
    const recommendations = []

    // High spending categories
    if (patterns.categorySpending.length > 0) {
      const topCategory = patterns.categorySpending[0]
      if (topCategory.total > context.monthlyIncome * 0.3) {
        recommendations.push({
          title: `Reduce ${topCategory.category} spending`,
          description: `Your ${topCategory.category} spending (${this.formatCurrency(topCategory.total)}) exceeds 30% of monthly income`,
          priority: 'HIGH',
          potentialSavings: topCategory.total * 0.2
        })
      }
    }

    // Recurring expense optimization
    if (patterns.recurringPatterns.length > 3) {
      recommendations.push({
        title: 'Audit recurring subscriptions',
        description: `You have ${patterns.recurringPatterns.length} recurring expenses. Review for unnecessary subscriptions.`,
        priority: 'MEDIUM',
        potentialSavings: patterns.recurringPatterns.reduce((sum: number, p: any) => sum + p.totalSpent * 0.15, 0)
      })
    }

    // Cash flow improvement
    if (context.cashFlow < 0) {
      recommendations.push({
        title: 'Improve cash flow immediately',
        description: 'Negative cash flow detected. Focus on increasing income or reducing expenses.',
        priority: 'CRITICAL',
        potentialSavings: Math.abs(context.cashFlow)
      })
    }

    return recommendations
  }
}
