
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Plus } from 'lucide-react'

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([])

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/personal/vehicles')
      if (response.ok) {
        const data = await response.json()
        setVehicles(data.vehicles || [])
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vehicles</h1>
          <p className="text-muted-foreground">Manage your vehicles</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No vehicles added yet</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Vehicle
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {vehicles.map((vehicle: any) => (
                <div key={vehicle.id} className="p-4 border rounded-lg hover:bg-accent">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                      {vehicle.licensePlate && (
                        <p className="text-sm text-muted-foreground">License: {vehicle.licensePlate}</p>
                      )}
                      {vehicle.mileage && (
                        <p className="text-xs text-muted-foreground">Mileage: {vehicle.mileage.toLocaleString()} mi</p>
                      )}
                    </div>
                    {vehicle.currentValue && (
                      <p className="font-bold">${vehicle.currentValue.toLocaleString()}</p>
                    )}
                  </div>
                  {vehicle.registrationExpiry && (
                    <p className="text-xs text-orange-600">
                      Registration expires: {new Date(vehicle.registrationExpiry).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
