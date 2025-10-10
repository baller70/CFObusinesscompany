
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, Plus, DollarSign } from 'lucide-react'

export default function CharitableGivingPage() {
  const [donations, setDonations] = useState([])
  const [totalGiving, setTotalGiving] = useState(0)

  useEffect(() => {
    fetchDonations()
  }, [])

  const fetchDonations = async () => {
    try {
      const response = await fetch('/api/personal/charitable-giving')
      if (response.ok) {
        const data = await response.json()
        setDonations(data.donations || [])
        setTotalGiving(data.totalGiving || 0)
      }
    } catch (error) {
      console.error('Error fetching donations:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Charitable Giving</h1>
          <p className="text-muted-foreground">Track your donations for tax purposes</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Donation
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Giving ({new Date().getFullYear()})</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalGiving.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Donations</CardTitle>
            <Heart className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{donations.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Donation History</CardTitle>
        </CardHeader>
        <CardContent>
          {donations.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No donations recorded yet</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Your First Donation
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {donations.map((donation: any) => (
                <div key={donation.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{donation.organizationName}</p>
                    <p className="text-sm text-muted-foreground">{new Date(donation.date).toLocaleDateString()}</p>
                    {donation.taxDeductible && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded mt-1 inline-block">
                        Tax Deductible
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-bold text-green-600">${donation.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
