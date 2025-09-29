
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface TaskFormData {
  title: string;
  project: string;
  assignedTo: string;
  priority: string;
  status: string;
  category: string;
  startDate: string;
  dueDate: string;
  estimatedHours: string;
  budget: string;
  description: string;
  notes: string;
}

export default function NewTaskPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    project: '',
    assignedTo: '',
    priority: '',
    status: 'todo',
    category: '',
    startDate: '',
    dueDate: '',
    estimatedHours: '',
    budget: '',
    description: '',
    notes: ''
  })

  const [dependencies, setDependencies] = useState<string[]>([])
  const [checklist, setChecklist] = useState<string[]>([])
  const [newDependency, setNewDependency] = useState('')
  const [newChecklistItem, setNewChecklistItem] = useState('')

  const handleInputChange = (field: keyof TaskFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addDependency = () => {
    if (newDependency && !dependencies.includes(newDependency)) {
      setDependencies([...dependencies, newDependency])
      setNewDependency('')
      toast.success('Dependency added!')
    }
  }

  const removeDependency = (dep: string) => {
    setDependencies(dependencies.filter(d => d !== dep))
    toast.info('Dependency removed')
  }

  const addChecklistItem = () => {
    if (newChecklistItem && !checklist.includes(newChecklistItem)) {
      setChecklist([...checklist, newChecklistItem])
      setNewChecklistItem('')
      toast.success('Checklist item added!')
    }
  }

  const removeChecklistItem = (item: string) => {
    setChecklist(checklist.filter(i => i !== item))
    toast.info('Checklist item removed')
  }

  const handleSaveDraft = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success('Task saved as draft!')
    } catch (error) {
      toast.error('Failed to save draft')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Basic validation
    if (!formData.title || !formData.priority || !formData.dueDate) {
      setError('Please fill in all required fields: Title, Priority, and Due Date')
      setIsLoading(false)
      return
    }

    try {
      // Here you would normally send to your API
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call

      // Mock successful creation
      toast.success('Task created successfully!')
      router.push('/dashboard/tasks')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
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
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title *</Label>
                <Input 
                  id="title" 
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter task title" 
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select value={formData.project} onValueChange={(value) => handleInputChange('project', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="q4-financial-analysis">Q4 Financial Analysis</SelectItem>
                    <SelectItem value="erp-implementation">ERP Implementation</SelectItem>
                    <SelectItem value="audit-preparation">Audit Preparation</SelectItem>
                    <SelectItem value="budget-planning-2024">Budget Planning 2024</SelectItem>
                    <SelectItem value="tax-compliance">Tax Compliance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Select value={formData.assignedTo} onValueChange={(value) => handleInputChange('assignedTo', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="john-smith">John Smith</SelectItem>
                    <SelectItem value="sarah-johnson">Sarah Johnson</SelectItem>
                    <SelectItem value="michael-chen">Michael Chen</SelectItem>
                    <SelectItem value="lisa-davis">Lisa Davis</SelectItem>
                    <SelectItem value="me">Assign to me</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
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
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
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
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
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
                <Input 
                  id="startDate" 
                  type="date" 
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input 
                  id="dueDate" 
                  type="date" 
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Estimated Hours</Label>
                <Input 
                  id="estimatedHours" 
                  type="number" 
                  value={formData.estimatedHours}
                  onChange={(e) => handleInputChange('estimatedHours', e.target.value)}
                  placeholder="0" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget</Label>
                <Input 
                  id="budget" 
                  type="number" 
                  step="0.01" 
                  value={formData.budget}
                  onChange={(e) => handleInputChange('budget', e.target.value)}
                  placeholder="0.00" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the task in detail..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea 
                id="notes" 
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional notes or requirements..."
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <Label>Dependencies</Label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Select value={newDependency} onValueChange={setNewDependency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a task this depends on" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="complete-budget-review">Complete Budget Review</SelectItem>
                      <SelectItem value="prepare-financial-statements">Prepare Financial Statements</SelectItem>
                      <SelectItem value="client-data-collection">Client Data Collection</SelectItem>
                      <SelectItem value="setup-erp-system">Setup ERP System</SelectItem>
                      <SelectItem value="audit-documentation">Audit Documentation</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="sm" onClick={addDependency}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Dependency
                  </Button>
                </div>
                
                {dependencies.length > 0 && (
                  <div className="space-y-2">
                    {dependencies.map((dep, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{dep.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeDependency(dep)}
                          className="text-red-600 h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Checklist Items</Label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Input 
                    placeholder="Enter a checklist item" 
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addChecklistItem()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addChecklistItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                
                {checklist.length > 0 && (
                  <div className="space-y-2">
                    {checklist.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{item}</span>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeChecklistItem(item)}
                          className="text-red-600 h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
              <Link href="/dashboard/tasks">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={isLoading}>
                Save as Draft
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Task'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
