
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'react-hot-toast'

interface VehicleExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicles: any[]
  onSuccess: () => void
}

export function VehicleExpenseDialog({ open, onOpenChange, vehicles, onSuccess }: VehicleExpenseDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    vehicleId: '',
    date: new Date().toISOString().split('T')[0],
    type: 'GAS',
    amount: '',
    mileage: '',
    vendor: '',
    description: '',
    notes: ''
  })

  useEffect(() => {
    if (open && !formData.vehicleId && vehicles.length > 0) {
      setFormData(prev => ({ ...prev, vehicleId: vehicles[0].id }))
    }
  }, [open, vehicles, formData.vehicleId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/personal/vehicle-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to save expense')
      }

      toast.success('Expense added successfully')
      onSuccess()
      onOpenChange(false)
      
      // Reset form
      setFormData({
        vehicleId: vehicles.length > 0 ? vehicles[0].id : '',
        date: new Date().toISOString().split('T')[0],
        type: 'GAS',
        amount: '',
        mileage: '',
        vendor: '',
        description: '',
        notes: ''
      })
    } catch (error) {
      console.error('Error saving expense:', error)
      toast.error('Failed to save expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Vehicle Expense</DialogTitle>
          <DialogDescription>
            Record a vehicle-related expense.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="vehicleId">Vehicle *</Label>
              <Select
                value={formData.vehicleId}
                onValueChange={(value) => setFormData({ ...formData, vehicleId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Expense Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GAS">Gas/Fuel</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="REPAIR">Repair</SelectItem>
                  <SelectItem value="INSURANCE">Insurance</SelectItem>
                  <SelectItem value="REGISTRATION">Registration</SelectItem>
                  <SelectItem value="INSPECTION">Inspection</SelectItem>
                  <SelectItem value="PARKING">Parking</SelectItem>
                  <SelectItem value="TOLLS">Tolls</SelectItem>
                  <SelectItem value="CAR_WASH">Car Wash</SelectItem>
                  <SelectItem value="ACCESSORIES">Accessories</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
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

            <div className="space-y-2">
              <Label htmlFor="mileage">Mileage at Service</Label>
              <Input
                id="mileage"
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                placeholder="Current mileage"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="vendor">Vendor/Service Provider</Label>
              <Input
                id="vendor"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="e.g., Shell, Jiffy Lube"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the expense"
                rows={2}
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
            <Button type="submit" disabled={loading || vehicles.length === 0}>
              {loading ? 'Saving...' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
