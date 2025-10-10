'use client'


import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Users, 
  DollarSign, 
  FileText, 
  Calculator, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Calendar,
  Download,
  Upload
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { toast } from 'sonner'

export default function PayrollPage() {
  const { data: session, status } = useSession() || {}
  
  if (status === 'loading') return <div className="p-6">Loading...</div>
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Mock data for demonstration
  const mockEmployees = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@company.com',
      jobTitle: 'Senior Developer',
      department: 'Engineering',
      salary: 95000,
      hourlyRate: null,
      hireDate: new Date('2023-03-15'),
      isActive: true,
      paychecks: [
        { id: '1', payPeriodStart: new Date('2024-11-01'), payPeriodEnd: new Date('2024-11-15'), grossPay: 3958.33, netPay: 2850.00 },
        { id: '2', payPeriodStart: new Date('2024-10-16'), payPeriodEnd: new Date('2024-10-31'), grossPay: 3958.33, netPay: 2850.00 }
      ]
    },
    {
      id: '2',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@company.com',
      jobTitle: 'Marketing Manager',
      department: 'Marketing',
      salary: 75000,
      hourlyRate: null,
      hireDate: new Date('2023-07-01'),
      isActive: true,
      paychecks: [
        { id: '3', payPeriodStart: new Date('2024-11-01'), payPeriodEnd: new Date('2024-11-15'), grossPay: 3125.00, netPay: 2280.00 }
      ]
    },
    {
      id: '3',
      firstName: 'Mike',
      lastName: 'Brown',
      email: 'mike.brown@company.com',
      jobTitle: 'Part-time Assistant',
      department: 'Operations',
      salary: null,
      hourlyRate: 25,
      hireDate: new Date('2024-01-15'),
      isActive: true,
      paychecks: [
        { id: '4', payPeriodStart: new Date('2024-11-01'), payPeriodEnd: new Date('2024-11-15'), grossPay: 1000.00, netPay: 800.00 }
      ]
    }
  ]

  const mockPayPeriods = [
    {
      id: '1',
      startDate: new Date('2024-11-01'),
      endDate: new Date('2024-11-15'),
      payDate: new Date('2024-11-20'),
      status: 'COMPLETED',
      employeeCount: 3,
      totalGross: 8083.33,
      totalNet: 5930.00,
      totalTaxes: 1653.33,
      totalDeductions: 500.00
    },
    {
      id: '2',
      startDate: new Date('2024-10-16'),
      endDate: new Date('2024-10-31'),
      payDate: new Date('2024-11-05'),
      status: 'COMPLETED',
      employeeCount: 3,
      totalGross: 8083.33,
      totalNet: 5930.00,
      totalTaxes: 1653.33,
      totalDeductions: 500.00
    },
    {
      id: '3',
      startDate: new Date('2024-11-16'),
      endDate: new Date('2024-11-30'),
      payDate: new Date('2024-12-05'),
      status: 'PENDING',
      employeeCount: 3,
      totalGross: 0,
      totalNet: 0,
      totalTaxes: 0,
      totalDeductions: 0
    }
  ]

  const activeEmployees = mockEmployees.filter(emp => emp.isActive).length
  const totalPayrollCost = mockEmployees.reduce((sum, emp) => 
    sum + (emp.salary || 0) + (emp.hourlyRate ? emp.hourlyRate * 2080 : 0), 0
  )
  const currentPeriod = mockPayPeriods.find(p => p.status === 'PENDING')
  const lastPayroll = mockPayPeriods.find(p => p.status === 'COMPLETED')

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>
      case 'PROCESSING':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
      case 'ERROR':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'PENDING':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'PROCESSING':
        return <Calculator className="h-4 w-4 text-blue-500" />
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll</h1>
          <p className="text-gray-600 mt-1">Full-service payroll with tax compliance automation</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline"
            onClick={() => {
              toast.info('Timesheet import dialog would open here')
              // In a real app, this would open file picker for timesheet import
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Timesheets
          </Button>
          <Link href="/dashboard/payroll/run">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Run Payroll
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-blue-500 mr-2" />
              <div className="text-2xl font-bold text-blue-600">{activeEmployees}</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Currently employed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Annual Payroll Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalPayrollCost.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Estimated annual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Last Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ${lastPayroll?.totalNet.toLocaleString() || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {lastPayroll ? format(lastPayroll.payDate, 'MMM d') : 'No payroll yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Next Pay Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-orange-500 mr-2" />
              <div className="text-lg font-bold text-orange-600">
                {currentPeriod ? format(currentPeriod.payDate, 'MMM d') : 'TBD'}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Upcoming payment</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="payroll-runs">Payroll Runs</TabsTrigger>
          <TabsTrigger value="compliance">Tax & Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Pay Period</CardTitle>
              </CardHeader>
              <CardContent>
                {currentPeriod ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Period:</span>
                      <span className="font-medium">
                        {format(currentPeriod.startDate, 'MMM d')} - {format(currentPeriod.endDate, 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Pay Date:</span>
                      <span className="font-medium">{format(currentPeriod.payDate, 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Employees:</span>
                      <span className="font-medium">{currentPeriod.employeeCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      {getStatusBadge(currentPeriod.status)}
                    </div>
                    
                    {currentPeriod.status === 'PENDING' && (
                      <div className="pt-4 border-t border-gray-200">
                        <Button 
                          className="w-full"
                          onClick={() => {
                            toast.success('Payroll calculation initiated!')
                            // In a real app, this would start payroll calculation
                          }}
                        >
                          <Calculator className="h-4 w-4 mr-2" />
                          Calculate Payroll
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No active pay period</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      toast.info('New employee form would open here')
                      // In a real app, this would navigate to add employee form
                    }}
                  >
                    <Users className="h-4 w-4 mr-3" />
                    Add New Employee
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      toast.success('Pay stubs generated! Check your downloads folder.')
                      // In a real app, this would generate and download pay stubs
                    }}
                  >
                    <FileText className="h-4 w-4 mr-3" />
                    Generate Pay Stubs
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      toast.success('Payroll report exported! Check your downloads folder.')
                      // In a real app, this would export payroll report
                    }}
                  >
                    <Download className="h-4 w-4 mr-3" />
                    Export Payroll Report
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      toast.info('Tax calculator would open here')
                      // In a real app, this would open tax calculator
                    }}
                  >
                    <Calculator className="h-4 w-4 mr-3" />
                    Tax Calculator
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>Employee Directory</CardTitle>
            </CardHeader>
            <CardContent>
              {mockEmployees.length > 0 ? (
                <div className="space-y-4">
                  {mockEmployees.map((employee) => (
                    <div key={employee.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {employee.firstName[0]}{employee.lastName[0]}
                            </span>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {employee.firstName} {employee.lastName}
                              </h3>
                              <Badge variant={employee.isActive ? 'default' : 'secondary'}>
                                {employee.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <div><strong>Email:</strong> {employee.email}</div>
                                <div><strong>Department:</strong> {employee.department}</div>
                                <div><strong>Job Title:</strong> {employee.jobTitle}</div>
                              </div>
                              <div>
                                <div><strong>Hire Date:</strong> {format(employee.hireDate, 'MMM d, yyyy')}</div>
                                <div>
                                  <strong>Compensation:</strong>{' '}
                                  {employee.salary 
                                    ? `$${employee.salary.toLocaleString()}/year`
                                    : `$${employee.hourlyRate}/hour`
                                  }
                                </div>
                                <div><strong>Last Paycheck:</strong> {
                                  employee.paychecks.length > 0 
                                    ? `$${employee.paychecks[0].netPay.toLocaleString()}`
                                    : 'None'
                                }</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            Pay Stubs
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No employees yet</h3>
                  <p className="text-gray-600 mb-4">Add employees to start running payroll</p>
                  <Link href="/dashboard/payroll/employees/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Employee
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll-runs">
          <Card>
            <CardHeader>
              <CardTitle>Payroll History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPayPeriods.map((period) => (
                  <div key={period.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(period.status)}
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {format(period.startDate, 'MMM d')} - {format(period.endDate, 'MMM d, yyyy')}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1">
                            {getStatusBadge(period.status)}
                            <span className="text-sm text-gray-500">
                              Pay Date: {format(period.payDate, 'MMM d, yyyy')}
                            </span>
                            <span className="text-sm text-gray-500">
                              {period.employeeCount} employees
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="grid grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-xs text-gray-500">Gross</div>
                            <div className="font-semibold">${period.totalGross.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Taxes</div>
                            <div className="font-semibold text-red-600">${period.totalTaxes.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Deductions</div>
                            <div className="font-semibold text-blue-600">${period.totalDeductions.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Net</div>
                            <div className="font-semibold text-green-600">${period.totalNet.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 mt-4">
                      <Button variant="outline" size="sm">
                        <FileText className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3 mr-1" />
                        Export
                      </Button>
                      {period.status === 'PENDING' && (
                        <Button size="sm">
                          <Calculator className="h-3 w-3 mr-1" />
                          Process
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tax Filings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded">
                    <div>
                      <div className="font-medium">Form 941 - Q3 2024</div>
                      <div className="text-sm text-gray-600">Filed on time</div>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded">
                    <div>
                      <div className="font-medium">Form 941 - Q4 2024</div>
                      <div className="text-sm text-gray-600">Due: Jan 31, 2025</div>
                    </div>
                    <Clock className="h-5 w-5 text-gray-500" />
                  </div>

                  <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded">
                    <div>
                      <div className="font-medium">W-2 Forms</div>
                      <div className="text-sm text-gray-600">Due: Jan 31, 2025</div>
                    </div>
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Federal Tax Rate:</span>
                    <span className="font-semibold">22%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">State Tax Rate:</span>
                    <span className="font-semibold">6.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">FICA Rate:</span>
                    <span className="font-semibold">7.65%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">SUTA Rate:</span>
                    <span className="font-semibold">2.7%</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Compliance Score:</span>
                      <span className="font-bold text-green-600">98%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
