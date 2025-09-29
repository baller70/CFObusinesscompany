
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Upload, X } from 'lucide-react'
import Link from 'next/link'

export default async function NewExpensePage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/dashboard/expenses">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Expense</h1>
          <p className="text-gray-600 mt-1">Record a new business expense</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendor1">Office Supplies Inc</SelectItem>
                  <SelectItem value="vendor2">Tech Solutions LLC</SelectItem>
                  <SelectItem value="vendor3">Professional Services Corp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input id="amount" type="number" step="0.01" placeholder="0.00" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="office-supplies">Office Supplies</SelectItem>
                  <SelectItem value="travel">Travel & Entertainment</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="rent">Rent & Utilities</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit-card">Business Credit Card</SelectItem>
                  <SelectItem value="checking">Business Checking</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input id="reference" placeholder="Invoice/Receipt number" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Describe the expense..."
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <Label>Receipt/Documentation</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <Button variant="outline">
                    Upload Receipt
                  </Button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  PNG, JPG, PDF up to 10MB
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Link href="/dashboard/expenses">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button variant="outline">Save as Draft</Button>
            <Button>Save Expense</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
