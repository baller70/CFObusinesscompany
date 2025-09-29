
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
      case 'MEDIUM': return 'bg-yellow-500'
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
            CFO Analysis Error
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
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            CFO AI Insights
          </span>
          <div className="flex gap-2">
            <Button onClick={onOpenChat} variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Ask CFO
            </Button>
            <Button onClick={loadFinancialHealthAnalysis} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          AI-powered financial insights and recommendations from your virtual CFO
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 animate-pulse text-blue-500" />
              <span className="text-sm">Analyzing your financial data...</span>
            </div>
            <Progress value={66} className="h-2" />
          </div>
        ) : analysis ? (
          <div className="space-y-4">
            {/* Urgency Level & Confidence */}
            <div className="flex items-center justify-between">
              <Badge className={`${getUrgencyColor(analysis.urgencyLevel)} text-white`}>
                {getUrgencyIcon(analysis.urgencyLevel)}
                <span className="ml-1">{analysis.urgencyLevel}</span>
              </Badge>
              <div className="text-sm text-gray-500">
                Confidence: {Math.round(analysis.confidenceScore * 100)}%
              </div>
            </div>

            {/* Summary */}
            <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm font-medium text-blue-900">{analysis.summary}</p>
            </div>

            {/* Top Insights */}
            <div>
              <h4 className="font-semibold text-sm text-gray-900 mb-2">Key Insights</h4>
              <div className="space-y-2">
                {analysis.insights.slice(0, 3).map((insight) => (
                  <div key={insight.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{insight.title}</p>
                      <p className="text-xs text-gray-600">{insight.description}</p>
                      {insight.trend && (
                        <div className="flex items-center gap-1 mt-1">
                          {insight.trend === 'UP' ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : insight.trend === 'DOWN' ? (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          ) : null}
                          {insight.changePercentage && (
                            <span className="text-xs text-gray-500">
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

            {/* Top Recommendations */}
            <div>
              <h4 className="font-semibold text-sm text-gray-900 mb-2">Priority Actions</h4>
              <div className="space-y-2">
                {analysis.recommendations
                  .sort((a, b) => a.priority - b.priority)
                  .slice(0, 2)
                  .map((rec) => (
                  <div key={rec.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                    {getImpactIcon(rec.impact)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{rec.title}</p>
                      <p className="text-xs text-gray-600">{rec.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {rec.timeframe}
                        </Badge>
                        {rec.potentialSavings && (
                          <span className="text-xs text-green-600 font-medium">
                            Save ${rec.potentialSavings.toLocaleString()}
                          </span>
                        )}
                        {rec.potentialRevenue && (
                          <span className="text-xs text-blue-600 font-medium">
                            +${rec.potentialRevenue.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={onOpenChat} className="w-full" variant="outline">
              <MessageSquare className="h-4 w-4 mr-2" />
              Discuss with CFO AI
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
