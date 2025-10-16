
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'

interface WishListItemDialogProps {
  open: boolean
  onClose: () => void
  onSave: () => void
  wishListId: string
  item?: any
}

export function WishListItemDialog({ open, onClose, onSave, wishListId, item }: WishListItemDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    estimatedCost: '',
    url: '',
    imageUrl: '',
    priority: 'MEDIUM',
    isPurchased: false,
    purchasedDate: '',
    actualCost: '',
    notes: ''
  })

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        estimatedCost: item.estimatedCost?.toString() || '',
        url: item.url || '',
        imageUrl: item.imageUrl || '',
        priority: item.priority || 'MEDIUM',
        isPurchased: item.isPurchased || false,
        purchasedDate: item.purchasedDate ? new Date(item.purchasedDate).toISOString().split('T')[0] : '',
        actualCost: item.actualCost?.toString() || '',
        notes: item.notes || ''
      })
    } else {
      setFormData({
        name: '',
        description: '',
        estimatedCost: '',
        url: '',
        imageUrl: '',
        priority: 'MEDIUM',
        isPurchased: false,
        purchasedDate: '',
        actualCost: '',
        notes: ''
      })
    }
  }, [item, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = '/api/personal/wish-list-items'
      const method = item ? 'PUT' : 'POST'
      const body = item 
        ? { ...formData, id: item.id } 
        : { ...formData, wishListId }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        toast.success(item ? 'Item updated successfully' : 'Item added successfully')
        onSave()
        onClose()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to save item')
      }
    } catch (error) {
      console.error('Error saving item:', error)
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Item' : 'Add Item'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., iPhone 15 Pro, Winter Coat"
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Details about this item"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="estimatedCost">Estimated Cost ($) *</Label>
              <Input
                id="estimatedCost"
                type="number"
                step="0.01"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                placeholder="0.00"
                required
              />
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

            <div className="col-span-2">
              <Label htmlFor="url">Product URL</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com/product"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Sending_and_retrieving_form_data/client-server.png"
              />
            </div>

            {item && (
              <>
                <div className="col-span-2 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPurchased"
                    checked={formData.isPurchased}
                    onChange={(e) => setFormData({ ...formData, isPurchased: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isPurchased">Mark as Purchased</Label>
                </div>

                {formData.isPurchased && (
                  <>
                    <div>
                      <Label htmlFor="purchasedDate">Purchase Date</Label>
                      <Input
                        id="purchasedDate"
                        type="date"
                        value={formData.purchasedDate}
                        onChange={(e) => setFormData({ ...formData, purchasedDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="actualCost">Actual Cost ($)</Label>
                      <Input
                        id="actualCost"
                        type="number"
                        step="0.01"
                        value={formData.actualCost}
                        onChange={(e) => setFormData({ ...formData, actualCost: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this item"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : item ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
