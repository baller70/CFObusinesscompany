
import BankStatementsClient from '@/components/bank-statements/bank-statements-client';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function BankStatementsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return <BankStatementsClient />;
}
