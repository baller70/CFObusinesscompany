
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

import { BackButton } from '@/components/ui/back-button';
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
    return <div className="p-6">
        <BackButton href="/dashboard/payroll" />Loading...</div>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Payroll Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employees configured</h3>
            <p className="text-gray-600 mb-4">Add employees to your business profile to process payroll</p>
            <Button onClick={() => toast.info('Employee management feature coming soon')}>
              <Users className="h-4 w-4 mr-2" />
              Add Employees
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
