
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Eye, Send, Download, Edit, Check, Mail, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface InvoiceActionsProps {
  invoice: {
    id: string;
    invoiceNumber: string;
    status: string;
    customer?: {
      name: string;
      email: string;
    };
    total?: number;
  };
  onStatusUpdate?: (invoiceId: string, newStatus: string) => void;
}

export function InvoiceActions({ invoice, onStatusUpdate }: InvoiceActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false)
  const [sendEmailData, setSendEmailData] = useState({
    to: invoice.customer?.email || '',
    subject: `Invoice ${invoice.invoiceNumber}`,
    message: `Please find attached invoice ${invoice.invoiceNumber} for your review and payment.`
  })

  const handleView = () => {
    // Create a modal with invoice details
    const newWindow = window.open('', '_blank', 'width=800,height=600')
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Invoice ${invoice.invoiceNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .invoice-header { border-bottom: 2px solid #ccc; padding-bottom: 20px; margin-bottom: 20px; }
              .invoice-details { margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="invoice-header">
              <h1>Invoice ${invoice.invoiceNumber}</h1>
              <p>Customer: ${invoice.customer?.name || 'N/A'}</p>
              <p>Status: ${invoice.status}</p>
              <p>Amount: $${invoice.total?.toLocaleString() || 'N/A'}</p>
            </div>
            <div class="invoice-details">
              <h3>Invoice Details</h3>
              <p>This is a preview of invoice ${invoice.invoiceNumber}. In a complete system, this would show the full invoice details including line items, taxes, and payment terms.</p>
            </div>
          </body>
        </html>
      `)
      newWindow.document.close()
    } else {
      toast.info(`Opening invoice ${invoice.invoiceNumber} details...`)
      router.push(`/dashboard/invoices/${invoice.id}/view`)
    }
  }

  const handleSend = async () => {
    setIsLoading(true)
    try {
      // Simulate API call to send invoice
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const response = await fetch('/api/invoices/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          ...sendEmailData
        })
      })

      if (response.ok) {
        toast.success(`Invoice ${invoice.invoiceNumber} sent successfully to ${sendEmailData.to}!`)
        onStatusUpdate?.(invoice.id, 'SENT')
        setShowSendDialog(false)
      } else {
        throw new Error('Failed to send invoice')
      }
    } catch (error) {
      toast.error('Failed to send invoice. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    toast.info(`Opening invoice ${invoice.invoiceNumber} for editing...`)
    router.push(`/dashboard/invoices/${invoice.id}/edit`)
  }

  const handleMarkPaid = async () => {
    setIsLoading(true)
    try {
      // Simulate API call to mark as paid
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const response = await fetch('/api/invoices/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id })
      })

      if (response.ok) {
        toast.success(`Invoice ${invoice.invoiceNumber} marked as paid!`)
        onStatusUpdate?.(invoice.id, 'PAID')
        setShowMarkPaidDialog(false)
      } else {
        throw new Error('Failed to mark invoice as paid')
      }
    } catch (error) {
      toast.error('Failed to update invoice status. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = () => {
    setShowSendDialog(true)
    setSendEmailData({
      ...sendEmailData,
      subject: `Reminder: Invoice ${invoice.invoiceNumber}`,
      message: `This is a friendly reminder regarding invoice ${invoice.invoiceNumber}. Please review and process payment at your earliest convenience.`
    })
  }

  const handleFollowUp = async () => {
    setIsLoading(true)
    try {
      // Simulate API call for follow-up
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const response = await fetch('/api/invoices/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          customerEmail: invoice.customer?.email
        })
      })

      if (response.ok) {
        toast.success(`Follow-up reminder sent for invoice ${invoice.invoiceNumber}`)
      } else {
        throw new Error('Failed to send follow-up')
      }
    } catch (error) {
      toast.error('Failed to send follow-up. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    setIsLoading(true)
    try {
      // Simulate PDF generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create a simple PDF-like content for download
      const pdfContent = `Invoice ${invoice.invoiceNumber}\n\nCustomer: ${invoice.customer?.name}\nAmount: $${invoice.total?.toLocaleString()}\nStatus: ${invoice.status}\n\nThis is a simulated PDF download. In a real application, this would generate an actual PDF file.`
      
      const blob = new Blob([pdfContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoice.invoiceNumber}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success(`Downloaded PDF for invoice ${invoice.invoiceNumber}`)
    } catch (error) {
      toast.error('Failed to generate PDF. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col space-y-2 ml-6">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleView}
          disabled={isLoading}
        >
          <Eye className="h-3 w-3 mr-1" />
          View
        </Button>
        
        {invoice.status === 'DRAFT' && (
          <>
            <Button 
              size="sm"
              onClick={() => setShowSendDialog(true)}
              disabled={isLoading}
            >
              <Send className="h-3 w-3 mr-1" />
              Send
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleEdit}
              disabled={isLoading}
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </>
        )}

        {invoice.status === 'SENT' && (
          <>
            <Button 
              size="sm"
              onClick={() => setShowMarkPaidDialog(true)}
              disabled={isLoading}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark Paid
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleResend}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
              Resend
            </Button>
          </>
        )}

        {invoice.status === 'OVERDUE' && (
          <>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleFollowUp}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Mail className="h-3 w-3 mr-1" />}
              Follow Up
            </Button>
            <Button 
              size="sm"
              onClick={() => setShowMarkPaidDialog(true)}
              disabled={isLoading}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark Paid
            </Button>
          </>
        )}

        <Button 
          variant="outline" 
          size="sm"
          onClick={handleDownloadPDF}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Download className="h-3 w-3 mr-1" />}
          PDF
        </Button>
      </div>

      {/* Send Invoice Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invoice {invoice.invoiceNumber}</DialogTitle>
            <DialogDescription>
              Send this invoice to your customer via email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="send-to">To</Label>
              <Input
                id="send-to"
                type="email"
                value={sendEmailData.to}
                onChange={(e) => setSendEmailData(prev => ({ ...prev, to: e.target.value }))}
                placeholder="customer@example.com"
              />
            </div>
            <div>
              <Label htmlFor="send-subject">Subject</Label>
              <Input
                id="send-subject"
                value={sendEmailData.subject}
                onChange={(e) => setSendEmailData(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="send-message">Message</Label>
              <Textarea
                id="send-message"
                value={sendEmailData.message}
                onChange={(e) => setSendEmailData(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={isLoading || !sendEmailData.to}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Paid Dialog */}
      <Dialog open={showMarkPaidDialog} onOpenChange={setShowMarkPaidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Invoice as Paid</DialogTitle>
            <DialogDescription>
              Mark invoice {invoice.invoiceNumber} as paid. This action will update the invoice status and record the payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Invoice: {invoice.invoiceNumber}</p>
                  <p className="text-sm text-green-700">Amount: ${invoice.total?.toLocaleString() || 'N/A'}</p>
                  <p className="text-sm text-green-700">Customer: {invoice.customer?.name || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMarkPaidDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkPaid} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Mark as Paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
