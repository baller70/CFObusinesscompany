
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, DollarSign, TrendingUp, AlertCircle, BookOpen, Loader2, FileText, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Recommendation {
  category: string
  title: string
  description: string
  potentialSavings: number
  eligibility: string
  requirements: string[]
  ircSection: string
  deadline?: string
  actionItems: string[]
}

interface LegalLoophole {
  title: string
  description: string
  potentialSavings: number
  complexity: string
  requirements: string[]
  risks: string[]
  professionalAdvice: string
}

interface AnalysisResult {
  recommendations: Recommendation[]
  legalLoopholes: LegalLoophole[]
  estimatedTotalSavings: number
  priorityActions: string[]
}

export default function TaxBreaksPage() {
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [financialData, setFinancialData] = useState<any>(null)

  useEffect(() => {
    fetchFinancialData()
  }, [])

  const fetchFinancialData = async () => {
    try {
      const response = await fetch('/api/personal/tax-breaks')
      if (response.ok) {
        const data = await response.json()
        setFinancialData(data.financialData)
      }
    } catch (error) {
      console.error('Error fetching financial data:', error)
    }
  }

  const runAnalysis = async () => {
    if (!financialData) {
      setError('Financial data not available. Please ensure you have transactions and data in your account.')
      return
    }

    setAnalyzing(true)
    setProgress(0)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/personal/tax-breaks/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ financialData }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze tax breaks')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let partialRead = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        partialRead += decoder.decode(value, { stream: true })
        let lines = partialRead.split('\n')
        partialRead = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              return
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.status === 'processing') {
                setProgress(prev => Math.min(prev + 1, 99))
              } else if (parsed.status === 'completed') {
                setResult(parsed.result)
                setProgress(100)
                setAnalyzing(false)
                return
              } else if (parsed.status === 'error') {
                throw new Error(parsed.message || 'Analysis failed')
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error analyzing tax breaks:', error)
      setError(error.message || 'Failed to analyze tax breaks')
      setAnalyzing(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      'Retirement': TrendingUp,
      'Healthcare': AlertCircle,
      'Education': BookOpen,
      'Charitable': CheckCircle,
      'Home': FileText,
      'Business': DollarSign,
    }
    const Icon = icons[category] || DollarSign
    return <Icon className="h-5 w-5" />
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Retirement': 'text-blue-600 bg-blue-50',
      'Healthcare': 'text-red-600 bg-red-50',
      'Education': 'text-green-600 bg-green-50',
      'Charitable': 'text-purple-600 bg-purple-50',
      'Home': 'text-orange-600 bg-orange-50',
      'Business': 'text-indigo-600 bg-indigo-50',
    }
    return colors[category] || 'text-gray-600 bg-gray-50'
  }

  const getComplexityColor = (complexity: string) => {
    const colors: Record<string, string> = {
      'Low': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-red-100 text-red-800',
    }
    return colors[complexity] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tax Breaks & Opportunities</h1>
        <p className="text-muted-foreground">
          AI-powered tax optimization based on your financial data
        </p>
      </div>

      {financialData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Annual Income</p>
                <p className="text-lg font-bold">${financialData.income.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Charitable Giving</p>
                <p className="text-lg font-bold">${financialData.charitableDonations.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Healthcare Expenses</p>
                <p className="text-lg font-bold">${financialData.healthcareExpenses.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Retirement Contributions</p>
                <p className="text-lg font-bold">${financialData.retirementContributions.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!result && (
        <Card>
          <CardHeader>
            <CardTitle>AI Tax Analysis</CardTitle>
            <CardDescription>
              Our AI will analyze your financial data and recommend personalized tax breaks, credits, and legal strategies to minimize your tax liability.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runAnalysis} 
              disabled={analyzing || !financialData}
              size="lg"
              className="w-full"
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing... {progress}%
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze My Tax Situation
                </>
              )}
            </Button>
            {!financialData && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Add financial data to enable AI analysis
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Potential Tax Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600 mb-4">
                ${result.estimatedTotalSavings.toLocaleString()}
              </div>
              <div className="space-y-2">
                <p className="font-medium">Priority Actions:</p>
                <ul className="list-disc list-inside space-y-1">
                  {result.priorityActions.map((action, index) => (
                    <li key={index} className="text-sm text-muted-foreground">{action}</li>
                  ))}
                </ul>
              </div>
              <Button 
                onClick={runAnalysis} 
                variant="outline" 
                className="mt-4"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Refresh Analysis
              </Button>
            </CardContent>
          </Card>

          <Tabs defaultValue="recommendations" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recommendations">
                Tax Breaks & Deductions ({result.recommendations.length})
              </TabsTrigger>
              <TabsTrigger value="loopholes">
                Legal Strategies ({result.legalLoopholes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recommendations" className="space-y-4">
              {result.recommendations.map((rec, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getCategoryColor(rec.category)}`}>
                          {getCategoryIcon(rec.category)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{rec.title}</CardTitle>
                            <Badge variant="outline">{rec.category}</Badge>
                          </div>
                          {rec.ircSection && (
                            <p className="text-xs text-muted-foreground">{rec.ircSection}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Potential Savings</p>
                        <p className="text-xl font-bold text-green-600">
                          ${rec.potentialSavings.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm">{rec.description}</p>
                    </div>

                    <div>
                      <p className="font-medium text-sm mb-1">Eligibility:</p>
                      <p className="text-sm text-muted-foreground">{rec.eligibility}</p>
                    </div>

                    {rec.requirements.length > 0 && (
                      <div>
                        <p className="font-medium text-sm mb-2">Requirements:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {rec.requirements.map((req, i) => (
                            <li key={i} className="text-sm text-muted-foreground">{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {rec.actionItems.length > 0 && (
                      <div>
                        <p className="font-medium text-sm mb-2">Action Items:</p>
                        <ul className="space-y-1">
                          {rec.actionItems.map((action, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {rec.deadline && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Deadline:</strong> {rec.deadline}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="loopholes" className="space-y-4">
              {result.legalLoopholes.map((loophole, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{loophole.title}</CardTitle>
                          <Badge className={getComplexityColor(loophole.complexity)}>
                            {loophole.complexity} Complexity
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Potential Savings</p>
                        <p className="text-xl font-bold text-green-600">
                          ${loophole.potentialSavings.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm">{loophole.description}</p>
                    </div>

                    {loophole.requirements.length > 0 && (
                      <div>
                        <p className="font-medium text-sm mb-2">Requirements:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {loophole.requirements.map((req, i) => (
                            <li key={i} className="text-sm text-muted-foreground">{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {loophole.risks.length > 0 && (
                      <div>
                        <p className="font-medium text-sm mb-2 text-red-600">Risks to Consider:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {loophole.risks.map((risk, i) => (
                            <li key={i} className="text-sm text-muted-foreground">{risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Professional Advice:</strong> {loophole.professionalAdvice}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Disclaimer:</strong> This analysis is for informational purposes only and does not constitute professional tax advice. Please consult with a qualified tax professional or CPA before implementing any tax strategies.
        </AlertDescription>
      </Alert>
    </div>
  )
}
