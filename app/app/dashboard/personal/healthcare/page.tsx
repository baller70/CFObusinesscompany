
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/ui/back-button'
import { Heart, Plus, DollarSign } from 'lucide-react'

export default function HealthcarePage() {
  const [expenses, setExpenses] = useState([])
  const [totalExpenses, setTotalExpenses] = useState(0)

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/personal/healthcare')
      if (response.ok) {
        const data = await response.json()
        setExpenses(data.expenses || [])
        setTotalExpenses(data.totalExpenses || 0)
      }
    } catch (error) {
      console.error('Error fetching healthcare expenses:', error)
    }
  }

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard/personal" />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Healthcare Expenses</h1>
          <p className="text-muted-foreground">Track your medical expenses</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Healthcare Expenses ({new Date().getFullYear()})</CardTitle>
          <DollarSign className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">-${totalExpenses.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Healthcare Expense History</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No healthcare expenses recorded yet</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Expense
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense: any) => (
                <div key={expense.id} className="flex justify-between items-start p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{expense.provider}</p>
                    <p className="text-sm text-muted-foreground">{expense.type}</p>
                    <p className="text-xs text-muted-foreground">{new Date(expense.date).toLocaleDateString()}</p>
                    {expense.hsaEligible && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded mt-1 inline-block">
                        HSA Eligible
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${expense.amount.toLocaleString()}</p>
                    <p className="text-sm text-green-600">Out of Pocket: ${expense.outOfPocket.toLocaleString()}</p>
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
