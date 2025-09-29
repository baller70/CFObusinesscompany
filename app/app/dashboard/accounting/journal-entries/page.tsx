

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, FileText, Search, Filter, Calendar, CheckCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

async function getJournalEntriesData(userId: string) {
  const [journalEntries, journalStats] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { userId },
      include: {
        lines: {
          include: { account: true }
        }
      },
      orderBy: { date: 'desc' }
    }).catch(() => []),
    prisma.journalEntry.count({
      where: { userId }
    }).catch(() => 0)
  ])

  return { journalEntries, journalStats }
}

export default async function JournalEntriesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const { journalEntries, journalStats } = await getJournalEntriesData(session.user.id)

  // Mock data for demonstration
  const mockJournalEntries = [
    {
      id: '1',
      entryNumber: 'JE-2024-001',
      date: new Date('2024-11-15'),
      description: 'Monthly depreciation entry',
      reference: 'DEP-NOV-2024',
      totalDebit: 2500,
      totalCredit: 2500,
      lines: [
        { id: '1', description: 'Depreciation Expense', debitAmount: 2500, creditAmount: 0, account: { code: '5300', name: 'Depreciation Expense' } },
        { id: '2', description: 'Accumulated Depreciation', debitAmount: 0, creditAmount: 2500, account: { code: '1250', name: 'Accumulated Depreciation' } }
      ]
    },
    {
      id: '2',
      entryNumber: 'JE-2024-002',
      date: new Date('2024-11-10'),
      description: 'Accrued interest on loan',
      reference: 'INT-NOV-2024',
      totalDebit: 450,
      totalCredit: 450,
      lines: [
        { id: '3', description: 'Interest Expense', debitAmount: 450, creditAmount: 0, account: { code: '5400', name: 'Interest Expense' } },
        { id: '4', description: 'Accrued Interest Payable', debitAmount: 0, creditAmount: 450, account: { code: '2150', name: 'Accrued Interest Payable' } }
      ]
    },
    {
      id: '3',
      entryNumber: 'JE-2024-003',
      date: new Date('2024-11-05'),
      description: 'Prepaid insurance adjustment',
      reference: 'INS-NOV-2024',
      totalDebit: 800,
      totalCredit: 800,
      lines: [
        { id: '5', description: 'Insurance Expense', debitAmount: 800, creditAmount: 0, account: { code: '5500', name: 'Insurance Expense' } },
        { id: '6', description: 'Prepaid Insurance', debitAmount: 0, creditAmount: 800, account: { code: '1300', name: 'Prepaid Insurance' } }
      ]
    }
  ]

  const thisMonthEntries = mockJournalEntries.filter(entry => {
    const entryMonth = entry.date.getMonth()
    const currentMonth = new Date().getMonth()
    return entryMonth === currentMonth
  }).length

  const totalDebits = mockJournalEntries.reduce((sum, entry) => sum + entry.totalDebit, 0)
  const averageEntry = mockJournalEntries.length > 0 ? totalDebits / mockJournalEntries.length : 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Journal Entries</h1>
          <p className="text-gray-600 mt-1">Double-entry bookkeeping with approval workflows</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            Recurring Entries
          </Button>
          <Link href="/dashboard/accounting/journal-entries/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by entry number, description, or reference..."
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
            </Button>
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
            <CardTitle className="text-sm font-medium text-gray-600">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{mockJournalEntries.length}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{thisMonthEntries}</div>
            <p className="text-xs text-gray-500 mt-1">New entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalDebits.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total debits/credits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ${averageEntry.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Per entry</p>
          </CardContent>
        </Card>
      </div>

      {/* Journal Entries List */}
      <Card>
        <CardHeader>
          <CardTitle>Journal Entry Register</CardTitle>
        </CardHeader>
        <CardContent>
          {mockJournalEntries.length > 0 ? (
            <div className="space-y-6">
              {mockJournalEntries.map((entry) => (
                <div key={entry.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  {/* Entry Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {entry.entryNumber}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {format(entry.date, 'MMM d, yyyy')}
                          </div>
                          {entry.reference && (
                            <span>Ref: {entry.reference}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Debit</div>
                          <div className="text-lg font-bold text-gray-900">
                            ${entry.totalDebit.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Credit</div>
                          <div className="text-lg font-bold text-gray-900">
                            ${entry.totalCredit.toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center">
                          {entry.totalDebit === entry.totalCredit ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Entry Description */}
                  <div className="mb-4">
                    <p className="text-gray-700 font-medium">{entry.description}</p>
                  </div>

                  {/* Journal Lines */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-600 border-b border-gray-200 pb-2">
                        <div className="col-span-1">Account</div>
                        <div className="col-span-4">Account Name</div>
                        <div className="col-span-3">Description</div>
                        <div className="col-span-2 text-right">Debit</div>
                        <div className="col-span-2 text-right">Credit</div>
                      </div>
                      
                      {entry.lines.map((line) => (
                        <div key={line.id} className="grid grid-cols-12 gap-4 text-sm py-2 hover:bg-gray-100 rounded">
                          <div className="col-span-1 font-mono text-gray-600">
                            {line.account.code}
                          </div>
                          <div className="col-span-4 font-medium text-gray-900">
                            {line.account.name}
                          </div>
                          <div className="col-span-3 text-gray-600">
                            {line.description}
                          </div>
                          <div className="col-span-2 text-right font-semibold">
                            {line.debitAmount > 0 ? `$${line.debitAmount.toLocaleString()}` : '—'}
                          </div>
                          <div className="col-span-2 text-right font-semibold">
                            {line.creditAmount > 0 ? `$${line.creditAmount.toLocaleString()}` : '—'}
                          </div>
                        </div>
                      ))}

                      {/* Totals Row */}
                      <div className="grid grid-cols-12 gap-4 text-sm font-bold border-t border-gray-300 pt-2">
                        <div className="col-span-8 text-right">TOTAL:</div>
                        <div className="col-span-2 text-right">${entry.totalDebit.toLocaleString()}</div>
                        <div className="col-span-2 text-right">${entry.totalCredit.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Entry Actions */}
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      Reverse
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No journal entries yet</h3>
              <p className="text-gray-600 mb-4">Create your first journal entry to record transactions</p>
              <div className="space-x-3">
                <Button variant="outline">
                  Import Entries
                </Button>
                <Link href="/dashboard/accounting/journal-entries/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Entry
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-8 w-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Recurring Entries</h3>
              <p className="text-sm text-gray-600 mb-4">Set up automatic journal entries</p>
              <Button variant="outline" size="sm">Setup Recurring</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="h-8 w-8 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Trial Balance</h3>
              <p className="text-sm text-gray-600 mb-4">Generate trial balance report</p>
              <Button variant="outline" size="sm">View Trial Balance</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-purple-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Approval Workflow</h3>
              <p className="text-sm text-gray-600 mb-4">Configure approval processes</p>
              <Button variant="outline" size="sm">Setup Workflow</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
