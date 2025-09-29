

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Plus, Save } from 'lucide-react'
import Link from 'next/link'

export default async function NewInvoicePage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
          <p className="text-gray-600 mt-1">Generate a new invoice for your customer</p>
        </div>
        <Link href="/dashboard/invoices">
          <Button variant="outline">
            Back to Invoices
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="customer">Customer *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acme-corp">Acme Corporation</SelectItem>
                  <SelectItem value="tech-solutions">Tech Solutions Inc</SelectItem>
                  <SelectItem value="global-systems">Global Systems Ltd</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input 
                id="invoiceNumber" 
                defaultValue="INV-2024-001"
                className="font-mono"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="issueDate">Issue Date *</Label>
              <div className="relative">
                <Input 
                  id="issueDate" 
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date *</Label>
              <div className="relative">
                <Input 
                  id="dueDate" 
                  type="date"
                />
                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-semibold">Line Items</Label>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="border rounded-lg">
              <div className="grid grid-cols-12 gap-4 p-4 border-b bg-gray-50 text-sm font-medium text-gray-700">
                <div className="col-span-5">Description</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-1"></div>
              </div>

              <div className="grid grid-cols-12 gap-4 p-4 border-b">
                <div className="col-span-5">
                  <Input placeholder="Item description" />
                </div>
                <div className="col-span-2">
                  <Input type="number" defaultValue="1" className="text-center" />
                </div>
                <div className="col-span-2">
                  <Input type="number" step="0.01" placeholder="0.00" className="text-right" />
                </div>
                <div className="col-span-2">
                  <div className="text-right font-semibold py-2 px-3 bg-gray-50 rounded">
                    $0.00
                  </div>
                </div>
                <div className="col-span-1 flex justify-center">
                  <Button variant="ghost" size="sm" className="text-red-600">×</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold">$0.00</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (0%):</span>
                <span className="font-semibold">$0.00</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>$0.00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea 
              id="notes" 
              placeholder="Additional notes for the customer..."
              rows={3}
            />
          </div>

          {/* Terms */}
          <div>
            <Label htmlFor="terms">Terms & Conditions</Label>
            <Textarea 
              id="terms" 
              placeholder="Payment terms and conditions..."
              rows={3}
              defaultValue="Payment is due within 30 days of invoice date."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button variant="outline">
              Save as Draft
            </Button>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Create & Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
