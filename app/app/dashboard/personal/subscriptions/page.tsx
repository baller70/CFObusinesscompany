
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Calendar, DollarSign } from 'lucide-react'

import { BackButton } from '@/components/ui/back-button';
export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([])
  const [stats, setStats] = useState({
    totalMonthly: 0,
    totalAnnual: 0,
    activeCount: 0
  })

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/personal/subscriptions')
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions || [])
        setStats(data.stats || { totalMonthly: 0, totalAnnual: 0, activeCount: 0 })
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground">Track and manage all your subscriptions</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Subscription
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BackButton href="/dashboard/personal" />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalMonthly.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Cost</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalAnnual.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No subscriptions tracked yet</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Subscription
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub: any) => (
                <div key={sub.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-accent">
                  <div>
                    <p className="font-medium">{sub.name}</p>
                    <p className="text-sm text-muted-foreground">{sub.category}</p>
                    <p className="text-xs text-muted-foreground">Next billing: {new Date(sub.nextBillingDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${sub.amount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{sub.frequency}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
