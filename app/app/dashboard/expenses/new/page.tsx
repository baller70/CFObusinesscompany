
'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Upload, X, FileText } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NewExpensePage() {
  const { data: session, status } = useSession() || {}
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [expense, setExpense] = useState({
    vendor: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    reference: '',
    description: ''
  })

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Handle authentication redirect properly
  if (status === 'loading') {
    return <div className="p-6">Loading...</div>
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  const handleInputChange = (field: string, value: string) => {
    setExpense(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      
      // Check file type
      const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a PNG, JPG, or PDF file')
        return
      }
      
      setUploadedFile(file)
      toast.success('Receipt uploaded successfully!')
    }
  }

  const removeUploadedFile = () => {
    setUploadedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSaveDraft = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Expense saved as draft!')
      router.push('/dashboard/expenses')
    } catch (error) {
      toast.error('Failed to save draft')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveExpense = async () => {
    // Basic validation
    if (!expense.vendor || !expense.amount || !expense.category) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Expense saved successfully!')
      router.push('/dashboard/expenses')
    } catch (error) {
      toast.error('Failed to save expense')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/dashboard/expenses">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Expense</h1>
          <p className="text-gray-600 mt-1">Record a new business expense</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor *</Label>
              <Select value={expense.vendor} onValueChange={(value) => handleInputChange('vendor', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendor1">Office Supplies Inc</SelectItem>
                  <SelectItem value="vendor2">Tech Solutions LLC</SelectItem>
                  <SelectItem value="vendor3">Professional Services Corp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input 
                id="amount" 
                type="number" 
                step="0.01" 
                placeholder="0.00"
                value={expense.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={expense.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="office-supplies">Office Supplies</SelectItem>
                  <SelectItem value="travel">Travel & Entertainment</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="rent">Rent & Utilities</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input 
                id="date" 
                type="date"
                value={expense.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={expense.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit-card">Business Credit Card</SelectItem>
                  <SelectItem value="checking">Business Checking</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input 
                id="reference" 
                placeholder="Invoice/Receipt number"
                value={expense.reference}
                onChange={(e) => handleInputChange('reference', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Describe the expense..."
              rows={3}
              value={expense.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <Label>Receipt/Documentation</Label>
            {uploadedFile ? (
              <div className="border border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">{uploadedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={removeUploadedFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".png,.jpg,.jpeg,.pdf"
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                    >
                      Upload Receipt
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    PNG, JPG, PDF up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Link href="/dashboard/expenses">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={handleSaveDraft}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button 
              onClick={handleSaveExpense}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Expense'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
