
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Send,
  Download,
  Calendar,
  Users,
  TrendingUp,
  DollarSign,
  BarChart3,
  PieChart,
  Clock
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export default function InvestorReportsPage() {
  const [selectedQuarter, setSelectedQuarter] = useState('q4-2024')
  const [investorReports, setInvestorReports] = useState<any[]>([])

  const handleSendReport = () => {
    toast.info('Investor report distribution feature coming soon')
  }

  const handleGenerateReport = () => {
    toast.info('Generating investor report...')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Investor Reports</h1>
          <p className="text-muted-foreground mt-2">
            Generate and distribute reports for investors and stakeholders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="q4-2024">Q4 2024</SelectItem>
              <SelectItem value="q3-2024">Q3 2024</SelectItem>
              <SelectItem value="q2-2024">Q2 2024</SelectItem>
              <SelectItem value="q1-2024">Q1 2024</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleGenerateReport} className="gap-2">
            <FileText className="h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{investorReports.length}</div>
            <p className="text-xs text-muted-foreground">Generated reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sent</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">No reports sent yet</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Active investors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Report</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Schedule not set</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Report Types */}
      <Tabs defaultValue="quarterly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="quarterly">Quarterly Reports</TabsTrigger>
          <TabsTrigger value="annual">Annual Reports</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Updates</TabsTrigger>
        </TabsList>

        <TabsContent value="quarterly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quarterly Investor Reports</CardTitle>
              <CardDescription>Comprehensive quarterly financial and operational updates</CardDescription>
            </CardHeader>
            <CardContent>
              {investorReports.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No quarterly reports yet</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Generate your first quarterly investor report to get started
                  </p>
                  <Button onClick={handleGenerateReport} className="mt-4 gap-2">
                    <FileText className="h-4 w-4" />
                    Generate Quarterly Report
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {investorReports.map((report) => (
                    <Card key={report.id}>
                      <CardContent className="flex items-center justify-between p-6">
                        <div className="flex-1">
                          <h4 className="font-semibold">{report.title}</h4>
                          <p className="text-sm text-muted-foreground">{report.period}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{report.status}</Badge>
                            <span className="text-xs text-muted-foreground">
                              Generated: {report.createdAt}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="gap-2">
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                          <Button size="sm" variant="outline" className="gap-2">
                            <Send className="h-4 w-4" />
                            Send
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="annual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Annual Investor Reports</CardTitle>
              <CardDescription>Year-end comprehensive reports for investors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No annual reports yet</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Annual reports will be available at year-end
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Investor Updates</CardTitle>
              <CardDescription>Brief monthly updates for active investors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No monthly updates yet</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Start sending monthly updates to keep investors informed
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
