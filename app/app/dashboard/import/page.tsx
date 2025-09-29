
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { CsvImportWizard } from '@/components/import/csv-import-wizard'
import { prisma } from '@/lib/db'

async function getUserData(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      csvUploads: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  })
}

export default async function ImportPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const userData = await getUserData(session.user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={userData} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Import Financial Data</h1>
          <p className="text-gray-600 mt-1">
            Upload CSV files from your bank, credit cards, or other financial institutions
          </p>
        </div>

        <CsvImportWizard 
          userId={session.user.id}
          recentUploads={userData?.csvUploads || []}
        />
      </main>
    </div>
  )
}
