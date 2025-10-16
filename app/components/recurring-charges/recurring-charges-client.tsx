
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarDays, DollarSign, AlertCircle, Plus, Search, Filter, PauseCircle, PlayCircle, Edit, Trash2, CheckCircle } from 'lucide-react'
import { formatDistanceToNow, format, isPast, isToday, isTomorrow } from 'date-fns'
import { RecurringChargeForm } from './recurring-charge-form'
import { toast } from 'react-hot-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface RecurringCharge {
  id: string
  name: string
  description?: string
  amount: number
  category: string
  frequency: string
  nextDueDate: string
  lastPaidDate?: string
  vendor?: string
  billingCycle: number
  reminderEnabled: boolean
  reminderDays: number
  isActive: boolean
  isPaused: boolean
  pausedUntil?: string
  annualAmount: number
  taxDeductible: boolean
  businessExpense: boolean
  notes?: string
  tags?: string[]
  autoPayEnabled: boolean
  paymentMethod?: string
  createdAt: string
  updatedAt: string
}

interface RecurringChargesSummary {
  totalCharges: number
  activeCharges: number
  totalMonthlyAmount: number
  totalAnnualAmount: number
  dueSoon: number
  overdue: number
  categories: string[]
}

export default function RecurringChargesClient() {
  const [recurringCharges, setRecurringCharges] = useState<RecurringCharge[]>([])
  const [summary, setSummary] = useState<RecurringChargesSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCharge, setEditingCharge] = useState<RecurringCharge | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetchRecurringCharges()
  }, [activeTab])

  const fetchRecurringCharges = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (activeTab === 'active') params.set('active', 'true')
      if (activeTab === 'upcoming') params.set('upcoming', '7')
      if (selectedCategory !== 'all') params.set('category', selectedCategory)

      const response = await fetch(`/api/recurring-charges?${params}`)
      if (!response.ok) throw new Error('Failed to fetch recurring charges')
      
      const data = await response.json()
      setRecurringCharges(Array.isArray(data.recurringCharges) ? data.recurringCharges : [])
      setSummary(data.summary || null)
    } catch (error) {
      console.error('Error fetching recurring charges:', error)
      toast.error('Failed to load recurring charges')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = async (chargeId: string) => {
    try {
      const response = await fetch(`/api/recurring-charges/${chargeId}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createTransaction: true })
      })
      
      if (!response.ok) throw new Error('Failed to mark as paid')
      
      toast.success('Payment recorded successfully')
      fetchRecurringCharges()
    } catch (error) {
      console.error('Error marking as paid:', error)
      toast.error('Failed to record payment')
    }
  }

  const handleTogglePause = async (charge: RecurringCharge) => {
    try {
      const response = await fetch(`/api/recurring-charges/${charge.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isPaused: !charge.isPaused,
          pausedUntil: charge.isPaused ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      })
      
      if (!response.ok) throw new Error('Failed to update charge')
      
      toast.success(charge.isPaused ? 'Charge resumed' : 'Charge paused')
      fetchRecurringCharges()
    } catch (error) {
      console.error('Error toggling pause:', error)
      toast.error('Failed to update charge')
    }
  }

  const handleDelete = async (chargeId: string, chargeName: string) => {
    if (!confirm(`Are you sure you want to delete "${chargeName}"?`)) return
    
    try {
      const response = await fetch(`/api/recurring-charges/${chargeId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete charge')
      
      toast.success('Recurring charge deleted')
      fetchRecurringCharges()
    } catch (error) {
      console.error('Error deleting charge:', error)
      toast.error('Failed to delete charge')
    }
  }

  const filteredCharges = (recurringCharges || []).filter(charge => {
    const matchesSearch = charge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         charge.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         charge.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Tab-based filtering
    if (activeTab === 'active' && !charge.isActive) return false
    if (activeTab === 'upcoming') {
      const dueDate = new Date(charge.nextDueDate)
      const today = new Date()
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (daysUntilDue > 7) return false // Only show charges due in next 7 days
    }
    
    return matchesSearch
  })

  const getStatusBadge = (charge: RecurringCharge) => {
    const dueDate = new Date(charge.nextDueDate)
    const today = new Date()
    
    if (!charge.isActive) {
      return <Badge variant="secondary">Inactive</Badge>
    }
    
    if (charge.isPaused) {
      return <Badge variant="outline" className="border-orange-200 text-orange-700">Paused</Badge>
    }
    
    if (isPast(dueDate) && !isToday(dueDate)) {
      return <Badge variant="destructive">Overdue</Badge>
    }
    
    if (isToday(dueDate)) {
      return <Badge className="bg-orange-500 hover:bg-orange-600">Due Today</Badge>
    }
    
    if (isTomorrow(dueDate)) {
      return <Badge className="bg-blue-500 hover:bg-blue-600">Due Tomorrow</Badge>
    }
    
    const daysDifference = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
    if (daysDifference <= 7) {
      return <Badge variant="outline" className="border-gray-200 text-gray-700">Due Soon</Badge>
    }
    
    return <Badge variant="outline" className="border-green-200 text-green-700">Active</Badge>
  }

  const getDueDateText = (charge: RecurringCharge) => {
    const dueDate = new Date(charge.nextDueDate)
    
    if (isToday(dueDate)) return 'Today'
    if (isTomorrow(dueDate)) return 'Tomorrow'
    if (isPast(dueDate)) return `${formatDistanceToNow(dueDate)} ago`
    
    return `in ${formatDistanceToNow(dueDate)}`
  }

  const getFrequencyText = (frequency: string) => {
    const frequencyMap: { [key: string]: string } = {
      DAILY: 'Daily',
      WEEKLY: 'Weekly',
      BIWEEKLY: 'Bi-weekly',
      MONTHLY: 'Monthly',
      BIMONTHLY: 'Bi-monthly',
      QUARTERLY: 'Quarterly',
      SEMIANNUALLY: 'Semi-annually',
      ANNUALLY: 'Annually',
      CUSTOM: 'Custom'
    }
    return frequencyMap[frequency] || frequency
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-heading text-foreground mb-2">Recurring Charges</h1>
            <p className="text-body text-muted-foreground">
              Track and manage your monthly recurring expenses and subscriptions
            </p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Recurring Charge
          </Button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="card-premium-elevated">
              <CardHeader className="pb-3">
                <CardTitle className="text-small text-muted-foreground font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  Total Monthly
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-financial-large text-financial-negative mb-2">
                  ${summary.totalMonthlyAmount.toFixed(2)}
                </div>
                <p className="text-small text-muted-foreground">
                  {summary.activeCharges} active charges
                </p>
              </CardContent>
            </Card>

            <Card className="card-premium-elevated">
              <CardHeader className="pb-3">
                <CardTitle className="text-small text-muted-foreground font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  Annual Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-financial-large text-purple-600 mb-2">
                  ${summary.totalAnnualAmount.toFixed(2)}
                </div>
                <p className="text-small text-muted-foreground">
                  Projected yearly cost
                </p>
              </CardContent>
            </Card>

            <Card className="card-premium-elevated">
              <CardHeader className="pb-3">
                <CardTitle className="text-small text-muted-foreground font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-warning"></div>
                  Due Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-financial-large text-warning mb-2">
                  {summary.dueSoon}
                </div>
                <p className="text-small text-muted-foreground">
                  Next 7 days
                </p>
              </CardContent>
            </Card>

            <Card className="card-premium-elevated">
              <CardHeader className="pb-3">
                <CardTitle className="text-small text-muted-foreground font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-destructive"></div>
                  Overdue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-financial-large text-destructive mb-2">
                  {summary.overdue}
                </div>
                <p className="text-small text-muted-foreground">
                  Requires attention
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card className="card-premium mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search recurring charges..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {summary?.categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-card border">
            <TabsTrigger value="all">All ({(recurringCharges || []).length})</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="upcoming">Due Soon</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Recurring Charges List */}
        <div className="space-y-4">
          {filteredCharges.map((charge) => (
            <Card key={charge.id} className="card-premium hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-body-large font-medium text-foreground">
                        {charge.name}
                      </h3>
                      {getStatusBadge(charge)}
                      {charge.autoPayEnabled && (
                        <Badge variant="outline" className="border-blue-200 text-blue-700">
                          Auto-pay
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-small text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span>${charge.amount.toFixed(2)} {getFrequencyText(charge.frequency)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        <span>Due {getDueDateText(charge)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-muted">
                          {charge.category}
                        </span>
                        {charge.vendor && (
                          <span className="text-muted-foreground">
                            • {charge.vendor}
                          </span>
                        )}
                      </div>
                    </div>

                    {charge.description && (
                      <p className="text-small text-muted-foreground mt-2">
                        {charge.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {!charge.isPaused && (isPast(new Date(charge.nextDueDate)) || isToday(new Date(charge.nextDueDate))) && (
                      <Button
                        size="sm"
                        onClick={() => handleMarkPaid(charge.id)}
                        className="bg-success hover:bg-success/90 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Paid
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTogglePause(charge)}
                    >
                      {charge.isPaused ? (
                        <PlayCircle className="h-4 w-4" />
                      ) : (
                        <PauseCircle className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingCharge(charge)
                        setShowForm(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(charge.id, charge.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredCharges.length === 0 && (
            <Card className="card-premium">
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-body-large font-medium text-foreground mb-2">
                  No recurring charges found
                </h3>
                <p className="text-body text-muted-foreground mb-6">
                  {searchTerm ? 'Try adjusting your search or filters.' : 'Get started by adding your first recurring charge.'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recurring Charge
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recurring Charge Form Modal */}
        {showForm && (
          <RecurringChargeForm
            charge={editingCharge}
            onClose={() => {
              setShowForm(false)
              setEditingCharge(null)
            }}
            onSuccess={() => {
              setShowForm(false)
              setEditingCharge(null)
              fetchRecurringCharges()
            }}
          />
        )}
      </div>
    </div>
  )
}
