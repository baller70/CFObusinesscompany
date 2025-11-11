
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { AddAssetDialog } from '@/components/personal/add-asset-dialog'
import { AddLiabilityDialog } from '@/components/personal/add-liability-dialog'

import { BackButton } from '@/components/ui/back-button'

export default function NetWorthPage() {
  const [data, setData] = useState({
    totalAssets: 0,
    totalLiabilities: 0,
    netWorth: 0,
    assets: [],
    liabilities: [],
    snapshots: []
  })
  
  const [assetDialogOpen, setAssetDialogOpen] = useState(false)
  const [liabilityDialogOpen, setLiabilityDialogOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/personal/net-worth')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching net worth:', error)
    }
  }

  return (
    <>
      <div className="space-y-6">
        <BackButton href="/dashboard/personal" />
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Net Worth Tracker</h1>
            <p className="text-muted-foreground">Track your assets and liabilities</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${data.totalAssets.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${data.totalLiabilities.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">${data.netWorth.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Assets</CardTitle>
                <Button size="sm" onClick={() => setAssetDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Asset
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {data.assets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No assets added yet.</p>
                  <p className="text-sm">Start tracking your assets to see your net worth grow!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.assets.map((asset: any) => (
                    <div key={asset.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <p className="text-sm text-muted-foreground">{asset.type}</p>
                      </div>
                      <p className="font-bold">${asset.value.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Liabilities</CardTitle>
                <Button size="sm" onClick={() => setLiabilityDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Liability
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {data.liabilities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No liabilities added yet.</p>
                  <p className="text-sm">Track your debts and obligations here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.liabilities.map((liability: any) => (
                    <div key={liability.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{liability.name}</p>
                        <p className="text-sm text-muted-foreground">{liability.type}</p>
                      </div>
                      <p className="font-bold text-red-600">${liability.balance.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AddAssetDialog
        open={assetDialogOpen}
        onOpenChange={setAssetDialogOpen}
        onSuccess={fetchData}
      />

      <AddLiabilityDialog
        open={liabilityDialogOpen}
        onOpenChange={setLiabilityDialogOpen}
        onSuccess={fetchData}
      />
    </>
  )
}
