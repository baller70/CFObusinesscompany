
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'react-hot-toast'

interface VehicleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle?: any
  onSuccess: () => void
}

export function VehicleDialog({ open, onOpenChange, vehicle, onSuccess }: VehicleDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    vin: '',
    licensePlate: '',
    purchaseDate: '',
    purchasePrice: '',
    currentValue: '',
    mileage: '',
    color: '',
    fuelType: 'gasoline',
    insurancePolicy: '',
    registrationExpiry: '',
    inspectionExpiry: '',
    notes: ''
  })

  useEffect(() => {
    if (vehicle) {
      setFormData({
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year?.toString() || '',
        vin: vehicle.vin || '',
        licensePlate: vehicle.licensePlate || '',
        purchaseDate: vehicle.purchaseDate ? new Date(vehicle.purchaseDate).toISOString().split('T')[0] : '',
        purchasePrice: vehicle.purchasePrice?.toString() || '',
        currentValue: vehicle.currentValue?.toString() || '',
        mileage: vehicle.mileage?.toString() || '',
        color: vehicle.color || '',
        fuelType: vehicle.fuelType || 'gasoline',
        insurancePolicy: vehicle.insurancePolicy || '',
        registrationExpiry: vehicle.registrationExpiry ? new Date(vehicle.registrationExpiry).toISOString().split('T')[0] : '',
        inspectionExpiry: vehicle.inspectionExpiry ? new Date(vehicle.inspectionExpiry).toISOString().split('T')[0] : '',
        notes: vehicle.notes || ''
      })
    } else {
      setFormData({
        make: '',
        model: '',
        year: '',
        vin: '',
        licensePlate: '',
        purchaseDate: '',
        purchasePrice: '',
        currentValue: '',
        mileage: '',
        color: '',
        fuelType: 'gasoline',
        insurancePolicy: '',
        registrationExpiry: '',
        inspectionExpiry: '',
        notes: ''
      })
    }
  }, [vehicle, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = '/api/personal/vehicles'
      const method = vehicle ? 'PUT' : 'POST'
      const payload = vehicle ? { ...formData, id: vehicle.id } : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Failed to save vehicle')
      }

      toast.success(vehicle ? 'Vehicle updated successfully' : 'Vehicle added successfully')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving vehicle:', error)
      toast.error('Failed to save vehicle')
    } finally {
      setLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vehicle ? 'Edit' : 'Add'} Vehicle</DialogTitle>
          <DialogDescription>
            {vehicle ? 'Update the details of this vehicle.' : 'Add a new vehicle to your inventory.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Select
                value={formData.year}
                onValueChange={(value) => setFormData({ ...formData, year: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="make">Make *</Label>
              <Input
                id="make"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                placeholder="e.g., Toyota"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="e.g., Camry"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vin">VIN</Label>
              <Input
                id="vin"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                placeholder="Vehicle Identification Number"
                maxLength={17}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="licensePlate">License Plate</Label>
              <Input
                id="licensePlate"
                value={formData.licensePlate}
                onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                placeholder="ABC-1234"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="e.g., Blue"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mileage">Mileage</Label>
              <Input
                id="mileage"
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                placeholder="Current mileage"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuelType">Fuel Type</Label>
              <Select
                value={formData.fuelType}
                onValueChange={(value) => setFormData({ ...formData, fuelType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasoline">Gasoline</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="plug-in-hybrid">Plug-in Hybrid</SelectItem>
                </SelectContent>
              </Select>
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
              <Label htmlFor="insurancePolicy">Insurance Policy #</Label>
              <Input
                id="insurancePolicy"
                value={formData.insurancePolicy}
                onChange={(e) => setFormData({ ...formData, insurancePolicy: e.target.value })}
                placeholder="Policy number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationExpiry">Registration Expiry</Label>
              <Input
                id="registrationExpiry"
                type="date"
                value={formData.registrationExpiry}
                onChange={(e) => setFormData({ ...formData, registrationExpiry: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inspectionExpiry">Inspection Expiry</Label>
              <Input
                id="inspectionExpiry"
                type="date"
                value={formData.inspectionExpiry}
                onChange={(e) => setFormData({ ...formData, inspectionExpiry: e.target.value })}
              />
            </div>

            <div className="space-y-2 col-span-3">
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
              {loading ? 'Saving...' : vehicle ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
