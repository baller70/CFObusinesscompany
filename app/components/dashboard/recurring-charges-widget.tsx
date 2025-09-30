
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Repeat, Clock, AlertTriangle, ChevronRight, Plus } from 'lucide-react'
import { formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns'

interface RecurringCharge {
  id: string
  name: string
  amount: number
  category: string
  frequency: string
  nextDueDate: string
  isPaused: boolean
  isActive: boolean
  vendor?: string
}

interface RecurringChargesSummary {
  totalMonthlyAmount: number
  dueSoon: number
  overdue: number
  nextPayments: Array<{
    id: string
    name: string
    amount: number
    dueDate: string
  }>
}

export function RecurringChargesWidget() {
  const [summary, setSummary] = useState<RecurringChargesSummary | null>(null)
  const [upcomingCharges, setUpcomingCharges] = useState<RecurringCharge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecurringChargesData()
  }, [])

  const fetchRecurringChargesData = async () => {
    try {
      setLoading(true)
      // Fetch upcoming charges (next 7 days)
      const response = await fetch('/api/recurring-charges?upcoming=7&active=true')
      if (response.ok) {
        const data = await response.json()
        setUpcomingCharges(data.recurringCharges.slice(0, 5)) // Show only first 5
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Error fetching recurring charges:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (charge: RecurringCharge) => {
    const dueDate = new Date(charge.nextDueDate)
    
    if (isPast(dueDate) && !isToday(dueDate)) {
      return <Badge variant="destructive" className="text-xs">Overdue</Badge>
    }
    
    if (isToday(dueDate)) {
      return <Badge className="bg-orange-500 hover:bg-orange-600 text-xs">Today</Badge>
    }
    
    if (isTomorrow(dueDate)) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-xs">Tomorrow</Badge>
    }
    
    const daysDifference = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24))
    if (daysDifference <= 7) {
      return <Badge variant="outline" className="border-yellow-200 text-yellow-700 text-xs">Due Soon</Badge>
    }
    
    return null
  }

  const getDueDateText = (charge: RecurringCharge) => {
    const dueDate = new Date(charge.nextDueDate)
    
    if (isToday(dueDate)) return 'Today'
    if (isTomorrow(dueDate)) return 'Tomorrow'
    if (isPast(dueDate)) return `${formatDistanceToNow(dueDate)} ago`
    
    return `in ${formatDistanceToNow(dueDate)}`
  }

  if (loading) {
    return (
      <Card className="card-premium-elevated">
        <CardHeader className="pb-3">
          <div className="h-6 bg-muted rounded w-2/3"></div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="card-premium-elevated">
      <CardHeader className="pb-3">
        <CardTitle className="text-body-large font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-primary" />
            Recurring Charges
          </div>
          <Link href="/recurring-charges">
            <Button variant="outline" size="sm">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-3 gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="text-center">
              <div className="text-small font-medium text-foreground">
                ${summary.totalMonthlyAmount.toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">Monthly</div>
            </div>
            <div className="text-center">
              <div className="text-small font-medium text-warning">
                {summary.dueSoon}
              </div>
              <div className="text-xs text-muted-foreground">Due Soon</div>
            </div>
            <div className="text-center">
              <div className="text-small font-medium text-destructive">
                {summary.overdue}
              </div>
              <div className="text-xs text-muted-foreground">Overdue</div>
            </div>
          </div>
        )}

        {/* Upcoming Charges */}
        {upcomingCharges.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-small font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              Upcoming Payments
            </div>
            {upcomingCharges.map((charge) => (
              <div key={charge.id} className="flex items-center justify-between p-3 bg-background border rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-small font-medium text-foreground truncate">
                      {charge.name}
                    </p>
                    {getStatusBadge(charge)}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>${charge.amount.toFixed(2)}</span>
                    <span>•</span>
                    <span>{getDueDateText(charge)}</span>
                    {charge.vendor && (
                      <>
                        <span>•</span>
                        <span className="truncate">{charge.vendor}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-small text-muted-foreground mb-4">
              No upcoming recurring charges found
            </p>
            <Link href="/recurring-charges">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Recurring Charge
              </Button>
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        {upcomingCharges.length > 0 && (
          <div className="border-t pt-3">
            <div className="flex gap-2">
              <Link href="/recurring-charges" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  Manage All
                </Button>
              </Link>
              <Link href="/recurring-charges?active=true" className="flex-1">
                <Button size="sm" className="w-full">
                  Add New
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
