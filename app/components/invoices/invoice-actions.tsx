
'use client'

import { Button } from '@/components/ui/button'
import { Eye, Send, Download } from 'lucide-react'
import { toast } from 'sonner'

interface InvoiceActionsProps {
  invoice: {
    id: string;
    invoiceNumber: string;
    status: string;
  };
}

export function InvoiceActions({ invoice }: InvoiceActionsProps) {
  const handleView = () => {
    toast.success(`Viewing invoice ${invoice.invoiceNumber}`)
    // In a real app, this would navigate to invoice detail page
  }

  const handleSend = () => {
    toast.success(`Invoice ${invoice.invoiceNumber} sent successfully!`)
    // In a real app, this would update the invoice status
  }

  const handleEdit = () => {
    toast.info(`Editing invoice ${invoice.invoiceNumber}`)
    // In a real app, this would navigate to edit page
  }

  const handleMarkPaid = () => {
    toast.success(`Invoice ${invoice.invoiceNumber} marked as paid!`)
    // In a real app, this would update the invoice status
  }

  const handleResend = () => {
    toast.success(`Invoice ${invoice.invoiceNumber} resent successfully!`)
    // In a real app, this would resend the invoice
  }

  const handleFollowUp = () => {
    toast.info(`Follow-up reminder sent for invoice ${invoice.invoiceNumber}`)
    // In a real app, this would send a follow-up email
  }

  const handleDownloadPDF = () => {
    toast.success(`Downloading PDF for invoice ${invoice.invoiceNumber}`)
    // In a real app, this would generate and download PDF
  }

  return (
    <div className="flex flex-col space-y-2 ml-6">
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleView}
      >
        <Eye className="h-3 w-3 mr-1" />
        View
      </Button>
      
      {invoice.status === 'DRAFT' && (
        <>
          <Button 
            size="sm"
            onClick={handleSend}
          >
            <Send className="h-3 w-3 mr-1" />
            Send
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleEdit}
          >
            Edit
          </Button>
        </>
      )}

      {invoice.status === 'SENT' && (
        <>
          <Button 
            size="sm"
            onClick={handleMarkPaid}
          >
            Mark Paid
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleResend}
          >
            <Send className="h-3 w-3 mr-1" />
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
          >
            Follow Up
          </Button>
          <Button 
            size="sm"
            onClick={handleMarkPaid}
          >
            Mark Paid
          </Button>
        </>
      )}

      <Button 
        variant="outline" 
        size="sm"
        onClick={handleDownloadPDF}
      >
        <Download className="h-3 w-3 mr-1" />
        PDF
      </Button>
    </div>
  )
}
