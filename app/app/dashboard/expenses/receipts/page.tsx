

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Receipt, Search, Filter, FileImage, Eye } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import Link from 'next/link'

async function getReceiptsData(userId: string) {
  const [receipts, receiptStats] = await Promise.all([
    prisma.receipt.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    }),
    prisma.receipt.groupBy({
      by: ['processed'],
      where: { userId },
      _count: { _all: true },
      _sum: { amount: true }
    })
  ])

  const currentMonth = new Date()
  currentMonth.setDate(1)
  currentMonth.setHours(0, 0, 0, 0)
  
  const monthlyReceipts = receipts.filter(receipt => 
    new Date(receipt.date) >= currentMonth
  )

  return { receipts, receiptStats, monthlyReceipts }
}

export default async function ReceiptsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const { receipts, receiptStats, monthlyReceipts } = await getReceiptsData(session.user.id)

  const totalAmount = receiptStats.reduce((sum, stat) => sum + (stat._sum.amount || 0), 0)
  const processedCount = receiptStats.find(s => s.processed === true)?._count._all || 0
  const unprocessedCount = receiptStats.find(s => s.processed === false)?._count._all || 0
  const monthlyAmount = monthlyReceipts.reduce((sum, receipt) => sum + receipt.amount, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Receipts</h1>
          <p className="text-gray-600 mt-1">Digital receipt storage and OCR processing</p>
        </div>
        <Link href="/dashboard/expenses/receipts/upload">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Upload Receipt
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search receipts by vendor, description, or amount..."
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{receipts.length}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${monthlyAmount.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">{monthlyReceipts.length} receipts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{processedCount}</div>
            <p className="text-xs text-gray-500 mt-1">OCR completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending OCR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{unprocessedCount}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting processing</p>
          </CardContent>
        </Card>
      </div>

      {/* Receipts Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Receipt Vault</CardTitle>
        </CardHeader>
        <CardContent>
          {receipts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {receipts.map((receipt) => (
                <div key={receipt.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <FileImage className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">
                        {format(new Date(receipt.date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <Badge variant={receipt.processed ? 'default' : 'secondary'}>
                      {receipt.processed ? 'Processed' : 'Pending'}
                    </Badge>
                  </div>

                  {receipt.vendor && (
                    <h3 className="font-semibold text-gray-900 mb-1">{receipt.vendor}</h3>
                  )}

                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    ${receipt.amount.toLocaleString()}
                  </div>

                  {receipt.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{receipt.description}</p>
                  )}

                  {receipt.category && (
                    <div className="mb-3">
                      <Badge variant="outline">{receipt.category}</Badge>
                    </div>
                  )}

                  {receipt.ocrText && (
                    <div className="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-600 max-h-16 overflow-y-auto">
                      <strong>OCR Text:</strong> {receipt.ocrText.substring(0, 100)}...
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {format(new Date(receipt.createdAt), 'MMM d')}
                    </span>
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No receipts yet</h3>
              <p className="text-gray-600 mb-4">Upload your first receipt to start building your digital vault</p>
              <Link href="/dashboard/expenses/receipts/upload">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Receipt
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
