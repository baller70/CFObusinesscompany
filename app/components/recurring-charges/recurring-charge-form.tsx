
'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, DollarSign, Tag, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface RecurringCharge {
  id: string
  name: string
  description?: string
  amount: number
  category: string
  frequency: string
  nextDueDate: string
  vendor?: string
  billingCycle: number
  reminderEnabled: boolean
  reminderDays: number
  taxDeductible: boolean
  businessExpense: boolean
  notes?: string
  tags?: string[]
  autoPayEnabled: boolean
  paymentMethod?: string
}

interface RecurringChargeFormProps {
  charge?: RecurringCharge | null
  onClose: () => void
  onSuccess: () => void
}

const commonCategories = [
  'Software & SaaS',
  'Utilities',
  'Insurance',
  'Marketing & Advertising',
  'Office Supplies',
  'Professional Services',
  'Rent & Real Estate',
  'Communications',
  'Financial Services',
  'Entertainment',
  'Transportation',
  'Health & Wellness',
  'Education & Training',
  'Other'
]

const frequencyOptions = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Bi-weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'BIMONTHLY', label: 'Bi-monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'SEMIANNUALLY', label: 'Semi-annually' },
  { value: 'ANNUALLY', label: 'Annually' },
  { value: 'CUSTOM', label: 'Custom' }
]

export function RecurringChargeForm({ charge, onClose, onSuccess }: RecurringChargeFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    category: '',
    frequency: 'MONTHLY',
    nextDueDate: '',
    vendor: '',
    billingCycle: 1,
    reminderEnabled: true,
    reminderDays: 3,
    taxDeductible: false,
    businessExpense: true,
    notes: '',
    tags: [] as string[],
    autoPayEnabled: false,
    paymentMethod: ''
  })

  const [customCategory, setCustomCategory] = useState('')
  const [newTag, setNewTag] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (charge) {
      setFormData({
        name: charge.name || '',
        description: charge.description || '',
        amount: charge.amount?.toString() || '',
        category: charge.category || '',
        frequency: charge.frequency || 'MONTHLY',
        nextDueDate: charge.nextDueDate ? new Date(charge.nextDueDate).toISOString().slice(0, 16) : '',
        vendor: charge.vendor || '',
        billingCycle: charge.billingCycle || 1,
        reminderEnabled: charge.reminderEnabled ?? true,
        reminderDays: charge.reminderDays ?? 3,
        taxDeductible: charge.taxDeductible ?? false,
        businessExpense: charge.businessExpense ?? true,
        notes: charge.notes || '',
        tags: charge.tags || [],
        autoPayEnabled: charge.autoPayEnabled ?? false,
        paymentMethod: charge.paymentMethod || ''
      })
    } else {
      // Set default next due date to next month
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      setFormData(prev => ({
        ...prev,
        nextDueDate: nextMonth.toISOString().slice(0, 16)
      }))
    }
  }, [charge])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Amount must be greater than 0'
    if (!formData.category.trim() && !customCategory.trim()) newErrors.category = 'Category is required'
    if (!formData.nextDueDate) newErrors.nextDueDate = 'Next due date is required'
    
    const dueDate = new Date(formData.nextDueDate)
    if (isNaN(dueDate.getTime())) newErrors.nextDueDate = 'Invalid due date'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setLoading(true)

    try {
      const category = customCategory.trim() || formData.category
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        category,
        tags: formData.tags.filter(tag => tag.trim())
      }

      const url = charge ? `/api/recurring-charges/${charge.id}` : '/api/recurring-charges'
      const method = charge ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save recurring charge')
      }

      toast.success(charge ? 'Recurring charge updated!' : 'Recurring charge added!')
      onSuccess()
    } catch (error) {
      console.error('Error saving recurring charge:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save recurring charge')
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const calculateAnnualAmount = () => {
    const amount = parseFloat(formData.amount) || 0
    const multipliers = {
      DAILY: 365,
      WEEKLY: 52,
      BIWEEKLY: 26,
      MONTHLY: 12,
      BIMONTHLY: 6,
      QUARTERLY: 4,
      SEMIANNUALLY: 2,
      ANNUALLY: 1,
      CUSTOM: 12
    }
    
    const multiplier = multipliers[formData.frequency as keyof typeof multipliers] || 12
    return (amount * (multiplier / formData.billingCycle)).toFixed(2)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-heading">
            {charge ? 'Edit Recurring Charge' : 'Add Recurring Charge'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-body-large font-medium flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Netflix, Office 365, etc."
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-small text-destructive mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="vendor">Vendor</Label>
                  <Input
                    id="vendor"
                    value={formData.vendor}
                    onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                    placeholder="Company or service provider"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description of the service or charge"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-body-large font-medium flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Financial Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    className={errors.amount ? 'border-destructive' : ''}
                  />
                  {errors.amount && (
                    <p className="text-small text-destructive mt-1">{errors.amount}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="billingCycle">Billing Cycle</Label>
                  <Input
                    id="billingCycle"
                    type="number"
                    min="1"
                    value={formData.billingCycle}
                    onChange={(e) => setFormData(prev => ({ ...prev, billingCycle: parseInt(e.target.value) || 1 }))}
                    placeholder="1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    e.g., every 2 months = 2
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nextDueDate">Next Due Date *</Label>
                  <Input
                    id="nextDueDate"
                    type="datetime-local"
                    value={formData.nextDueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, nextDueDate: e.target.value }))}
                    className={errors.nextDueDate ? 'border-destructive' : ''}
                  />
                  {errors.nextDueDate && (
                    <p className="text-small text-destructive mt-1">{errors.nextDueDate}</p>
                  )}
                </div>

                <div>
                  <Label>Estimated Annual Cost</Label>
                  <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center">
                    <span className="text-body font-medium">
                      ${calculateAnnualAmount()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categorization */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-body-large font-medium flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                Categorization
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, category: value }))
                      if (value !== 'custom') setCustomCategory('')
                    }}
                  >
                    <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonCategories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom Category</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-small text-destructive mt-1">{errors.category}</p>
                  )}
                </div>

                {formData.category === 'custom' && (
                  <div>
                    <Label htmlFor="customCategory">Custom Category</Label>
                    <Input
                      id="customCategory"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter custom category"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="tags"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-body-large font-medium flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Settings & Preferences
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Reminder Notifications</Label>
                      <p className="text-small text-muted-foreground">Get notified before due date</p>
                    </div>
                    <Switch
                      checked={formData.reminderEnabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, reminderEnabled: checked }))}
                    />
                  </div>

                  {formData.reminderEnabled && (
                    <div>
                      <Label htmlFor="reminderDays">Reminder Days Before</Label>
                      <Input
                        id="reminderDays"
                        type="number"
                        min="0"
                        max="30"
                        value={formData.reminderDays}
                        onChange={(e) => setFormData(prev => ({ ...prev, reminderDays: parseInt(e.target.value) || 3 }))}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-pay Enabled</Label>
                      <p className="text-small text-muted-foreground">Automatically paid</p>
                    </div>
                    <Switch
                      checked={formData.autoPayEnabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoPayEnabled: checked }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Tax Deductible</Label>
                      <p className="text-small text-muted-foreground">Business expense deduction</p>
                    </div>
                    <Switch
                      checked={formData.taxDeductible}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, taxDeductible: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Business Expense</Label>
                      <p className="text-small text-muted-foreground">Related to business operations</p>
                    </div>
                    <Switch
                      checked={formData.businessExpense}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, businessExpense: checked }))}
                    />
                  </div>

                  {formData.autoPayEnabled && (
                    <div>
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Input
                        id="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        placeholder="Credit card, bank account, etc."
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes or information"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (charge ? 'Update Charge' : 'Add Charge')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
