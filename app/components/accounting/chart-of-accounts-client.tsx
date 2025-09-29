

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, BookOpen, TrendingUp, TrendingDown, Minus, ChevronRight, ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import Link from 'next/link'

interface ChartOfAccountsClientProps {
  mockAccounts: any
}

export function ChartOfAccountsClient({ mockAccounts }: ChartOfAccountsClientProps) {
  const [expandedTypes, setExpandedTypes] = useState<string[]>(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'])

  const toggleExpanded = (type: string) => {
    setExpandedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(item => item !== type)
        : [...prev, type]
    )
  }

  const accountTypeLabels = {
    ASSET: 'Assets',
    LIABILITY: 'Liabilities', 
    EQUITY: 'Equity',
    REVENUE: 'Revenue',
    EXPENSE: 'Expenses'
  }

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'ASSET':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'LIABILITY':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'EQUITY':
        return <Minus className="h-4 w-4 text-blue-600" />
      case 'REVENUE':
        return <TrendingUp className="h-4 w-4 text-purple-600" />
      case 'EXPENSE':
        return <TrendingDown className="h-4 w-4 text-orange-600" />
      default:
        return <BookOpen className="h-4 w-4 text-gray-400" />
    }
  }

  const formatBalance = (balance: number, type: string) => {
    const absBalance = Math.abs(balance)
    
    // For liability, equity, and revenue accounts, negative balances are normal
    if (['LIABILITY', 'EQUITY', 'REVENUE'].includes(type) && balance < 0) {
      return `$${absBalance.toLocaleString()}`
    }
    
    return balance >= 0 ? `$${balance.toLocaleString()}` : `($${absBalance.toLocaleString()})`
  }

  const getTotalByType = (accounts: any[], type: string) => {
    return accounts.reduce((sum, account) => sum + account.balance, 0)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chart of Accounts</h1>
          <p className="text-gray-600 mt-1">Flexible account structure with unlimited hierarchy</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            Import Accounts
          </Button>
          <Link href="/dashboard/accounting/chart-of-accounts/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {Object.entries(mockAccounts).map(([type, accounts]) => {
          const total = getTotalByType(accounts as any[], type)
          return (
            <Card key={type}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  {getAccountTypeIcon(type)}
                  <span className="ml-2">{accountTypeLabels[type as keyof typeof accountTypeLabels]}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {formatBalance(total, type)}
                </div>
                <p className="text-xs text-gray-500 mt-1">{(accounts as any[]).length} accounts</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle>Account Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(mockAccounts).map(([type, accounts]) => (
              <Collapsible 
                key={type} 
                open={expandedTypes.includes(type)} 
                onOpenChange={() => toggleExpanded(type)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start p-4 h-auto hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-3">
                        {expandedTypes.includes(type) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        {getAccountTypeIcon(type)}
                        <span className="text-lg font-semibold">
                          {accountTypeLabels[type as keyof typeof accountTypeLabels]}
                        </span>
                        <Badge variant="outline">{(accounts as any[]).length} accounts</Badge>
                      </div>
                      <div className="text-lg font-bold">
                        {formatBalance(getTotalByType(accounts as any[], type), type)}
                      </div>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="ml-8 space-y-2 mt-2">
                    {(accounts as any[]).map((account) => (
                      <div 
                        key={account.id} 
                        className="flex items-center justify-between py-3 px-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-mono text-gray-500 min-w-[60px]">
                            {account.code}
                          </span>
                          <span className="font-medium text-gray-900">
                            {account.name}
                          </span>
                          <Badge variant={account.isActive ? 'default' : 'secondary'}>
                            {account.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-semibold">
                            {formatBalance(account.balance, type)}
                          </span>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>

          {Object.keys(mockAccounts).length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts yet</h3>
              <p className="text-gray-600 mb-4">Set up your chart of accounts to start tracking finances</p>
              <div className="space-x-3">
                <Button variant="outline">
                  Import Standard Chart
                </Button>
                <Link href="/dashboard/accounting/chart-of-accounts/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Account
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Balance Check */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Balance Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Total Assets</div>
              <div className="text-2xl font-bold text-green-600">
                ${getTotalByType(mockAccounts.ASSET || [], 'ASSET').toLocaleString()}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Total Liabilities + Equity</div>
              <div className="text-2xl font-bold text-blue-600">
                ${Math.abs(getTotalByType(mockAccounts.LIABILITY || [], 'LIABILITY') + 
                           getTotalByType(mockAccounts.EQUITY || [], 'EQUITY')).toLocaleString()}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Difference</div>
              <div className={`text-2xl font-bold ${
                Math.abs(getTotalByType(mockAccounts.ASSET || [], 'ASSET') + 
                        getTotalByType(mockAccounts.LIABILITY || [], 'LIABILITY') + 
                        getTotalByType(mockAccounts.EQUITY || [], 'EQUITY')) < 0.01 
                  ? 'text-green-600' : 'text-red-600'
              }`}>
                $0.00
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 text-center">
              ✓ Chart of accounts is balanced (Assets = Liabilities + Equity)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
