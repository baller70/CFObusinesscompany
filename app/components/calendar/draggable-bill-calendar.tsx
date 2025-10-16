
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon, GripVertical } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { toast } from 'react-hot-toast'
import { Textarea } from '@/components/ui/textarea'

interface Bill {
  id: string
  description: string
  amount: number
  dueDate: string
  status: string
  vendor?: { name: string }
  isRecurring?: boolean
  frequency?: string
}

interface DraggableBillCalendarProps {
  initialBills?: Bill[]
}

export function DraggableBillCalendar({ initialBills = [] }: DraggableBillCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bills, setBills] = useState<Bill[]>(initialBills)
  const [draggingBill, setDraggingBill] = useState<Bill | null>(null)
  const [showAddBillDialog, setShowAddBillDialog] = useState(false)
  const [showRecurringDialog, setShowRecurringDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [pendingBill, setPendingBill] = useState<{ description: string; amount: number; date: Date } | null>(null)
  const [vendors, setVendors] = useState<any[]>([])
  
  const [newBill, setNewBill] = useState({
    description: '',
    amount: '',
    vendorId: '',
    notes: ''
  })

  const [recurringConfig, setRecurringConfig] = useState({
    frequency: 'MONTHLY',
    isRecurring: false
  })

  useEffect(() => {
    fetchBills()
    fetchVendors()
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
    setShowAddBillDialog(true)
  }

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{format(currentDate, 'MMMM yyyy')}</h2>
          <p className="text-sm text-muted-foreground">Drag bills to reschedule or click dates to add new bills</p>
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
