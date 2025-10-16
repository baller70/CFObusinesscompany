
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Share2, Copy, ExternalLink, Clock, Download } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface Share {
  id: string
  shareToken: string
  shareUrl: string
  expiresAt: string | null
  maxDownloads: number | null
  downloadCount: number
  isActive: boolean
  createdAt: string
}

interface DocumentShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  documentName: string
}

export function DocumentShareDialog({ 
  open, 
  onOpenChange, 
  documentId, 
  documentName 
}: DocumentShareDialogProps) {
  const [shares, setShares] = useState<Share[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  
  // New share form
  const [expiresIn, setExpiresIn] = useState<string>('7days')
  const [maxDownloads, setMaxDownloads] = useState<string>('')
  const [sharedWith, setSharedWith] = useState<string>('')

  useEffect(() => {
    if (open && documentId) {
      fetchShares()
    }
  }, [open, documentId])

  const fetchShares = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/documents/${documentId}/share`)
      const data = await response.json()
      
      if (response.ok) {
        setShares(data.shares)
      } else {
        toast.error('Failed to load shares')
      }
    } catch (error) {
      console.error('Error fetching shares:', error)
      toast.error('Failed to load shares')
    } finally {
      setLoading(false)
    }
  }

  const createShare = async () => {
    setCreating(true)
    try {
      const response = await fetch(`/api/documents/${documentId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expiresIn,
          maxDownloads: maxDownloads ? parseInt(maxDownloads) : null,
          sharedWith: sharedWith || null
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('Share link created successfully')
        setShares([data.share, ...shares])
        
        // Reset form
        setExpiresIn('7days')
        setMaxDownloads('')
        setSharedWith('')
      } else {
        toast.error('Failed to create share link')
      }
    } catch (error) {
      console.error('Error creating share:', error)
      toast.error('Failed to create share link')
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('Share link copied to clipboard')
  }

  const getExpiryLabel = (expiresAt: string | null) => {
    if (!expiresAt) return 'Never expires'
    
    const expiry = new Date(expiresAt)
    const now = new Date()
    
    if (expiry < now) {
      return 'Expired'
    }
    
    return `Expires ${format(expiry, 'MMM d, yyyy')}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
          <DialogDescription>
            Create secure share links for "{documentName}"
          </DialogDescription>
        </DialogHeader>

        {/* Create New Share */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold mb-4">Create New Share Link</h4>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="expiresIn">Expires In</Label>
              <Select value={expiresIn} onValueChange={setExpiresIn}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1hour">1 Hour</SelectItem>
                  <SelectItem value="24hours">24 Hours</SelectItem>
                  <SelectItem value="7days">7 Days</SelectItem>
                  <SelectItem value="30days">30 Days</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="maxDownloads">Max Downloads (optional)</Label>
              <Input
                id="maxDownloads"
                type="number"
                placeholder="Unlimited"
                value={maxDownloads}
                onChange={(e) => setMaxDownloads(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="sharedWith">Share With Email (optional)</Label>
              <Input
                id="sharedWith"
                type="email"
                placeholder="recipient@example.com"
                value={sharedWith}
                onChange={(e) => setSharedWith(e.target.value)}
              />
            </div>

            <Button 
              onClick={createShare} 
              disabled={creating}
              className="w-full"
            >
              <Share2 className="h-4 w-4 mr-2" />
              {creating ? 'Creating...' : 'Create Share Link'}
            </Button>
          </div>
        </div>

        {/* Existing Shares */}
        <div className="mt-6">
          <h4 className="font-semibold mb-4">Active Share Links</h4>
          
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading shares...</div>
          ) : shares.length > 0 ? (
            <div className="space-y-3">
              {shares.map((share) => (
                <div 
                  key={share.id} 
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {getExpiryLabel(share.expiresAt)}
                        </Badge>
                        {share.maxDownloads && (
                          <Badge variant="outline" className="text-xs">
                            <Download className="h-3 w-3 mr-1" />
                            {share.downloadCount}/{share.maxDownloads} downloads
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Created {format(new Date(share.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Input 
                      value={share.shareUrl} 
                      readOnly 
                      className="text-sm"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(share.shareUrl)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(share.shareUrl, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No active shares yet
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
