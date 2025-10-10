
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Download, Calendar } from 'lucide-react'

export default function ReportsPage() {
  const reports = [
    { id: 1, name: 'Monthly Spending Summary', type: 'Monthly', lastGenerated: '2024-01-15' },
    { id: 2, name: 'Year-over-Year Comparison', type: 'Annual', lastGenerated: '2024-01-01' },
    { id: 3, name: 'Net Worth Statement', type: 'Quarterly', lastGenerated: '2024-01-10' },
    { id: 4, name: 'Income & Expense Report', type: 'Monthly', lastGenerated: '2024-01-15' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <p className="text-muted-foreground">Generate comprehensive financial reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {['Monthly Summary', 'Year-End Report', 'Net Worth Statement', 'Custom Report'].map((reportType, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{reportType}</span>
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Generate a detailed {reportType.toLowerCase()} for your records
              </p>
              <Button className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Generate Report
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
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-accent">
                <div>
                  <p className="font-medium">{report.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(report.lastGenerated).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
