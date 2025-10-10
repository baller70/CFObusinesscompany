
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Plus,
  Activity,
  BarChart3,
  Target,
  Coins,
  AlertTriangle
} from 'lucide-react'

interface Portfolio {
  id: string
  name: string
  description?: string
  type: string
  totalValue: number
  totalCost: number
  totalReturn: number
  totalReturnPct: number
  totalInvestments: number
  performanceScore: number
  riskScore: number
  diversificationScore: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface PortfolioSummary {
  totalPortfolios: number
  totalValue: number
  totalReturn: number
  avgReturnPct: number
}

export default function InvestmentPortfolioPage() {
  const { data: session } = useSession() || {}
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [summary, setSummary] = useState<PortfolioSummary>({
    totalPortfolios: 0,
    totalValue: 0,
    totalReturn: 0,
    avgReturnPct: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      fetchPortfolios()
    }
  }, [session?.user?.id])

  const fetchPortfolios = async () => {
    try {
      const response = await fetch('/api/premium-features/investments/portfolio')
      if (response.ok) {
        const data = await response.json()
        setPortfolios(data.portfolios || [])
        setSummary(data.summary || {
          totalPortfolios: 0,
          totalValue: 0,
          totalReturn: 0,
          avgReturnPct: 0
        })
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPerformanceIcon = (returnPct: number) => {
    if (returnPct > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (returnPct < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Activity className="h-4 w-4 text-gray-500" />
  }

  const getPortfolioTypeColor = (type: string) => {
    switch (type) {
      case 'RETIREMENT': return 'bg-blue-100 text-blue-800'
      case 'TAXABLE': return 'bg-green-100 text-green-800'
      case 'TAX_DEFERRED': return 'bg-purple-100 text-purple-800'
      case 'EMERGENCY_FUND': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskBadgeColor = (riskScore: number) => {
    if (riskScore >= 80) return 'bg-red-100 text-red-800'
    if (riskScore >= 60) return 'bg-gray-100 text-gray-800'
    return 'bg-green-100 text-green-800'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-background p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-background p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-heading text-foreground mb-3">
            Investment Portfolio Management
          </h1>
          <p className="text-body text-muted-foreground">
            Track, analyze and optimize your investment portfolios
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Create Portfolio
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card className="card-premium-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-small text-muted-foreground font-medium flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" />
              Total Portfolios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-financial-large text-foreground mb-2">
              {summary.totalPortfolios}
            </div>
            <p className="text-small text-muted-foreground">
              Active portfolios
            </p>
          </CardContent>
        </Card>

        <Card className="card-premium-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-small text-muted-foreground font-medium flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-financial-large text-foreground mb-2">
              ${summary.totalValue.toLocaleString()}
            </div>
            <p className="text-small text-muted-foreground">
              Across all portfolios
            </p>
          </CardContent>
        </Card>

        <Card className="card-premium-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-small text-muted-foreground font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              Total Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-financial-large mb-2 ${summary.totalReturn >= 0 ? 'text-financial-positive' : 'text-financial-negative'}`}>
              ${summary.totalReturn.toLocaleString()}
            </div>
            <p className="text-small text-muted-foreground flex items-center gap-1">
              {getPerformanceIcon(summary.avgReturnPct)}
              {summary.avgReturnPct.toFixed(2)}% average
            </p>
          </CardContent>
        </Card>

        <Card className="card-premium-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-small text-muted-foreground font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-financial-large text-foreground mb-2">
              {portfolios.length > 0 
                ? (portfolios.reduce((sum, p) => sum + p.performanceScore, 0) / portfolios.length).toFixed(0)
                : '0'}/100
            </div>
            <p className="text-small text-muted-foreground">
              Average score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {portfolios.map((portfolio) => (
          <Card key={portfolio.id} className="card-premium-elevated hover:scale-105 transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-body-large text-foreground mb-2">
                    {portfolio.name}
                  </CardTitle>
                  <Badge className={`${getPortfolioTypeColor(portfolio.type)} text-xs`}>
                    {portfolio.type.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-body text-muted-foreground">
                    {portfolio.totalInvestments} investments
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Portfolio Value */}
              <div>
                <div className="text-financial text-foreground">
                  ${portfolio.totalValue.toLocaleString()}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {getPerformanceIcon(portfolio.totalReturnPct)}
                  <span className={`text-small ${
                    portfolio.totalReturn >= 0 ? 'text-financial-positive' : 'text-financial-negative'
                  }`}>
                    ${portfolio.totalReturn.toLocaleString()} ({portfolio.totalReturnPct.toFixed(2)}%)
                  </span>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-muted">
                <div className="text-center">
                  <div className="text-small text-muted-foreground">Performance</div>
                  <div className="text-body font-medium text-foreground">
                    {portfolio.performanceScore.toFixed(0)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-small text-muted-foreground">Risk</div>
                  <Badge className={`text-xs ${getRiskBadgeColor(portfolio.riskScore)}`}>
                    {portfolio.riskScore.toFixed(0)}
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="text-small text-muted-foreground">Diversification</div>
                  <div className="text-body font-medium text-foreground">
                    {portfolio.diversificationScore.toFixed(0)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  <Target className="h-3 w-3 mr-1" />
                  Rebalance
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Analyze
                </Button>
              </div>

              {portfolio.description && (
                <p className="text-small text-muted-foreground pt-2">
                  {portfolio.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Empty State or Create New Card */}
        {portfolios.length === 0 && (
          <Card className="card-premium-elevated border-dashed border-2 hover:border-primary transition-colors cursor-pointer" 
                onClick={() => setShowCreateForm(true)}>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <PieChart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-body-large font-medium text-foreground mb-2">
                Create Your First Portfolio
              </h3>
              <p className="text-body text-muted-foreground text-center mb-4">
                Start tracking your investments with a professional portfolio management system
              </p>
              <Button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Portfolio
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Alerts Section */}
      {portfolios.some(p => p.riskScore > 80 || p.performanceScore < 30) && (
        <Card className="card-premium-elevated mt-10 border-gray-200 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-body-large text-gray-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Portfolio Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {portfolios.filter(p => p.riskScore > 80).map(portfolio => (
                <div key={portfolio.id} className="text-small text-gray-700">
                  • Portfolio "{portfolio.name}" has high risk score ({portfolio.riskScore.toFixed(0)})
                </div>
              ))}
              {portfolios.filter(p => p.performanceScore < 30).map(portfolio => (
                <div key={portfolio.id} className="text-small text-gray-700">
                  • Portfolio "{portfolio.name}" needs performance review ({portfolio.performanceScore.toFixed(0)}/100)
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
