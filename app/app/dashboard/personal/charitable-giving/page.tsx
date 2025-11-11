'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Heart, Plus, DollarSign, Loader2, Calendar } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'

import { BackButton } from '@/components/ui/back-button';
export default function CharitableGivingPage() {
  const [donations, setDonations] = useState([])
  const [totalGiving, setTotalGiving] = useState(0)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    organizationName: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    taxDeductible: true,
    receiptNumber: '',
    notes: ''
  })
  const { toast } = useToast()

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

  const handleAddDonation = async () => {
    if (!formData.organizationName || !formData.amount || !formData.date) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/personal/charitable-giving', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to add donation')
      }

      toast({
        title: 'Donation added',
        description: 'Your charitable donation has been recorded',
      })

      setShowAddDialog(false)
      setFormData({
        organizationName: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        taxDeductible: true,
        receiptNumber: '',
        notes: ''
      })
      fetchDonations()
    } catch (error) {
      console.error('Error adding donation:', error)
      toast({
        title: 'Error',
        description: 'Failed to add donation. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const taxDeductibleTotal = donations
    .filter((d: any) => d.taxDeductible)
    .reduce((sum: number, d: any) => sum + d.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Charitable Giving</h1>
          <p className="text-muted-foreground">Track your donations for tax purposes</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Donation
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BackButton href="/dashboard/personal" />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Giving ({new Date().getFullYear()})</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalGiving.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All donations this year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tax Deductible</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${taxDeductibleTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Eligible for deduction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Donations</CardTitle>
            <Heart className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{donations.length}</div>
            <p className="text-xs text-muted-foreground">Total this year</p>
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
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Record Your First Donation
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {donations.map((donation: any) => (
                <div key={donation.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-accent">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{donation.organizationName}</p>
                      {donation.taxDeductible && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Tax Deductible
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(donation.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    {donation.receiptNumber && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Receipt: {donation.receiptNumber}
                      </p>
                    )}
                    {donation.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {donation.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">${donation.amount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Charitable Donation</DialogTitle>
            <DialogDescription>
              Record a charitable donation for tax tracking
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="organizationName">Organization Name *</Label>
              <Input
                id="organizationName"
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                placeholder="e.g., Red Cross, Local Food Bank"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="taxDeductible" className="cursor-pointer">
                  Tax Deductible
                </Label>
                <p className="text-sm text-muted-foreground">
                  Is this donation tax deductible?
                </p>
              </div>
              <Switch
                id="taxDeductible"
                checked={formData.taxDeductible}
                onCheckedChange={(checked) => setFormData({ ...formData, taxDeductible: checked })}
              />
            </div>

            <div>
              <Label htmlFor="receiptNumber">Receipt Number (Optional)</Label>
              <Input
                id="receiptNumber"
                value={formData.receiptNumber}
                onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                placeholder="Receipt or confirmation number"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any additional notes..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false)
                setFormData({
                  organizationName: '',
                  amount: '',
                  date: new Date().toISOString().split('T')[0],
                  taxDeductible: true,
                  receiptNumber: '',
                  notes: ''
                })
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleAddDonation} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Donation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
