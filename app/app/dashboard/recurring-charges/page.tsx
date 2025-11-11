
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Repeat, DollarSign, Calendar, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

import { BackButton } from '@/components/ui/back-button';
export default function RecurringChargesPage() {
  const { data: session, status } = useSession() || {}
  const [recurringCharges, setRecurringCharges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalMonthly: 0,
    totalAnnual: 0,
    activeCount: 0
  })
  
  useEffect(() => {
    if (session?.user?.id) {
      fetchRecurringCharges()
    }
  }, [session?.user?.id])

  const fetchRecurringCharges = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/recurring-charges')
      if (response.ok) {
        const data = await response.json()
        setRecurringCharges(data.charges || [])
        calculateStats(data.charges || [])
      }
    } catch (error) {
      console.error('Error fetching recurring charges:', error)
      toast.error('Failed to load recurring charges')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (charges: any[]) => {
    let monthly = 0
    let annual = 0
    let active = 0

    charges.forEach(charge => {
      if (charge.isActive) {
        active++
        const amount = Math.abs(charge.amount)
        
        if (charge.frequency === 'MONTHLY') {
          monthly += amount
          annual += amount * 12
        } else if (charge.frequency === 'ANNUAL') {
          annual += amount
          monthly += amount / 12
        } else if (charge.frequency === 'QUARTERLY') {
          annual += amount * 4
          monthly += (amount * 4) / 12
        } else if (charge.frequency === 'WEEKLY') {
          monthly += amount * 4
          annual += amount * 52
        }
      }
    })

    setStats({ totalMonthly: monthly, totalAnnual: annual, activeCount: active })
  }

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'MONTHLY': return 'default'
      case 'ANNUAL': return 'secondary'
      case 'QUARTERLY': return 'outline'
      case 'WEEKLY': return 'destructive'
      default: return 'outline'
    }
  }

  if (status === 'loading') return <div className="p-6">
        <BackButton href="/dashboard" />Loading...</div>
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recurring Charges</h1>
          <p className="text-gray-600 mt-1">Track and manage all your recurring expenses</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchRecurringCharges}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => toast.info('Add new recurring charge form coming soon')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Recurring Charge
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Monthly Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">-${stats.totalMonthly.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">Average per month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Annual Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">-${stats.totalAnnual.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">Projected yearly cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Repeat className="h-4 w-4 mr-2" />
              Active Charges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.activeCount}</div>
            <p className="text-xs text-gray-500 mt-1">Currently tracking</p>
          </CardContent>
        </Card>
      </div>

      {/* Recurring Charges List */}
      <Card>
        <CardHeader>
          <CardTitle>All Recurring Charges</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Loading recurring charges...</p>
            </div>
          ) : recurringCharges.length === 0 ? (
            <div className="text-center py-12">
              <Repeat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No recurring charges found</h3>
              <p className="text-gray-600 mb-4">Start tracking your recurring expenses like subscriptions, utilities, and more</p>
              <Button onClick={() => toast.info('Add recurring charge form coming soon')}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Recurring Charge
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recurringCharges.map((charge) => (
                <div key={charge.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="bg-red-100 p-3 rounded-lg">
                      <Repeat className="h-5 w-5 text-red-600" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h4 className="font-semibold text-gray-900">
                          {charge.description || 'Recurring Charge'}
                        </h4>
                        <Badge variant={getFrequencyColor(charge.frequency)}>
                          {charge.frequency}
                        </Badge>
                        {!charge.isActive && (
                          <Badge variant="outline" className="bg-gray-100">
                            Inactive
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {charge.nextDueDate && (
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Next due: {format(new Date(charge.nextDueDate), 'MMM d, yyyy')}
                          </div>
                        )}
                        {charge.category && (
                          <span>{charge.category}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">
                        -${Math.abs(charge.amount).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {charge.frequency.toLowerCase()}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info(`Editing ${charge.description || 'recurring charge'}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newWindow = window.open('', '_blank', 'width=600,height=400')
                          if (newWindow) {
                            newWindow.document.write(`
                              <html>
                                <head>
                                  <title>Recurring Charge Details</title>
                                  <style>
                                    body { font-family: Arial, sans-serif; margin: 20px; }
                                    h1 { color: #333; }
                                    .detail { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
                                  </style>
                                </head>
                                <body>
                                  <h1>${charge.description || 'Recurring Charge'}</h1>
                                  <div class="detail"><strong>Amount:</strong> -$${Math.abs(charge.amount).toFixed(2)}</div>
                                  <div class="detail"><strong>Frequency:</strong> ${charge.frequency}</div>
                                  <div class="detail"><strong>Next Due:</strong> ${charge.nextDueDate ? format(new Date(charge.nextDueDate), 'MMM d, yyyy') : 'N/A'}</div>
                                  <div class="detail"><strong>Status:</strong> ${charge.isActive ? 'Active' : 'Inactive'}</div>
                                  ${charge.category ? `<div class="detail"><strong>Category:</strong> ${charge.category.name}</div>` : ''}
                                </body>
                              </html>
                            `)
                            newWindow.document.close()
                          }
                        }}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights Card */}
      {recurringCharges.length > 0 && (
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <TrendingUp className="h-5 w-5 mr-2" />
              Spending Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900">
                    You have {stats.activeCount} active recurring charges
                  </p>
                  <p className="text-sm text-blue-700">
                    Totaling ${stats.totalMonthly.toFixed(2)}/month or ${stats.totalAnnual.toFixed(2)}/year
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
