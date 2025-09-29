
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Users, Calculator, FileText } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function PayrollRunPage() {
  const { data: session, status } = useSession() || {}
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const [payrollRun, setPayrollRun] = useState({
    payPeriodStart: '',
    payPeriodEnd: '',
    payDate: '',
    runType: 'regular',
    employees: [] as string[]
  })

  // Handle authentication redirect properly
  if (status === 'loading') {
    return <div className="p-6">Loading...</div>
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  const handleInputChange = (field: string, value: string) => {
    setPayrollRun(prev => ({ ...prev, [field]: value }))
  }

  const handleCalculatePayroll = async () => {
    if (!payrollRun.payPeriodStart || !payrollRun.payPeriodEnd || !payrollRun.payDate) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      // Simulate payroll calculation
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Payroll calculated successfully!')
    } catch (error) {
      toast.error('Failed to calculate payroll')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProcessPayroll = async () => {
    setIsLoading(true)
    try {
      // Simulate payroll processing
      await new Promise(resolve => setTimeout(resolve, 3000))
      toast.success('Payroll processed successfully!')
      router.push('/dashboard/payroll')
    } catch (error) {
      toast.error('Failed to process payroll')
    } finally {
      setIsLoading(false)
    }
  }

  const mockEmployees = [
    { id: '1', name: 'John Smith', salary: '$75,000', hoursWorked: 80 },
    { id: '2', name: 'Sarah Johnson', salary: '$65,000', hoursWorked: 80 },
    { id: '3', name: 'Mike Wilson', salary: '$58,000', hoursWorked: 76 },
    { id: '4', name: 'Emily Davis', salary: '$70,000', hoursWorked: 80 }
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/dashboard/payroll">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payroll
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Run Payroll</h1>
          <p className="text-gray-600 mt-1">Process payroll for your employees</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payroll Setup */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Payroll Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="payPeriodStart">Pay Period Start *</Label>
                  <Input 
                    id="payPeriodStart" 
                    type="date"
                    value={payrollRun.payPeriodStart}
                    onChange={(e) => handleInputChange('payPeriodStart', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payPeriodEnd">Pay Period End *</Label>
                  <Input 
                    id="payPeriodEnd" 
                    type="date"
                    value={payrollRun.payPeriodEnd}
                    onChange={(e) => handleInputChange('payPeriodEnd', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payDate">Pay Date *</Label>
                  <Input 
                    id="payDate" 
                    type="date"
                    value={payrollRun.payDate}
                    onChange={(e) => handleInputChange('payDate', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="runType">Run Type</Label>
                  <Select value={payrollRun.runType} onValueChange={(value) => handleInputChange('runType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select run type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular Payroll</SelectItem>
                      <SelectItem value="bonus">Bonus Run</SelectItem>
                      <SelectItem value="correction">Correction Run</SelectItem>
                      <SelectItem value="off-cycle">Off-cycle Run</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button 
                  onClick={handleCalculatePayroll}
                  disabled={isLoading}
                  variant="outline"
                >
                  {isLoading ? 'Calculating...' : 'Calculate Payroll'}
                </Button>
                <Button 
                  onClick={handleProcessPayroll}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Process Payroll'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Employee List */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Employees ({mockEmployees.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockEmployees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-700">
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-gray-500">Annual: {employee.salary}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{employee.hoursWorked} hrs</p>
                      <p className="text-sm text-gray-500">This period</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Payroll Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Employees</span>
                    <span className="font-medium">{mockEmployees.length}</span>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-600">Gross Pay</span>
                    <span className="font-medium text-blue-700">$26,730</span>
                  </div>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-sm text-orange-600">Taxes & Deductions</span>
                    <span className="font-medium text-orange-700">$8,019</span>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-sm text-green-600">Net Pay</span>
                    <span className="font-bold text-green-700">$18,711</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Next Steps</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>1. Review employee hours</li>
                    <li>2. Calculate payroll taxes</li>
                    <li>3. Generate pay stubs</li>
                    <li>4. Process payments</li>
                    <li>5. File tax reports</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
