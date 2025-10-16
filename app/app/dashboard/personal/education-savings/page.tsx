
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Plus, TrendingUp, Edit, Trash2, Target, Calendar } from 'lucide-react'
import { EducationSavingsDialog } from '@/components/education-savings-dialog'
import { toast } from 'react-hot-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Progress } from '@/components/ui/progress'

export default function EducationSavingsPage() {
  const [accounts, setAccounts] = useState([])
  const [totalSavings, setTotalSavings] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<any>(null)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/personal/education-savings')
      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts || [])
        setTotalSavings(data.totalSavings || 0)
      }
    } catch (error) {
      console.error('Error fetching education savings:', error)
      toast.error('Failed to load education savings')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (account: any) => {
    setSelectedAccount(account)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setSelectedAccount(null)
    setDialogOpen(true)
  }

  const handleDeleteClick = (account: any) => {
    setAccountToDelete(account)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return

    try {
      const response = await fetch(`/api/personal/education-savings?id=${accountToDelete.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete account')
      }

      toast.success('Account deleted successfully')
      fetchAccounts()
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account')
    } finally {
      setDeleteDialogOpen(false)
      setAccountToDelete(null)
    }
  }

  const getAccountTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'PLAN_529': '529 Plan',
      'COVERDELL_ESA': 'Coverdell ESA',
      'UGMA_UTMA': 'UGMA/UTMA',
      'ROTH_IRA': 'Roth IRA',
      'SAVINGS_ACCOUNT': 'Savings Account',
      'OTHER': 'Other'
    }
    return labels[type] || type
  }

  const calculateProgress = (current: number, target: number) => {
    if (!target || target === 0) return 0
    return Math.min((current / target) * 100, 100)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Education Savings</h1>
          <p className="text-muted-foreground">Plan and save for education expenses</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Target</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ${accounts.reduce((sum, acc: any) => sum + (acc.targetAmount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Education Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No education accounts added yet</p>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Account
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account: any) => {
                const progress = account.targetAmount 
                  ? calculateProgress(account.currentBalance, account.targetAmount)
                  : 0
                
                return (
                  <div key={account.id} className="p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-lg">{account.beneficiaryName}</p>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {getAccountTypeLabel(account.accountType)}
                          </span>
                          {account.stateSponsored && (
                            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                              State-Sponsored
                            </span>
                          )}
                        </div>
                        {account.provider && (
                          <p className="text-sm text-muted-foreground">
                            Provider: {account.provider}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            ${account.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          {account.targetAmount && (
                            <p className="text-xs text-muted-foreground">
                              of ${account.targetAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} goal
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(account)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(account)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {account.targetAmount && (
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-muted-foreground">Progress to Goal</span>
                          <span className="text-xs font-medium">{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {account.annualContribution && (
                        <div>
                          <p className="text-muted-foreground">Annual Contribution</p>
                          <p className="font-medium">
                            ${account.annualContribution.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                      {account.targetDate && (
                        <div>
                          <p className="text-muted-foreground">Target Date</p>
                          <p className="font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(account.targetDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {account.notes && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground">{account.notes}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <EducationSavingsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        account={selectedAccount}
        onSuccess={fetchAccounts}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Education Savings Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the education savings account for {accountToDelete?.beneficiaryName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
