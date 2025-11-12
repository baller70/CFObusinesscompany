

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ChartOfAccountsClient } from '@/components/accounting/chart-of-accounts-client'
import { BackButton } from '@/components/ui/back-button'

export default async function ChartOfAccountsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Fetch real chart of accounts from database
  const allAccounts = await prisma.chartOfAccount.findMany({
    where: { userId: session.user.id },
    orderBy: { code: 'asc' }
  })

  // Group accounts by type
  const accounts = {
    ASSET: allAccounts.filter(a => a.type === 'ASSET'),
    LIABILITY: allAccounts.filter(a => a.type === 'LIABILITY'),
    EQUITY: allAccounts.filter(a => a.type === 'EQUITY'),
    REVENUE: allAccounts.filter(a => a.type === 'REVENUE'),
    EXPENSE: allAccounts.filter(a => a.type === 'EXPENSE')
  }

  return (
    <>
      <BackButton href="/dashboard" />
      <ChartOfAccountsClient mockAccounts={accounts} />
    </>
  )
}
