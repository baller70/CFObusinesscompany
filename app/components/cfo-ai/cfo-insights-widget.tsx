
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Brain,
  DollarSign,
  Target,
  Zap,
  RefreshCw,
  MessageSquare
} from 'lucide-react'
import { CFOAnalysis, CFORecommendation, CFOInsight } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

interface CFOInsightsWidgetProps {
  onOpenChat: () => void
}

export function CFOInsightsWidget({ onOpenChat }: CFOInsightsWidgetProps) {
  const [analysis, setAnalysis] = useState<CFOAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadFinancialHealthAnalysis()
  }, [])

  const loadFinancialHealthAnalysis = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/cfo-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisType: 'FINANCIAL_HEALTH'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to load CFO analysis')
      }

      const data = await response.json()
      
      // Transform the response to match our interface
      const transformedAnalysis: CFOAnalysis = {
        id: `analysis_${Date.now()}`,
        userId: 'current_user',
        type: 'FINANCIAL_HEALTH',
        summary: data.summary,
        recommendations: data.recommendations.map((rec: any, index: number) => ({
          id: `rec_${index}`,
          ...rec,
          status: 'PENDING' as const
        })),
        insights: data.insights.map((insight: any, index: number) => ({
          id: `insight_${index}`,
          ...insight
        })),
        urgencyLevel: data.urgencyLevel,
        confidenceScore: data.confidenceScore,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      setAnalysis(transformedAnalysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis')
      toast({
        title: 'Analysis Failed',
        description: 'Unable to load CFO insights. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL': return 'bg-red-500'
      case 'HIGH': return 'bg-orange-500'
      case 'MEDIUM': return 'bg-blue-500'
      default: return 'bg-green-500'
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL': return <AlertTriangle className="h-4 w-4" />
      case 'HIGH': return <TrendingUp className="h-4 w-4" />
      case 'MEDIUM': return <Target className="h-4 w-4" />
      default: return <CheckCircle className="h-4 w-4" />
    }
  }

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'HIGH': return <Zap className="h-4 w-4 text-red-500" />
      case 'MEDIUM': return <TrendingUp className="h-4 w-4 text-orange-500" />
      default: return <Target className="h-4 w-4 text-blue-500" />
    }
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            CFO ANALYSIS ERROR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button onClick={loadFinancialHealthAnalysis} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Analysis
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="card-premium-elevated border-l-4 border-l-primary/50 relative overflow-hidden group">
      {/* Premium background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-50 group-hover:opacity-80 transition-opacity duration-500"></div>
      
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-subheading text-foreground">CFO AI INSIGHTS</h3>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-small text-muted-foreground">Active Analysis</span>
              </div>
            </div>
          </span>
          <div className="flex gap-2">
            <Button 
              onClick={onOpenChat} 
              className="btn-primary shadow-sm hover:shadow-md transition-all duration-200"
              size="sm"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Ask CFO
            </Button>
            <Button 
              onClick={loadFinancialHealthAnalysis} 
              variant="outline" 
              size="sm" 
              disabled={isLoading}
              className="hover:bg-primary/5 border-primary/20"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
        <CardDescription className="text-body text-muted-foreground">
          AI-powered financial insights and recommendations from your virtual CFO
        </CardDescription>
      </CardHeader>
      
      <CardContent className="relative z-10 space-premium-sm">
        {isLoading ? (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
              <Brain className="h-5 w-5 animate-pulse text-primary" />
              <span className="text-body text-foreground font-medium">Analyzing your financial data...</span>
            </div>
            <div className="space-y-2">
              <Progress value={66} className="h-3 bg-muted rounded-full" />
              <p className="text-small text-muted-foreground text-center">Processing financial patterns...</p>
            </div>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            {/* Premium Urgency Level & Confidence */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/50 to-transparent rounded-xl border border-border/50">
              <Badge className={`${getUrgencyColor(analysis.urgencyLevel)} text-white shadow-sm px-3 py-1.5 flex items-center gap-2`}>
                {getUrgencyIcon(analysis.urgencyLevel)}
                <span className="font-medium">{analysis.urgencyLevel} PRIORITY</span>
              </Badge>
              <div className="text-body text-muted-foreground font-medium">
                Confidence: {Math.round(analysis.confidenceScore * 100)}%
              </div>
            </div>

            {/* Premium Summary */}
            <div className="p-5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl border-l-4 border-l-primary shadow-sm">
              <p className="text-body font-medium text-foreground leading-relaxed">{analysis.summary}</p>
            </div>

            {/* Premium Key Insights */}
            <div>
              <h4 className="text-subheading text-foreground mb-4 flex items-center gap-2">
                <Zap className="h-4 w-4 text-warning" />
                Key Insights
              </h4>
              <div className="space-y-3">
                {analysis.insights.slice(0, 3).map((insight, index) => (
                  <div 
                    key={insight.id} 
                    className="flex items-start gap-3 p-4 bg-card/50 hover:bg-card border border-border/50 rounded-xl hover:shadow-sm transition-all duration-200 group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex-1">
                      <p className="text-body font-medium text-foreground group-hover:text-primary transition-colors">{insight.title}</p>
                      <p className="text-small text-muted-foreground leading-relaxed mt-1">{insight.description}</p>
                      {insight.trend && (
                        <div className="flex items-center gap-2 mt-2">
                          {insight.trend === 'UP' ? (
                            <TrendingUp className="h-4 w-4 text-success" />
                          ) : insight.trend === 'DOWN' ? (
                            <TrendingDown className="h-4 w-4 text-destructive" />
                          ) : null}
                          {insight.changePercentage && (
                            <span className={`text-small font-medium ${
                              insight.changePercentage > 0 ? 'text-success' : 'text-destructive'
                            }`}>
                              {insight.changePercentage > 0 ? '+' : ''}{insight.changePercentage}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Premium Priority Actions */}
            <div>
              <h4 className="text-subheading text-foreground mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Priority Actions
              </h4>
              <div className="space-y-3">
                {analysis.recommendations
                  .sort((a, b) => a.priority - b.priority)
                  .slice(0, 2)
                  .map((rec, index) => (
                  <div 
                    key={rec.id} 
                    className="flex items-start gap-3 p-4 bg-card/50 hover:bg-card border border-border/50 rounded-xl hover:shadow-sm transition-all duration-200 group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {getImpactIcon(rec.impact)}
                    <div className="flex-1">
                      <p className="text-body font-medium text-foreground group-hover:text-primary transition-colors">{rec.title}</p>
                      <p className="text-small text-muted-foreground leading-relaxed mt-1">{rec.description}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-small px-2 py-1 border-primary/20 text-primary">
                          {rec.timeframe}
                        </Badge>
                        {rec.potentialSavings && (
                          <span className="text-small text-success font-semibold bg-success/10 px-2 py-1 rounded-lg">
                            Save ${rec.potentialSavings.toLocaleString()}
                          </span>
                        )}
                        {rec.potentialRevenue && (
                          <span className="text-small text-primary font-semibold bg-primary/10 px-2 py-1 rounded-lg">
                            +${rec.potentialRevenue.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={onOpenChat} 
              className="w-full btn-primary shadow-md hover:shadow-lg transition-all duration-200 py-3"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Discuss with CFO AI
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
