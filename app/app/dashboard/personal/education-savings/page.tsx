
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Plus, TrendingUp } from 'lucide-react'

export default function EducationSavingsPage() {
  const [accounts, setAccounts] = useState([])
  const [totalSavings, setTotalSavings] = useState(0)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/personal/education-savings')
      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts || [])
        setTotalSavings(data.totalSavings || 0)
      }
    } catch (error) {
      console.error('Error fetching education savings:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Education Savings</h1>
          <p className="text-muted-foreground">Save for education expenses</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Education Savings</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">${totalSavings.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Education Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No education accounts added yet</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Account
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account: any) => (
                <div key={account.id} className="p-4 border rounded-lg hover:bg-accent">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{account.beneficiaryName}</p>
                      <p className="text-sm text-muted-foreground">{account.accountType}</p>
                      {account.provider && (
                        <p className="text-xs text-muted-foreground">Provider: {account.provider}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">${account.currentBalance.toLocaleString()}</p>
                      {account.targetAmount && (
                        <p className="text-xs text-muted-foreground">
                          Goal: ${account.targetAmount.toLocaleString()}
                        </p>
                      )}
                    </div>
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
