
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Globe, Plus, TrendingUp, TrendingDown, RefreshCw, DollarSign, AlertTriangle } from 'lucide-react'

export default function MultiCurrencyPage() {
  const { data: session } = useSession() || {}
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Multi-Currency Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage multiple currencies and exchange rates
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Update Rates
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Currency
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Currencies</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">USD (Base)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value (USD)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">Across all currencies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exchange Gain/Loss</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Updates</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Auto</div>
            <p className="text-xs text-muted-foreground">Daily updates</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="currencies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="currencies">Active Currencies</TabsTrigger>
          <TabsTrigger value="rates">Exchange Rates</TabsTrigger>
          <TabsTrigger value="transactions">FX Transactions</TabsTrigger>
          <TabsTrigger value="exposure">Currency Exposure</TabsTrigger>
        </TabsList>

        <TabsContent value="currencies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Currencies</CardTitle>
              <CardDescription>
                Currencies currently in use in your accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Base Currency Card */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">USD - United States Dollar</p>
                        <p className="text-sm text-muted-foreground">Base Currency</p>
                      </div>
                    </div>
                    <Badge>Base</Badge>
                  </div>
                </div>

                {/* Empty State */}
                <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg">
                  <Globe className="h-10 w-10 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-semibold mb-2">Add More Currencies</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    Track accounts and transactions in multiple currencies
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Currency
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exchange Rates</CardTitle>
              <CardDescription>
                Current exchange rates against your base currency (USD)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <RefreshCw className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Additional Currencies</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Add more currencies to see real-time exchange rates
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Currency
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Foreign Exchange Transactions</CardTitle>
              <CardDescription>
                History of currency conversions and exchanges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No FX Transactions</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Record currency exchange transactions to track gains and losses
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Record FX Transaction
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exposure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Currency Exposure Analysis</CardTitle>
              <CardDescription>
                Breakdown of assets and liabilities by currency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Exposure Data</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Currency exposure analysis will appear when you have multi-currency accounts
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
