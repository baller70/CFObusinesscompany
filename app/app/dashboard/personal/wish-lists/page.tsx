'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Sparkles, Plus, ShoppingBag, Edit, Trash2, Eye, Package, 
  AlertCircle, CheckCircle, Calendar, DollarSign, TrendingUp 
} from 'lucide-react'
import { WishListDialog } from '@/components/wish-list-dialog'
import { WishListItemDialog } from '@/components/wish-list-item-dialog'
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
import { format } from 'date-fns'

export default function WishListsPage() {
  const [wishLists, setWishLists] = useState<any[]>([])
  const [selectedList, setSelectedList] = useState<any>(null)
  const [showListDialog, setShowListDialog] = useState(false)
  const [showItemDialog, setShowItemDialog] = useState(false)
  const [editingList, setEditingList] = useState<any>(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [deleteDialog, setDeleteDialog] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'overview' | 'details'>('overview')

  useEffect(() => {
    fetchWishLists()
  }, [])

  const fetchWishLists = async () => {
    try {
      const response = await fetch('/api/personal/wish-lists')
      if (response.ok) {
        const data = await response.json()
        setWishLists(data.wishLists || [])
      }
    } catch (error) {
      console.error('Error fetching wish lists:', error)
      toast.error('Failed to load wish lists')
    }
  }

  const handleCreateList = () => {
    setEditingList(null)
    setShowListDialog(true)
  }

  const handleEditList = (list: any) => {
    setEditingList(list)
    setShowListDialog(true)
  }

  const handleDeleteList = async () => {
    if (!deleteDialog) return

    try {
      const response = await fetch(`/api/personal/wish-lists?id=${deleteDialog.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Wish list deleted successfully')
        fetchWishLists()
        if (selectedList?.id === deleteDialog.id) {
          setSelectedList(null)
          setViewMode('overview')
        }
      } else {
        toast.error('Failed to delete wish list')
      }
    } catch (error) {
      console.error('Error deleting wish list:', error)
      toast.error('An error occurred')
    } finally {
      setDeleteDialog(null)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/personal/wish-list-items?id=${itemId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Item deleted successfully')
        fetchWishLists()
      } else {
        toast.error('Failed to delete item')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('An error occurred')
    }
  }

  const handleViewList = (list: any) => {
    setSelectedList(list)
    setViewMode('details')
  }

  const handleAddItem = () => {
    setEditingItem(null)
    setShowItemDialog(true)
  }

  const handleEditItem = (item: any) => {
    setEditingItem(item)
    setShowItemDialog(true)
  }

  const getTotalEstimatedCost = (items: any[]) => {
    return items?.reduce((sum, item) => sum + (item.estimatedCost || 0), 0) || 0
  }

  const getPurchasedCount = (items: any[]) => {
    return items?.filter(item => item.isPurchased).length || 0
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-100'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100'
      case 'LOW': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (viewMode === 'details' && selectedList) {
    const list = wishLists.find(l => l.id === selectedList.id) || selectedList
    const totalEstimated = getTotalEstimatedCost(list.items)
    const purchasedCount = getPurchasedCount(list.items)
    const progress = list.targetAmount ? (list.savedAmount / list.targetAmount) * 100 : 0

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="ghost" 
              onClick={() => {
                setViewMode('overview')
                setSelectedList(null)
              }}
              className="mb-2"
            >
              ← Back to All Lists
            </Button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShoppingBag className="h-8 w-8" />
              {list.name}
            </h1>
            {list.description && (
              <p className="text-muted-foreground mt-1">{list.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleEditList(list)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit List
            </Button>
            <Button onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{list.items?.length || 0}</div>
              <p className="text-xs text-gray-500">{purchasedCount} purchased</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Estimated Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${totalEstimated.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Saved Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${(list.savedAmount || 0).toLocaleString()}
              </div>
              {list.targetAmount && (
                <p className="text-xs text-gray-500">
                  of ${list.targetAmount.toLocaleString()} goal
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {progress.toFixed(0)}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            {!list.items || list.items.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No items yet</h3>
                <p className="text-gray-600 mb-4">Start adding items to your wish list</p>
                <Button onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {list.items.map((item: any) => (
                  <div 
                    key={item.id} 
                    className={`border rounded-lg p-4 ${item.isPurchased ? 'bg-gray-50 opacity-75' : 'hover:shadow-md'} transition-shadow`}
                  >
                    {item.imageUrl && (
                      <div className="mb-3 relative aspect-video bg-gray-100 rounded overflow-hidden">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${item.isPurchased ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                      {item.isPurchased && (
                        <CheckCircle className="h-5 w-5 text-green-600 ml-2 flex-shrink-0" />
                      )}
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Estimated:</span>
                        <span className="font-semibold text-gray-900">
                          ${item.estimatedCost.toLocaleString()}
                        </span>
                      </div>

                      {item.isPurchased && item.actualCost && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Actual:</span>
                          <span className="font-semibold text-green-600">
                            ${item.actualCost.toLocaleString()}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                        {item.isPurchased && item.purchasedDate && (
                          <Badge variant="outline" className="text-xs">
                            {format(new Date(item.purchasedDate), 'MMM d, yyyy')}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {item.url && (
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline block mb-3"
                      >
                        View Product →
                      </a>
                    )}

                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditItem(item)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="flex-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <WishListItemDialog
          open={showItemDialog}
          onClose={() => {
            setShowItemDialog(false)
            setEditingItem(null)
          }}
          onSave={() => {
            fetchWishLists()
            setShowItemDialog(false)
            setEditingItem(null)
          }}
          wishListId={list.id}
          item={editingItem}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Wish Lists</h1>
          <p className="text-muted-foreground">Plan your future purchases and track shopping goals</p>
        </div>
        <Button onClick={handleCreateList}>
          <Plus className="h-4 w-4 mr-2" />
          Create List
        </Button>
      </div>

      {/* Statistics Overview */}
      {wishLists.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Lists</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{wishLists.length}</div>
              <p className="text-xs text-gray-500">
                {wishLists.filter(l => l.isActive).length} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {wishLists.reduce((sum, list) => sum + (list.items?.length || 0), 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                ${wishLists.reduce((sum, list) => 
                  sum + getTotalEstimatedCost(list.items), 0
                ).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Saved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${wishLists.reduce((sum, list) => 
                  sum + (list.savedAmount || 0), 0
                ).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Wish Lists Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Your Wish Lists</CardTitle>
        </CardHeader>
        <CardContent>
          {wishLists.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No wish lists yet</h3>
              <p className="text-gray-600 mb-4">Create your first wish list to start planning purchases</p>
              <Button onClick={handleCreateList}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First List
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wishLists.map((list) => {
                const totalItems = list.items?.length || 0
                const purchasedItems = getPurchasedCount(list.items)
                const totalCost = getTotalEstimatedCost(list.items)
                const progress = list.targetAmount ? (list.savedAmount / list.targetAmount) * 100 : 0

                return (
                  <div 
                    key={list.id} 
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewList(list)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <ShoppingBag className="h-5 w-5 text-gray-600" />
                          <h3 className="font-semibold text-gray-900">{list.name}</h3>
                        </div>
                        {list.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{list.description}</p>
                        )}
                      </div>
                      {!list.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>

                    {list.category && (
                      <Badge variant="outline" className="mb-3">{list.category}</Badge>
                    )}

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Items:</span>
                        <span className="font-medium">
                          {totalItems} ({purchasedItems} purchased)
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Estimated Cost:</span>
                        <span className="font-medium">${totalCost.toLocaleString()}</span>
                      </div>

                      {list.targetDate && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Target Date:</span>
                          <span className="font-medium">
                            {format(new Date(list.targetDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                    </div>

                    {list.targetAmount && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Savings Goal:</span>
                          <span className="font-medium">
                            ${(list.savedAmount || 0).toLocaleString()} / ${list.targetAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewList(list)
                        }}
                        className="flex-1"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditList(list)
                        }}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteDialog(list)
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <WishListDialog
        open={showListDialog}
        onClose={() => {
          setShowListDialog(false)
          setEditingList(null)
        }}
        onSave={() => {
          fetchWishLists()
          setShowListDialog(false)
          setEditingList(null)
        }}
        wishList={editingList}
      />

      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Wish List?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog?.name}"? This will also delete all items in this list. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteList} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
