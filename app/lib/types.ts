
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
  aiCategorizedTransactions?: number
  totalBankStatements?: number
  recentBankStatements?: number
  topExpenseCategories?: Array<{
    name: string
    total: number
    count: number
  }>
  totalGoalAmount?: number
  currentGoalAmount?: number
  goalCompletionRate?: number
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

// Bank Statement Types
export interface BankStatement {
  id: string
  userId: string
  fileName: string
  originalName: string
  cloudStoragePath: string
  fileType: 'CSV' | 'PDF'
  fileSize?: number | null
  sourceType: 'BANK' | 'CREDIT_CARD'
  bankName?: string | null
  accountType?: string | null
  accountNumber?: string | null
  creditLimit?: number | null
  statementPeriod?: string | null
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  processingStage: 'UPLOADED' | 'EXTRACTING_DATA' | 'CATEGORIZING_TRANSACTIONS' | 'ANALYZING_PATTERNS' | 'GENERATING_INSIGHTS' | 'DISTRIBUTING_DATA' | 'COMPLETED' | 'FAILED'
  recordCount: number
  processedCount: number
  errorLog?: string | null
  aiAnalysis?: any
  extractedData?: any
  mappingConfig?: any
  createdAt: Date
  updatedAt: Date
}

export interface StatementProcessingResult {
  success: boolean
  message: string
  data?: {
    transactionsCreated: number
    categoriesCreated: number
    insights: string[]
    recommendations: string[]
  }
  errors?: string[]
}

// Advanced Financial Feature Types

export interface CashFlowForecast {
  id: string
  userId: string
  period: string
  periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  startDate: Date
  endDate: Date
  projectedIncome: number
  projectedExpenses: number
  projectedCashFlow: number
  openingBalance: number
  closingBalance: number
  confidence: number
  scenarioType: 'OPTIMISTIC' | 'REALISTIC' | 'PESSIMISTIC' | 'CUSTOM'
  incomeBreakdown?: any
  expenseBreakdown?: any
  modelVersion?: string | null
  generatedAt: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TaxOptimization {
  id: string
  userId: string
  taxYear: number
  quarter?: number | null
  estimatedTaxableIncome: number
  estimatedTaxLiability: number
  currentTaxPaid: number
  quarterlyEstimate: number
  standardDeduction: number
  itemizedDeductions?: any
  businessDeductions?: any
  availableCredits?: any
  recommendations?: any
  potentialSavings: number
  implementationSteps?: any
  documentsRequired?: any
  deadlines?: any
  filingStatus?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface BusinessInsight {
  id: string
  userId: string
  type: string
  category: string
  title: string
  description: string
  value?: number | null
  percentage?: number | null
  trend?: 'UP' | 'DOWN' | 'STABLE' | 'VOLATILE' | 'SEASONAL' | null
  timeframe?: string | null
  context?: any
  analysis?: string | null
  confidence: number
  actionable: boolean
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  suggestions?: any
  source?: string | null
  isStale: boolean
  staleAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface AIRecommendation {
  id: string
  userId: string
  type: string
  category: string
  title: string
  description: string
  impactLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  potentialSavings?: number | null
  potentialRevenue?: number | null
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  timeToImplement?: string | null
  steps: any
  requirements?: any
  resources?: any
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'ON_HOLD'
  implementedAt?: Date | null
  rejectedAt?: Date | null
  rejectionReason?: string | null
  confidence: number
  dataSupporting?: any
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL'
  dueDate?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface ScenarioAnalysis {
  id: string
  userId: string
  name: string
  description?: string | null
  scenarioType: 'OPTIMISTIC' | 'REALISTIC' | 'PESSIMISTIC' | 'CUSTOM'
  timeHorizon: string
  startDate: Date
  endDate: Date
  revenueGrowth?: number | null
  expenseGrowth?: number | null
  inflationRate?: number | null
  customVariables?: any
  projectedRevenue?: number | null
  projectedExpenses?: number | null
  projectedProfit?: number | null
  projectedCashFlow?: number | null
  breakEvenPoint?: Date | null
  riskFactors?: any
  opportunities?: any
  recommendations?: any
  comparisonData?: any
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ComplianceTracking {
  id: string
  userId: string
  complianceType: string
  title: string
  description?: string | null
  requirements: any
  regulations?: any
  industry?: string | null
  status: string
  completedItems?: any
  pendingItems?: any
  overdue: boolean
  dueDate?: Date | null
  lastReviewDate?: Date | null
  nextReviewDate?: Date | null
  frequency?: string | null
  documents?: any
  evidence?: any
  notes?: string | null
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  penalties?: any
  createdAt: Date
  updatedAt: Date
}

export interface CreditApplication {
  id: string
  userId: string
  type: string
  lender?: string | null
  productName?: string | null
  requestedAmount: number
  purpose: string
  termLength?: number | null
  collateral?: string | null
  businessRevenue?: number | null
  businessExpenses?: number | null
  businessAge?: number | null
  status: string
  applicationDate?: Date | null
  approvalDate?: Date | null
  decisionAmount?: number | null
  interestRate?: number | null
  requirements?: any
  submittedDocs?: any
  eligibilityScore?: number | null
  recommendations?: any
  alternativeOptions?: any
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface IndustryBenchmark {
  id: string
  userId: string
  industry: string
  companySize: string
  region?: string | null
  avgRevenue?: number | null
  avgProfit?: number | null
  avgExpenses?: number | null
  avgProfitMargin?: number | null
  avgCurrentRatio?: number | null
  avgDebtToEquity?: number | null
  avgROA?: number | null
  avgROE?: number | null
  avgEmployees?: number | null
  avgCustomers?: number | null
  avgProjects?: number | null
  revenueGrowth?: number | null
  customerGrowth?: number | null
  marketShare?: number | null
  userPerformance?: any
  gaps?: any
  strengths?: any
  dataSource?: string | null
  dataDate: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PredictiveModel {
  id: string
  userId: string
  modelType: string
  name: string
  description?: string | null
  features: any
  parameters: any
  algorithm?: string | null
  trainingData?: any
  trainingPeriod?: string | null
  dataQuality?: number | null
  accuracy?: number | null
  precision?: number | null
  recall?: number | null
  lastTrained?: Date | null
  predictions?: any
  confidenceLevel?: number | null
  version: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface BusinessEntity {
  id: string
  userId: string
  name: string
  type: string
  registrationNumber?: string | null
  taxId?: string | null
  registrationDate?: Date | null
  registrationState?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  zipCode?: string | null
  phone?: string | null
  email?: string | null
  annualRevenue?: number | null
  employees?: number | null
  fiscalYearEnd?: Date | null
  parentEntityId?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface WorkflowRule {
  id: string
  userId: string
  name: string
  description?: string | null
  trigger: string
  conditions: any
  actions: any
  isActive: boolean
  lastRun?: Date | null
  runCount: number
  successCount: number
  schedule?: string | null
  nextRun?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface KPITarget {
  id: string
  userId: string
  name: string
  description?: string | null
  kpiType: string
  targetValue: number
  currentValue: number
  unit?: string | null
  period: string
  startDate: Date
  endDate: Date
  status: string
  progress: number
  trend?: 'UP' | 'DOWN' | 'STABLE' | 'VOLATILE' | 'SEASONAL' | null
  lastUpdate?: Date | null
  isAchievable?: boolean | null
  createdAt: Date
  updatedAt: Date
}

export interface BudgetScenario {
  id: string
  userId: string
  name: string
  description?: string | null
  scenarioType: 'OPTIMISTIC' | 'REALISTIC' | 'PESSIMISTIC' | 'CUSTOM'
  period: string
  startDate: Date
  endDate: Date
  categoryBudgets: any
  totalBudget: number
  contingency: number
  actualSpending: number
  variance: number
  variancePercent: number
  riskFactors?: any
  opportunities?: any
  recommendations?: any
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Enhanced Receipt with OCR capabilities
export interface EnhancedReceipt {
  id: string
  userId: string
  vendor?: string | null
  amount: number
  date: Date
  category?: string | null
  description?: string | null
  cloudStoragePath?: string | null
  ocrText?: string | null
  ocrData?: any
  aiAnalysis?: any
  processed: boolean
  confidence?: number | null
  taxDeductible: boolean
  businessExpense: boolean
  createdAt: Date
  updatedAt: Date
}

// API Response Types
export interface CashFlowForecastResponse {
  forecasts: CashFlowForecast[]
  summary: {
    totalPeriods: number
    avgProjectedCashFlow: number
    highestCashFlow: number
    lowestCashFlow: number
    riskPeriods: number
  }
}

export interface BusinessInsightsResponse {
  insights: BusinessInsight[]
  summary: {
    totalInsights: number
    actionableInsights: number
    highPriorityInsights: number
    categories: { [key: string]: number }
  }
}

export interface AIRecommendationsResponse {
  recommendations: AIRecommendation[]
  summary: {
    totalRecommendations: number
    pendingRecommendations: number
    highImpactRecommendations: number
    potentialSavings: number
    potentialRevenue: number
  }
}

export interface TaxOptimizationResponse {
  optimization: TaxOptimization
  summary: {
    estimatedLiability: number
    potentialSavings: number
    quarterlyEstimates: number[]
    upcomingDeadlines: Array<{ date: Date; description: string }>
  }
}

// UI State Types
export interface DashboardState {
  isLoading: boolean
  selectedPeriod: string
  selectedScenario: 'OPTIMISTIC' | 'REALISTIC' | 'PESSIMISTIC' | 'CUSTOM'
  showAdvancedFeatures: boolean
  activeTab: string
}

export interface FilterOptions {
  dateRange?: {
    start: Date
    end: Date
  }
  categories?: string[]
  priority?: string[]
  status?: string[]
  amount?: {
    min: number
    max: number
  }
}

// Chart Data Types
export interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }>
}

export interface TimeSeriesData {
  date: string
  value: number
  category?: string
  trend?: 'UP' | 'DOWN' | 'STABLE'
}

// Analysis Result Types
export interface FinancialHealthScore {
  overall: number
  components: {
    profitability: number
    liquidity: number
    efficiency: number
    leverage: number
    growth: number
  }
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  recommendations: string[]
}

export interface ProfitabilityAnalysis {
  grossMargin: number
  operatingMargin: number
  netMargin: number
  trending: 'UP' | 'DOWN' | 'STABLE'
  industryComparison: {
    aboveAverage: boolean
    percentile: number
  }
  recommendations: string[]
}

export interface CashFlowAnalysis {
  operatingCashFlow: number
  freeCashFlow: number
  cashConversionCycle: number
  burnRate: number
  runway: number
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE'
  alerts: string[]
}

export interface ExpenseAnalysis {
  totalExpenses: number
  categorizedExpenses: { [category: string]: number }
  topExpenseCategories: Array<{
    category: string
    amount: number
    percentage: number
    trend: 'UP' | 'DOWN' | 'STABLE'
  }>
  seasonalPatterns: { [month: string]: number }
  anomalies: Array<{
    date: string
    amount: number
    category: string
    description: string
  }>
  optimizationOpportunities: string[]
}

// Recurring Charges Types
export interface RecurringCharge {
  id: string
  userId: string
  name: string
  description?: string | null
  amount: number
  category: string
  frequency: RecurringFrequency
  nextDueDate: Date
  lastPaidDate?: Date | null
  vendor?: string | null
  billingCycle: number
  reminderEnabled: boolean
  reminderDays: number
  isActive: boolean
  isPaused: boolean
  pausedUntil?: Date | null
  annualAmount: number
  taxDeductible: boolean
  businessExpense: boolean
  notes?: string | null
  tags?: string[]
  autoPayEnabled: boolean
  paymentMethod?: string | null
  createdAt: Date
  updatedAt: Date
}

export type RecurringFrequency = 
  | 'DAILY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'BIMONTHLY'
  | 'QUARTERLY'
  | 'SEMIANNUALLY'
  | 'ANNUALLY'
  | 'CUSTOM'

export interface RecurringChargesSummary {
  totalCharges: number
  activeCharges: number
  totalMonthlyAmount: number
  totalAnnualAmount: number
  dueSoon: number
  overdue: number
  categories: string[]
  topCategories: Array<{
    category: string
    amount: number
    count: number
  }>
  nextPayments: Array<{
    id: string
    name: string
    amount: number
    dueDate: Date
  }>
}

export interface RecurringChargeFormData {
  name: string
  description?: string
  amount: number
  category: string
  frequency: RecurringFrequency
  nextDueDate: string
  vendor?: string
  billingCycle: number
  reminderEnabled: boolean
  reminderDays: number
  taxDeductible: boolean
  businessExpense: boolean
  notes?: string
  tags: string[]
  autoPayEnabled: boolean
  paymentMethod?: string
}
