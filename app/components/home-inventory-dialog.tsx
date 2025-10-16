
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'react-hot-toast'

interface HomeInventoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: any
  onSuccess: () => void
}

export function HomeInventoryDialog({ open, onOpenChange, item, onSuccess }: HomeInventoryDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'ELECTRONICS',
    purchaseDate: '',
    purchasePrice: '',
    currentValue: '',
    location: '',
    brand: '',
    model: '',
    serialNumber: '',
    warrantyExpiration: '',
    notes: ''
  })

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        category: item.category || 'ELECTRONICS',
        purchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : '',
        purchasePrice: item.purchasePrice?.toString() || '',
        currentValue: item.currentValue?.toString() || '',
        location: item.location || '',
        brand: item.brand || '',
        model: item.model || '',
        serialNumber: item.serialNumber || '',
        warrantyExpiration: item.warrantyExpiration ? new Date(item.warrantyExpiration).toISOString().split('T')[0] : '',
        notes: item.notes || ''
      })
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'ELECTRONICS',
        purchaseDate: '',
        purchasePrice: '',
        currentValue: '',
        location: '',
        brand: '',
        model: '',
        serialNumber: '',
        warrantyExpiration: '',
        notes: ''
      })
    }
  }, [item, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = '/api/personal/home-inventory'
      const method = item ? 'PUT' : 'POST'
      const payload = item ? { ...formData, id: item.id } : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Failed to save item')
      }

      toast.success(item ? 'Item updated successfully' : 'Item added successfully')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving item:', error)
      toast.error('Failed to save item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit' : 'Add'} Inventory Item</DialogTitle>
          <DialogDescription>
            {item ? 'Update the details of this item.' : 'Add a new item to your home inventory.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder='e.g., 65" Samsung TV'
                required
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details about the item"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ELECTRONICS">Electronics</SelectItem>
                  <SelectItem value="FURNITURE">Furniture</SelectItem>
                  <SelectItem value="APPLIANCES">Appliances</SelectItem>
                  <SelectItem value="JEWELRY">Jewelry</SelectItem>
                  <SelectItem value="ART">Art</SelectItem>
                  <SelectItem value="COLLECTIBLES">Collectibles</SelectItem>
                  <SelectItem value="TOOLS">Tools</SelectItem>
                  <SelectItem value="SPORTING_GOODS">Sporting Goods</SelectItem>
                  <SelectItem value="CLOTHING">Clothing</SelectItem>
                  <SelectItem value="BOOKS">Books</SelectItem>
                  <SelectItem value="KITCHEN">Kitchen</SelectItem>
                  <SelectItem value="OUTDOOR">Outdoor</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Living Room, Bedroom"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g., Samsung, Sony"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Model number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                placeholder="Serial or ID number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentValue">Current Value</Label>
              <Input
                id="currentValue"
                type="number"
                step="0.01"
                value={formData.currentValue}
                onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warrantyExpiration">Warranty Expiration</Label>
              <Input
                id="warrantyExpiration"
                type="date"
                value={formData.warrantyExpiration}
                onChange={(e) => setFormData({ ...formData, warrantyExpiration: e.target.value })}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information"
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
