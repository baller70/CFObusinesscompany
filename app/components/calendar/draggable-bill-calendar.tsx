
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon, GripVertical, CheckCircle, Edit2, DollarSign, FileText, CreditCard } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { toast } from 'react-hot-toast'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Bill {
  id: string
  description: string
  amount: number
  dueDate: string
  status: string
  vendor?: { name: string }
  isRecurring?: boolean
  frequency?: string
  notes?: string
  paymentMethod?: string
}

interface RecurringCharge {
  id: string
  name: string
  description?: string
  amount: number
  category: string
  frequency: string
  vendor?: string
  autoPayEnabled: boolean
  paymentMethod?: string
}

interface DraggableBillCalendarProps {
  initialBills?: Bill[]
}

export function DraggableBillCalendar({ initialBills = [] }: DraggableBillCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bills, setBills] = useState<Bill[]>(initialBills)
  const [draggingBill, setDraggingBill] = useState<Bill | null>(null)
  const [showBillPoolDialog, setShowBillPoolDialog] = useState(false)
  const [showAddBillDialog, setShowAddBillDialog] = useState(false)
  const [showRecurringDialog, setShowRecurringDialog] = useState(false)
  const [showBillOptionsDialog, setShowBillOptionsDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [pendingBill, setPendingBill] = useState<{ description: string; amount: number; date: Date } | null>(null)
  const [vendors, setVendors] = useState<any[]>([])
  const [recurringCharges, setRecurringCharges] = useState<RecurringCharge[]>([])
  const [selectedRecurringCharge, setSelectedRecurringCharge] = useState<RecurringCharge | null>(null)
  const [selectedBillForOptions, setSelectedBillForOptions] = useState<Bill | null>(null)
  
  const [newBill, setNewBill] = useState({
    description: '',
    amount: '',
    vendorId: '',
    notes: ''
  })

  const [billScheduleOptions, setBillScheduleOptions] = useState({
    amount: '',
    notes: '',
    paymentMethod: '',
    markAsPaid: false
  })

  const [recurringConfig, setRecurringConfig] = useState({
    frequency: 'MONTHLY',
    isRecurring: false
  })

  useEffect(() => {
    fetchBills()
    fetchVendors()
    fetchRecurringCharges()
  }, [currentDate])

  const fetchBills = async () => {
    try {
      const start = format(startOfMonth(currentDate), 'yyyy-MM-dd')
      const end = format(endOfMonth(currentDate), 'yyyy-MM-dd')
      const response = await fetch(`/api/bills?start=${start}&end=${end}`)
      if (response.ok) {
        const data = await response.json()
        setBills(data.bills || [])
      }
    } catch (error) {
      console.error('Error fetching bills:', error)
    }
  }

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors')
      if (response.ok) {
        const data = await response.json()
        setVendors(data.vendors || [])
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
    }
  }

  const fetchRecurringCharges = async () => {
    try {
      const response = await fetch('/api/recurring-charges?active=true')
      if (response.ok) {
        const data = await response.json()
        setRecurringCharges(data.recurringCharges || [])
      }
    } catch (error) {
      console.error('Error fetching recurring charges:', error)
    }
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getBillsForDate = (date: Date) => {
    return bills.filter(bill => isSameDay(new Date(bill.dueDate), date))
  }

  const handleDragStart = (bill: Bill) => {
    setDraggingBill(bill)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    
    if (!draggingBill) return

    // Show recurring dialog
    setSelectedDate(date)
    setPendingBill({
      description: draggingBill.description,
      amount: draggingBill.amount,
      date
    })
    setShowRecurringDialog(true)
    setDraggingBill(null)
  }

  const handleRecurringSubmit = async () => {
    if (!pendingBill || !selectedDate) return

    try {
      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: pendingBill.description,
          amount: pendingBill.amount,
          dueDate: selectedDate,
          isRecurring: recurringConfig.isRecurring,
          frequency: recurringConfig.isRecurring ? recurringConfig.frequency : null
        })
      })

      if (response.ok) {
        toast.success(`Bill ${recurringConfig.isRecurring ? 'scheduled with recurrence' : 'added'}!`)
        fetchBills()
        setShowRecurringDialog(false)
        setPendingBill(null)
        setRecurringConfig({ frequency: 'MONTHLY', isRecurring: false })
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to save bill')
      }
    } catch (error) {
      console.error('Error saving bill:', error)
      toast.error('Failed to save bill')
    }
  }

  const handleAddBill = async () => {
    if (!newBill.description || !newBill.amount || !selectedDate) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: newBill.description,
          amount: parseFloat(newBill.amount),
          dueDate: selectedDate,
          vendorId: newBill.vendorId || null,
          notes: newBill.notes || null
        })
      })

      if (response.ok) {
        toast.success('Bill added successfully!')
        fetchBills()
        setShowAddBillDialog(false)
        setNewBill({ description: '', amount: '', vendorId: '', notes: '' })
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to add bill')
      }
    } catch (error) {
      console.error('Error adding bill:', error)
      toast.error('Failed to add bill')
    }
  }

  const handleDeleteBill = async (billId: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) return

    try {
      const response = await fetch(`/api/bills/${billId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Bill deleted successfully!')
        fetchBills()
      } else {
        toast.error('Failed to delete bill')
      }
    } catch (error) {
      console.error('Error deleting bill:', error)
      toast.error('Failed to delete bill')
    }
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setShowBillPoolDialog(true)
  }

  const handleSelectRecurringCharge = (charge: RecurringCharge) => {
    setSelectedRecurringCharge(charge)
    setBillScheduleOptions({
      amount: charge.amount.toString(),
      notes: charge.description || '',
      paymentMethod: charge.paymentMethod || '',
      markAsPaid: false
    })
    setShowBillPoolDialog(false)
    setShowBillOptionsDialog(true)
  }

  const handleScheduleBill = async () => {
    if (!selectedRecurringCharge || !selectedDate) return

    try {
      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: selectedRecurringCharge.name,
          amount: parseFloat(billScheduleOptions.amount),
          dueDate: selectedDate,
          vendorId: null,
          notes: billScheduleOptions.notes,
          paymentMethod: billScheduleOptions.paymentMethod,
          status: billScheduleOptions.markAsPaid ? 'PAID' : 'PENDING',
          recurringChargeId: selectedRecurringCharge.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // If marked as paid, create a transaction
        if (billScheduleOptions.markAsPaid) {
          await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              description: selectedRecurringCharge.name,
              amount: parseFloat(billScheduleOptions.amount),
              date: selectedDate,
              category: selectedRecurringCharge.category,
              type: 'EXPENSE',
              notes: billScheduleOptions.notes,
              paymentMethod: billScheduleOptions.paymentMethod
            })
          })
          toast.success('Bill scheduled and marked as paid!')
        } else {
          toast.success('Bill scheduled successfully!')
        }
        
        fetchBills()
        setShowBillOptionsDialog(false)
        setSelectedRecurringCharge(null)
        setBillScheduleOptions({
          amount: '',
          notes: '',
          paymentMethod: '',
          markAsPaid: false
        })
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to schedule bill')
      }
    } catch (error) {
      console.error('Error scheduling bill:', error)
      toast.error('Failed to schedule bill')
    }
  }

  const handleBillClick = (bill: Bill, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedBillForOptions(bill)
    // Open options for existing bill
  }

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{format(currentDate, 'MMMM yyyy')}</h2>
          <p className="text-sm text-muted-foreground">Click a date to schedule bills from your recurring charges, or drag bills to reschedule</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-4 text-center font-semibold text-sm border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dayBills = getBillsForDate(day)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isToday = isSameDay(day, new Date())
              
              return (
                <div
                  key={idx}
                  className={`min-h-[120px] p-2 border-r border-b last:border-r-0 ${
                    !isCurrentMonth ? 'bg-muted/30' : ''
                  } ${isToday ? 'bg-primary/5' : ''} hover:bg-muted/50 transition-colors cursor-pointer`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day)}
                  onClick={() => handleDateClick(day)}
                >
                  <div className={`text-sm font-medium mb-2 ${
                    isToday ? 'bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center' : ''
                  }`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayBills.map(bill => (
                      <div
                        key={bill.id}
                        draggable
                        onDragStart={() => handleDragStart(bill)}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-start gap-1 p-2 bg-primary/10 rounded text-xs cursor-move hover:bg-primary/20 transition-colors group"
                      >
                        <GripVertical className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{bill.description}</div>
                          <div className="text-muted-foreground">${bill.amount.toFixed(2)}</div>
                          {bill.vendor && (
                            <div className="text-muted-foreground text-[10px] truncate">{bill.vendor.name}</div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteBill(bill.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Bill Dialog */}
      <Dialog open={showAddBillDialog} onOpenChange={setShowAddBillDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bill</DialogTitle>
            <DialogDescription>
              Add a new bill for {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={newBill.description}
                onChange={(e) => setNewBill({ ...newBill, description: e.target.value })}
                placeholder="e.g., Electric Bill, Rent, etc."
              />
            </div>
            
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={newBill.amount}
                onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="vendor">Vendor</Label>
              <Select value={newBill.vendorId} onValueChange={(value) => setNewBill({ ...newBill, vendorId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No vendor</SelectItem>
                  {vendors.map(vendor => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newBill.notes}
                onChange={(e) => setNewBill({ ...newBill, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddBillDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBill}>Add Bill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bill Pool Dialog - Shows available recurring charges to schedule */}
      <Dialog open={showBillPoolDialog} onOpenChange={setShowBillPoolDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule a Bill for {selectedDate && format(selectedDate, 'MMMM d, yyyy')}</DialogTitle>
            <DialogDescription>
              Select a bill from your recurring charges to schedule on this date
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-2">
              {recurringCharges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No recurring charges available.</p>
                  <p className="text-sm mt-2">Add recurring charges from the Recurring Charges page first.</p>
                </div>
              ) : (
                recurringCharges.map((charge) => (
                  <div
                    key={charge.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleSelectRecurringCharge(charge)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{charge.name}</h4>
                          <Badge variant="outline" className="text-xs">{charge.category}</Badge>
                          {charge.autoPayEnabled && (
                            <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                              Auto-pay
                            </Badge>
                          )}
                        </div>
                        {charge.description && (
                          <p className="text-sm text-muted-foreground mb-2">{charge.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${charge.amount.toFixed(2)}
                          </span>
                          {charge.vendor && (
                            <span>{charge.vendor}</span>
                          )}
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                            {charge.frequency}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Schedule
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowBillPoolDialog(false)
              setShowAddBillDialog(true)
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Bill
            </Button>
            <Button variant="outline" onClick={() => setShowBillPoolDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bill Options Dialog - Configure bill before scheduling */}
      <Dialog open={showBillOptionsDialog} onOpenChange={setShowBillOptionsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Bill</DialogTitle>
            <DialogDescription>
              Customize the bill details before scheduling
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedRecurringCharge && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="font-medium text-lg">{selectedRecurringCharge.name}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="bill-amount">Amount *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="bill-amount"
                  type="number"
                  step="0.01"
                  value={billScheduleOptions.amount}
                  onChange={(e) => setBillScheduleOptions({ ...billScheduleOptions, amount: e.target.value })}
                  placeholder="0.00"
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Default: ${selectedRecurringCharge?.amount.toFixed(2)}
              </p>
            </div>
            
            <div>
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select 
                value={billScheduleOptions.paymentMethod} 
                onValueChange={(value) => setBillScheduleOptions({ ...billScheduleOptions, paymentMethod: value })}
              >
                <SelectTrigger>
                  <CreditCard className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="debit_card">Debit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="bill-notes">Notes</Label>
              <Textarea
                id="bill-notes"
                value={billScheduleOptions.notes}
                onChange={(e) => setBillScheduleOptions({ ...billScheduleOptions, notes: e.target.value })}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <input
                type="checkbox"
                id="mark-paid"
                checked={billScheduleOptions.markAsPaid}
                onChange={(e) => setBillScheduleOptions({ ...billScheduleOptions, markAsPaid: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="mark-paid" className="cursor-pointer flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Mark as paid immediately</span>
              </Label>
            </div>
            
            {billScheduleOptions.markAsPaid && (
              <div className="p-3 bg-success/10 border border-success/20 rounded-lg text-sm">
                <p className="text-success font-medium mb-1">This will:</p>
                <ul className="text-muted-foreground space-y-1 ml-4">
                  <li>• Create the bill with "Paid" status</li>
                  <li>• Record a transaction in your expenses</li>
                  <li>• Update your budget tracking</li>
                </ul>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowBillOptionsDialog(false)
              setShowBillPoolDialog(true)
            }}>
              Back
            </Button>
            <Button onClick={handleScheduleBill}>
              {billScheduleOptions.markAsPaid ? 'Schedule & Mark Paid' : 'Schedule Bill'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Bill Dialog */}
      <Dialog open={showAddBillDialog} onOpenChange={setShowAddBillDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bill</DialogTitle>
            <DialogDescription>
              Add a new bill for {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={newBill.description}
                onChange={(e) => setNewBill({ ...newBill, description: e.target.value })}
                placeholder="e.g., Electric Bill, Rent, etc."
              />
            </div>
            
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={newBill.amount}
                onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="vendor">Vendor</Label>
              <Select value={newBill.vendorId} onValueChange={(value) => setNewBill({ ...newBill, vendorId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No vendor</SelectItem>
                  {vendors.map(vendor => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newBill.notes}
                onChange={(e) => setNewBill({ ...newBill, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddBillDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBill}>Add Bill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recurring Bill Dialog */}
      <Dialog open={showRecurringDialog} onOpenChange={setShowRecurringDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Bill</DialogTitle>
            <DialogDescription>
              Is this a recurring bill?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="font-medium">{pendingBill?.description}</div>
              <div className="text-sm text-muted-foreground">${pendingBill?.amount.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">
                Due: {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={recurringConfig.isRecurring}
                  onChange={(e) => setRecurringConfig({ ...recurringConfig, isRecurring: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isRecurring" className="cursor-pointer">
                  This is a recurring bill
                </Label>
              </div>
              
              {recurringConfig.isRecurring && (
                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select 
                    value={recurringConfig.frequency} 
                    onValueChange={(value) => setRecurringConfig({ ...recurringConfig, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="BIWEEKLY">Bi-weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                      <SelectItem value="SEMIANNUALLY">Semi-annually</SelectItem>
                      <SelectItem value="ANNUALLY">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRecurringDialog(false)
              setPendingBill(null)
            }}>
              Cancel
            </Button>
            <Button onClick={handleRecurringSubmit}>
              {recurringConfig.isRecurring ? 'Schedule Recurring Bill' : 'Add One-Time Bill'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
