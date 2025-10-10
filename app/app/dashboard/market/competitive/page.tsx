
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  BarChart3,
  PieChart,
  Plus,
  RefreshCw,
  Download
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function CompetitiveAnalysisPage() {
  const [competitors, setCompetitors] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const handleAddCompetitor = () => {
    toast.info('Add competitor feature coming soon')
  }

  const handleRefresh = () => {
    toast.info('Refreshing competitive data...')
  }

  const filteredCompetitors = competitors.filter(comp =>
    comp.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Competitive Analysis</h1>
          <p className="text-muted-foreground mt-2">
            Track and analyze your competition in the market
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleAddCompetitor} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Competitor
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Competitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{competitors.length}</div>
            <p className="text-xs text-muted-foreground">Being tracked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Share</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">Your position</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">vs competitors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Competitive Index</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Overall score</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Analysis Views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Strategy</TabsTrigger>
          <TabsTrigger value="market-share">Market Share</TabsTrigger>
          <TabsTrigger value="swot">SWOT Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Landscape</CardTitle>
              <CardDescription>Overview of your competitive position</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No competitive data yet</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Start by adding competitors to track and analyze
                </p>
                <Button onClick={handleAddCompetitor} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Add Your First Competitor
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Competitor List</CardTitle>
                  <CardDescription>Companies you're tracking</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search competitors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {filteredCompetitors.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No competitors added</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Add competitors to start tracking their performance
                  </p>
                  <Button onClick={handleAddCompetitor} className="mt-4 gap-2">
                    <Plus className="h-4 w-4" />
                    Add Competitor
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCompetitors.map((competitor) => (
                    <Card key={competitor.id}>
                      <CardContent className="flex items-center justify-between p-6">
                        <div className="flex-1">
                          <h4 className="font-semibold">{competitor.name}</h4>
                          <p className="text-sm text-muted-foreground">{competitor.industry}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge>{competitor.marketShare}% market share</Badge>
                            <span className="text-xs text-muted-foreground">
                              Revenue: {competitor.revenue}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">View Details</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Strategy</CardTitle>
              <CardDescription>Compare pricing across competitors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No pricing data</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Add competitor pricing information to see comparisons
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market-share" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market Share Analysis</CardTitle>
              <CardDescription>Distribution of market share among competitors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <PieChart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No market share data</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Market share analysis will appear when competitor data is added
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="swot" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No strengths defined</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Weaknesses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No weaknesses defined</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No opportunities defined</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-orange-600">Threats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No threats defined</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
