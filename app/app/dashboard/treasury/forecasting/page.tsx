
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, Plus, Calendar, Activity, AlertTriangle, Target, BarChart3 } from 'lucide-react'

import { BackButton } from '@/components/ui/back-button';
export default function CashForecastingPage() {
  const { data: session } = useSession() || {}
  const [loading, setLoading] = useState(false)
  const [forecastPeriod, setForecastPeriod] = useState('90')

  return (
    <div className="p-6 space-y-6">
        <BackButton href="/dashboard" />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cash Forecasting</h1>
          <p className="text-muted-foreground mt-1">
            Predict future cash positions and plan accordingly
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Generate Forecast
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Forecast Assumption
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Cash</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">As of today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">30-Day Forecast</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">Projected balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">90-Day Forecast</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">Projected balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forecast Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">No historical data</p>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Period Selector */}
      <div className="flex gap-2">
        {[
          { value: '30', label: '30 Days' },
          { value: '60', label: '60 Days' },
          { value: '90', label: '90 Days' },
          { value: '180', label: '6 Months' },
          { value: '365', label: '1 Year' }
        ].map((period) => (
          <Button
            key={period.value}
            variant={forecastPeriod === period.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setForecastPeriod(period.value)}
          >
            {period.label}
          </Button>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="forecast" className="space-y-4">
        <TabsList>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
          <TabsTrigger value="accuracy">Accuracy Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cash Forecast Chart</CardTitle>
              <CardDescription>
                Projected cash balance over the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Forecast Data</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Add historical cash flow data and forecast assumptions to generate predictions
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate First Forecast
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Forecast Details */}
          <Card>
            <CardHeader>
              <CardTitle>Forecast Breakdown</CardTitle>
              <CardDescription>
                Detailed breakdown of expected cash movements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Activity className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Forecast details will appear here once generated
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scenario Analysis</CardTitle>
              <CardDescription>
                Compare different cash flow scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Scenarios Created</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Create best-case, worst-case, and most-likely scenarios to plan for uncertainty
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Scenario
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assumptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Forecast Assumptions</CardTitle>
              <CardDescription>
                Key assumptions driving your cash forecast
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Assumptions Set</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Define assumptions about revenue growth, expense patterns, and timing
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Assumption
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accuracy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Forecast Accuracy</CardTitle>
              <CardDescription>
                Compare forecasts against actual results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Accuracy Data</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Historical forecast accuracy metrics will appear once you have past forecasts to compare
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
