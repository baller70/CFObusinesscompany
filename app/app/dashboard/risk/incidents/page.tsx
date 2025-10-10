

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  AlertCircle, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Bell,
  Activity,
  FileText,
  TrendingUp
} from 'lucide-react'

export default function RiskIncidentsPage() {
  const { data: session } = useSession() || {}
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Risk Incidents</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage risk incidents and near-misses
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            View Report
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Log Incident
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">0</div>
            <p className="text-xs text-muted-foreground">Under investigation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">0</div>
            <p className="text-xs text-muted-foreground">Successfully closed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financial Impact</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">Total losses</p>
          </CardContent>
        </Card>
      </div>

      {/* Severity Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">0</div>
            <p className="text-xs text-muted-foreground mt-1">Severe impact incidents</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              High
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">0</div>
            <p className="text-xs text-muted-foreground mt-1">Significant impact</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              Medium
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">0</div>
            <p className="text-xs text-muted-foreground mt-1">Moderate impact</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-600" />
              Low
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">0</div>
            <p className="text-xs text-muted-foreground mt-1">Minor incidents</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Incidents</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="investigating">Investigating</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Incident Log</CardTitle>
              <CardDescription>
                Complete record of all risk incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Incidents Recorded</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Start logging risk incidents to track, investigate, and prevent future occurrences
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Log First Incident
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="open" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Open Incidents</CardTitle>
              <CardDescription>
                Incidents requiring immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Open Incidents</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  All incidents are either under investigation or resolved
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investigating" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Under Investigation</CardTitle>
              <CardDescription>
                Incidents currently being analyzed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Investigations</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  No incidents are currently under investigation
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resolved Incidents</CardTitle>
              <CardDescription>
                Successfully closed incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Resolved Incidents</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Incidents that have been successfully resolved will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

