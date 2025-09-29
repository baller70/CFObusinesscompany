
'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Zap, 
  Play, 
  Pause, 
  Settings, 
  Mail, 
  Bell, 
  FileText, 
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

export default function AutomationsPage() {
  const { data: session, status } = useSession() || {}
  
  if (status === 'loading') {
    return <div>Loading...</div>
  }
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Mock data for demonstration
  const mockAutomations = [
    {
      id: '1',
      name: 'Invoice Payment Reminders',
      description: 'Send automated payment reminders for overdue invoices',
      trigger: 'INVOICE_CREATED',
      action: 'SEND_EMAIL',
      conditions: { daysOverdue: 7, amount: { min: 100 } },
      isActive: true,
      lastRun: new Date('2024-11-15T10:30:00'),
      runCount: 23,
      createdAt: new Date('2024-10-01')
    },
    {
      id: '2', 
      name: 'Monthly Financial Reports',
      description: 'Generate and distribute monthly financial reports to stakeholders',
      trigger: 'MONTHLY_REPORT',
      action: 'GENERATE_REPORT',
      conditions: { reportType: 'financial', recipients: ['cfo@company.com'] },
      isActive: true,
      lastRun: new Date('2024-11-01T09:00:00'),
      runCount: 3,
      createdAt: new Date('2024-08-15')
    },
    {
      id: '3',
      name: 'Project Completion Tasks',
      description: 'Create invoicing tasks when projects are marked as completed',
      trigger: 'PROJECT_COMPLETED',
      action: 'CREATE_TASK',
      conditions: { taskType: 'invoice_creation', assignee: 'accounting@company.com' },
      isActive: true,
      lastRun: new Date('2024-11-10T14:20:00'),
      runCount: 8,
      createdAt: new Date('2024-09-01')
    },
    {
      id: '4',
      name: 'Expense Approval Workflow',
      description: 'Auto-approve expenses under $50, route larger expenses for review',
      trigger: 'INVOICE_CREATED',
      action: 'UPDATE_STATUS',
      conditions: { maxAmount: 50, category: 'office supplies' },
      isActive: false,
      lastRun: new Date('2024-10-25T16:45:00'),
      runCount: 156,
      createdAt: new Date('2024-07-01')
    },
    {
      id: '5',
      name: 'Bill Due Date Notifications',
      description: 'Send notifications 3 days before bill due dates',
      trigger: 'BILL_DUE',
      action: 'SEND_REMINDER',
      conditions: { daysBefore: 3, amount: { min: 500 } },
      isActive: true,
      lastRun: new Date('2024-11-14T08:15:00'),
      runCount: 45,
      createdAt: new Date('2024-09-15')
    }
  ]

  const mockRuns = [
    {
      id: '1',
      automationId: '1',
      automationName: 'Invoice Payment Reminders',
      runDate: new Date('2024-11-15T10:30:00'),
      status: 'SUCCESS',
      details: 'Sent 3 payment reminders',
      duration: 1.2
    },
    {
      id: '2',
      automationId: '5',
      automationName: 'Bill Due Date Notifications',
      runDate: new Date('2024-11-14T08:15:00'),
      status: 'SUCCESS',
      details: 'Notified about 2 upcoming bill due dates',
      duration: 0.8
    },
    {
      id: '3',
      automationId: '3',
      automationName: 'Project Completion Tasks',
      runDate: new Date('2024-11-10T14:20:00'),
      status: 'SUCCESS',
      details: 'Created invoice task for Website Redesign project',
      duration: 0.5
    },
    {
      id: '4',
      automationId: '2',
      automationName: 'Monthly Financial Reports',
      runDate: new Date('2024-11-01T09:00:00'),
      status: 'SUCCESS',
      details: 'Generated and sent October financial report',
      duration: 3.2
    }
  ]

  const activeAutomations = mockAutomations.filter(a => a.isActive).length
  const totalRuns = mockAutomations.reduce((sum, a) => sum + a.runCount, 0)
  const avgRunsPerAutomation = mockAutomations.length > 0 ? Math.round(totalRuns / mockAutomations.length) : 0
  const timeSaved = totalRuns * 15 // Assuming 15 minutes saved per automation run

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'INVOICE_CREATED':
        return <FileText className="h-4 w-4 text-blue-500" />
      case 'PAYMENT_RECEIVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'BILL_DUE':
        return <Calendar className="h-4 w-4 text-orange-500" />
      case 'PROJECT_COMPLETED':
        return <CheckCircle className="h-4 w-4 text-purple-500" />
      case 'MONTHLY_REPORT':
        return <TrendingUp className="h-4 w-4 text-indigo-500" />
      default:
        return <Zap className="h-4 w-4 text-gray-400" />
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'SEND_EMAIL':
        return <Mail className="h-4 w-4 text-blue-500" />
      case 'CREATE_TASK':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'GENERATE_REPORT':
        return <FileText className="h-4 w-4 text-purple-500" />
      case 'UPDATE_STATUS':
        return <Settings className="h-4 w-4 text-orange-500" />
      case 'SEND_REMINDER':
        return <Bell className="h-4 w-4 text-red-500" />
      default:
        return <Zap className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>
      case 'ERROR':
        return <Badge variant="destructive">Error</Badge>
      case 'RUNNING':
        return <Badge className="bg-blue-100 text-blue-800">Running</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'RUNNING':
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automations</h1>
          <p className="text-gray-600 mt-1">Workflow automation platform to eliminate manual tasks</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Link href="/dashboard/automations/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Automation
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Automations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Zap className="h-5 w-5 text-blue-500 mr-2" />
              <div className="text-2xl font-bold text-blue-600">{activeAutomations}</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Out of {mockAutomations.length} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalRuns}</div>
            <p className="text-xs text-gray-500 mt-1">All time executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{avgRunsPerAutomation}</div>
            <p className="text-xs text-gray-500 mt-1">Per automation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Time Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{Math.round(timeSaved / 60)}h</div>
            <p className="text-xs text-gray-500 mt-1">Estimated savings</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="automations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="automations">All Automations</TabsTrigger>
          <TabsTrigger value="runs">Recent Runs</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="automations">
          <Card>
            <CardHeader>
              <CardTitle>Automation Rules</CardTitle>
            </CardHeader>
            <CardContent>
              {mockAutomations.length > 0 ? (
                <div className="space-y-4">
                  {mockAutomations.map((automation) => (
                    <div key={automation.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="flex flex-col items-center space-y-2">
                            {getTriggerIcon(automation.trigger)}
                            <div className="w-px h-8 bg-gray-300"></div>
                            {getActionIcon(automation.action)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{automation.name}</h3>
                              <Badge variant={automation.isActive ? 'default' : 'secondary'}>
                                {automation.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>

                            <p className="text-gray-600 text-sm mb-3">{automation.description}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                              <div>
                                <div><strong>Trigger:</strong> {automation.trigger.replace('_', ' ').toLowerCase()}</div>
                                <div><strong>Action:</strong> {automation.action.replace('_', ' ').toLowerCase()}</div>
                              </div>
                              <div>
                                <div><strong>Total Runs:</strong> {automation.runCount}</div>
                                <div><strong>Last Run:</strong> {
                                  automation.lastRun ? format(automation.lastRun, 'MMM d, yyyy HH:mm') : 'Never'
                                }</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 ml-4">
                          <Switch
                            checked={automation.isActive}
                            onCheckedChange={(checked: boolean) => {
                              // Handle toggle logic here
                              console.log('Toggle automation:', automation.id, checked)
                            }}
                          />
                          <Button variant="outline" size="sm">
                            <Settings className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            {automation.isActive ? (
                              <>
                                <Pause className="h-3 w-3 mr-1" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3 mr-1" />
                                Start
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No automations yet</h3>
                  <p className="text-gray-600 mb-4">Create your first automation to start saving time</p>
                  <Link href="/dashboard/automations/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Automation
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="runs">
          <Card>
            <CardHeader>
              <CardTitle>Recent Execution History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRuns.map((run) => (
                  <div key={run.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(run.status)}
                      <div>
                        <h4 className="font-medium text-gray-900">{run.automationName}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{format(run.runDate, 'MMM d, yyyy HH:mm')}</span>
                          <span>Duration: {run.duration}s</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(run.status)}
                      <span className="text-sm text-gray-600">{run.details}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Mail className="h-5 w-5 text-blue-500 mr-2" />
                  Invoice Reminders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Automatically send payment reminders for overdue invoices
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Popular</Badge>
                  <Button size="sm">Use Template</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <TrendingUp className="h-5 w-5 text-purple-500 mr-2" />
                  Monthly Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Generate and distribute monthly financial reports automatically
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Recommended</Badge>
                  <Button size="sm">Use Template</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Calendar className="h-5 w-5 text-orange-500 mr-2" />
                  Bill Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Get notified before bill due dates to avoid late fees
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Essential</Badge>
                  <Button size="sm">Use Template</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  Expense Approval
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Auto-approve small expenses and route larger ones for review
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Time Saver</Badge>
                  <Button size="sm">Use Template</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileText className="h-5 w-5 text-indigo-500 mr-2" />
                  Document Filing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Automatically organize uploaded documents by type and date
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Organization</Badge>
                  <Button size="sm">Use Template</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed border-2 border-gray-300">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Custom Automation</h3>
                  <p className="text-sm text-gray-600 mb-4">Build your own automation from scratch</p>
                  <Button variant="outline">Create Custom</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
