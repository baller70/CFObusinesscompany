
'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, Download, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ImportStep {
  id: number;
  title: string;
  status: 'pending' | 'active' | 'completed';
}

export default function ImportPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importType, setImportType] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const steps: ImportStep[] = [
    { id: 1, title: 'Select File', status: currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : 'pending' },
    { id: 2, title: 'Map Columns', status: currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : 'pending' },
    { id: 3, title: 'Review & Import', status: currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : 'pending' }
  ]

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['.csv', '.xlsx', '.xls']
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      
      if (!allowedTypes.includes(fileExtension)) {
        toast.error('Please select a CSV or Excel file')
        return
      }

      setSelectedFile(file)
      toast.success('File selected successfully!')
    }
  }, [])

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    } else {
      handleImport()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleImport = async () => {
    setIsProcessing(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i)
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      toast.success('Data imported successfully!')
      setCurrentStep(4) // Set to completed state
    } catch (error) {
      toast.error('Import failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStepIcon = (step: ImportStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'active':
        return <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">{step.id}</div>
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold">{step.id}</div>
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Import Data</h1>
        <p className="text-gray-600 mt-1">Import transactions, customers, or other data from CSV or Excel files</p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center">
                {getStepIcon(step)}
                <span className={`ml-2 font-medium ${step.status === 'active' ? 'text-blue-600' : step.status === 'completed' ? 'text-green-600' : 'text-gray-500'}`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 mx-4 h-1 ${step.status === 'completed' ? 'bg-green-600' : 'bg-gray-200'} rounded`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Select File to Import
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="importType">What are you importing?</Label>
                <Select value={importType} onValueChange={setImportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select import type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transactions">Transactions</SelectItem>
                    <SelectItem value="customers">Customers</SelectItem>
                    <SelectItem value="vendors">Vendors</SelectItem>
                    <SelectItem value="products">Products</SelectItem>
                    <SelectItem value="categories">Categories</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Upload File</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          CSV, XLSX, XLS up to 50MB
                        </span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleFileSelect}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {selectedFile && (
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex justify-between">
              <div></div>
              <Button 
                onClick={handleNext} 
                disabled={!selectedFile || !importType}
              >
                Next: Map Columns
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Map Columns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Map the columns in your file to the corresponding fields in the system
                </AlertDescription>
              </Alert>

              {/* Mock column mapping interface */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date Column</Label>
                  <Select defaultValue="column1">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="column1">Column 1: Date</SelectItem>
                      <SelectItem value="column2">Column 2: Transaction Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Amount Column</Label>
                  <Select defaultValue="column3">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="column3">Column 3: Amount</SelectItem>
                      <SelectItem value="column4">Column 4: Value</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Description Column</Label>
                  <Select defaultValue="column5">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="column5">Column 5: Description</SelectItem>
                      <SelectItem value="column6">Column 6: Details</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Category Column (Optional)</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="column7">Column 7: Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleNext}>
                Next: Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Ready to import {selectedFile?.name}. Please review the details below.
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Import Summary</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>File:</strong> {selectedFile?.name}</div>
                  <div><strong>Type:</strong> {importType}</div>
                  <div><strong>Estimated Records:</strong> ~50 rows</div>
                </div>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Import Progress</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack} disabled={isProcessing}>
                Back
              </Button>
              <Button onClick={handleNext} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import Data'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              Import Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your data has been successfully imported! You can now view the imported records in the corresponding sections.
              </AlertDescription>
            </Alert>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-green-800">Import Results</h4>
              <div className="space-y-1 text-sm text-green-700">
                <div>✓ 47 records imported successfully</div>
                <div>✓ 0 records skipped</div>
                <div>✓ 0 errors encountered</div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button onClick={() => {
                setCurrentStep(1)
                setSelectedFile(null)
                setImportType('')
                setUploadProgress(0)
              }}>
                Import Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sample Template Downloads */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Download Sample Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Download sample templates to see the expected format for your data
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Transactions', 'Customers', 'Products'].map((template) => (
              <Button 
                key={template}
                variant="outline" 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  // Create and trigger download of CSV template
                  const csvContent = template === 'Transactions' 
                    ? 'Date,Amount,Description,Category\n2024-01-01,100.00,Sample Transaction,Expenses'
                    : template === 'Customers'
                    ? 'Name,Email,Phone,Address\nJohn Doe,john@example.com,555-0123,123 Main St'
                    : 'Name,Price,Category,SKU\nSample Product,29.99,Electronics,SP001';
                  
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${template.toLowerCase()}_template.csv`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                  
                  toast.success(`${template} template downloaded!`);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                {template} Template
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
