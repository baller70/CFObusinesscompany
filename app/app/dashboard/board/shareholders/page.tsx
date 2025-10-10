

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Plus, 
  PieChart, 
  TrendingUp,
  DollarSign,
  Award,
  Building2,
  UserCheck,
  FileText,
  Download,
  Upload,
  Share2
} from 'lucide-react'

export default function ShareholdersPage() {
  const { data: session } = useSession() || {}
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Shareholders</h1>
          <p className="text-muted-foreground mt-1">
            Manage shareholder records and equity distribution
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Cap Table Report
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Shareholder
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shareholders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Active shareholders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
            <Share2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">0</div>
            <p className="text-xs text-muted-foreground">Outstanding shares</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Company Valuation</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">$0</div>
            <p className="text-xs text-muted-foreground">Latest valuation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funding Rounds</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">0</div>
            <p className="text-xs text-muted-foreground">Completed rounds</p>
          </CardContent>
        </Card>
      </div>

      {/* Shareholder Types */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50 hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6 text-center">
            <Building2 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-900">0</div>
            <p className="text-sm text-blue-700 mt-1">Founders</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6 text-center">
            <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-900">0</div>
            <p className="text-sm text-green-700 mt-1">Investors</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50 hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6 text-center">
            <UserCheck className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-900">0</div>
            <p className="text-sm text-purple-700 mt-1">Employees</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50 hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6 text-center">
            <Award className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-900">0</div>
            <p className="text-sm text-orange-700 mt-1">Advisors</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Shareholders</TabsTrigger>
          <TabsTrigger value="common">Common Stock</TabsTrigger>
          <TabsTrigger value="preferred">Preferred Stock</TabsTrigger>
          <TabsTrigger value="options">Options</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cap Table</CardTitle>
              <CardDescription>
                Complete capitalization table with all shareholders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <PieChart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Shareholders</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Start building your cap table by adding shareholders and equity allocation
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Shareholder
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="common" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Common Stock</CardTitle>
              <CardDescription>
                Shareholders holding common stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Share2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Common Stock Holders</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Track common stock ownership and distribution
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferred" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferred Stock</CardTitle>
              <CardDescription>
                Shareholders holding preferred stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Preferred Stock Holders</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Manage preferred stock from funding rounds and conversions
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="options" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Options</CardTitle>
              <CardDescription>
                Employee stock options and option pool
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Stock Options</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Track employee equity grants and vesting schedules
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Equity Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Equity Distribution</CardTitle>
          <CardDescription>Breakdown of ownership across all shareholders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <div className="text-2xl font-bold">0%</div>
              <p className="text-sm text-muted-foreground">Founders</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <div className="text-2xl font-bold">0%</div>
              <p className="text-sm text-muted-foreground">Investors</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <UserCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <div className="text-2xl font-bold">0%</div>
              <p className="text-sm text-muted-foreground">Employees</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Share2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <div className="text-2xl font-bold">0%</div>
              <p className="text-sm text-muted-foreground">Option Pool</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

