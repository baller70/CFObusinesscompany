'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Plus, Receipt as ReceiptIcon, Search, Filter, FileImage, Eye, 
  Edit, Trash2, Download, ShoppingCart, DollarSign, TrendingUp,
  Calendar, RefreshCw, Scan, Share2, CheckSquare, XSquare
} from 'lucide-react'
import { format } from 'date-fns'
import { ReceiptDialog } from '@/components/receipt-dialog'
import { ReceiptViewDialog } from '@/components/receipt-view-dialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([])
  const [filteredReceipts, setFilteredReceipts] = useState<any[]>([])
  const [stats, setStats] = useState<any>([])
  const [showDialog, setShowDialog] = useState(false)
  const [editingReceipt, setEditingReceipt] = useState<any>(null)
  const [viewingReceipt, setViewingReceipt] = useState<any>(null)
  const [deleteDialog, setDeleteDialog] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [populating, setPopulating] = useState(false)
  const [selectedReceipts, setSelectedReceipts] = useState<Set<string>>(new Set())
  const [bulkSelectMode, setBulkSelectMode] = useState(false)

  useEffect(() => {
    fetchReceipts()
  }, [])

  useEffect(() => {
    filterReceipts()
  }, [receipts, searchTerm, categoryFilter])

  const fetchReceipts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/personal/receipts')
      if (response.ok) {
        const data = await response.json()
        setReceipts(data.receipts || [])
        setStats(data.stats || [])
      }
    } catch (error) {
      console.error('Error fetching receipts:', error)
      toast.error('Failed to load receipts')
    } finally {
      setLoading(false)
    }
  }

  const filterReceipts = () => {
    let filtered = receipts

    // Filter by search term (including OCR text)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(receipt =>
        (receipt.vendor?.toLowerCase() || '').includes(term) ||
        (receipt.description?.toLowerCase() || '').includes(term) ||
        (receipt.category?.toLowerCase() || '').includes(term) ||
        (receipt.ocrText?.toLowerCase() || '').includes(term) ||
        receipt.amount.toString().includes(term)
      )
    }

    // Filter by category
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(receipt => receipt.category === categoryFilter)
    }

    setFilteredReceipts(filtered)
  }

  const handleViewReceipt = (receipt: any) => {
    setViewingReceipt(receipt)
  }

  const toggleReceiptSelection = (receiptId: string) => {
    const newSelection = new Set(selectedReceipts)
    if (newSelection.has(receiptId)) {
      newSelection.delete(receiptId)
    } else {
      newSelection.add(receiptId)
    }
    setSelectedReceipts(newSelection)
  }

  const selectAllReceipts = () => {
    const allIds = new Set(filteredReceipts.map(r => r.id))
    setSelectedReceipts(allIds)
  }

  const deselectAllReceipts = () => {
    setSelectedReceipts(new Set())
  }

  const handleBulkShare = async () => {
    if (selectedReceipts.size === 0) {
      toast.error('No receipts selected')
      return
    }

    try {
      const response = await fetch('/api/personal/receipts/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptIds: Array.from(selectedReceipts) })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Generated share links for ${data.receipts.length} receipt(s)`)
        
        // Create shareable text
        const shareText = data.receipts.map((r: any) => 
          `${r.vendor} - $${r.amount} (${format(new Date(r.date), 'MMM d, yyyy')})`
        ).join('\n')
        
        await navigator.clipboard.writeText(shareText)
        toast.success('Receipt details copied to clipboard')
        
        deselectAllReceipts()
        setBulkSelectMode(false)
      } else {
        toast.error('Failed to generate share links')
      }
    } catch (error) {
      console.error('Error sharing receipts:', error)
      toast.error('An error occurred')
    }
  }

  const handleCreateReceipt = () => {
    setEditingReceipt(null)
    setShowDialog(true)
  }

  const handleEditReceipt = (receipt: any) => {
    setEditingReceipt(receipt)
    setShowDialog(true)
  }

  const handleDeleteReceipt = async () => {
    if (!deleteDialog) return

    try {
      const response = await fetch(`/api/personal/receipts?id=${deleteDialog.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Receipt deleted successfully')
        fetchReceipts()
      } else {
        toast.error('Failed to delete receipt')
      }
    } catch (error) {
      console.error('Error deleting receipt:', error)
      toast.error('An error occurred')
    } finally {
      setDeleteDialog(null)
    }
  }

  const handlePopulateFromStatements = async () => {
    try {
      setPopulating(true)
      const response = await fetch('/api/personal/receipts/populate-from-statements', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Successfully imported ${data.created} receipts from bank statements`)
        fetchReceipts()
      } else {
        toast.error('Failed to populate receipts from statements')
      }
    } catch (error) {
      console.error('Error populating receipts:', error)
      toast.error('An error occurred')
    } finally {
      setPopulating(false)
    }
  }

  // Calculate statistics
  const currentMonth = new Date()
  currentMonth.setDate(1)
  currentMonth.setHours(0, 0, 0, 0)

  const monthlyReceipts = receipts.filter(r => new Date(r.date) >= currentMonth)
  const monthlyAmount = monthlyReceipts.reduce((sum, r) => sum + r.amount, 0)
  const totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0)

  const categoryTotals = receipts.reduce((acc: any, receipt) => {
    const cat = receipt.category || 'Uncategorized'
    acc[cat] = (acc[cat] || 0) + receipt.amount
    return acc
  }, {})

  const topCategories = Object.entries(categoryTotals)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 3)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Receipt Manager</h1>
          <p className="text-muted-foreground">
            Track all your shopping receipts and expenses with OCR scanning
          </p>
        </div>
        <div className="flex gap-2">
        <BackButton href="/dashboard/expenses" />
          {bulkSelectMode ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  setBulkSelectMode(false)
                  deselectAllReceipts()
                }}
              >
                <XSquare className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                variant="outline" 
                onClick={handleBulkShare}
                disabled={selectedReceipts.size === 0}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Selected ({selectedReceipts.size})
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={handlePopulateFromStatements}
                disabled={populating}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${populating ? 'animate-spin' : ''}`} />
                {populating ? 'Importing...' : 'Import from Statements'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setBulkSelectMode(true)}
                disabled={filteredReceipts.length === 0}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Select Multiple
              </Button>
              <Button onClick={handleCreateReceipt}>
                <Plus className="h-4 w-4 mr-2" />
                Add Receipt
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{receipts.length}</div>
            <p className="text-xs text-gray-500 mt-1">${totalAmount.toLocaleString()} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${monthlyAmount.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">{monthlyReceipts.length} receipts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${receipts.length > 0 ? (totalAmount / receipts.length).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Per receipt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Top Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-600">
              {topCategories[0]?.[0] || 'N/A'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {topCategories[0] ? `$${(topCategories[0][1] as number).toLocaleString()}` : 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by vendor, description, amount, or OCR text..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {RECEIPT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Selection Banner */}
      {bulkSelectMode && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckSquare className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  {selectedReceipts.size} receipt(s) selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={selectAllReceipts}>
                  Select All ({filteredReceipts.length})
                </Button>
                <Button size="sm" variant="outline" onClick={deselectAllReceipts}>
                  Deselect All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Spending Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCategories.map(([category, amount]: [string, any]) => {
                const percentage = (amount / totalAmount) * 100
                return (
                  <div key={category}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{category}</span>
                      <span className="text-sm font-semibold">${amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Receipts Grid */}
      <Card>
        <CardHeader>
          <CardTitle>All Receipts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading receipts...</p>
            </div>
          ) : filteredReceipts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReceipts.map((receipt) => (
                <div 
                  key={receipt.id} 
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                    selectedReceipts.has(receipt.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                >
                  {bulkSelectMode && (
                    <div className="mb-3">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedReceipts.has(receipt.id)}
                          onChange={() => toggleReceiptSelection(receipt.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <span className="text-sm font-medium">Select this receipt</span>
                      </label>
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <FileImage className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">
                        {format(new Date(receipt.date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {receipt.processed && receipt.ocrText && (
                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                          <Scan className="h-3 w-3 mr-1" />
                          OCR
                        </Badge>
                      )}
                      {receipt.taxDeductible && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          Tax
                        </Badge>
                      )}
                    </div>
                  </div>

                  {receipt.vendor && (
                    <h3 className="font-semibold text-gray-900 mb-1">{receipt.vendor}</h3>
                  )}

                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    ${receipt.amount.toLocaleString()}
                  </div>

                  {receipt.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{receipt.description}</p>
                  )}

                  {receipt.category && (
                    <Badge variant="outline" className="mb-3">{receipt.category}</Badge>
                  )}

                  {receipt.cloudStoragePath && (
                    <div className="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                      <FileImage className="h-4 w-4 inline mr-1" />
                      Receipt image attached
                    </div>
                  )}

                  {receipt.confidence && (
                    <div className="mb-3 text-xs text-gray-500">
                      Confidence: {(receipt.confidence * 100).toFixed(0)}%
                    </div>
                  )}

                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewReceipt(receipt)}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditReceipt(receipt)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setDeleteDialog(receipt)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || categoryFilter !== 'all' ? 'No receipts found' : 'No receipts yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || categoryFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Add your first receipt or import from bank statements'}
              </p>
              {!searchTerm && categoryFilter === 'all' && (
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleCreateReceipt}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Receipt
                  </Button>
                  <Button variant="outline" onClick={handlePopulateFromStatements}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Import from Statements
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ReceiptDialog
        open={showDialog}
        onClose={() => {
          setShowDialog(false)
          setEditingReceipt(null)
        }}
        onSave={() => {
          fetchReceipts()
          setShowDialog(false)
          setEditingReceipt(null)
        }}
        receipt={editingReceipt}
      />

      <ReceiptViewDialog
        open={!!viewingReceipt}
        onClose={() => setViewingReceipt(null)}
        receipt={viewingReceipt}
      />

      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Receipt?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this receipt from {deleteDialog?.vendor}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReceipt} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
