
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Plus } from 'lucide-react'

export default function CreditScorePage() {
  const [scores, setScores] = useState([])
  const [currentScore, setCurrentScore] = useState({ score: 0, provider: '', scoreDate: new Date() })

  useEffect(() => {
    fetchScores()
  }, [])

  const fetchScores = async () => {
    try {
      const response = await fetch('/api/personal/credit-score')
      if (response.ok) {
        const data = await response.json()
        setScores(data.scores || [])
        if (data.scores?.length > 0) {
          setCurrentScore(data.scores[0])
        }
      }
    } catch (error) {
      console.error('Error fetching credit scores:', error)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 750) return 'text-green-600'
    if (score >= 650) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreRating = (score: number) => {
    if (score >= 750) return 'Excellent'
    if (score >= 700) return 'Good'
    if (score >= 650) return 'Fair'
    return 'Poor'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Credit Score Monitoring</h1>
          <p className="text-muted-foreground">Track your credit health</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Score
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Credit Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className={`text-6xl font-bold ${getScoreColor(currentScore.score)}`}>
                {currentScore.score || '---'}
              </div>
              <p className="text-xl font-medium mt-2">{getScoreRating(currentScore.score)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {currentScore.provider} • {new Date(currentScore.scoreDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credit Score History</CardTitle>
        </CardHeader>
        <CardContent>
          {scores.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No credit score history yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {scores.map((score: any, index: number) => (
                <div key={score.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{score.provider}</p>
                    <p className="text-sm text-muted-foreground">{new Date(score.scoreDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className={`text-2xl font-bold ${getScoreColor(score.score)}`}>
                      {score.score}
                    </span>
                    {index > 0 && scores[index - 1] && (
                      score.score > (scores[index - 1] as any).score ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
