

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ChartOfAccountsClient } from '@/components/accounting/chart-of-accounts-client'

// Mock data is used for demonstration purposes

export default async function ChartOfAccountsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Mock data for demonstration
  const mockAccounts = {
    ASSET: [
      { id: '1', code: '1000', name: 'Cash and Cash Equivalents', balance: 50000, isActive: true, children: [] },
      { id: '2', code: '1100', name: 'Accounts Receivable', balance: 25000, isActive: true, children: [] },
      { id: '3', code: '1200', name: 'Inventory', balance: 15000, isActive: true, children: [] },
    ],
    LIABILITY: [
      { id: '4', code: '2000', name: 'Accounts Payable', balance: -18000, isActive: true, children: [] },
      { id: '5', code: '2100', name: 'Accrued Expenses', balance: -5000, isActive: true, children: [] },
    ],
    EQUITY: [
      { id: '6', code: '3000', name: 'Owner Equity', balance: -50000, isActive: true, children: [] },
      { id: '7', code: '3100', name: 'Retained Earnings', balance: -12000, isActive: true, children: [] },
    ],
    REVENUE: [
      { id: '8', code: '4000', name: 'Service Revenue', balance: -45000, isActive: true, children: [] },
      { id: '9', code: '4100', name: 'Product Sales', balance: -30000, isActive: true, children: [] },
    ],
    EXPENSE: [
      { id: '10', code: '5000', name: 'Cost of Goods Sold', balance: 18000, isActive: true, children: [] },
      { id: '11', code: '5100', name: 'Operating Expenses', balance: 12000, isActive: true, children: [] },
      { id: '12', code: '5200', name: 'Marketing Expenses', balance: 8000, isActive: true, children: [] },
    ]
  }

  return <ChartOfAccountsClient mockAccounts={mockAccounts} />
}
