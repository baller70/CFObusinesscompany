

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ChartOfAccountsClient } from '@/components/accounting/chart-of-accounts-client'

export default async function ChartOfAccountsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Empty accounts data - users can add their own
  const accounts = {
    ASSET: [],
    LIABILITY: [],
    EQUITY: [],
    REVENUE: [],
    EXPENSE: []
  }

  return <ChartOfAccountsClient mockAccounts={accounts} />
}
