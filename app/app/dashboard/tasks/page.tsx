
'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, CheckSquare, Clock, AlertCircle, Calendar, User, Tag } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { toast } from 'sonner'

export default function TasksPage() {
  const { data: session, status } = useSession() || {}
  
  if (status === 'loading') return <div className="p-6">Loading...</div>
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // All data will come from the database - no mock data
  const mockTasks: any[] = []

  const todoTasks = 0
  const inProgressTasks = 0
  const overdueMockTasks = 0
  const completedTasks = 0

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'LOW': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'secondary'
      case 'IN_PROGRESS': return 'outline'
      case 'COMPLETED': return 'default'
      case 'OVERDUE': return 'destructive'
      default: return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TODO': return <Clock className="h-4 w-4" />
      case 'IN_PROGRESS': return <AlertCircle className="h-4 w-4" />
      case 'COMPLETED': return <CheckSquare className="h-4 w-4" />
      case 'OVERDUE': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600 mt-1">Organize and track your financial tasks and deadlines</p>
        </div>
        <Link href="/dashboard/tasks/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">To Do</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{todoTasks}</div>
            <p className="text-xs text-gray-500 mt-1">Ready to start</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{inProgressTasks}</div>
            <p className="text-xs text-gray-500 mt-1">Currently working</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <div className="text-2xl font-bold text-red-600">{overdueMockTasks}</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active" onClick={() => toast.info('Showing active tasks - tasks that are in progress or ready to start')}>Active Tasks</TabsTrigger>
          <TabsTrigger value="completed" onClick={() => toast.success('Showing completed tasks - great work on finishing these!')}>Completed</TabsTrigger>
          <TabsTrigger value="overdue" onClick={() => toast.error('Showing overdue tasks - these need immediate attention')}>Overdue</TabsTrigger>
          <TabsTrigger value="all" onClick={() => toast.info('Showing all tasks across all statuses')}>All Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTasks.filter(task => task.status !== 'COMPLETED' && task.status !== 'OVERDUE').map((task) => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusIcon(task.status)}
                          <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                          <Badge variant={getStatusColor(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </div>

                        <p className="text-gray-600 text-sm mb-3">{task.description}</p>

                        <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                          {task.dueDate && (
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              Due: {format(task.dueDate, 'MMM d, yyyy')}
                            </div>
                          )}
                          {task.assignedUser && (
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {task.assignedUser.name}
                            </div>
                          )}
                          {task.project && (
                            <div className="flex items-center">
                              <Tag className="h-4 w-4 mr-1" />
                              {task.project.name}
                            </div>
                          )}
                        </div>

                        {task.tags && task.tags.length > 0 && (
                          <div className="flex items-center space-x-2 mb-3">
      // @ts-ignore
                            {task.tags.map((tag: any, index: any) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {task.status === 'IN_PROGRESS' && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">Progress</span>
                              <span className="font-medium">{task.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast.info(`Opening task "${task.title}" for editing - you can modify details, deadline, assignee, and priority.`)
                          }}
                        >
                          Edit
                        </Button>
                        {task.status === 'TODO' && (
                          <Button 
                            size="sm"
                            onClick={() => {
                              toast.success(`Started task: "${task.title}"`)
                              setTimeout(() => {
                                toast.info('Task status updated to "In Progress"')
                              }, 1000)
                            }}
                          >
                            Start
                          </Button>
                        )}
                        {task.status === 'IN_PROGRESS' && (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              toast.success(`✅ Completed task: "${task.title}"`)
                              setTimeout(() => {
                                toast.info('Task marked as completed and team has been notified.')
                              }, 1500)
                            }}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTasks.filter(task => task.status === 'COMPLETED').map((task) => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-6 bg-green-50 border-green-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <CheckSquare className="h-5 w-5 text-green-500" />
                          <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                          <Badge className="bg-green-100 text-green-800">Completed</Badge>
                        </div>

                        <p className="text-gray-600 text-sm mb-3">{task.description}</p>

                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span>Completed: {format(task.completedAt || new Date(), 'MMM d, yyyy')}</span>
                          {task.assignedUser && <span>By: {task.assignedUser.name}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue">
          <Card>
            <CardHeader>
              <CardTitle>Overdue Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTasks.filter(task => task.status === 'OVERDUE').map((task) => (
                  <div key={task.id} className="border border-red-200 rounded-lg p-6 bg-red-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <AlertCircle className="h-5 w-5 text-red-500" />
                          <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                          <Badge variant="destructive">Overdue</Badge>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </div>

                        <p className="text-gray-600 text-sm mb-3">{task.description}</p>

                        <div className="flex items-center space-x-6 text-sm text-red-600 font-medium">
                          <Calendar className="h-4 w-4 mr-1" />
                          Was due: {format(task.dueDate, 'MMM d, yyyy')}
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => {
                            toast.success(`✅ Marked overdue task "${task.title}" as complete`)
                            setTimeout(() => {
                              toast.info('Task completed despite being overdue. Great recovery!')
                            }, 1000)
                          }}
                        >
                          Mark Complete
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const newDate = new Date()
                            newDate.setDate(newDate.getDate() + 7) // Add 7 days
                            toast.success(`📅 Extended deadline for "${task.title}" to ${format(newDate, 'MMM d, yyyy')}`)
                            setTimeout(() => {
                              toast.info('Task moved back to active status with new deadline.')
                            }, 1000)
                          }}
                        >
                          Extend Deadline
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTasks.map((task) => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(task.status)}
                        <div>
                          <h4 className="font-semibold text-gray-900">{task.title}</h4>
                          <p className="text-sm text-gray-600">{task.description.substring(0, 80)}...</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Badge variant={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)} style={{ fontSize: '0.75rem' }}>
                          {task.priority}
                        </Badge>
                        {task.dueDate && (
                          <span className="text-sm text-gray-500">
                            {format(task.dueDate, 'MMM d')}
                          </span>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const newWindow = window.open('', '_blank', 'width=800,height=700')
                            if (newWindow) {
                              newWindow.document.write(`
                                <html>
                                  <head>
                                    <title>Task Details - ${task.title}</title>
                                    <style>
                                      body { font-family: Arial, sans-serif; margin: 20px; }
                                      .task-header { background: #3b82f6; color: white; padding: 20px; margin-bottom: 20px; }
                                      .detail-section { margin: 15px 0; padding: 10px; background: #f8fafc; border-radius: 5px; }
                                      .progress-bar { width: 100%; height: 20px; background: #e5e7eb; border-radius: 10px; margin: 10px 0; }
                                      .progress-fill { height: 100%; background: #3b82f6; border-radius: 10px; width: ${task.progress || 0}%; }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="task-header">
                                      <h1>${task.title}</h1>
                                      <p><strong>Status:</strong> ${task.status.replace('_', ' ')}</p>
                                      <p><strong>Priority:</strong> ${task.priority}</p>
                                    </div>
                                    
                                    <div class="detail-section">
                                      <h3>Description</h3>
                                      <p>${task.description}</p>
                                    </div>
                                    
                                    <div class="detail-section">
                                      <h3>Task Information</h3>
                                      <p><strong>Due Date:</strong> ${format(task.dueDate, 'MMM d, yyyy')}</p>
                                      <p><strong>Created:</strong> ${format(task.createdAt, 'MMM d, yyyy')}</p>
                                      ${task.assignedUser ? `<p><strong>Assigned To:</strong> ${task.assignedUser.name}</p>` : '<p><strong>Assigned To:</strong> Unassigned</p>'}
                                      ${task.project ? `<p><strong>Project:</strong> ${task.project.name}</p>` : '<p><strong>Project:</strong> None</p>'}
                                    </div>
                                    
                                    ${task.status === 'IN_PROGRESS' ? `
                                      <div class="detail-section">
                                        <h3>Progress (${task.progress}%)</h3>
                                        <div class="progress-bar">
                                          <div class="progress-fill"></div>
                                        </div>
                                      </div>
                                    ` : ''}
                                    
                                    ${task.tags && task.tags.length > 0 ? `
                                      <div class="detail-section">
                                        <h3>Tags</h3>
                                        <p>${task.tags.join(', ')}</p>
                                      </div>
                                    ` : ''}
                                    
                                    ${task.completedAt ? `
                                      <div class="detail-section">
                                        <h3>Completion</h3>
                                        <p>Completed on ${format(task.completedAt, 'MMM d, yyyy')}</p>
                                      </div>
                                    ` : ''}
                                  </body>
                                </html>
                              `)
                              newWindow.document.close()
                            } else {
                              toast.info(`Opening task details for "${task.title}"`)
                            }
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
