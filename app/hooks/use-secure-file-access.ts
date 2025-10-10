
"use client"

import { useState, useCallback } from 'react'

interface VerificationToken {
  token: string
  expiresAt: string
}

export function useSecureFileAccess() {
  const [verificationToken, setVerificationToken] = useState<VerificationToken | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const isTokenValid = useCallback(() => {
    if (!verificationToken) return false
    return new Date(verificationToken.expiresAt) > new Date()
  }, [verificationToken])

  const requestAccess = useCallback((action: () => void) => {
    if (isTokenValid()) {
      // Token is still valid, execute action immediately
      action()
    } else {
      // Token expired or doesn't exist, request verification
      setPendingAction(() => action)
      setIsDialogOpen(true)
    }
  }, [isTokenValid])

  const handleVerified = useCallback(() => {
    // Store verification token (in a real app, this would come from the API)
    setVerificationToken({
      token: Math.random().toString(36).substring(2),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    })
    
    // Execute pending action
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }, [pendingAction])

  const downloadDocument = useCallback(async (documentId: string, fileName: string) => {
    if (!isTokenValid()) {
      requestAccess(() => downloadDocument(documentId, fileName))
      return
    }

    try {
      const response = await fetch('/api/documents/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          verificationToken: verificationToken?.token
        }),
      })

      const data = await response.json()

      if (response.ok && data.downloadUrl) {
        // Create a temporary link and click it to download
        const link = document.createElement('a')
        link.href = data.downloadUrl
        link.download = fileName
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        console.error('Download failed:', data.error)
        alert(data.error || 'Failed to download document')
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('An error occurred while downloading the document')
    }
  }, [verificationToken, isTokenValid, requestAccess])

  return {
    isDialogOpen,
    setIsDialogOpen,
    handleVerified,
    downloadDocument,
    requestAccess
  }
}
