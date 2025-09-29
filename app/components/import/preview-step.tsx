
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, CheckCircle, AlertTriangle, Eye } from 'lucide-react'
import { format } from 'date-fns'

interface PreviewStepProps {
  data: any[]
  columnMapping: Record<string, string>
  fileName: string
  onConfirm: () => void
  onBack: () => void
}

export function PreviewStep({ data, columnMapping, fileName, onConfirm, onBack }: PreviewStepProps) {
  const [showAll, setShowAll] = useState(false)
  
  const formatCurrency = (value: string) => {
    const num = parseFloat(value?.toString().replace(/[^-\d.]/g, ''))
    if (isNaN(num)) return value
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(num))
  }

  const formatDate = (value: string) => {
    try {
      const date = new Date(value)
      if (isNaN(date.getTime())) return value
      return format(date, 'MMM d, yyyy')
    } catch {
      return value
    }
  }

  const getTransactionType = (amount: string) => {
    const num = parseFloat(amount?.toString().replace(/[^-\d.]/g, ''))
    if (isNaN(num)) return 'Unknown'
    return num >= 0 ? 'Income' : 'Expense'
  }

  const previewData = showAll ? data : data.slice(0, 5)
  
  const getCellValue = (row: any, fieldKey: string) => {
    const columnName = columnMapping[fieldKey]
    if (!columnName) return ''
    return row[columnName] || ''
  }

  const validateData = () => {
    const issues = []
    
    // Check for missing required data
    let hasDateIssues = 0
    let hasAmountIssues = 0
    
    data.forEach((row, index) => {
      const dateValue = getCellValue(row, 'date')
      const amountValue = getCellValue(row, 'amount')
      
      if (!dateValue || new Date(dateValue).toString() === 'Invalid Date') {
        hasDateIssues++
      }
      
      if (!amountValue || isNaN(parseFloat(amountValue.toString().replace(/[^-\d.]/g, '')))) {
        hasAmountIssues++
      }
    })
    
    if (hasDateIssues > 0) {
      issues.push(`${hasDateIssues} rows have invalid or missing dates`)
    }
    
    if (hasAmountIssues > 0) {
      issues.push(`${hasAmountIssues} rows have invalid or missing amounts`)
    }
    
    return issues
  }

  const validationIssues = validateData()
  const canImport = validationIssues.length === 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            Preview Import
          </CardTitle>
          <CardDescription>
            Review your data before importing. We'll process {data.length} transactions from "{fileName}".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{data.length}</p>
                <p className="text-sm text-gray-500">Total Rows</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {data.filter(row => {
                    const amount = getCellValue(row, 'amount')
                    const num = parseFloat(amount?.toString().replace(/[^-\d.]/g, ''))
                    return !isNaN(num) && num >= 0
                  }).length}
                </p>
                <p className="text-sm text-gray-500">Income</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {data.filter(row => {
                    const amount = getCellValue(row, 'amount')
                    const num = parseFloat(amount?.toString().replace(/[^-\d.]/g, ''))
                    return !isNaN(num) && num < 0
                  }).length}
                </p>
                <p className="text-sm text-gray-500">Expenses</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {Object.keys(columnMapping).filter(key => columnMapping[key]).length}
                </p>
                <p className="text-sm text-gray-500">Mapped Fields</p>
              </div>
            </div>

            {/* Validation Issues */}
            {validationIssues.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Data validation issues found:</p>
                    {validationIssues.map((issue, index) => (
                      <p key={index}>• {issue}</p>
                    ))}
                    <p className="mt-2">Please fix these issues in your CSV file before importing.</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Success message */}
            {canImport && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your data looks good! Ready to import {data.length} transactions.
                </AlertDescription>
              </Alert>
            )}

            {/* Preview Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-900">Date</th>
                      <th className="text-left p-3 font-medium text-gray-900">Amount</th>
                      <th className="text-left p-3 font-medium text-gray-900">Description</th>
                      <th className="text-left p-3 font-medium text-gray-900">Type</th>
                      {columnMapping.category && (
                        <th className="text-left p-3 font-medium text-gray-900">Category</th>
                      )}
                      {columnMapping.merchant && (
                        <th className="text-left p-3 font-medium text-gray-900">Merchant</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => {
                      const amount = getCellValue(row, 'amount')
                      const isIncome = getTransactionType(amount) === 'Income'
                      
                      return (
                        <tr key={index} className="border-t hover:bg-gray-50">
                          <td className="p-3">
                            {formatDate(getCellValue(row, 'date'))}
                          </td>
                          <td className="p-3">
                            <span className={isIncome ? 'text-green-600' : 'text-red-600'}>
                              {isIncome ? '+' : '-'}{formatCurrency(amount)}
                            </span>
                          </td>
                          <td className="p-3 max-w-xs truncate">
                            {getCellValue(row, 'description') || '-'}
                          </td>
                          <td className="p-3">
                            <Badge variant={isIncome ? 'default' : 'destructive'} className="text-xs">
                              {getTransactionType(amount)}
                            </Badge>
                          </td>
                          {columnMapping.category && (
                            <td className="p-3">
                              {getCellValue(row, 'category') || '-'}
                            </td>
                          )}
                          {columnMapping.merchant && (
                            <td className="p-3">
                              {getCellValue(row, 'merchant') || '-'}
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {data.length > 5 && !showAll && (
              <div className="text-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAll(true)}
                >
                  Show All {data.length} Rows
                </Button>
              </div>
            )}

            {showAll && (
              <div className="text-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAll(false)}
                >
                  Show Less
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Mapping
        </Button>
        <Button 
          onClick={onConfirm} 
          disabled={!canImport}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Import {data.length} Transactions
        </Button>
      </div>
    </div>
  )
}
