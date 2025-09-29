
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NewBillPage() {
  const { data: session, status } = useSession() || {}
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const [bill, setBill] = useState({
    vendor: '',
    amount: '',
    billNumber: '',
    dueDate: '',
    issueDate: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    status: 'PENDING'
  })

  // Handle authentication redirect properly
  if (status === 'loading') {
    return <div className="p-6">Loading...</div>
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  const handleInputChange = (field: string, value: string) => {
    setBill(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveBill = async () => {
    // Basic validation
    if (!bill.vendor || !bill.amount || !bill.dueDate) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Bill created successfully!')
      router.push('/dashboard/expenses/bills')
    } catch (error) {
      toast.error('Failed to create bill')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Bill saved as draft!')
      router.push('/dashboard/expenses/bills')
    } catch (error) {
      toast.error('Failed to save draft')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/dashboard/expenses/bills">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bills
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Bill</h1>
          <p className="text-gray-600 mt-1">Create a new bill to track upcoming payments</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bill Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor *</Label>
              <Select value={bill.vendor} onValueChange={(value) => handleInputChange('vendor', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendor1">Office Supplies Inc</SelectItem>
                  <SelectItem value="vendor2">Tech Solutions LLC</SelectItem>
                  <SelectItem value="vendor3">Professional Services Corp</SelectItem>
                  <SelectItem value="vendor4">Utilities Company</SelectItem>
                  <SelectItem value="vendor5">Marketing Agency</SelectItem>
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
                value={bill.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billNumber">Bill Number</Label>
              <Input 
                id="billNumber" 
                placeholder="Enter bill number"
                value={bill.billNumber}
                onChange={(e) => handleInputChange('billNumber', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={bill.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="office-supplies">Office Supplies</SelectItem>
                  <SelectItem value="professional-services">Professional Services</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date</Label>
              <Input 
                id="issueDate" 
                type="date"
                value={bill.issueDate}
                onChange={(e) => handleInputChange('issueDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input 
                id="dueDate" 
                type="date"
                value={bill.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Add notes about this bill..."
              rows={3}
              value={bill.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Link href="/dashboard/expenses/bills">
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
              onClick={handleSaveBill}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Bill'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
