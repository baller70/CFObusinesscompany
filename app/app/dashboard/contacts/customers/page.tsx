
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Users, Mail, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'

import { BackButton } from '@/components/ui/back-button';
async function getCustomers(userId: string) {
  return await prisma.customer.findMany({
    where: { userId, isActive: true },
    orderBy: { createdAt: 'desc' },
    include: {
      invoices: {
        select: { total: true, status: true }
      }
    }
  }).catch(() => [])
}

export default async function CustomersPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const customers = await getCustomers(session.user.id)

  return (
    <div className="p-6 max-w-7xl mx-auto">
        <BackButton href="/dashboard" />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage your customer relationships</p>
        </div>
        <Link href="/dashboard/contacts/customers/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </Link>
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers yet</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first customer</p>
            <Link href="/dashboard/contacts/customers/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer) => {
            const totalInvoiced = customer.invoices.reduce((sum, invoice) => sum + invoice.total, 0)
            const paidInvoices = customer.invoices.filter(inv => inv.status === 'PAID').length
            
            return (
              <Card key={customer.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{customer.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {customer.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {customer.email}
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {customer.phone}
                      </div>
                    )}
                    {customer.city && customer.state && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {customer.city}, {customer.state}
                      </div>
                    )}
                    
                    <div className="pt-3 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Invoiced:</span>
                        <span className="font-semibold">${totalInvoiced.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Invoices:</span>
                        <span className="text-gray-900">{customer.invoices.length} ({paidInvoices} paid)</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
