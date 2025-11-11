

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Printer, CreditCard, CheckCircle, Clock, FileText } from 'lucide-react'
import Link from 'next/link'

import { BackButton } from '@/components/ui/back-button';
export default async function PrintChecksPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Initialize check statistics (real data will be pulled from database when check feature is implemented)
  const checkData = {
    totalChecks: 0,
    pendingChecks: 0,
    printedChecks: 0,
    voidedChecks: 0,
    lastCheckNumber: 1001
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
        <BackButton href="/dashboard/expenses" />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Print Checks</h1>
          <p className="text-gray-600 mt-1">MICR check printing and payment processing</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/dashboard/expenses/checks/batch">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Batch Run
            </Button>
          </Link>
          <Link href="/dashboard/expenses/checks/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Print Check
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Next Check Number</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">#{checkData.lastCheckNumber}</div>
            <p className="text-xs text-gray-500 mt-1">Ready to print</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{checkData.pendingChecks}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Printed This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{checkData.printedChecks}</div>
            <p className="text-xs text-gray-500 mt-1">Successful prints</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Voided Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{checkData.voidedChecks}</div>
            <p className="text-xs text-gray-500 mt-1">Cancelled/void</p>
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Printer className="h-5 w-5 mr-2 text-blue-600" />
              MICR Check Printing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Bank-compliant MICR encoding</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Magnetic ink character recognition</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Automated check numbering</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Custom check layouts</span>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/dashboard/expenses/checks/settings">
                <Button variant="outline" size="sm">Configure Printer</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-green-600" />
              Check Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Batch check printing</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Positive pay file generation</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Check stock management</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Void tracking & reconciliation</span>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/dashboard/expenses/checks/stock">
                <Button variant="outline" size="sm">Manage Stock</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Check Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No checks printed yet</h3>
            <p className="text-gray-600 mb-4">Start printing professional checks for your vendors</p>
            <div className="space-x-3">
              <Link href="/dashboard/expenses/checks/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Print Single Check
                </Button>
              </Link>
              <Link href="/dashboard/expenses/checks/batch">
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Batch Check Run
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
