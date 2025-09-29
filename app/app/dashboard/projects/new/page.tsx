

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Plus, Save } from 'lucide-react'
import Link from 'next/link'

export default async function NewProjectPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
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
            Back to Projects
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="projectName">Project Name *</Label>
              <Input 
                id="projectName" 
                placeholder="Enter project name"
              />
            </div>

            <div>
              <Label htmlFor="client">Client *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acme-corp">Acme Corporation</SelectItem>
                  <SelectItem value="tech-solutions">Tech Solutions Inc</SelectItem>
                  <SelectItem value="global-systems">Global Systems Ltd</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Project Description</Label>
            <Textarea 
              id="description" 
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
                  defaultValue={new Date().toISOString().split('T')[0]}
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
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select defaultValue="active">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
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
                <Select defaultValue="hourly">
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
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-semibold">Team Members</Label>
              <Button variant="outline" size="sm">
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

              <div className="grid grid-cols-12 gap-4 p-4 border-b">
                <div className="col-span-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="john-smith">John Smith</SelectItem>
                      <SelectItem value="sarah-johnson">Sarah Johnson</SelectItem>
                      <SelectItem value="mike-brown">Mike Brown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="project-manager">Project Manager</SelectItem>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="designer">Designer</SelectItem>
                      <SelectItem value="consultant">Consultant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Input type="number" step="0.01" placeholder="0.00" />
                </div>
                <div className="col-span-2">
                  <Select defaultValue="full">
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
                  <Button variant="ghost" size="sm" className="text-red-600">×</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea 
              id="notes" 
              placeholder="Additional project notes..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button variant="outline">
              Save as Draft
            </Button>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
