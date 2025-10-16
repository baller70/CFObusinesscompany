
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Plus, Save, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface TeamMember {
  id: string;
  member: string;
  role: string;
  rate: string;
  accessLevel: string;
}

interface ProjectFormData {
  projectName: string;
  client: string;
  description: string;
  startDate: string;
  endDate: string;
  budget: string;
  status: string;
  billingType: string;
  rate: string;
  notes: string;
}

export default function NewProjectPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<ProjectFormData>({
    projectName: '',
    client: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    budget: '',
    status: 'PLANNING',
    billingType: 'hourly',
    rate: '',
    notes: ''
  })

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      member: '',
      role: '',
      rate: '',
      accessLevel: 'full'
    }
  ])



  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addTeamMember = () => {
    setTeamMembers(prev => [...prev, {
      id: Date.now().toString(),
      member: '',
      role: '',
      rate: '',
      accessLevel: 'full'
    }])
    toast.success('Team member row added!')
  }

  const removeTeamMember = (id: string) => {
    setTeamMembers(prev => prev.filter(member => member.id !== id))
    toast.info('Team member removed')
  }

  const updateTeamMember = (id: string, field: keyof TeamMember, value: string) => {
    setTeamMembers(prev => prev.map(member => 
      member.id === id ? { ...member, [field]: value } : member
    ))
  }

  const handleSaveDraft = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success('Project saved as draft!')
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
    if (!formData.projectName || !formData.client) {
      setError('Please fill in all required fields')
      setIsLoading(false)
      return
    }

    try {
      // Here you would normally send to your API
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call

      // Mock successful creation
      toast.success('Project created successfully!')
      router.push('/dashboard/projects')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Project</h1>
          <p className="text-gray-600 mt-1">Set up a new project to track time and expenses</p>
        </div>
        <Link href="/dashboard/projects">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="projectName">Project Name *</Label>
                <Input 
                  id="projectName" 
                  value={formData.projectName}
                  onChange={(e) => handleInputChange('projectName', e.target.value)}
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="client">Client Name *</Label>
                <Input 
                  id="client" 
                  value={formData.client}
                  onChange={(e) => handleInputChange('client', e.target.value)}
                  placeholder="Enter client name"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Project Description</Label>
              <Textarea 
                id="description" 
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the project scope and objectives..."
                rows={4}
              />
            </div>

            {/* Dates and Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <div className="relative">
                  <Input 
                    id="startDate" 
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    required
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <Label htmlFor="endDate">Expected End Date</Label>
                <div className="relative">
                  <Input 
                    id="endDate" 
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="budget">Project Budget</Label>
                <Input 
                  id="budget" 
                  type="number"
                  step="0.01"
                  value={formData.budget}
                  onChange={(e) => handleInputChange('budget', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNING">Planning</SelectItem>
                    <SelectItem value="IN_PROGRESS">Active</SelectItem>
                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Billing Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Billing Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="billingType">Billing Type</Label>
                  <Select value={formData.billingType} onValueChange={(value) => handleInputChange('billingType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly Rate</SelectItem>
                      <SelectItem value="fixed">Fixed Price</SelectItem>
                      <SelectItem value="retainer">Retainer</SelectItem>
                      <SelectItem value="non-billable">Non-Billable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="rate">Rate</Label>
                  <Input 
                    id="rate" 
                    type="number"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) => handleInputChange('rate', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Team Members */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-semibold">Team Members</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTeamMember}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </div>

              <div className="border rounded-lg">
                <div className="grid grid-cols-12 gap-4 p-4 border-b bg-gray-50 text-sm font-medium text-gray-700">
                  <div className="col-span-4">Team Member</div>
                  <div className="col-span-3">Role</div>
                  <div className="col-span-2">Rate</div>
                  <div className="col-span-2">Access Level</div>
                  <div className="col-span-1"></div>
                </div>

                {teamMembers.map((member, index) => (
                  <div key={member.id} className="grid grid-cols-12 gap-4 p-4 border-b last:border-b-0">
                    <div className="col-span-4">
                      <Input 
                        value={member.member}
                        onChange={(e) => updateTeamMember(member.id, 'member', e.target.value)}
                        placeholder="Team member name"
                      />
                    </div>
                    <div className="col-span-3">
                      <Select value={member.role} onValueChange={(value) => updateTeamMember(member.id, 'role', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="project-manager">Project Manager</SelectItem>
                          <SelectItem value="developer">Developer</SelectItem>
                          <SelectItem value="designer">Designer</SelectItem>
                          <SelectItem value="consultant">Consultant</SelectItem>
                          <SelectItem value="analyst">Analyst</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00"
                        value={member.rate}
                        onChange={(e) => updateTeamMember(member.id, 'rate', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Select value={member.accessLevel} onValueChange={(value) => updateTeamMember(member.id, 'accessLevel', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full">Full Access</SelectItem>
                          <SelectItem value="limited">Limited</SelectItem>
                          <SelectItem value="read-only">Read Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600"
                        onClick={() => removeTeamMember(member.id)}
                        disabled={teamMembers.length === 1}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional project notes..."
                rows={3}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
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
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Project
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
