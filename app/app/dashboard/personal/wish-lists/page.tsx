
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Plus, ShoppingBag } from 'lucide-react'

export default function WishListsPage() {
  const [wishLists, setWishLists] = useState([])

  useEffect(() => {
    fetchWishLists()
  }, [])

  const fetchWishLists = async () => {
    try {
      const response = await fetch('/api/personal/wish-lists')
      if (response.ok) {
        const data = await response.json()
        setWishLists(data.wishLists || [])
      }
    } catch (error) {
      console.error('Error fetching wish lists:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Wish Lists</h1>
          <p className="text-muted-foreground">Plan your future purchases</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create List
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Wish Lists</CardTitle>
        </CardHeader>
        <CardContent>
          {wishLists.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No wish lists created yet</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First List
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wishLists.map((list: any) => (
                <div key={list.id} className="p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        {list.name}
                      </p>
                      {list.description && (
                        <p className="text-sm text-muted-foreground mt-1">{list.description}</p>
                      )}
                    </div>
                  </div>
                  {list.targetAmount && (
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>${list.savedAmount?.toLocaleString()} / ${list.targetAmount.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${Math.min((list.savedAmount / list.targetAmount) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
