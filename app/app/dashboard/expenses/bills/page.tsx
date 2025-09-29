

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Clock, AlertCircle, CheckCircle, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

async function getBillsData(userId: string) {
  const [bills, vendors, billStats] = await Promise.all([
    prisma.bill.findMany({
      where: { userId },
      include: { vendor: true },
      orderBy: { dueDate: 'asc' }
    }),
    prisma.vendor.count({
      where: { userId, isActive: true }
    }),
    prisma.bill.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true },
      _sum: { amount: true }
    })
  ])

  const upcomingBills = bills.filter(bill => 
    bill.status === 'PENDING' && 
    new Date(bill.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  )

  const overdueBills = bills.filter(bill => 
    bill.status === 'PENDING' && new Date(bill.dueDate) < new Date()
  )

  return { bills, vendors, billStats, upcomingBills, overdueBills }
}

export default async function BillsToPayPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const { bills, vendors, billStats, upcomingBills, overdueBills } = await getBillsData(session.user.id)

  const pendingAmount = billStats.find(s => s.status === 'PENDING')?._sum.amount || 0
  const overdueBillsCount = overdueBills.length
  const upcomingBillsCount = upcomingBills.length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>
      case 'SCHEDULED':
        return <Badge variant="outline">Scheduled</Badge>
      case 'PAID':
        return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>
      case 'OVERDUE':
        return <Badge variant="destructive">Overdue</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bills to Pay</h1>
          <p className="text-gray-600 mt-1">Track and pay your vendor bills</p>
        </div>
        <Link href="/dashboard/expenses/bills/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Bill
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${pendingAmount.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">{vendors} active vendors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <div className="text-2xl font-bold text-red-600">{overdueBillsCount}</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Due This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-blue-500 mr-2" />
              <div className="text-2xl font-bold text-blue-600">{upcomingBillsCount}</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Upcoming payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{bills.length}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Bills List */}
      <Card>
        <CardHeader>
          <CardTitle>All Bills</CardTitle>
        </CardHeader>
        <CardContent>
          {bills.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Bill #</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Vendor</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Description</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Due Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => {
                    const isOverdue = bill.status === 'PENDING' && new Date(bill.dueDate) < new Date()
                    const isDueSoon = bill.status === 'PENDING' && 
                      new Date(bill.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    
                    return (
                      <tr 
                        key={bill.id} 
                        className={`border-b border-gray-100 hover:bg-gray-50 ${
                          isOverdue ? 'bg-red-50' : isDueSoon ? 'bg-yellow-50' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono text-sm">
                          {bill.billNumber || `BILL-${bill.id.slice(-6).toUpperCase()}`}
                        </td>
                        <td className="py-3 px-4">
                          {bill.vendor?.name || 'No Vendor'}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="truncate">{bill.description}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          ${bill.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            {format(new Date(bill.dueDate), 'MMM d, yyyy')}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(isOverdue ? 'OVERDUE' : bill.status)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="outline" size="sm">
                            {bill.status === 'PENDING' ? 'Pay Now' : 'View'}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bills yet</h3>
              <p className="text-gray-600 mb-4">Add your first vendor bill to start tracking payments</p>
              <Link href="/dashboard/expenses/bills/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bill
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
