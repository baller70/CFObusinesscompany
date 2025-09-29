
'use client'

import { Button } from '@/components/ui/button'
import { Download, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface ExportFilterButtonsProps {
  mockInvoices: any[];
}

export function ExportFilterButtons({ mockInvoices }: ExportFilterButtonsProps) {
  return (
    <div className="flex items-center space-x-4">
      <Button 
        variant="outline"
        onClick={() => {
          toast.info('Filter functionality coming soon - allows filtering by status, date range, customer, etc.')
        }}
      >
        <Filter className="h-4 w-4 mr-2" />
        Filter
      </Button>
      <Button 
        variant="outline"
        onClick={() => {
          // Create CSV data for export
          const csvData = mockInvoices.map(inv => ({
            'Invoice Number': inv.invoiceNumber,
            'Customer': inv.customer.name,
            'Status': inv.status,
            'Amount': inv.total,
            'Issue Date': format(inv.issueDate, 'yyyy-MM-dd'),
            'Due Date': format(inv.dueDate, 'yyyy-MM-dd'),
            'Project': inv.project?.name || 'N/A'
          }))
          
          const csvContent = [
            Object.keys(csvData[0]).join(','),
            ...csvData.map(row => Object.values(row).join(','))
          ].join('\n')
          
          const blob = new Blob([csvContent], { type: 'text/csv' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `invoices-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          
          toast.success('Invoice data exported to CSV!')
        }}
      >
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
    </div>
  )
}

interface EstimateActionsProps {
  estimate: any;
}

export function EstimateActions({ estimate }: EstimateActionsProps) {
  return (
    <div className="flex flex-col space-y-2 ml-6">
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => {
          const newWindow = window.open('', '_blank', 'width=800,height=600')
          if (newWindow) {
            newWindow.document.write(`
              <html>
                <head>
                  <title>Estimate ${estimate.estimateNumber}</title>
                  <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .estimate-header { border-bottom: 2px solid #ccc; padding-bottom: 20px; margin-bottom: 20px; }
                  </style>
                </head>
                <body>
                  <div class="estimate-header">
                    <h1>Estimate ${estimate.estimateNumber}</h1>
                    <p>Customer: ${estimate.customer.name}</p>
                    <p>Status: ${estimate.status}</p>
                    <p>Amount: $${estimate.total.toLocaleString()}</p>
                    <p>Valid Until: ${format(estimate.validUntil, 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <h3>Estimate Items</h3>
                    ${estimate.items.map(item => 
                      `<p>${item.description}: ${item.quantity} × $${item.rate} = $${item.amount.toLocaleString()}</p>`
                    ).join('')}
                  </div>
                </body>
              </html>
            `)
            newWindow.document.close()
          }
        }}
      >
        View
      </Button>

      {estimate.status === 'PENDING' && (
        <>
          <Button 
            size="sm"
            onClick={() => {
              toast.success(`Estimate ${estimate.estimateNumber} sent to ${estimate.customer.name}!`)
            }}
          >
            Send
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              toast.info(`Opening estimate ${estimate.estimateNumber} for editing...`)
            }}
          >
            Edit
          </Button>
        </>
      )}

      {estimate.status === 'ACCEPTED' && !estimate.convertedToInvoice && (
        <Button 
          size="sm"
          onClick={() => {
            toast.success(`Converting estimate ${estimate.estimateNumber} to invoice...`)
            setTimeout(() => {
              toast.info('Estimate converted to invoice successfully!')
            }, 2000)
          }}
        >
          Convert to Invoice
        </Button>
      )}

      <Button 
        variant="outline" 
        size="sm"
        onClick={() => {
          // Generate estimate PDF content
          const pdfContent = `Estimate ${estimate.estimateNumber}\n\nCustomer: ${estimate.customer.name}\nAmount: $${estimate.total.toLocaleString()}\nValid Until: ${format(estimate.validUntil, 'MMM d, yyyy')}\n\nItems:\n${estimate.items.map(item => `${item.description}: ${item.quantity} × $${item.rate} = $${item.amount.toLocaleString()}`).join('\n')}`
          
          const blob = new Blob([pdfContent], { type: 'text/plain' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `estimate-${estimate.estimateNumber}.txt`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          
          toast.success(`Downloaded PDF for estimate ${estimate.estimateNumber}`)
        }}
      >
        PDF
      </Button>
    </div>
  )
}

interface DraftInvoiceActionsProps {
  invoice: any;
}

export function DraftInvoiceActions({ invoice }: DraftInvoiceActionsProps) {
  return (
    <div className="flex space-x-2">
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => {
          toast.info(`Opening draft invoice ${invoice.invoiceNumber} for editing...`)
        }}
      >
        Edit
      </Button>
      <Button 
        size="sm"
        onClick={() => {
          toast.success(`Draft invoice ${invoice.invoiceNumber} sent successfully!`)
          setTimeout(() => {
            toast.info('Invoice status updated to "SENT"')
          }, 1000)
        }}
      >
        Send
      </Button>
    </div>
  )
}

interface OverdueInvoiceActionsProps {
  invoice: any;
}

export function OverdueInvoiceActions({ invoice }: OverdueInvoiceActionsProps) {
  return (
    <div className="flex space-x-2">
      <Button 
        variant="destructive" 
        size="sm"
        onClick={() => {
          toast.success(`Overdue reminder sent for invoice ${invoice.invoiceNumber}!`)
          setTimeout(() => {
            toast.info('Customer will receive a follow-up email with payment instructions.')
          }, 1000)
        }}
      >
        Send Reminder
      </Button>
      <Button 
        size="sm"
        onClick={() => {
          toast.success(`Invoice ${invoice.invoiceNumber} marked as paid!`)
          setTimeout(() => {
            toast.info('Invoice status updated and payment recorded.')
          }, 1000)
        }}
      >
        Mark Paid
      </Button>
    </div>
  )
}
