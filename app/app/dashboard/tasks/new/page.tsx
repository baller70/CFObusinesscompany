
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewTaskPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/dashboard/tasks">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Task</h1>
          <p className="text-gray-600 mt-1">Create a new task or assignment</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input id="title" placeholder="Enter task title" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project1">Q4 Financial Analysis</SelectItem>
                  <SelectItem value="project2">ERP Implementation</SelectItem>
                  <SelectItem value="project3">Audit Preparation</SelectItem>
                  <SelectItem value="project4">Budget Planning 2024</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user1">John Smith</SelectItem>
                  <SelectItem value="user2">Sarah Johnson</SelectItem>
                  <SelectItem value="user3">Michael Chen</SelectItem>
                  <SelectItem value="me">Assign to me</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">In Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial-analysis">Financial Analysis</SelectItem>
                  <SelectItem value="budgeting">Budgeting</SelectItem>
                  <SelectItem value="reporting">Reporting</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="audit">Audit</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input id="dueDate" type="date" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input id="estimatedHours" type="number" placeholder="0" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget</Label>
              <Input id="budget" type="number" step="0.01" placeholder="0.00" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Describe the task in detail..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea 
              id="notes" 
              placeholder="Any additional notes or requirements..."
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <Label>Dependencies</Label>
            <div className="space-y-2">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a task this depends on" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task1">Complete Budget Review</SelectItem>
                  <SelectItem value="task2">Prepare Financial Statements</SelectItem>
                  <SelectItem value="task3">Client Data Collection</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                Add Dependency
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Checklist Items</Label>
            <div className="space-y-2">
              <Input placeholder="Enter a checklist item" />
              <Button variant="outline" size="sm">
                Add Item
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Link href="/dashboard/tasks">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button variant="outline">Save as Draft</Button>
            <Button>Create Task</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
