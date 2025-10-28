
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface AddLiabilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const LIABILITY_TYPES = [
  'Mortgage',
  'Home Equity Loan',
  'Auto Loan',
  'Student Loan',
  'Personal Loan',
  'Credit Card',
  'Medical Debt',
  'Business Loan',
  'Tax Debt',
  'Other'
]

export function AddLiabilityDialog({ open, onOpenChange, onSuccess }: AddLiabilityDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    balance: '',
    interestRate: '',
    monthlyPayment: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.type || !formData.balance) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/personal/liabilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          balance: parseFloat(formData.balance),
          interestRate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
          monthlyPayment: formData.monthlyPayment ? parseFloat(formData.monthlyPayment) : undefined
        })
      })

      if (response.ok) {
        toast.success('Liability added successfully!')
        setFormData({ name: '', type: '', balance: '', interestRate: '', monthlyPayment: '' })
        onOpenChange(false)
        onSuccess?.()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to add liability')
      }
    } catch (error) {
      console.error('Error adding liability:', error)
      toast.error('Failed to add liability')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Liability</DialogTitle>
          <DialogDescription>
            Track your debts and obligations to calculate your net worth. Enter the details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Liability Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Home Mortgage, Car Loan"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Liability Type *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData({ ...formData, type: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select liability type" />
              </SelectTrigger>
              <SelectContent>
                {LIABILITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">Current Balance (USD) *</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interestRate">Interest Rate (%) (Optional)</Label>
            <Input
              id="interestRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="0.00"
              value={formData.interestRate}
              onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthlyPayment">Monthly Payment (USD) (Optional)</Label>
            <Input
              id="monthlyPayment"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.monthlyPayment}
              onChange={(e) => setFormData({ ...formData, monthlyPayment: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Liability'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
