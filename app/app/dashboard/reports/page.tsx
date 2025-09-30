
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter,
  TrendingUp,
  PieChart,
  BarChart3,
  LineChart,
  FileSpreadsheet,
  Printer,
  Share2,
  RefreshCw
} from 'lucide-react'
import { format, subMonths } from 'date-fns'
import { toast } from 'sonner'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('current-month')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Mock reports data
  const mockReports = [
    {
      id: '1',
      name: 'Profit & Loss Statement',
      type: 'P&L',
      description: 'Comprehensive profit and loss analysis',
      period: 'November 2024',
      createdAt: new Date('2024-11-01'),
      status: 'Ready',
      size: '2.4 MB'
    },
    {
      id: '2',
      name: 'Cash Flow Statement',
      type: 'CASH_FLOW',
      description: 'Cash inflows and outflows analysis',
      period: 'November 2024',
      createdAt: new Date('2024-11-05'),
      status: 'Ready',
      size: '1.8 MB'
    },
    {
      id: '3',
      name: 'Balance Sheet',
      type: 'BALANCE',
      description: 'Assets, liabilities, and equity snapshot',
      period: 'October 2024',
      createdAt: new Date('2024-10-31'),
      status: 'Ready',
      size: '3.2 MB'
    },
    {
      id: '4',
      name: 'Tax Summary Report',
      type: 'TAX',
      description: 'Quarterly tax obligations and deductions',
      period: 'Q3 2024',
      createdAt: new Date('2024-09-30'),
      status: 'Processing',
      size: '1.1 MB'
    },
    {
      id: '5',
      name: 'Expense Analysis',
      type: 'EXPENSE',
      description: 'Detailed breakdown of business expenses',
      period: 'November 2024',
      createdAt: new Date('2024-11-10'),
      status: 'Ready',
      size: '2.8 MB'
    }
  ]

  const reportTypes = [
    { value: 'p-l', label: 'Profit & Loss', icon: <TrendingUp className="h-4 w-4" /> },
    { value: 'cash-flow', label: 'Cash Flow', icon: <LineChart className="h-4 w-4" /> },
    { value: 'balance-sheet', label: 'Balance Sheet', icon: <BarChart3 className="h-4 w-4" /> },
    { value: 'tax-summary', label: 'Tax Summary', icon: <FileText className="h-4 w-4" /> },
    { value: 'expense-analysis', label: 'Expense Analysis', icon: <PieChart className="h-4 w-4" /> }
  ]

  const itemsPerPage = 3
  const totalPages = Math.ceil(mockReports.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentReports = mockReports.slice(startIndex, startIndex + itemsPerPage)

  const handleGenerateReport = async (type: string) => {
    setIsGenerating(true)
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success(`${type} report generated successfully!`)
    } catch (error) {
      toast.error('Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadReport = (reportName: string) => {
    toast.success(`Downloading ${reportName}...`)
    // In a real app, this would trigger actual download
  }

  const handleShareReport = (reportName: string) => {
    toast.info(`Sharing ${reportName} via email...`)
    // In a real app, this would open share dialog
  }

  const handlePrintReport = (reportName: string) => {
    toast.info(`Printing ${reportName}...`)
    // In a real app, this would open print dialog
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ready':
        return <Badge className="bg-green-100 text-green-800">Ready</Badge>
      case 'Processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
      case 'Failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600 mt-1">Generate and manage comprehensive financial reports</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
          <Button
            onClick={() => {
              toast.info('Quick report generation dialog would open here')
              // In a real app, this would open a quick report generation dialog
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Period</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current-month">Current Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reports</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="tax">Tax Reports</SelectItem>
                    <SelectItem value="operational">Operational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
                <Input placeholder="Search reports..." />
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => toast.info('Filters applied!')}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList>
          <TabsTrigger value="generate">Generate Reports</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportTypes.map((type) => (
              <Card key={type.value} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {type.icon}
                    <span className="ml-2">{type.label}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Period</label>
                      <Select defaultValue="current-month">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="current-month">Current Month</SelectItem>
                          <SelectItem value="last-month">Last Month</SelectItem>
                          <SelectItem value="quarter">This Quarter</SelectItem>
                          <SelectItem value="year">This Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={() => handleGenerateReport(type.label)}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      Generate {type.label}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <FileSpreadsheet className="h-8 w-8 text-blue-500" />
                      <div>
                        <h4 className="font-semibold text-gray-900">{report.name}</h4>
                        <p className="text-sm text-gray-600">{report.description}</p>
                        <div className="flex items-center space-x-3 mt-1">
                          {getStatusBadge(report.status)}
                          <span className="text-xs text-gray-500">
                            {format(report.createdAt, 'MMM d, yyyy')} • {report.size}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadReport(report.name)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleShareReport(report.name)}
                      >
                        <Share2 className="h-3 w-3 mr-1" />
                        Share
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePrintReport(report.name)}
                      >
                        <Printer className="h-3 w-3 mr-1" />
                        Print
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-6 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage > 1) setCurrentPage(currentPage - 1)
                        }}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {[...Array(totalPages)].map((_, index) => (
                      <PaginationItem key={index}>
                        <PaginationLink 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage(index + 1)
                          }}
                          isActive={currentPage === index + 1}
                          className="cursor-pointer"
                        >
                          {index + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                        }}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Report Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Monthly Financial Package</h4>
                  <p className="text-sm text-gray-600 mb-3">P&L, Balance Sheet, and Cash Flow combined</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toast.info('Generating monthly financial package...')}
                  >
                    Use Template
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Executive Dashboard</h4>
                  <p className="text-sm text-gray-600 mb-3">High-level KPIs and performance metrics</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toast.info('Generating executive dashboard...')}
                  >
                    Use Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled reports</h3>
                <p className="text-gray-600 mb-4">Set up automated report generation to save time</p>
                <Button 
                  onClick={() => toast.info('Opening schedule report dialog...')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
