
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Download, Calendar, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState<string | null>(null)
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchReports()
    fetchCurrentProfile()
  }, [])

  const fetchCurrentProfile = async () => {
    try {
      const response = await fetch('/api/business-profiles')
      if (response.ok) {
        const data = await response.json()
        const current = data.profiles?.find((p: any) => p.isCurrent)
        setCurrentProfile(current)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/personal/reports')
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    }
  }

  const generateReport = async (reportType: string) => {
    setLoading(reportType)
    try {
      const response = await fetch('/api/personal/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportType }),
      })

      if (response.ok) {
        // Get the CSV content
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get('Content-Disposition')
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `${reportType.replace(/\s+/g, '_')}.csv`
        
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: 'Report Generated',
          description: `Your ${reportType} has been downloaded`,
        })

        // Refresh the reports list
        await fetchReports()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to generate report',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error generating report:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive',
      })
    } finally {
      setLoading(null)
    }
  }

  const reportTypes = [
    {
      name: 'Monthly Summary',
      description: 'Overview of current month\'s transactions and balances',
    },
    {
      name: 'Year-End Report',
      description: 'Comprehensive annual financial summary',
    },
    {
      name: 'Net Worth Statement',
      description: 'Complete breakdown of assets and liabilities',
    },
    {
      name: 'Custom Report',
      description: 'Customizable report with flexible date ranges',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <p className="text-muted-foreground">Generate comprehensive financial reports</p>
      </div>

      {currentProfile && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-600"></div>
              <p className="text-sm font-medium text-blue-900">
                Reports will be generated from: <span className="font-bold">{currentProfile.name}</span>
                {currentProfile.type === 'PERSONAL' && ' (Personal/Household)'}
                {currentProfile.type === 'BUSINESS' && ' (Business)'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{report.name}</span>
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {report.description}
              </p>
              <Button 
                className="w-full" 
                onClick={() => generateReport(report.name)}
                disabled={loading === report.name}
              >
                {loading === report.name ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports generated yet</h3>
              <p className="text-muted-foreground">Generate your first report to see it appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-accent">
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {report.summary?.transactionCount || 0} transactions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      Net: ${((report.summary?.netIncome || 0).toFixed(2))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Income: ${(report.summary?.income || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expenses: ${(report.summary?.expenses || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
