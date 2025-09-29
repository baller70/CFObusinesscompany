
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ColumnMappingStepProps {
  headers: string[]
  sampleData: any[]
  onMappingComplete: (mapping: Record<string, string>) => void
  onBack: () => void
}

const REQUIRED_FIELDS = [
  { key: 'date', label: 'Date', required: true, description: 'Transaction date' },
  { key: 'amount', label: 'Amount', required: true, description: 'Transaction amount (positive or negative)' },
  { key: 'description', label: 'Description', required: true, description: 'Transaction description or merchant' },
]

const OPTIONAL_FIELDS = [
  { key: 'category', label: 'Category', required: false, description: 'Transaction category (we can auto-categorize if missing)' },
  { key: 'merchant', label: 'Merchant', required: false, description: 'Merchant or payee name' },
  { key: 'account', label: 'Account', required: false, description: 'Account name or number' },
  { key: 'type', label: 'Type', required: false, description: 'Transaction type (income/expense)' },
]

export function ColumnMappingStep({ headers, sampleData, onMappingComplete, onBack }: ColumnMappingStepProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [autoMapped, setAutoMapped] = useState(false)

  // Auto-detect column mappings
  useEffect(() => {
    const autoMapping: Record<string, string> = {}
    
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase()
      
      // Date mapping
      if ((lowerHeader.includes('date') || lowerHeader.includes('posted') || lowerHeader.includes('transaction')) && !autoMapping.date) {
        autoMapping.date = header
      }
      
      // Amount mapping
      if ((lowerHeader.includes('amount') || lowerHeader.includes('debit') || lowerHeader.includes('credit') || lowerHeader === 'sum') && !autoMapping.amount) {
        autoMapping.amount = header
      }
      
      // Description mapping
      if ((lowerHeader.includes('description') || lowerHeader.includes('memo') || lowerHeader.includes('details') || lowerHeader.includes('transaction')) && !autoMapping.description) {
        autoMapping.description = header
      }
      
      // Category mapping
      if ((lowerHeader.includes('category') || lowerHeader.includes('type')) && !autoMapping.category) {
        autoMapping.category = header
      }
      
      // Merchant mapping
      if ((lowerHeader.includes('merchant') || lowerHeader.includes('payee') || lowerHeader.includes('vendor')) && !autoMapping.merchant) {
        autoMapping.merchant = header
      }
      
      // Account mapping
      if ((lowerHeader.includes('account') || lowerHeader.includes('card')) && !autoMapping.account) {
        autoMapping.account = header
      }
    })
    
    setMapping(autoMapping)
    setAutoMapped(Object.keys(autoMapping).length > 0)
  }, [headers])

  const handleMappingChange = (field: string, header: string) => {
    setMapping(prev => ({
      ...prev,
      [field]: header === 'none' ? '' : header
    }))
  }

  const getValidationErrors = (): string[] => {
    const errors: string[] = []
    
    REQUIRED_FIELDS.forEach(field => {
      if (!mapping[field.key]) {
        errors.push(`${field.label} is required`)
      }
    })
    
    return errors
  }

  const canProceed = () => {
    return getValidationErrors().length === 0
  }

  const handleContinue = () => {
    if (canProceed()) {
      onMappingComplete(mapping)
    }
  }

  const validationErrors = getValidationErrors()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Map Your CSV Columns</CardTitle>
          <CardDescription>
            Tell us which columns contain your financial data. We've tried to auto-detect the mappings.
          </CardDescription>
          {autoMapped && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                We've automatically mapped some columns based on their names. Please review and adjust if needed.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Required Fields */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Required Fields</h3>
              <div className="space-y-4">
                {REQUIRED_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">
                        {field.label}
                      </label>
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    </div>
                    <p className="text-xs text-gray-500">{field.description}</p>
                    <Select 
                      value={mapping[field.key] || 'none'} 
                      onValueChange={(value) => handleMappingChange(field.key, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Not mapped --</SelectItem>
                        {headers.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional Fields */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Optional Fields</h3>
              <div className="space-y-4">
                {OPTIONAL_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">
                        {field.label}
                      </label>
                      <Badge variant="outline" className="text-xs">Optional</Badge>
                    </div>
                    <p className="text-xs text-gray-500">{field.description}</p>
                    <Select 
                      value={mapping[field.key] || 'none'} 
                      onValueChange={(value) => handleMappingChange(field.key, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Not mapped --</SelectItem>
                        {headers.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {validationErrors.map((error, index) => (
                    <p key={index}>{error}</p>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Sample Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Data Preview</CardTitle>
          <CardDescription>Here's a preview of your first few rows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {headers.map((header) => (
                    <th key={header} className="text-left p-2 font-medium text-gray-900">
                      {header}
                      {Object.values(mapping).includes(header) && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {Object.keys(mapping).find(key => mapping[key] === header)}
                        </Badge>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sampleData.map((row, index) => (
                  <tr key={index} className="border-b">
                    {headers.map((header) => (
                      <td key={header} className="p-2 text-gray-600">
                        {row[header] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleContinue} disabled={!canProceed()}>
          Continue to Preview
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
