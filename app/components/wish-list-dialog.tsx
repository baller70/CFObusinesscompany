
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'

interface WishListDialogProps {
  open: boolean
  onClose: () => void
  onSave: () => void
  wishList?: any
}

const CATEGORIES = [
  'Electronics',
  'Clothing & Accessories',
  'Home & Garden',
  'Food & Groceries',
  'Entertainment',
  'Health & Beauty',
  'Sports & Outdoors',
  'Books & Media',
  'Toys & Games',
  'Automotive',
  'Pet Supplies',
  'Office Supplies',
  'Other'
]

export function WishListDialog({ open, onClose, onSave, wishList }: WishListDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    priority: 'MEDIUM',
    targetAmount: '',
    savedAmount: '0',
    targetDate: '',
    isActive: true,
    notes: ''
  })

  useEffect(() => {
    if (wishList) {
      setFormData({
        name: wishList.name || '',
        description: wishList.description || '',
        category: wishList.category || '',
        priority: wishList.priority || 'MEDIUM',
        targetAmount: wishList.targetAmount?.toString() || '',
        savedAmount: wishList.savedAmount?.toString() || '0',
        targetDate: wishList.targetDate ? new Date(wishList.targetDate).toISOString().split('T')[0] : '',
        isActive: wishList.isActive !== undefined ? wishList.isActive : true,
        notes: wishList.notes || ''
      })
    } else {
      setFormData({
        name: '',
        description: '',
        category: '',
        priority: 'MEDIUM',
        targetAmount: '',
        savedAmount: '0',
        targetDate: '',
        isActive: true,
        notes: ''
      })
    }
  }, [wishList, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = '/api/personal/wish-lists'
      const method = wishList ? 'PUT' : 'POST'
      const body = wishList ? { ...formData, id: wishList.id } : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        toast.success(wishList ? 'Wish list updated successfully' : 'Wish list created successfully')
        onSave()
        onClose()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to save wish list')
      }
    } catch (error) {
      console.error('Error saving wish list:', error)
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{wishList ? 'Edit Wish List' : 'Create Wish List'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">List Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Christmas Shopping, Home Renovation"
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What is this wish list for?"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="targetAmount">Target Amount ($)</Label>
              <Input
                id="targetAmount"
                type="number"
                step="0.01"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            {wishList && (
              <div>
                <Label htmlFor="savedAmount">Saved Amount ($)</Label>
                <Input
                  id="savedAmount"
                  type="number"
                  step="0.01"
                  value={formData.savedAmount}
                  onChange={(e) => setFormData({ ...formData, savedAmount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            )}

            <div>
              <Label htmlFor="targetDate">Target Date</Label>
              <Input
                id="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              />
            </div>

            {wishList && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            )}

            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this wish list"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : wishList ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
