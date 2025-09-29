
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NewVendorPage() {
  const { data: session, status } = useSession() || {}
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Handle authentication redirect properly
  if (status === 'loading') {
    return <div className="p-6">Loading...</div>
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  const handleCreateVendor = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Vendor created successfully!')
      router.push('/dashboard/contacts/vendors')
    } catch (error) {
      toast.error('Failed to create vendor')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/dashboard/contacts/vendors">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vendors
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Vendor</h1>
          <p className="text-gray-600 mt-1">Add a new vendor to your contacts</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="company">Company Name *</Label>
              <Input id="company" placeholder="Vendor Company LLC" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input id="contactName" placeholder="John Smith" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="contact@vendor.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" type="url" placeholder="https://vendor.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="office-supplies">Office Supplies</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="professional-services">Professional Services</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input id="street" placeholder="123 Business Ave" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="suite">Suite/Unit</Label>
                <Input id="suite" placeholder="Suite 100" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="San Francisco" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ca">California</SelectItem>
                    <SelectItem value="ny">New York</SelectItem>
                    <SelectItem value="tx">Texas</SelectItem>
                    <SelectItem value="fl">Florida</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input id="zip" placeholder="94105" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="ca">Canada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Payment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID</Label>
                <Input id="taxId" placeholder="12-3456789" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="net-15">Net 15</SelectItem>
                    <SelectItem value="net-30">Net 30</SelectItem>
                    <SelectItem value="net-60">Net 60</SelectItem>
                    <SelectItem value="due-on-receipt">Due on Receipt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input id="accountNumber" placeholder="Vendor account number" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="routingNumber">Routing Number</Label>
                <Input id="routingNumber" placeholder="123456789" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea 
              id="notes" 
              placeholder="Additional notes about this vendor..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Link href="/dashboard/contacts/vendors">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button 
              onClick={handleCreateVendor}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Vendor'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
