
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Shield, Calendar, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface RetentionPolicy {
  id: string
  name: string
  retentionPolicyEnabled: boolean
  retentionPolicyYears: number | null
  retentionExpiry: string | null
  complianceCategory: string | null
}

interface DocumentRetentionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  documentName: string
}

export function DocumentRetentionDialog({ 
  open, 
  onOpenChange, 
  documentId, 
  documentName 
}: DocumentRetentionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [enabled, setEnabled] = useState(false)
  const [years, setYears] = useState<string>('7')
  const [category, setCategory] = useState<string>('TAX_RECORDS')

  useEffect(() => {
    if (open && documentId) {
      fetchRetentionPolicy()
    }
  }, [open, documentId])

  const fetchRetentionPolicy = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/documents/${documentId}/retention`)
      const data = await response.json()
      
      if (response.ok && data.retentionPolicy) {
        const policy = data.retentionPolicy
        setEnabled(policy.retentionPolicyEnabled || false)
        setYears(policy.retentionPolicyYears?.toString() || '7')
        setCategory(policy.complianceCategory || 'TAX_RECORDS')
      }
    } catch (error) {
      console.error('Error fetching retention policy:', error)
      toast.error('Failed to load retention policy')
    } finally {
      setLoading(false)
    }
  }

  const saveRetentionPolicy = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/documents/${documentId}/retention`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retentionPolicyEnabled: enabled,
          retentionPolicyYears: enabled ? parseInt(years) : null,
          complianceCategory: enabled ? category : null
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('Retention policy updated successfully')
        onOpenChange(false)
      } else {
        toast.error('Failed to update retention policy')
      }
    } catch (error) {
      console.error('Error saving retention policy:', error)
      toast.error('Failed to update retention policy')
    } finally {
      setSaving(false)
    }
  }

  const getExpiryDate = () => {
    if (!enabled || !years) return null
    const now = new Date()
    const expiry = new Date(now.getFullYear() + parseInt(years), now.getMonth(), now.getDate())
    return expiry
  }

  const expiryDate = getExpiryDate()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Retention Policy</DialogTitle>
          <DialogDescription>
            Configure document retention for "{documentName}"
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-6">
            {/* Enable/Disable Retention Policy */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enabled">Enable Retention Policy</Label>
                <p className="text-sm text-gray-500">
                  Automatically manage document lifecycle
                </p>
              </div>
              <Switch
                id="enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>

            {enabled && (
              <>
                {/* Compliance Category */}
                <div>
                  <Label htmlFor="category">Compliance Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TAX_RECORDS">Tax Records (7 years)</SelectItem>
                      <SelectItem value="PAYROLL">Payroll Records (7 years)</SelectItem>
                      <SelectItem value="CONTRACTS">Contracts (10 years)</SelectItem>
                      <SelectItem value="FINANCIAL_STATEMENTS">Financial Statements (7 years)</SelectItem>
                      <SelectItem value="EMPLOYEE_RECORDS">Employee Records (7 years)</SelectItem>
                      <SelectItem value="AUDIT_REPORTS">Audit Reports (7 years)</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select the compliance category for this document
                  </p>
                </div>

                {/* Retention Period */}
                <div>
                  <Label htmlFor="years">Retention Period (Years)</Label>
                  <Input
                    id="years"
                    type="number"
                    min="1"
                    max="50"
                    value={years}
                    onChange={(e) => setYears(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How long to retain this document
                  </p>
                </div>

                {/* Expiry Information */}
                {expiryDate && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-900">Retention Expiry</p>
                        <p className="text-sm text-blue-700">
                          {format(expiryDate, 'MMMM d, yyyy')}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Document will be flagged for archival or deletion after this date
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Warning */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900">Important</p>
                      <p className="text-xs text-amber-700">
                        Ensure retention policies comply with your local regulations and industry standards
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={saveRetentionPolicy}
                disabled={saving}
                className="flex-1"
              >
                <Shield className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Policy'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
