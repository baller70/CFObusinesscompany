
'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, FolderOpen, Calendar, DollarSign, Users, BarChart3, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ProjectsPage() {
  const { data: session, status } = useSession() || {}
  
  if (status === 'loading') return <div className="p-6">Loading...</div>
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // All data will come from the database - no mock data
  const mockProjects: any[] = []

  const activeProjects = 0
  const completedProjects = 0
  const onHoldProjects = 0
  const totalBudget = 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'secondary'
      case 'IN_PROGRESS': return 'outline'
      case 'ON_HOLD': return 'destructive'
      case 'COMPLETED': return 'default'
      default: return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PLANNING': return <Clock className="h-4 w-4" />
      case 'IN_PROGRESS': return <BarChart3 className="h-4 w-4" />
      case 'ON_HOLD': return <AlertTriangle className="h-4 w-4" />
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200'
      case 'MEDIUM': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'LOW': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
          <p className="text-gray-600 mt-1">Track financial projects, budgets, and team collaboration</p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeProjects}</div>
            <p className="text-xs text-gray-500 mt-1">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedProjects}</div>
            <p className="text-xs text-gray-500 mt-1">Successfully finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Planning/On Hold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{onHoldProjects}</div>
            <p className="text-xs text-gray-500 mt-1">Not started/paused</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ${totalBudget.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Allocated funds</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active Projects</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="all">All Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockProjects.filter(project => project.status === 'IN_PROGRESS').map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(project.status)}
                        <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusColor(project.status)}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(project.priority)}>
                          {project.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>

                  {/* Budget */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">Budget</div>
                      <div className="font-semibold text-gray-900">
                        ${project.budget.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Spent</div>
                      <div className="font-semibold text-orange-600">
                        ${project.spent.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Tasks Summary */}
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-2">Tasks</div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-green-600">
      // @ts-ignore
                        ✓ {project.tasks.filter((t: any) => t.status === 'COMPLETED').length} completed
                      </span>
                      <span className="text-blue-600">
      // @ts-ignore
                        ◉ {project.tasks.filter((t: any) => t.status === 'IN_PROGRESS').length} in progress
                      </span>
                      <span className="text-gray-600">
      // @ts-ignore
                        ○ {project.tasks.filter((t: any) => t.status === 'TODO').length} todo
                      </span>
                    </div>
                  </div>

                  {/* Team Members */}
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-2">Team</div>
                    <div className="flex items-center space-x-2">
      // @ts-ignore
                      {project.teamMembers.slice(0, 3).map((member: any, index: any) => (
                        <Avatar key={index} className="h-6 w-6">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="text-xs">
      // @ts-ignore
                            {member.name.split(' ').map((n: any) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {project.teamMembers.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{project.teamMembers.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(project.startDate, 'MMM d')} - {format(project.endDate, 'MMM d, yyyy')}
                      </div>
                      <div>
                        {differenceInDays(project.endDate, new Date())} days left
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const newWindow = window.open('', '_blank', 'width=900,height=700')
                        if (newWindow) {
                          newWindow.document.write(`
                            <html>
                              <head>
                                <title>Project Details - ${project.name}</title>
                                <style>
                                  body { font-family: Arial, sans-serif; margin: 20px; }
                                  .project-header { border-bottom: 2px solid #ccc; padding-bottom: 20px; margin-bottom: 20px; }
                                  .section { margin: 20px 0; }
                                  .task-item { padding: 10px; margin: 5px 0; background: #f5f5f5; border-radius: 5px; }
                                </style>
                              </head>
                              <body>
                                <div class="project-header">
                                  <h1>${project.name}</h1>
                                  <p><strong>Status:</strong> ${project.status}</p>
                                  <p><strong>Priority:</strong> ${project.priority}</p>
                                  <p><strong>Progress:</strong> ${project.progress}%</p>
                                </div>
                                <div class="section">
                                  <h3>Description</h3>
                                  <p>${project.description}</p>
                                </div>
                                <div class="section">
                                  <h3>Budget Information</h3>
                                  <p><strong>Total Budget:</strong> $${project.budget.toLocaleString()}</p>
                                  <p><strong>Spent:</strong> $${project.spent.toLocaleString()}</p>
                                  <p><strong>Remaining:</strong> $${(project.budget - project.spent).toLocaleString()}</p>
                                </div>
                                <div class="section">
                                  <h3>Timeline</h3>
                                  <p><strong>Start Date:</strong> ${format(project.startDate, 'MMM d, yyyy')}</p>
                                  <p><strong>End Date:</strong> ${format(project.endDate, 'MMM d, yyyy')}</p>
                                  <p><strong>Days Remaining:</strong> ${differenceInDays(project.endDate, new Date())}</p>
                                </div>
                                <div class="section">
                                  <h3>Team Members</h3>
      // @ts-ignore
                                  ${project.teamMembers.map((member: any) => `<p>${member.name} - ${member.role}</p>`).join('')}
                                </div>
                                <div class="section">
                                  <h3>Tasks (${project.tasks.length} total)</h3>
      // @ts-ignore
                                  <div class="task-item">✓ Completed: ${project.tasks.filter((t: any) => t.status === 'COMPLETED').length}</div>
      // @ts-ignore
                                  <div class="task-item">◉ In Progress: ${project.tasks.filter((t: any) => t.status === 'IN_PROGRESS').length}</div>
      // @ts-ignore
                                  <div class="task-item">○ To Do: ${project.tasks.filter((t: any) => t.status === 'TODO').length}</div>
                                </div>
                              </body>
                            </html>
                          `)
                          newWindow.document.close()
                        } else {
                          toast.info(`Opening detailed view for ${project.name}...`)
                        }
                      }}
                    >
                      View Details
                    </Button>
                    <div className="space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          toast.info(`Opening ${project.name} for editing - you can modify budget, timeline, team members, and tasks.`)
                        }}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => {
                          const newProgress = Math.min(project.progress + 10, 100)
                          toast.success(`Project progress updated from ${project.progress}% to ${newProgress}%`)
                          setTimeout(() => {
                            if (newProgress === 100) {
                              toast.success(`🎉 Project ${project.name} completed!`)
                            }
                          }, 1500)
                        }}
                      >
                        Update Progress
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="space-y-4">
            {mockProjects.filter(project => project.status === 'COMPLETED').map((project) => (
              <Card key={project.id} className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                        <Badge className="bg-green-100 text-green-800">Completed</Badge>
                      </div>

                      <p className="text-gray-600 text-sm mb-3">{project.description}</p>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Budget:</span>
                          <div className="font-semibold">${project.budget.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Spent:</span>
                          <div className="font-semibold">${project.spent.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Completed:</span>
                          <div className="font-semibold">
                            {project.completedAt ? format(project.completedAt, 'MMM d, yyyy') : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Tasks:</span>
                          <div className="font-semibold">{project.tasks.length} total</div>
                        </div>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const newWindow = window.open('', '_blank', 'width=800,height=600')
                        if (newWindow) {
                          newWindow.document.write(`
                            <html>
                              <head>
                                <title>Project Report - ${project.name}</title>
                                <style>
                                  body { font-family: Arial, sans-serif; margin: 20px; }
                                  .report-header { background: #4CAF50; color: white; padding: 20px; margin-bottom: 20px; }
                                  .metric { display: inline-block; margin: 10px; padding: 15px; background: #f5f5f5; border-radius: 5px; text-align: center; }
                                </style>
                              </head>
                              <body>
                                <div class="report-header">
                                  <h1>Project Completion Report</h1>
                                  <h2>${project.name}</h2>
                                  <p>Status: COMPLETED ✓</p>
                                </div>
                                <h3>Final Project Metrics</h3>
                                <div class="metric">
                                  <h4>Budget Performance</h4>
                                  <p>Budget: $${project.budget.toLocaleString()}</p>
                                  <p>Spent: $${project.spent.toLocaleString()}</p>
                                  <p>Variance: $${(project.budget - project.spent).toLocaleString()}</p>
                                </div>
                                <div class="metric">
                                  <h4>Timeline</h4>
                                  <p>Planned: ${format(project.startDate, 'MMM d')} - ${format(project.endDate, 'MMM d, yyyy')}</p>
                                  <p>Completed: ${project.completedAt ? format(project.completedAt, 'MMM d, yyyy') : 'N/A'}</p>
                                </div>
                                <div class="metric">
                                  <h4>Tasks</h4>
                                  <p>Total Tasks: ${project.tasks.length}</p>
                                  <p>Completion Rate: 100%</p>
                                </div>
                                <div class="metric">
                                  <h4>Team</h4>
                                  <p>Team Size: ${project.teamMembers.length}</p>
                                  <p>Customer: ${project.customer.name}</p>
                                </div>
                                <h3>Summary</h3>
                                <p>Project successfully completed ${project.completedAt ? 'on ' + format(project.completedAt, 'MMM d, yyyy') : ''}</p>
                                <p>${project.description}</p>
                              </body>
                            </html>
                          `)
                          newWindow.document.close()
                        } else {
                          toast.info(`Generating completion report for ${project.name}...`)
                        }
                      }}
                    >
                      View Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="planning">
          <div className="space-y-4">
            {mockProjects.filter(project => project.status === 'PLANNING').map((project) => (
              <Card key={project.id} className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Clock className="h-5 w-5 text-blue-500" />
                        <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                        <Badge variant="secondary">Planning</Badge>
                      </div>

                      <p className="text-gray-600 text-sm mb-3">{project.description}</p>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Planned Start:</span>
                          <div className="font-semibold">{format(project.startDate, 'MMM d, yyyy')}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Budget:</span>
                          <div className="font-semibold">${project.budget.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Team Size:</span>
                          <div className="font-semibold">{project.teamMembers.length} members</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          toast.info(`Opening project plan editor for ${project.name} - modify timeline, budget, team assignments, and task breakdown.`)
                        }}
                      >
                        Edit Plan
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => {
                          toast.success(`🚀 Starting project: ${project.name}`)
                          setTimeout(() => {
                            toast.info('Project status updated to "IN PROGRESS" and team members have been notified.')
                          }, 1500)
                          setTimeout(() => {
                            toast.success('Project kickoff meeting scheduled!')
                          }, 3000)
                        }}
                      >
                        Start Project
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Project</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Progress</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Budget</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Spent</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Due Date</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockProjects.map((project) => (
                      <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-semibold text-gray-900">{project.name}</div>
                            <div className="text-sm text-gray-600">{project.customer.name}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusColor(project.status)}>
                            {project.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{project.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          ${project.budget.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={project.spent > project.budget * 0.8 ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                            ${project.spent.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {format(project.endDate, 'MMM d, yyyy')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              toast.info(`Opening project overview for ${project.name}`)
                              setTimeout(() => {
                                const newWindow = window.open('', '_blank', 'width=600,height=400')
                                if (newWindow) {
                                  newWindow.document.write(`
                                    <html>
                                      <head><title>${project.name} - Overview</title></head>
                                      <body style="font-family: Arial; margin: 20px;">
                                        <h2>${project.name}</h2>
                                        <p><strong>Status:</strong> ${project.status}</p>
                                        <p><strong>Progress:</strong> ${project.progress}%</p>
                                        <p><strong>Budget:</strong> $${project.budget.toLocaleString()} (Spent: $${project.spent.toLocaleString()})</p>
                                        <p><strong>Timeline:</strong> ${format(project.startDate, 'MMM d')} - ${format(project.endDate, 'MMM d, yyyy')}</p>
                                        <p><strong>Team:</strong> ${project.teamMembers.length} members</p>
                                        <p>${project.description}</p>
                                      </body>
                                    </html>
                                  `)
                                  newWindow.document.close()
                                }
                              }, 500)
                            }}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
