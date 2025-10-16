
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Download, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface Version {
  id: string
  version: number
  fileName: string
  fileSize: number | null
  changeDescription: string | null
  createdAt: string
  isCurrent: boolean
}

interface DocumentVersionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  documentName: string
}

export function DocumentVersionDialog({ 
  open, 
  onOpenChange, 
  documentId, 
  documentName 
}: DocumentVersionDialogProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && documentId) {
      fetchVersions()
    }
  }, [open, documentId])

  const fetchVersions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/documents/${documentId}/versions`)
      const data = await response.json()
      
      if (response.ok) {
        setVersions(data.versions)
      } else {
        toast.error('Failed to load version history')
      }
    } catch (error) {
      console.error('Error fetching versions:', error)
      toast.error('Failed to load version history')
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>
            View all versions of "{documentName}"
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading versions...</div>
        ) : versions.length > 0 ? (
          <div className="space-y-4">
            {versions.map((version) => (
              <div 
                key={version.id} 
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-gray-900">
                        Version {version.version}
                      </h4>
                      {version.isCurrent && (
                        <Badge variant="default" className="flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Current</span>
                        </Badge>
                      )}
                    </div>
                    
                    {version.changeDescription && (
                      <p className="text-sm text-gray-600 mb-2">{version.changeDescription}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(new Date(version.createdAt), 'MMM d, yyyy HH:mm')}
                      </span>
                      <span>{formatFileSize(version.fileSize)}</span>
                      <span className="font-mono text-gray-400">{version.fileName}</span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      toast.info(`Downloading version ${version.version}...`)
                      // In a real implementation, this would download the specific version
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            No version history available
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
