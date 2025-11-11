
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/ui/back-button'
import { Shield, Plus, AlertCircle } from 'lucide-react'

export default function InsurancePage() {
  const [policies, setPolicies] = useState([])

  useEffect(() => {
    fetchPolicies()
  }, [])

  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/personal/insurance')
      if (response.ok) {
        const data = await response.json()
        setPolicies(data.policies || [])
      }
    } catch (error) {
      console.error('Error fetching insurance:', error)
    }
  }

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard/personal" />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Insurance Policies</h1>
          <p className="text-muted-foreground">Manage all your insurance policies</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Policy
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Insurance Policies</CardTitle>
        </CardHeader>
        <CardContent>
          {policies.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No insurance policies added yet</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Policy
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {policies.map((policy: any) => (
                <div key={policy.id} className="p-4 border rounded-lg hover:bg-accent">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{policy.policyType}</p>
                      <p className="text-sm text-muted-foreground">{policy.provider}</p>
                      <p className="text-xs text-muted-foreground">Policy #{policy.policyNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${policy.premium?.toLocaleString()}/mo</p>
                      {policy.renewalDate && (
                        <p className="text-xs text-muted-foreground">
                          Renews: {new Date(policy.renewalDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {policy.coverageAmount && (
                    <p className="text-sm text-green-600">Coverage: ${policy.coverageAmount.toLocaleString()}</p>
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
