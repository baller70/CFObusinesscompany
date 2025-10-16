
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Plus, User, Trash2, Loader2, LineChart } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function CreditScorePage() {
  const [scores, setScores] = useState<any[]>([])
  const [scoresByPerson, setScoresByPerson] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newScore, setNewScore] = useState({
    personName: '',
    score: '',
    scoreDate: new Date().toISOString().split('T')[0],
    accounts: '',
    inquiries: '',
    creditUtilization: '',
    totalDebt: ''
  })

  useEffect(() => {
    fetchScores()
  }, [])

  const fetchScores = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/credit-scores')
      if (response.ok) {
        const data = await response.json()
        setScores(data.scores || [])
        setScoresByPerson(data.scoresByPerson || [])
      }
    } catch (error) {
      console.error('Error fetching credit scores:', error)
      toast.error('Failed to load credit scores')
    } finally {
      setLoading(false)
    }
  }

  const addScore = async () => {
    if (!newScore.personName || !newScore.score) {
      toast.error('Please fill in required fields')
      return
    }

    try {
      const response = await fetch('/api/credit-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: newScore.personName,
          score: newScore.score,
          scoreDate: newScore.scoreDate,
          accounts: newScore.accounts || null,
          inquiries: newScore.inquiries || null,
          creditUtilization: newScore.creditUtilization || null,
          totalDebt: newScore.totalDebt || null
        })
      })

      if (response.ok) {
        toast.success('Credit score added successfully')
        setShowAddDialog(false)
        setNewScore({
          personName: '',
          score: '',
          scoreDate: new Date().toISOString().split('T')[0],
          accounts: '',
          inquiries: '',
          creditUtilization: '',
          totalDebt: ''
        })
        fetchScores()
      } else {
        toast.error('Failed to add credit score')
      }
    } catch (error) {
      console.error('Error adding credit score:', error)
      toast.error('Failed to add credit score')
    }
  }

  const deleteScore = async (id: string) => {
    try {
      const response = await fetch(`/api/credit-scores/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Credit score removed successfully')
        fetchScores()
      } else {
        toast.error('Failed to remove credit score')
      }
    } catch (error) {
      console.error('Error removing credit score:', error)
      toast.error('Failed to remove credit score')
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 750) return 'text-green-600'
    if (score >= 700) return 'text-blue-600'
    if (score >= 650) return 'text-yellow-600'
    if (score >= 600) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 750) return 'bg-green-50'
    if (score >= 700) return 'bg-blue-50'
    if (score >= 650) return 'bg-yellow-50'
    if (score >= 600) return 'bg-orange-50'
    return 'bg-red-50'
  }

  const getScoreRating = (score: number) => {
    if (score >= 750) return 'Excellent'
    if (score >= 700) return 'Good'
    if (score >= 650) return 'Fair'
    if (score >= 600) return 'Poor'
    return 'Very Poor'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Credit Score Monitoring</h1>
          <p className="text-gray-600 mt-1">Track credit scores for multiple people</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Score
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Credit Score</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="personName">Person Name *</Label>
                <Input
                  id="personName"
                  placeholder="e.g., John Doe or Personal"
                  value={newScore.personName}
                  onChange={(e) => setNewScore({ ...newScore, personName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="score">Credit Score *</Label>
                  <Input
                    id="score"
                    type="number"
                    min="300"
                    max="850"
                    placeholder="e.g., 720"
                    value={newScore.score}
                    onChange={(e) => setNewScore({ ...newScore, score: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="scoreDate">Score Date</Label>
                  <Input
                    id="scoreDate"
                    type="date"
                    value={newScore.scoreDate}
                    onChange={(e) => setNewScore({ ...newScore, scoreDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-3">Optional Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="accounts">Number of Accounts</Label>
                    <Input
                      id="accounts"
                      type="number"
                      placeholder="e.g., 10"
                      value={newScore.accounts}
                      onChange={(e) => setNewScore({ ...newScore, accounts: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="inquiries">Recent Inquiries</Label>
                    <Input
                      id="inquiries"
                      type="number"
                      placeholder="e.g., 2"
                      value={newScore.inquiries}
                      onChange={(e) => setNewScore({ ...newScore, inquiries: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="grid gap-2">
                    <Label htmlFor="creditUtilization">Credit Utilization (%)</Label>
                    <Input
                      id="creditUtilization"
                      type="number"
                      step="0.1"
                      placeholder="e.g., 30"
                      value={newScore.creditUtilization}
                      onChange={(e) => setNewScore({ ...newScore, creditUtilization: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="totalDebt">Total Debt</Label>
                    <Input
                      id="totalDebt"
                      type="number"
                      placeholder="e.g., 5000"
                      value={newScore.totalDebt}
                      onChange={(e) => setNewScore({ ...newScore, totalDebt: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addScore}>Add Score</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : scoresByPerson.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <LineChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Credit Scores Tracked</h3>
              <p className="text-gray-600 mb-4">Start tracking credit scores for yourself and others</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Score
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scoresByPerson.map((person: any) => (
            <Card key={person.name} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-gray-500" />
                    <CardTitle className="text-lg">{person.name}</CardTitle>
                  </div>
                  {person.scores.length > 1 && (
                    <div className="flex items-center text-sm text-gray-500">
                      <LineChart className="h-4 w-4 mr-1" />
                      {person.scores.length} records
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {person.latestScore && (
                  <div className={`text-center p-6 rounded-lg mb-4 ${getScoreBgColor(person.latestScore.score)}`}>
                    <div className={`text-5xl font-bold ${getScoreColor(person.latestScore.score)}`}>
                      {person.latestScore.score}
                    </div>
                    <p className="text-lg font-medium mt-2">{getScoreRating(person.latestScore.score)}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(person.latestScore.scoreDate).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {person.latestScore?.accounts && (
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    {person.latestScore.accounts && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-gray-600">Accounts</div>
                        <div className="font-semibold">{person.latestScore.accounts}</div>
                      </div>
                    )}
                    {person.latestScore.inquiries !== null && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-gray-600">Inquiries</div>
                        <div className="font-semibold">{person.latestScore.inquiries}</div>
                      </div>
                    )}
                    {person.latestScore.creditUtilization !== null && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-gray-600">Utilization</div>
                        <div className="font-semibold">{person.latestScore.creditUtilization}%</div>
                      </div>
                    )}
                    {person.latestScore.totalDebt !== null && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-gray-600">Total Debt</div>
                        <div className="font-semibold">${person.latestScore.totalDebt?.toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                )}

                {person.scores.length > 1 && (
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">History</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {person.scores.slice(0, 5).map((score: any, index: number) => (
                        <div key={score.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                          <span className="text-gray-600">
                            {new Date(score.scoreDate).toLocaleDateString()}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className={`font-bold ${getScoreColor(score.score)}`}>
                              {score.score}
                            </span>
                            {index < person.scores.length - 1 && (
                              score.score > person.scores[index + 1].score ? (
                                <TrendingUp className="h-3 w-3 text-green-600" />
                              ) : score.score < person.scores[index + 1].score ? (
                                <TrendingDown className="h-3 w-3 text-red-600" />
                              ) : null
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this score?')) {
                                  deleteScore(score.id)
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
