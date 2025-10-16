
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'react-hot-toast'

interface EducationSavingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account?: any
  onSuccess: () => void
}

export function EducationSavingsDialog({ open, onOpenChange, account, onSuccess }: EducationSavingsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    beneficiaryName: '',
    accountType: 'PLAN_529',
    provider: '',
    accountNumber: '',
    currentBalance: '',
    targetAmount: '',
    targetDate: '',
    annualContribution: '',
    stateSponsored: false,
    notes: ''
  })

  useEffect(() => {
    if (account) {
      setFormData({
        beneficiaryName: account.beneficiaryName || '',
        accountType: account.accountType || 'PLAN_529',
        provider: account.provider || '',
        accountNumber: account.accountNumber || '',
        currentBalance: account.currentBalance?.toString() || '',
        targetAmount: account.targetAmount?.toString() || '',
        targetDate: account.targetDate ? new Date(account.targetDate).toISOString().split('T')[0] : '',
        annualContribution: account.annualContribution?.toString() || '',
        stateSponsored: account.stateSponsored || false,
        notes: account.notes || ''
      })
    } else {
      setFormData({
        beneficiaryName: '',
        accountType: 'PLAN_529',
        provider: '',
        accountNumber: '',
        currentBalance: '',
        targetAmount: '',
        targetDate: '',
        annualContribution: '',
        stateSponsored: false,
        notes: ''
      })
    }
  }, [account, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = '/api/personal/education-savings'
      const method = account ? 'PUT' : 'POST'
      const payload = account ? { ...formData, id: account.id } : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Failed to save education savings account')
      }

      toast.success(account ? 'Account updated successfully' : 'Account added successfully')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving account:', error)
      toast.error('Failed to save account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{account ? 'Edit' : 'Add'} Education Savings Account</DialogTitle>
          <DialogDescription>
            {account ? 'Update the details of this education savings account.' : 'Add a new education savings account.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="beneficiaryName">Beneficiary Name *</Label>
            <Input
              id="beneficiaryName"
              value={formData.beneficiaryName}
              onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value })}
              placeholder="e.g., John Doe Jr."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountType">Account Type *</Label>
            <Select
              value={formData.accountType}
              onValueChange={(value) => setFormData({ ...formData, accountType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLAN_529">529 Plan</SelectItem>
                <SelectItem value="COVERDELL_ESA">Coverdell ESA</SelectItem>
                <SelectItem value="UGMA_UTMA">UGMA/UTMA</SelectItem>
                <SelectItem value="ROTH_IRA">Roth IRA (Education)</SelectItem>
                <SelectItem value="SAVINGS_ACCOUNT">Savings Account</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Input
                id="provider"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                placeholder="e.g., Vanguard, Fidelity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="Last 4 digits"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentBalance">Current Balance *</Label>
              <Input
                id="currentBalance"
                type="number"
                step="0.01"
                value={formData.currentBalance}
                onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Target Amount</Label>
              <Input
                id="targetAmount"
                type="number"
                step="0.01"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetDate">Target Date</Label>
              <Input
                id="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annualContribution">Annual Contribution</Label>
              <Input
                id="annualContribution"
                type="number"
                step="0.01"
                value={formData.annualContribution}
                onChange={(e) => setFormData({ ...formData, annualContribution: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="stateSponsored"
              checked={formData.stateSponsored}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, stateSponsored: checked as boolean })
              }
            />
            <Label htmlFor="stateSponsored" className="cursor-pointer">
              State-Sponsored Plan
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Add any additional information..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : account ? 'Update Account' : 'Add Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
