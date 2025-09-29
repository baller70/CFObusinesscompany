
'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface EstimateItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

export default function NewEstimatePage() {
  const [estimate, setEstimate] = useState({
    customerId: '',
    customerName: '',
    customerEmail: '',
    estimateNumber: `EST-${Date.now().toString().slice(-6)}`,
    issueDate: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'DRAFT',
    notes: '',
    terms: 'This estimate is valid for 30 days from the date of issue.'
  })

  const [items, setItems] = useState<EstimateItem[]>([
    {
      id: '1',
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0
    }
  ])

  const addItem = () => {
    const newItem: EstimateItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof EstimateItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'rate') {
          updated.amount = updated.quantity * updated.rate
        }
        return updated
      }
      return item
    }))
  }

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const tax = subtotal * 0.1 // 10% tax
  const total = subtotal + tax

  const handleSaveDraft = () => {
    toast.success('Estimate saved as draft!')
  }

  const handleSendEstimate = () => {
    toast.success('Estimate sent to customer!')
  }

  return (
    <DashboardLayout title="Create New Estimate">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Estimate</h1>
            <p className="text-gray-600">Create a new estimate for your customer</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleSaveDraft}>
              Save as Draft
            </Button>
            <Button onClick={handleSendEstimate}>
              Send Estimate
            </Button>
          </div>
        </div>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={estimate.customerName}
                  onChange={(e) => setEstimate({ ...estimate, customerName: e.target.value })}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Customer Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={estimate.customerEmail}
                  onChange={(e) => setEstimate({ ...estimate, customerEmail: e.target.value })}
                  placeholder="customer@example.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estimate Details */}
        <Card>
          <CardHeader>
            <CardTitle>Estimate Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="estimateNumber">Estimate Number</Label>
                <Input
                  id="estimateNumber"
                  value={estimate.estimateNumber}
                  onChange={(e) => setEstimate({ ...estimate, estimateNumber: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={estimate.issueDate}
                  onChange={(e) => setEstimate({ ...estimate, issueDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={estimate.validUntil}
                  onChange={(e) => setEstimate({ ...estimate, validUntil: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Items</CardTitle>
              <Button onClick={addItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-5">
                    {index === 0 && <Label>Description</Label>}
                    <Textarea
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="col-span-2">
                    {index === 0 && <Label>Quantity</Label>}
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                    />
                  </div>
                  <div className="col-span-2">
                    {index === 0 && <Label>Rate ($)</Label>}
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    {index === 0 && <Label>Amount</Label>}
                    <Input
                      value={`$${item.amount.toFixed(2)}`}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="col-span-1">
                    {index === 0 && <Label>&nbsp;</Label>}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-8 pt-6 border-t">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (10%):</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes and Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add any notes for your customer"
                value={estimate.notes}
                onChange={(e) => setEstimate({ ...estimate, notes: e.target.value })}
                rows={4}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter terms and conditions"
                value={estimate.terms}
                onChange={(e) => setEstimate({ ...estimate, terms: e.target.value })}
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <Link href="/dashboard/invoices">
            <Button variant="outline">
              Cancel
            </Button>
          </Link>
          <div className="space-x-3">
            <Button variant="outline" onClick={handleSaveDraft}>
              Save as Draft
            </Button>
            <Button onClick={handleSendEstimate}>
              Send Estimate
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
