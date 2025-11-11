

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, Users, Phone, Mail, MapPin, DollarSign, FileText } from 'lucide-react'
import Link from 'next/link'

import { BackButton } from '@/components/ui/back-button';
async function getContractorsData(userId: string) {
  const [contractors, contractorStats] = await Promise.all([
    prisma.contractor.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      include: {
        projects: { 
          where: { status: { not: 'COMPLETED' } },
          select: { id: true, name: true }
        },
        tasks: {
          where: { status: { not: 'COMPLETED' } },
          select: { id: true }
        }
      }
    }),
    prisma.contractor.groupBy({
      by: ['isActive'],
      where: { userId },
      _count: { _all: true },
      _avg: { rate: true }
    })
  ])

  const activeContractors = contractorStats.find(s => s.isActive === true)?._count._all || 0
  const averageRate = contractorStats.find(s => s.isActive === true)?._avg.rate || 0

  return { contractors, activeContractors, averageRate }
}

export default async function ContractorsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const { contractors, activeContractors, averageRate } = await getContractorsData(session.user.id)

  const getRateTypeLabel = (rateType: string) => {
    switch (rateType) {
      case 'HOURLY': return 'per hour'
      case 'DAILY': return 'per day'  
      case 'PROJECT': return 'per project'
      case 'MONTHLY': return 'per month'
      default: return rateType
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
        <BackButton href="/dashboard" />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">People & Contractors</h1>
          <p className="text-gray-600 mt-1">Manage contractors with tax forms and compliance</p>
        </div>
        <Link href="/dashboard/contacts/contractors/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Contractor
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Contractors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeContractors}</div>
            <p className="text-xs text-gray-500 mt-1">Currently engaged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${averageRate.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Per engagement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {contractors.reduce((sum, c) => sum + c.projects.length, 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {contractors.reduce((sum, c) => sum + c.tasks.length, 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Outstanding work</p>
          </CardContent>
        </Card>
      </div>

      {/* Contractors List */}
      <Card>
        <CardHeader>
          <CardTitle>All Contractors</CardTitle>
        </CardHeader>
        <CardContent>
          {contractors.length > 0 ? (
            <div className="space-y-4">
              {contractors.map((contractor) => (
                <div key={contractor.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src="" alt={contractor.name} />
                        <AvatarFallback>
                          {contractor.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{contractor.name}</h3>
                          <Badge variant={contractor.isActive ? 'default' : 'secondary'}>
                            {contractor.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {contractor.specialty && (
                            <Badge variant="outline">{contractor.specialty}</Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            {contractor.email && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Mail className="h-4 w-4" />
                                <span>{contractor.email}</span>
                              </div>
                            )}
                            {contractor.phone && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Phone className="h-4 w-4" />
                                <span>{contractor.phone}</span>
                              </div>
                            )}
                            {(contractor.city || contractor.state) && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <MapPin className="h-4 w-4" />
                                <span>{[contractor.city, contractor.state].filter(Boolean).join(', ')}</span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            {contractor.rate && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <DollarSign className="h-4 w-4" />
                                <span className="font-medium">
                                  ${contractor.rate.toLocaleString()} {getRateTypeLabel(contractor.rateType)}
                                </span>
                              </div>
                            )}
                            {contractor.taxId && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <FileText className="h-4 w-4" />
                                <span>Tax ID: {contractor.taxId}</span>
                              </div>
                            )}
                            <div className="text-sm text-gray-600">
                              <strong>Projects:</strong> {contractor.projects.length} active
                              {contractor.projects.length > 0 && (
                                <div className="ml-4 text-xs">
                                  {contractor.projects.slice(0, 2).map(project => (
                                    <div key={project.id}>• {project.name}</div>
                                  ))}
                                  {contractor.projects.length > 2 && (
                                    <div>+ {contractor.projects.length - 2} more</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {contractor.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
                            <strong>Notes:</strong> {contractor.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                      <Button variant="outline" size="sm">
                        Generate 1099
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contractors yet</h3>
              <p className="text-gray-600 mb-4">Add contractors to manage 1099s and project assignments</p>
              <Link href="/dashboard/contacts/contractors/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contractor
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
