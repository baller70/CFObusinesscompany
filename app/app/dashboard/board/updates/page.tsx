

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BackButton } from '@/components/ui/back-button';
import { 
  Send, 
  Plus, 
  Mail, 
  FileText,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
  Calendar,
  Eye,
  Download,
  Edit
} from 'lucide-react'

export default function InvestorUpdatesPage() {
  const { data: session } = useSession() || {}
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  return (
    <div className="p-6 space-y-6">
        <BackButton href="/dashboard" />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Investor Updates</h1>
          <p className="text-muted-foreground mt-1">
            Communicate progress and performance with your investors
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Update
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Updates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Quarter</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">0</div>
            <p className="text-xs text-muted-foreground">Updates sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recipients</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">0</div>
            <p className="text-xs text-muted-foreground">Active investors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">0%</div>
            <p className="text-xs text-muted-foreground">Engagement rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Update Types */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50 hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6 text-center">
            <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-900">0</div>
            <p className="text-sm text-blue-700 mt-1">Monthly Updates</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6 text-center">
            <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-900">0</div>
            <p className="text-sm text-green-700 mt-1">Quarterly Reports</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50 hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6 text-center">
            <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-900">0</div>
            <p className="text-sm text-orange-700 mt-1">Annual Reports</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50 hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6 text-center">
            <Send className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-900">0</div>
            <p className="text-sm text-purple-700 mt-1">Special Updates</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Updates</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Investor Communications</CardTitle>
              <CardDescription>
                Complete history of investor updates and reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Send className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Investor Updates</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Start communicating with your investors through regular updates
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Update
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Draft Updates</CardTitle>
              <CardDescription>
                Updates in progress and pending review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Edit className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Drafts</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Draft updates will appear here before they're sent
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sent Updates</CardTitle>
              <CardDescription>
                Previously delivered investor communications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Sent Updates</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Your sent updates will be stored here with engagement metrics
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Updates</CardTitle>
              <CardDescription>
                Updates scheduled for future delivery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Scheduled Updates</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Schedule updates in advance to maintain consistent communication
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Metrics</CardTitle>
          <CardDescription>Track the effectiveness of your investor communications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <div className="text-2xl font-bold">0%</div>
              <p className="text-sm text-muted-foreground">Average Open Rate</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <div className="text-2xl font-bold">0%</div>
              <p className="text-sm text-muted-foreground">Engagement Rate</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <div className="text-2xl font-bold">0</div>
              <p className="text-sm text-muted-foreground">Active Readers</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

