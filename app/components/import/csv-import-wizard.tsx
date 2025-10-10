
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Download,
  Eye
} from 'lucide-react'
import { FileUploadStep } from './file-upload-step'
import { ColumnMappingStep } from './column-mapping-step'
import { PreviewStep } from './preview-step'
import { toast } from 'sonner'

interface CsvUpload {
  id: string
  fileName: string
  originalName: string
  recordCount: number
  processedCount: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  createdAt: Date
  errorLog?: string | null
}

interface CsvImportWizardProps {
  userId: string
  recentUploads: CsvUpload[]
}

type WizardStep = 'upload' | 'mapping' | 'preview' | 'processing' | 'complete'

export function CsvImportWizard({ userId, recentUploads }: CsvImportWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  
  const steps = [
    { key: 'upload', label: 'Upload File', icon: Upload },
    { key: 'mapping', label: 'Map Columns', icon: FileText },
    { key: 'preview', label: 'Preview', icon: Eye },
    { key: 'processing', label: 'Processing', icon: Loader2 },
    { key: 'complete', label: 'Complete', icon: CheckCircle }
  ]

  const getStepStatus = (step: string) => {
    const stepIndex = steps.findIndex(s => s.key === step)
    const currentIndex = steps.findIndex(s => s.key === currentStep)
    
    if (stepIndex < currentIndex) return 'complete'
    if (stepIndex === currentIndex) return 'current'
    return 'pending'
  }

  const handleFileUpload = (file: File, data: any[], headerRow: string[]) => {
    setUploadedFile(file)
    setCsvData(data)
    setHeaders(headerRow)
    setCurrentStep('mapping')
  }

  const handleColumnMapping = (mapping: Record<string, string>) => {
    setColumnMapping(mapping)
    setCurrentStep('preview')
  }

  const handlePreviewConfirm = async () => {
    if (!uploadedFile) return
    
    setCurrentStep('processing')
    setIsProcessing(true)
    
    try {
      // Upload file to S3
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('userId', userId)
      formData.append('columnMapping', JSON.stringify(columnMapping))
      
      const response = await fetch('/api/csv/upload', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }
      
      // Process the CSV data
      const processResponse = await fetch('/api/csv/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId: result.uploadId,
          userId,
          columnMapping
        })
      })
      
      const processResult = await processResponse.json()
      
      if (!processResponse.ok) {
        throw new Error(processResult.error || 'Processing failed')
      }
      
      setUploadResult(processResult)
      setCurrentStep('complete')
      toast.success(`Successfully processed ${processResult.processedCount} transactions`)
      
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setCurrentStep('upload')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetWizard = () => {
    setCurrentStep('upload')
    setUploadedFile(null)
    setCsvData([])
    setHeaders([])
    setColumnMapping({})
    setUploadResult(null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Import Progress</CardTitle>
          <CardDescription>Follow these steps to import your financial data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, index) => {
              const status = getStepStatus(step.key)
              return (
                <div key={step.key} className="flex flex-col items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    status === 'complete' ? 'bg-green-500 border-green-500 text-white' :
                    status === 'current' ? 'bg-blue-500 border-blue-500 text-white' :
                    'border-gray-300 text-gray-300'
                  }`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className={`text-xs mt-2 ${
                    status === 'complete' ? 'text-green-600' :
                    status === 'current' ? 'text-blue-600' :
                    'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`absolute h-px w-20 mt-5 ${
                      status === 'complete' ? 'bg-green-500' : 'bg-gray-300'
                    }`} style={{ left: `${(index * 25) + 12.5}%` }} />
                  )}
                </div>
              )
            })}
          </div>
          
          <Progress 
            value={(steps.findIndex(s => s.key === currentStep) / (steps.length - 1)) * 100} 
            className="h-2" 
          />
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === 'upload' && (
        <FileUploadStep onFileUpload={handleFileUpload} />
      )}
      
      {currentStep === 'mapping' && (
        <ColumnMappingStep 
          headers={headers}
          sampleData={csvData.slice(0, 3)}
          onMappingComplete={handleColumnMapping}
          onBack={() => setCurrentStep('upload')}
        />
      )}
      
      {currentStep === 'preview' && (
        <PreviewStep 
          data={csvData.slice(0, 10)}
          columnMapping={columnMapping}
          fileName={uploadedFile?.name || ''}
          onConfirm={handlePreviewConfirm}
          onBack={() => setCurrentStep('mapping')}
        />
      )}
      
      {currentStep === 'processing' && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Your Data</h3>
              <p className="text-gray-600 mb-4">
                We're importing and categorizing your transactions. This may take a few moments.
              </p>
              <Progress value={75} className="max-w-xs mx-auto" />
            </div>
          </CardContent>
        </Card>
      )}
      
      {currentStep === 'complete' && uploadResult && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Import Complete!</h3>
              <p className="text-gray-600 mb-6">
                Successfully imported {uploadResult.processedCount} transactions from your CSV file.
              </p>
              
              <div className="flex justify-center space-x-4">
                <Button onClick={() => window.location.href = '/dashboard'}>
                  View Dashboard
                </Button>
                <Button variant="outline" onClick={resetWizard}>
                  Import Another File
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Uploads */}
      {recentUploads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Imports</CardTitle>
            <CardDescription>Your previously uploaded files</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUploads.map((upload) => (
                <div key={upload.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      upload.status === 'COMPLETED' ? 'bg-green-100' :
                      upload.status === 'FAILED' ? 'bg-red-100' :
                      'bg-blue-100'
                    }`}>
                      {upload.status === 'COMPLETED' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : upload.status === 'FAILED' ? (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{upload.originalName}</p>
                      <p className="text-xs text-gray-500">
                        {upload.processedCount} of {upload.recordCount} records • {' '}
                        {new Date(upload.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      upload.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      upload.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {upload.status.toLowerCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
