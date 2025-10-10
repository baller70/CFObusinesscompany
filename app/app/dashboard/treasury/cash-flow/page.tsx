
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, Plus, TrendingUp, TrendingDown, DollarSign, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function CashFlowManagementPage() {
  const { data: session } = useSession() || {}
  const [loading, setLoading] = useState(false)
  const [timeframe, setTimeframe] = useState('month')

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cash Flow Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your cash inflows and outflows
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            View Report
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Cash Flow
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Inflows</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">$0</div>
            <p className="text-xs text-muted-foreground">0 transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Outflows</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">$0</div>
            <p className="text-xs text-muted-foreground">0 transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operating Cash Flow</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">Operational activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Period Selector */}
      <div className="flex gap-2">
        {[
          { value: 'week', label: 'This Week' },
          { value: 'month', label: 'This Month' },
          { value: 'quarter', label: 'This Quarter' },
          { value: 'year', label: 'This Year' }
        ].map((period) => (
          <Button
            key={period.value}
            variant={timeframe === period.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeframe(period.value)}
          >
            {period.label}
          </Button>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="operating">Operating Activities</TabsTrigger>
          <TabsTrigger value="investing">Investing Activities</TabsTrigger>
          <TabsTrigger value="financing">Financing Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Overview</CardTitle>
              <CardDescription>
                Comprehensive view of your cash movements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Cash Flow Data</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Start tracking your cash inflows and outflows to get comprehensive cash flow insights
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Cash Flow Entry
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operating" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Operating Activities</CardTitle>
              <CardDescription>
                Cash flows from core business operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Operating Cash Flows</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Track revenue collections, expense payments, and other operational cash movements
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Investing Activities</CardTitle>
              <CardDescription>
                Cash flows from investment purchases and sales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Investing Cash Flows</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Record cash used for asset purchases or received from asset sales
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financing Activities</CardTitle>
              <CardDescription>
                Cash flows from debt, equity, and dividend transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ArrowDownRight className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Financing Cash Flows</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Track loans, equity investments, and dividend payments
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
