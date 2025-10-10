

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Calculator, CheckCircle, AlertCircle, Clock, Upload, Download } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

async function getReconciliationData(userId: string) {
  const reconciliations = await prisma.reconciliation.findMany({
    where: { userId },
    orderBy: [{ year: 'desc' }, { month: 'desc' }]
  }).catch(() => [])

  const reconciliationStats = await prisma.reconciliation.groupBy({
    by: ['status'],
    where: { userId },
    _count: { _all: true },
    _sum: { difference: true }
  }).catch(() => [])

  return { reconciliations, reconciliationStats }
}

export default async function ReconciliationPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const { reconciliations, reconciliationStats } = await getReconciliationData(session.user.id)

  // Empty reconciliations data - users can add their own
  const mockReconciliations: any[] = []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      case 'NEEDS_REVIEW':
        return <Badge variant="destructive">Needs Review</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'PENDING':
        return <Clock className="h-4 w-4 text-gray-400" />
      case 'IN_PROGRESS':
        return <Calculator className="h-4 w-4 text-blue-500" />
      case 'NEEDS_REVIEW':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bank Reconciliation</h1>
          <p className="text-gray-600 mt-1">Automated reconciliation with ML-powered matching</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Bank Statement
          </Button>
          <Link href="/dashboard/accounting/reconciliation/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Start Reconciliation
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <div className="text-2xl font-bold text-green-600">
                {mockReconciliations.filter(r => r.status === 'COMPLETED').length}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">This year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-orange-500 mr-2" />
              <div className="text-2xl font-bold text-orange-600">
                {mockReconciliations.filter(r => r.status === 'PENDING').length}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Awaiting action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Need Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <div className="text-2xl font-bold text-red-600">
                {mockReconciliations.filter(r => r.status === 'NEEDS_REVIEW').length}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Discrepancies found</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">0</div>
            <p className="text-xs text-gray-500 mt-1">Hours per reconciliation</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reconciliations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reconciliations">Reconciliations</TabsTrigger>
          <TabsTrigger value="automation">Automation Rules</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="reconciliations">
          <Card>
            <CardHeader>
              <CardTitle>Reconciliation History</CardTitle>
            </CardHeader>
            <CardContent>
              {mockReconciliations.length > 0 ? (
                <div className="space-y-4">
                  {mockReconciliations.map((reconciliation) => (
                    <div 
                      key={reconciliation.id} 
                      className={`border rounded-lg p-6 hover:shadow-md transition-shadow ${
                        reconciliation.status === 'NEEDS_REVIEW' ? 'border-red-200 bg-red-50' :
                        reconciliation.status === 'COMPLETED' ? 'border-green-200 bg-green-50' :
                        'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(reconciliation.status)}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {monthNames[reconciliation.month - 1]} {reconciliation.year}
                            </h3>
                            <div className="flex items-center space-x-4 mt-1">
                              {getStatusBadge(reconciliation.status)}
                              {reconciliation.reconciledAt && (
                                <span className="text-sm text-gray-500">
                                  Reconciled on {format(new Date(reconciliation.reconciledAt), 'MMM d, yyyy')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center space-x-6">
                            <div className="text-center">
                              <div className="text-sm text-gray-600">Opening</div>
                              <div className="font-semibold">${reconciliation.openingBalance.toLocaleString()}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm text-gray-600">Closing</div>
                              <div className="font-semibold">${reconciliation.closingBalance.toLocaleString()}</div>
                            </div>
                            {reconciliation.bankBalance !== null && (
                              <div className="text-center">
                                <div className="text-sm text-gray-600">Bank Balance</div>
                                <div className="font-semibold">${reconciliation.bankBalance.toLocaleString()}</div>
                              </div>
                            )}
                            <div className="text-center">
                              <div className="text-sm text-gray-600">Difference</div>
                              <div className={`font-semibold ${
                                reconciliation.difference === 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {reconciliation.difference === 0 ? '$0.00' : 
                                 reconciliation.difference > 0 ? `+$${reconciliation.difference.toLocaleString()}` :
                                 `$${reconciliation.difference.toLocaleString()}`}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {reconciliation.notes && (
                        <div className="mt-4 p-3 bg-gray-100 rounded text-sm text-gray-700">
                          <strong>Notes:</strong> {reconciliation.notes}
                        </div>
                      )}

                      <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3 mr-1" />
                          Export
                        </Button>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        {reconciliation.status !== 'COMPLETED' && (
                          <Button size="sm">
                            {reconciliation.status === 'PENDING' ? 'Start' : 'Continue'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reconciliations yet</h3>
                  <p className="text-gray-600 mb-4">Start your first bank reconciliation</p>
                  <Link href="/dashboard/accounting/reconciliation/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Start Reconciliation
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle>Automated Matching Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No matching rules configured</h3>
                <p className="text-gray-600 mb-4">Set up automated rules to speed up reconciliation</p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Matching Rule
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Reconciliation Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Reconciliations:</span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Success Rate:</span>
                    <span className="font-semibold text-green-600">0%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Difference:</span>
                    <span className="font-semibold">$0.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Time Saved:</span>
                    <span className="font-semibold text-blue-600">0 hours/month</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Matching Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Auto-matched:</span>
                    <span className="font-semibold text-green-600">0%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Manual review:</span>
                    <span className="font-semibold text-orange-600">0%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Exceptions:</span>
                    <span className="font-semibold text-red-600">0%</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      ML algorithm confidence: <span className="font-semibold text-blue-600">0%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
