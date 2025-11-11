
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { GoalForm } from '@/components/goals/goal-form'
import { BackButton } from '@/components/ui/back-button'

async function getUserData(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId }
  })
}

export default async function NewGoalPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const userData = await getUserData(session.user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={userData} />
      
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton href="/dashboard/goals" />
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create New Goal</h1>
          <p className="text-gray-600 mt-1">
            Set a financial goal to track your progress and stay motivated
          </p>
        </div>

        <GoalForm userId={session.user.id} />
      </main>
    </div>
  )
}
