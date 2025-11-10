'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Receipt, Plus, DollarSign, TrendingUp, Trash2, Info, Car } from 'lucide-react'
import { VehicleExpenseDialog } from '@/components/vehicle-expense-dialog'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function VehicleExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [expensesByType, setExpensesByType] = useState<Record<string, number>>({})
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<any>(null)

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/personal/vehicle-expenses')
      if (response.ok) {
        const data = await response.json()
        setExpenses(data.expenses || [])
        setTotalExpenses(data.totalExpenses || 0)
        setExpensesByType(data.expensesByType || {})
        setVehicles(data.vehicles || [])
      }
    } catch (error) {
      console.error('Error fetching vehicle expenses:', error)
      toast.error('Failed to load vehicle expenses')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    if (vehicles.length === 0) {
      toast.error('Please add a vehicle first before tracking expenses')
      return
    }
    setDialogOpen(true)
  }

  const handleDeleteClick = (expense: any) => {
    if (expense.source === 'bank_statement') {
      toast.error('Cannot delete auto-detected expenses from bank statements')
      return
    }
    setExpenseToDelete(expense)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return

    try {
      const response = await fetch(`/api/personal/vehicle-expenses?id=${expenseToDelete.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete expense')
      }

      toast.success('Expense deleted successfully')
      fetchExpenses()
    } catch (error) {
      console.error('Error deleting expense:', error)
      toast.error('Failed to delete expense')
    } finally {
      setDeleteDialogOpen(false)
      setExpenseToDelete(null)
    }
  }

  const formatExpenseType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  // Separate manual and auto-detected expenses
  const manualExpenses = expenses.filter((e: any) => e.source === 'manual')
  const autoExpenses = expenses.filter((e: any) => e.source === 'bank_statement')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vehicle Expenses</h1>
          <p className="text-muted-foreground">Track all vehicle-related costs</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicle Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenses.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {manualExpenses.length} manual, {autoExpenses.length} auto-detected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tracked Vehicles</CardTitle>
            <Car className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Breakdown by Type */}
      {Object.keys(expensesByType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Expense Breakdown by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(expensesByType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, amount]) => (
                  <div key={type} className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">{formatExpenseType(type)}</p>
                    <p className="text-lg font-bold text-red-600">
                      ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info banner about auto-detection */}
      {autoExpenses.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Auto-Detected Expenses</p>
            <p className="text-xs text-blue-700 mt-1">
              We automatically detected {autoExpenses.length} vehicle-related transactions from your bank statements. 
              These are marked as "Auto-detected" and are read-only.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Expense History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No vehicle expenses recorded yet</p>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Expense
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="all">All ({expenses.length})</TabsTrigger>
                <TabsTrigger value="manual">Manual ({manualExpenses.length})</TabsTrigger>
                <TabsTrigger value="auto">Auto ({autoExpenses.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-3 mt-4">
                {expenses.map((expense: any) => (
                  <div key={`${expense.source}-${expense.id}`} className="flex justify-between items-center p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{formatExpenseType(expense.type)}</p>
                        {expense.source === 'bank_statement' && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                            Auto-detected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(expense.date).toLocaleDateString()} • {expense.vehicle}
                      </p>
                      {expense.description && (
                        <p className="text-xs text-muted-foreground mt-1">{expense.description}</p>
                      )}
                      {expense.vendor && (
                        <p className="text-xs text-muted-foreground">Vendor: {expense.vendor}</p>
                      )}
                      {expense.mileage && (
                        <p className="text-xs text-muted-foreground">Mileage: {expense.mileage.toLocaleString()} mi</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-red-600 text-lg">
                        ${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      {expense.source === 'manual' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(expense)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="manual" className="space-y-3 mt-4">
                {manualExpenses.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No manual expenses recorded</p>
                  </div>
                ) : (
                  manualExpenses.map((expense: any) => (
                    <div key={expense.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-accent transition-colors">
                      <div className="flex-1">
                        <p className="font-medium">{formatExpenseType(expense.type)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString()} • {expense.vehicle}
                        </p>
                        {expense.description && (
                          <p className="text-xs text-muted-foreground mt-1">{expense.description}</p>
                        )}
                        {expense.vendor && (
                          <p className="text-xs text-muted-foreground">Vendor: {expense.vendor}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-red-600 text-lg">
                          ${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(expense)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="auto" className="space-y-3 mt-4">
                {autoExpenses.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No auto-detected expenses from bank statements</p>
                  </div>
                ) : (
                  autoExpenses.map((expense: any) => (
                    <div key={expense.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-accent transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{formatExpenseType(expense.type)}</p>
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                            Auto-detected
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString()}
                        </p>
                        {expense.description && (
                          <p className="text-xs text-muted-foreground mt-1">{expense.description}</p>
                        )}
                        {expense.vendor && (
                          <p className="text-xs text-muted-foreground">Vendor: {expense.vendor}</p>
                        )}
                      </div>
                      <p className="font-bold text-red-600 text-lg">
                        ${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <VehicleExpenseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        vehicles={vehicles}
        onSuccess={fetchExpenses}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
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
