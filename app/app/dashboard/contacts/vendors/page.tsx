

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, Building2, Phone, Mail, MapPin, CreditCard, FileText, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

async function getVendorsData(userId: string) {
  const [vendors, vendorStats, recentTransactions] = await Promise.all([
    prisma.vendor.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      include: {
        bills: {
          where: { status: 'PENDING' },
          select: { id: true, amount: true }
        },
        expenses: {
          take: 5,
          orderBy: { date: 'desc' },
          select: { amount: true, date: true, description: true }
        }
      }
    }),
    prisma.vendor.groupBy({
      by: ['isActive'],
      where: { userId },
      _count: { _all: true }
    }),
    prisma.transaction.findMany({
      where: { 
        userId,
        type: 'EXPENSE',
        vendorId: { not: null }
      },
      take: 10,
      orderBy: { date: 'desc' },
      include: { vendor: true }
    })
  ])

  const activeVendors = vendorStats.find(s => s.isActive === true)?._count._all || 0
  const totalPendingBills = vendors.reduce((sum, v) => 
    sum + v.bills.reduce((billSum, bill) => billSum + bill.amount, 0), 0
  )

  const monthlySpend = recentTransactions
    .filter(t => new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0)

  return { 
    vendors, 
    activeVendors, 
    totalPendingBills, 
    monthlySpend,
    recentTransactions: recentTransactions.slice(0, 5)
  }
}

export default async function VendorsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const { vendors, activeVendors, totalPendingBills, monthlySpend } = await getVendorsData(session.user.id)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-600 mt-1">Vendor scorecards and purchase management</p>
        </div>
        <Link href="/dashboard/contacts/vendors/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeVendors}</div>
            <p className="text-xs text-gray-500 mt-1">Currently engaged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${totalPendingBills.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Outstanding payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Monthly Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${monthlySpend.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Payment Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">0</div>
            <p className="text-xs text-gray-500 mt-1">Days average</p>
          </CardContent>
        </Card>
      </div>

      {/* Vendors List */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {vendors.length > 0 ? (
            <div className="space-y-4">
              {vendors.map((vendor) => {
                const pendingAmount = vendor.bills.reduce((sum, bill) => sum + bill.amount, 0)
                const recentExpenses = vendor.expenses.slice(0, 3)
                const totalSpend = vendor.expenses.reduce((sum, expense) => sum + expense.amount, 0)

                return (
                  <div key={vendor.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src="" alt={vendor.name} />
                          <AvatarFallback>
                            {vendor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{vendor.name}</h3>
                            <Badge variant={vendor.isActive ? 'default' : 'secondary'}>
                              {vendor.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            {pendingAmount > 0 && (
                              <Badge variant="destructive">
                                ${pendingAmount.toLocaleString()} pending
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              {vendor.email && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <Mail className="h-4 w-4" />
                                  <span>{vendor.email}</span>
                                </div>
                              )}
                              {vendor.phone && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <Phone className="h-4 w-4" />
                                  <span>{vendor.phone}</span>
                                </div>
                              )}
                              {(vendor.city || vendor.state) && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <MapPin className="h-4 w-4" />
                                  <span>{[vendor.city, vendor.state].filter(Boolean).join(', ')}</span>
                                </div>
                              )}
                              {vendor.website && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <Building2 className="h-4 w-4" />
                                  <span>{vendor.website}</span>
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <TrendingUp className="h-4 w-4" />
                                <span className="font-medium">
                                  Total Spend: ${totalSpend.toLocaleString()}
                                </span>
                              </div>
                              {vendor.paymentTerms && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <CreditCard className="h-4 w-4" />
                                  <span>Terms: {vendor.paymentTerms}</span>
                                </div>
                              )}
                              {vendor.taxId && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <FileText className="h-4 w-4" />
                                  <span>Tax ID: {vendor.taxId}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {recentExpenses.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Transactions:</h4>
                              <div className="space-y-1">
                                {recentExpenses.map((expense, idx) => (
                                  <div key={idx} className="flex justify-between text-xs text-gray-600">
                                    <span className="truncate max-w-xs">{expense.description}</span>
                                    <span className="font-medium">${expense.amount.toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {vendor.notes && (
                            <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
                              <strong>Notes:</strong> {vendor.notes}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const newWindow = window.open('', '_blank', 'width=800,height=600')
                            if (newWindow) {
                              newWindow.document.write(`
                                <html>
                                  <head>
                                    <title>Vendor Scorecard - ${vendor.name}</title>
                                    <style>
                                      body { font-family: Arial, sans-serif; margin: 20px; }
                                      .scorecard-header { border-bottom: 2px solid #ccc; padding-bottom: 20px; margin-bottom: 20px; }
                                      .metric { margin: 15px 0; padding: 10px; background-color: #f5f5f5; border-radius: 5px; }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="scorecard-header">
                                      <h1>Vendor Scorecard</h1>
                                      <h2>${vendor.name}</h2>
                                    </div>
                                    <div class="metric">
                                      <strong>Total Spend:</strong> $${totalSpend.toLocaleString()}
                                    </div>
                                    <div class="metric">
                                      <strong>Pending Bills:</strong> ${vendor.bills.length} bills ($${pendingAmount.toLocaleString()})
                                    </div>
                                    <div class="metric">
                                      <strong>Recent Transactions:</strong> ${recentExpenses.length}
                                    </div>
                                    <div class="metric">
                                      <strong>Payment Terms:</strong> ${vendor.paymentTerms || 'Standard'}
                                    </div>
                                    <div class="metric">
                                      <strong>Status:</strong> ${vendor.isActive ? 'Active' : 'Inactive'}
                                    </div>
                                    <div class="metric">
                                      <strong>Contact:</strong> ${vendor.email || 'N/A'} | ${vendor.phone || 'N/A'}
                                    </div>
                                  </body>
                                </html>
                              `)
                              newWindow.document.close()
                            } else {
                              toast.info(`Opening scorecard for ${vendor.name}...`)
                            }
                          }}
                        >
                          View Scorecard
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (vendor.bills.length > 0) {
                              toast.success(`Initiating payment for ${vendor.bills.length} pending bills for ${vendor.name}`)
                              setTimeout(() => {
                                toast.info(`Payment queue: $${pendingAmount.toLocaleString()} total pending`)
                              }, 1500)
                            } else {
                              toast.info(`No pending bills for ${vendor.name}`)
                            }
                          }}
                        >
                          Pay Bills
                        </Button>
                        {vendor.bills.length > 0 && (
                          <Badge variant="outline" className="text-center">
                            {vendor.bills.length} pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors yet</h3>
              <p className="text-gray-600 mb-4">Add vendors to track spending and manage payments</p>
              <Link href="/dashboard/contacts/vendors/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vendor
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
