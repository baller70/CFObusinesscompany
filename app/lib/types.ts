
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
