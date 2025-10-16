
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'

interface ReceiptDialogProps {
  open: boolean
  onClose: () => void
  onSave: () => void
  receipt?: any
}

const RECEIPT_CATEGORIES = [
  'Groceries',
  'Department Stores',
  'Clothing & Shoes',
  'Electronics',
  'Home & Garden',
  'Pharmacy',
  'Sporting Goods',
  'Books & Music',
  'Toys & Games',
  'Pet Supplies',
  'Office Supplies',
  'Convenience Stores',
  'Restaurants',
  'Gas Stations',
  'Other'
]

export function ReceiptDialog({ open, onClose, onSave, receipt }: ReceiptDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    vendor: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    taxDeductible: false,
    businessExpense: false
  })

  useEffect(() => {
    if (receipt) {
      setFormData({
        vendor: receipt.vendor || '',
        amount: receipt.amount?.toString() || '',
        date: receipt.date ? new Date(receipt.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        category: receipt.category || '',
        description: receipt.description || '',
        taxDeductible: receipt.taxDeductible || false,
        businessExpense: receipt.businessExpense || false
      })
    } else {
      setFormData({
        vendor: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: '',
        description: '',
        taxDeductible: false,
        businessExpense: false
      })
    }
  }, [receipt, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = '/api/personal/receipts'
      const method = receipt ? 'PUT' : 'POST'
      const body = receipt ? { ...formData, id: receipt.id } : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        toast.success(receipt ? 'Receipt updated successfully' : 'Receipt added successfully')
        onSave()
        onClose()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to save receipt')
      }
    } catch (error) {
      console.error('Error saving receipt:', error)
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{receipt ? 'Edit Receipt' : 'Add Receipt'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="vendor">Vendor/Store *</Label>
              <Input
                id="vendor"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="e.g., Walmart, Target, Amazon"
                required
              />
            </div>

            <div>
              <Label htmlFor="amount">Amount ($) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {RECEIPT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What did you purchase?"
                rows={3}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="taxDeductible"
                  checked={formData.taxDeductible}
                  onChange={(e) => setFormData({ ...formData, taxDeductible: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="taxDeductible">Tax Deductible</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="businessExpense"
                  checked={formData.businessExpense}
                  onChange={(e) => setFormData({ ...formData, businessExpense: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="businessExpense">Business Expense</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : receipt ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
