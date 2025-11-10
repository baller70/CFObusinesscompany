
'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface FileUploadStepProps {
  onFileUpload: (file: File, data: any[], headers: string[]) => void
}

export function FileUploadStep({ onFileUpload }: FileUploadStepProps) {
  const [dragOver, setDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>('')

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length === 0) {
      throw new Error('CSV file is empty')
    }

    const result = []
    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''))
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(value => value.trim().replace(/"/g, ''))
      if (values.length === headers.length) {
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index]
        })
        result.push(row)
      }
    }
    
    return { data: result, headers }
  }

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true)
    setError('')

    try {
      // Validate file
      if (!file.name.toLowerCase().endsWith('.csv')) {
        throw new Error('Please select a CSV file')
      }

      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        throw new Error('File size must be less than 50MB')
      }

      // Read and parse CSV
      const text = await file.text()
      const { data, headers } = parseCSV(text)

      if (data.length === 0) {
        throw new Error('No data rows found in CSV file')
      }

      if (data.length > 10000) {
        throw new Error('CSV file has too many rows (maximum 10,000)')
      }

      toast.success(`Successfully loaded ${data.length} rows`)
      onFileUpload(file, data, headers)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }, [onFileUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      processFile(files[0])
    }
  }, [processFile])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      processFile(files[0])
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Upload CSV File
          </CardTitle>
          <CardDescription>
            Upload a CSV file from your bank, credit card, or financial institution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
          >
            {isProcessing ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600">Processing your file...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drop your CSV file here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports files up to 50MB with up to 10,000 transactions
                  </p>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button className="cursor-pointer">
                    Choose File
                  </Button>
                </label>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">CSV Format Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Required Information</h4>
              <p className="text-sm text-gray-600 mb-3">
                Your CSV should contain transaction data with columns for:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Date of transaction</li>
                <li>• Transaction amount (positive or negative)</li>
                <li>• Description or merchant name</li>
                <li>• Category (optional - we can auto-categorize)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Common Sources</h4>
              <p className="text-sm text-gray-600">
                Most banks and financial institutions allow you to export transaction history as CSV files. 
                Look for "Export" or "Download" options in your online banking or credit card portals.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Example Format</h4>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                Date,Amount,Description,Category<br/>
                2024-01-15,-45.67,"Grocery Store","Food"<br/>
                2024-01-16,2500.00,"Salary Deposit","Income"<br/>
                2024-01-17,-120.00,"Electric Bill","Utilities"
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
