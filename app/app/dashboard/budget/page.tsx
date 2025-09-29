
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PieChart, Plus, TrendingUp } from 'lucide-react'

async function getUserData(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId }
  })
}

export default async function BudgetPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const userData = await getUserData(session.user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={userData} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Budget Planning</h1>
          <p className="text-gray-600 mt-1">
            Create and manage your monthly budgets to stay on track
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <PieChart className="h-5 w-5 mr-2" />
                      Budget Overview
                    </CardTitle>
                    <CardDescription>
                      Your spending vs. budget for this month
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Budget
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <PieChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets created yet</h3>
                  <p className="text-gray-600 mb-6">
                    Create your first budget to start tracking your spending against your goals.
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Budget
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Budget Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <h4 className="font-medium text-blue-900 mb-1">50/30/20 Rule</h4>
                    <p className="text-sm text-blue-700">
                      Allocate 50% for needs, 30% for wants, and 20% for savings and debt repayment.
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <h4 className="font-medium text-green-900 mb-1">Track Everything</h4>
                    <p className="text-sm text-green-700">
                      Import your bank statements to see where your money actually goes.
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
                    <h4 className="font-medium text-purple-900 mb-1">Start Small</h4>
                    <p className="text-sm text-purple-700">
                      Begin with just a few categories and expand as you get comfortable.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
