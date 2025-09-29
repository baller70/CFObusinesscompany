
// Common TypeScript types for the application
export interface User {
  id: string
  email: string
  name?: string | null
  firstName?: string | null
  lastName?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  id: string
  userId: string
  date: Date
  amount: number
  description: string
  merchant?: string | null
  category: string
  categoryId?: string | null
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  account?: string | null
  csvUploadId?: string | null
  isRecurring: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  userId: string
  name: string
  color: string
  icon: string
  budget?: number | null
  type: 'EXPENSE' | 'INCOME'
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Debt {
  id: string
  userId: string
  name: string
  balance: number
  interestRate: number
  minimumPayment: number
  dueDate: number
  type: 'CREDIT_CARD' | 'STUDENT_LOAN' | 'MORTGAGE' | 'PERSONAL_LOAN' | 'AUTO_LOAN' | 'OTHER'
  priority: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Goal {
  id: string
  userId: string
  name: string
  description?: string | null
  targetAmount: number
  currentAmount: number
  targetDate?: Date | null
  type: 'EMERGENCY_FUND' | 'DEBT_PAYOFF' | 'SAVINGS' | 'INVESTMENT' | 'VACATION' | 'OTHER'
  priority: number
  isCompleted: boolean
  createdAt: Date
  updatedAt: Date
}

export interface FinancialMetrics {
  id: string
  userId: string
  monthlyIncome?: number | null
  monthlyExpenses?: number | null
  monthlyBurnRate?: number | null
  totalDebt?: number | null
  totalAssets?: number | null
  netWorth?: number | null
  emergencyFundGoal?: number | null
  debtToIncomeRatio?: number | null
  lastCalculated: Date
  updatedAt: Date
}

export interface CsvUpload {
  id: string
  userId: string
  fileName: string
  originalName: string
  cloudStoragePath: string
  recordCount: number
  processedCount: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  mappingConfig?: any
  errorLog?: string | null
  createdAt: Date
  updatedAt: Date
}

// CFO AI Types
export interface CFOAnalysis {
  id: string
  userId: string
  type: CFOAnalysisType
  summary: string
  recommendations: CFORecommendation[]
  insights: CFOInsight[]
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  confidenceScore: number
  createdAt: Date
  updatedAt: Date
}

export interface CFORecommendation {
  id: string
  title: string
  description: string
  category: CFORecommendationCategory
  impact: 'LOW' | 'MEDIUM' | 'HIGH'
  timeframe: string
  implementationSteps: string[]
  potentialSavings?: number
  potentialRevenue?: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  priority: number
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'
}

export interface CFOInsight {
  id: string
  type: CFOInsightType
  title: string
  description: string
  value: number | string
  trend?: 'UP' | 'DOWN' | 'STABLE'
  changePercentage?: number
  context: string
  actionable: boolean
}

export type CFOAnalysisType = 
  | 'CASH_FLOW'
  | 'DEBT_ANALYSIS'
  | 'EXPENSE_OPTIMIZATION'
  | 'REVENUE_OPTIMIZATION'
  | 'BUDGET_VARIANCE'
  | 'FINANCIAL_HEALTH'
  | 'RISK_ASSESSMENT'
  | 'GROWTH_OPPORTUNITIES'
  | 'TAX_OPTIMIZATION'
  | 'INVESTMENT_ANALYSIS'

export type CFORecommendationCategory = 
  | 'COST_REDUCTION'
  | 'REVENUE_INCREASE'
  | 'DEBT_MANAGEMENT'
  | 'CASH_FLOW_IMPROVEMENT'
  | 'BUDGET_OPTIMIZATION'
  | 'STRATEGIC_PLANNING'
  | 'OPERATIONAL_EFFICIENCY'
  | 'RISK_MITIGATION'
  | 'TAX_STRATEGY'
  | 'INVESTMENT_STRATEGY'

export type CFOInsightType = 
  | 'FINANCIAL_RATIO'
  | 'TREND_ANALYSIS'
  | 'BENCHMARK_COMPARISON'
  | 'CASH_FLOW_PATTERN'
  | 'EXPENSE_PATTERN'
  | 'REVENUE_PATTERN'
  | 'DEBT_STATUS'
  | 'PROFITABILITY_METRIC'
  | 'EFFICIENCY_METRIC'
  | 'RISK_INDICATOR'

export interface CFOChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  context?: FinancialContext
}

export interface FinancialContext {
  totalRevenue?: number
  totalExpenses?: number
  netIncome?: number
  totalDebt?: number
  cashFlow?: number
  burnRate?: number
  runway?: number
  debtToIncomeRatio?: number
  profitMargin?: number
  currentAssets?: number
  currentLiabilities?: number
  workingCapital?: number
}

export interface DebtReductionPlan {
  id: string
  strategy: 'SNOWBALL' | 'AVALANCHE' | 'HYBRID'
  totalDebt: number
  monthlyPayment: number
  payoffTimeline: number
  totalInterestSaved: number
  debtOrder: DebtPayoffOrder[]
  milestones: DebtMilestone[]
}

export interface DebtPayoffOrder {
  debtId: string
  debtName: string
  balance: number
  minimumPayment: number
  interestRate: number
  order: number
  estimatedPayoffMonths: number
}

export interface DebtMilestone {
  month: number
  description: string
  remainingDebt: number
  achieved: boolean
}
