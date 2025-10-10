
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Workflow, Plus, AlertTriangle, CheckCircle2, TrendingUp, Scale } from 'lucide-react'

export default function RebalancingPage() {
  const { data: session } = useSession() || {}
  const [loading, setLoading] = useState(false)

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Rebalancing</h1>
          <p className="text-muted-foreground mt-1">
            Maintain your target allocation and optimize portfolio balance
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Rebalancing Plan
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Balance</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Balanced</div>
            <p className="text-xs text-muted-foreground">No action needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drift from Target</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">Within tolerance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Rebalanced</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Never</div>
            <p className="text-xs text-muted-foreground">No history</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rebalancing Plans</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No plans created</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Rebalancing Status</CardTitle>
          <CardDescription>
            Current portfolio balance and recommended actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Scale className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Portfolio Data</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Set up your target asset allocation and add investments to receive rebalancing recommendations
            </p>
            <div className="flex gap-3">
              <Button variant="outline">Set Target Allocation</Button>
              <Button>Add Investments</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rebalancing History */}
      <Card>
        <CardHeader>
          <CardTitle>Rebalancing History</CardTitle>
          <CardDescription>
            Past rebalancing actions and their impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Rebalancing History</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Your rebalancing activities will appear here once you start optimizing your portfolio
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
