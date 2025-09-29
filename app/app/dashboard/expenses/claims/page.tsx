

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Receipt, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

async function getExpenseClaimsData(userId: string) {
  const [claims, claimStats] = await Promise.all([
    prisma.expenseClaim.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.expenseClaim.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true },
      _sum: { amount: true }
    })
  ])

  return { claims, claimStats }
}

export default async function ExpenseClaimsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const { claims, claimStats } = await getExpenseClaimsData(session.user.id)

  const submittedAmount = claimStats.find(s => s.status === 'SUBMITTED')?._sum.amount || 0
  const approvedAmount = claimStats.find(s => s.status === 'APPROVED')?._sum.amount || 0
  const paidAmount = claimStats.find(s => s.status === 'PAID')?._sum.amount || 0
  const rejectedCount = claimStats.find(s => s.status === 'REJECTED')?._count._all || 0

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <Badge variant="secondary">Submitted</Badge>
      case 'APPROVED':
        return <Badge className="bg-blue-100 text-blue-800">Approved</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>
      case 'PAID':
        return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'REJECTED':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'PAID':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expense Claims</h1>
          <p className="text-gray-600 mt-1">Submit and track your expense reimbursements</p>
        </div>
        <Link href="/dashboard/expenses/claims/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Claim
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${submittedAmount.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${approvedAmount.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Ready for payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Paid Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${paidAmount.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-xs text-gray-500 mt-1">Need revision</p>
          </CardContent>
        </Card>
      </div>

      {/* Claims List */}
      <Card>
        <CardHeader>
          <CardTitle>All Expense Claims</CardTitle>
        </CardHeader>
        <CardContent>
          {claims.length > 0 ? (
            <div className="space-y-4">
              {claims.map((claim) => (
                <div key={claim.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(claim.status)}
                        <h3 className="font-semibold text-gray-900">{claim.title}</h3>
                        {getStatusBadge(claim.status)}
                      </div>
                      
                      {claim.description && (
                        <p className="text-gray-600 text-sm mb-2">{claim.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <span>Amount: <span className="font-semibold text-gray-900">${claim.amount.toLocaleString()}</span></span>
                        <span>Date: {format(new Date(claim.date), 'MMM d, yyyy')}</span>
                        {claim.category && <span>Category: {claim.category}</span>}
                      </div>

                      {claim.notes && (
                        <p className="text-xs text-gray-500 mt-2 italic">Notes: {claim.notes}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          ${claim.amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(claim.createdAt), 'MMM d')}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </div>

                  {claim.receiptPath && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center text-sm text-gray-600">
                        <Receipt className="h-4 w-4 mr-2" />
                        Receipt attached
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No expense claims yet</h3>
              <p className="text-gray-600 mb-4">Submit your first expense claim to get reimbursed</p>
              <Link href="/dashboard/expenses/claims/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Claim
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
