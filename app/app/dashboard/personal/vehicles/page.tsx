'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Car, Plus, Edit, Trash2, AlertTriangle, DollarSign } from 'lucide-react'
import { VehicleDialog } from '@/components/vehicle-dialog'
import { toast } from 'react-hot-toast'
import { BackButton } from '@/components/ui/back-button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [vehicleToDelete, setVehicleToDelete] = useState<any>(null)

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/personal/vehicles')
      if (response.ok) {
        const data = await response.json()
        setVehicles(data.vehicles || [])
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      toast.error('Failed to load vehicles')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (vehicle: any) => {
    setSelectedVehicle(vehicle)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setSelectedVehicle(null)
    setDialogOpen(true)
  }

  const handleDeleteClick = (vehicle: any) => {
    setVehicleToDelete(vehicle)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!vehicleToDelete) return

    try {
      const response = await fetch(`/api/personal/vehicles?id=${vehicleToDelete.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete vehicle')
      }

      toast.success('Vehicle deleted successfully')
      fetchVehicles()
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      toast.error('Failed to delete vehicle')
    } finally {
      setDeleteDialogOpen(false)
      setVehicleToDelete(null)
    }
  }

  const isExpiringSoon = (date: string | null) => {
    if (!date) return false
    const expiryDate = new Date(date)
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30
  }

  const isExpired = (date: string | null) => {
    if (!date) return false
    return new Date(date) < new Date()
  }

  const totalValue = vehicles.reduce((sum, vehicle: any) => sum + (vehicle.currentValue || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vehicles</h1>
          <p className="text-muted-foreground">Manage your vehicle inventory</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BackButton href="/dashboard/personal" />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Your Vehicles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-12">
              <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No vehicles added yet</p>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Vehicle
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicles.map((vehicle: any) => (
                <div key={vehicle.id} className="p-4 border rounded-lg hover:bg-accent transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-medium text-lg">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                      {vehicle.color && (
                        <p className="text-sm text-muted-foreground">{vehicle.color}</p>
                      )}
                      {vehicle.licensePlate && (
                        <p className="text-sm text-muted-foreground">🚗 {vehicle.licensePlate}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(vehicle)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(vehicle)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {vehicle.currentValue && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Current Value:</span>
                        <span className="font-bold text-green-600">
                          ${vehicle.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {vehicle.mileage && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Mileage:</span>
                        <span>{vehicle.mileage.toLocaleString()} mi</span>
                      </div>
                    )}
                    {vehicle.fuelType && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Fuel Type:</span>
                        <span className="capitalize">{vehicle.fuelType}</span>
                      </div>
                    )}

                    {/* Expiry Warnings */}
                    <div className="pt-2 space-y-1">
                      {vehicle.registrationExpiry && (
                        <div className={`text-xs flex items-center gap-1 ${
                          isExpired(vehicle.registrationExpiry) 
                            ? 'text-red-600' 
                            : isExpiringSoon(vehicle.registrationExpiry) 
                            ? 'text-orange-600' 
                            : 'text-muted-foreground'
                        }`}>
                          {(isExpired(vehicle.registrationExpiry) || isExpiringSoon(vehicle.registrationExpiry)) && (
                            <AlertTriangle className="h-3 w-3" />
                          )}
                          Registration: {new Date(vehicle.registrationExpiry).toLocaleDateString()}
                          {isExpired(vehicle.registrationExpiry) && ' (EXPIRED)'}
                        </div>
                      )}
                      {vehicle.inspectionExpiry && (
                        <div className={`text-xs flex items-center gap-1 ${
                          isExpired(vehicle.inspectionExpiry) 
                            ? 'text-red-600' 
                            : isExpiringSoon(vehicle.inspectionExpiry) 
                            ? 'text-orange-600' 
                            : 'text-muted-foreground'
                        }`}>
                          {(isExpired(vehicle.inspectionExpiry) || isExpiringSoon(vehicle.inspectionExpiry)) && (
                            <AlertTriangle className="h-3 w-3" />
                          )}
                          Inspection: {new Date(vehicle.inspectionExpiry).toLocaleDateString()}
                          {isExpired(vehicle.inspectionExpiry) && ' (EXPIRED)'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <VehicleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        vehicle={selectedVehicle}
        onSuccess={fetchVehicles}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {vehicleToDelete?.year} {vehicleToDelete?.make} {vehicleToDelete?.model}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
