
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Upload, Save, X } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function NewExpenseClaimPage() {
  const router = useRouter()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: '',
    notes: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      toast.success('Receipt uploaded successfully')
    }
  }

  const handleSubmit = async (status: 'SUBMITTED' | 'DRAFT' = 'SUBMITTED') => {
    if (!formData.title || !formData.amount || !date) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success(`Expense claim ${status === 'DRAFT' ? 'saved as draft' : 'submitted'} successfully!`)
      router.push('/dashboard/expenses/claims')
    } catch (error) {
      toast.error('Failed to save expense claim')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Expense Claim</h1>
          <p className="text-gray-600 mt-1">Submit a new expense claim for reimbursement</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.back()}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Expense Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Expense Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Business Lunch, Travel Expense"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-7"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="travel">Travel & Transportation</SelectItem>
                      <SelectItem value="meals">Meals & Entertainment</SelectItem>
                      <SelectItem value="accommodation">Accommodation</SelectItem>
                      <SelectItem value="office-supplies">Office Supplies</SelectItem>
                      <SelectItem value="software">Software & Subscriptions</SelectItem>
                      <SelectItem value="training">Training & Education</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the business purpose of this expense..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information..."
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Receipt Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Receipt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="receipt-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        {selectedFile ? selectedFile.name : 'Upload Receipt'}
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        PNG, JPG, PDF up to 10MB
                      </span>
                      <input
                        id="receipt-upload"
                        name="receipt-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>
              </div>
              {selectedFile && (
                <div className="mt-4">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600 truncate">
                      {selectedFile.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Amount:</span>
                <span className="font-medium">
                  ${formData.amount ? parseFloat(formData.amount).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Date:</span>
                <span className="font-medium">
                  {date ? format(date, "MMM d, yyyy") : 'Not selected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Category:</span>
                <span className="font-medium">
                  {formData.category || 'Not selected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Receipt:</span>
                <span className="font-medium">
                  {selectedFile ? 'Attached' : 'No receipt'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              onClick={() => handleSubmit('SUBMITTED')} 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleSubmit('DRAFT')}
              className="w-full"
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
