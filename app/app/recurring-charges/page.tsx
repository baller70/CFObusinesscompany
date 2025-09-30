
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import RecurringChargesClient from '@/components/recurring-charges/recurring-charges-client'

export default async function RecurringChargesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  return <RecurringChargesClient />
}
