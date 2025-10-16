'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Home, Plus, Package, Edit, Trash2, Tag } from 'lucide-react'
import { HomeInventoryDialog } from '@/components/home-inventory-dialog'
import { toast } from 'react-hot-toast'
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

export default function HomeInventoryPage() {
  const [items, setItems] = useState([])
  const [totalValue, setTotalValue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<any>(null)

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/personal/home-inventory')
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
        setTotalValue(data.totalValue || 0)
      }
    } catch (error) {
      console.error('Error fetching home inventory:', error)
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item: any) => {
    setSelectedItem(item)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setSelectedItem(null)
    setDialogOpen(true)
  }

  const handleDeleteClick = (item: any) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return

    try {
      const response = await fetch(`/api/personal/home-inventory?id=${itemToDelete.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete item')
      }

      toast.success('Item deleted successfully')
      fetchInventory()
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Failed to delete item')
    } finally {
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  // Group items by category
  const itemsByCategory = items.reduce((acc: any, item: any) => {
    const category = item.category || 'OTHER'
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Home Inventory</h1>
          <p className="text-muted-foreground">Track your possessions for insurance purposes</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Home className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Tag className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(itemsByCategory).length}</div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No items in your inventory yet</p>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Item
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        Object.entries(itemsByCategory).map(([category, categoryItems]: [string, any]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                {formatCategory(category)} ({categoryItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryItems.map((item: any) => (
                  <div key={item.id} className="p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-medium text-lg">{item.name}</p>
                        {item.brand && item.model && (
                          <p className="text-sm text-muted-foreground">
                            {item.brand} {item.model}
                          </p>
                        )}
                        {item.location && (
                          <p className="text-xs text-muted-foreground">📍 {item.location}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(item)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {item.currentValue && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Current Value:</span>
                          <span className="font-bold text-green-600">
                            ${item.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      {item.purchasePrice && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Purchase Price:</span>
                          <span>${item.purchasePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {item.serialNumber && (
                        <p className="text-xs text-muted-foreground">S/N: {item.serialNumber}</p>
                      )}
                      {item.warrantyExpiration && new Date(item.warrantyExpiration) > new Date() && (
                        <p className="text-xs text-green-600">
                          Warranty until {new Date(item.warrantyExpiration).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <HomeInventoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
        onSuccess={fetchInventory}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {itemToDelete?.name}? This action cannot be undone.
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
