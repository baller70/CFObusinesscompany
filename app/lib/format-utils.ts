/**
 * Format currency amount with proper sign and color
 * Expenses should always show as negative (red)
 * Income should always show as positive (green)
 */
export function formatCurrency(amount: number | null | undefined, options?: {
  includeSign?: boolean
  includeColor?: boolean
  type?: 'INCOME' | 'EXPENSE' | 'NEUTRAL'
}): {
  formatted: string
  sign: string
  color: string
  className: string
} {
  const {
    includeSign = false,
    includeColor = false,
    type = 'NEUTRAL'
  } = options || {}

  // Handle null/undefined
  if (amount === null || amount === undefined) {
    return {
      formatted: '$0.00',
      sign: '',
      color: 'text-gray-900',
      className: ''
    }
  }

  // Always use absolute value for formatting
  const absAmount = Math.abs(amount)
  const formattedNumber = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(absAmount)

  let sign = ''
  let color = 'text-gray-900'
  let className = ''

  // Determine sign and color based on type
  if (type === 'EXPENSE') {
    sign = '-'
    color = 'text-red-600'
    className = 'text-financial-negative'
  } else if (type === 'INCOME') {
    sign = '+'
    color = 'text-green-600'
    className = 'text-financial-positive'
  } else if (includeSign) {
    // For neutral type, show actual sign if requested
    sign = amount >= 0 ? '+' : '-'
    color = amount >= 0 ? 'text-green-600' : 'text-red-600'
    className = amount >= 0 ? 'text-financial-positive' : 'text-financial-negative'
  }

  return {
    formatted: formattedNumber,
    sign: includeSign || type !== 'NEUTRAL' ? sign : '',
    color: includeColor || type !== 'NEUTRAL' ? color : 'text-gray-900',
    className: includeColor || type !== 'NEUTRAL' ? className : ''
  }
}

/**
 * Simple currency formatting without sign/color
 */
export function formatCurrencySimple(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount))
}

/**
 * Format expense amount (always negative/red)
 */
export function formatExpense(amount: number | null | undefined): string {
  const result = formatCurrency(amount, { includeSign: true, type: 'EXPENSE' })
  return `${result.sign}${result.formatted}`
}

/**
 * Format income amount (always positive/green)
 */
export function formatIncome(amount: number | null | undefined): string {
  const result = formatCurrency(amount, { includeSign: true, type: 'INCOME' })
  return `${result.sign}${result.formatted}`
}
