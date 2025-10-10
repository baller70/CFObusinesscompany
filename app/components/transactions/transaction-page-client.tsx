
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Filter, Layers } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import BulkOperationsDialog from '@/components/transactions/bulk-operations-dialog'

interface ExportFilterButtonsProps {
  mockTransactions: any[];
}

export function TransactionExportFilterButtons({ mockTransactions }: ExportFilterButtonsProps) {
  return (
    <div className="flex items-center space-x-3">
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => {
          // Export transactions to CSV
          const csvData = mockTransactions.map(trans => ({
            'Date': format(trans.date, 'yyyy-MM-dd'),
            'Description': trans.description,
            'Type': trans.type,
            'Category': trans.category?.name || 'N/A',
            'Amount': trans.amount,
            'Account': trans.account.name,
            'Status': trans.status,
            'Reference': trans.reference || 'N/A'
          }))
          
          const csvContent = [
            Object.keys(csvData[0]).join(','),
            ...csvData.map(row => Object.values(row).join(','))
          ].join('\n')
          
          const blob = new Blob([csvContent], { type: 'text/csv' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `transactions-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          
          toast.success('Transaction data exported to CSV!')
        }}
      >
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => {
          toast.info('Advanced filtering coming soon - filter by date range, amount, category, account, and status.')
        }}
      >
        <Filter className="h-4 w-4 mr-2" />
        Filter
      </Button>
    </div>
  )
}

interface TransactionActionsProps {
  transaction: any;
  currentProfileId?: string;
  onRefresh?: () => void;
}

export function TransactionActions({ transaction, currentProfileId, onRefresh }: TransactionActionsProps) {
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  return (
    <>
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setBulkDialogOpen(true)}
          title="Bulk operations - move or delete all similar transactions"
        >
          <Layers className="h-3 w-3 mr-1" />
          Bulk
        </Button>
        {transaction.receiptUrl && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // Simulate receipt download
              const receiptContent = `Receipt for Transaction\n\nDate: ${format(transaction.date, 'MMM d, yyyy')}\nDescription: ${transaction.description}\nAmount: ${transaction.amount >= 0 ? '+' : ''}$${Math.abs(transaction.amount).toLocaleString()}\nCategory: ${transaction.category?.name || 'N/A'}\nAccount: ${transaction.account.name}\nReference: ${transaction.reference || 'N/A'}\n\nThis is a simulated receipt download.`
              
              const blob = new Blob([receiptContent], { type: 'text/plain' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `receipt-${transaction.reference || transaction.id}.txt`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
              
              toast.success('Receipt downloaded!')
            }}
          >
            <Download className="h-3 w-3 mr-1" />
            Receipt
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            const newWindow = window.open('', '_blank', 'width=700,height=500')
            if (newWindow) {
              newWindow.document.write(`
                <html>
                  <head>
                    <title>Transaction Details</title>
                    <style>
                      body { font-family: Arial, sans-serif; margin: 20px; }
                      .transaction-header { border-bottom: 2px solid #ccc; padding-bottom: 20px; margin-bottom: 20px; }
                      .detail-row { margin: 10px 0; }
                      .label { font-weight: bold; color: #555; }
                    </style>
                  </head>
                  <body>
                    <div class="transaction-header">
                      <h1>Transaction Details</h1>
                      <p class="detail-row"><span class="label">Reference:</span> ${transaction.reference || 'N/A'}</p>
                    </div>
                    <div class="detail-row"><span class="label">Date:</span> ${format(transaction.date, 'MMM d, yyyy')}</div>
                    <div class="detail-row"><span class="label">Description:</span> ${transaction.description}</div>
                    <div class="detail-row"><span class="label">Amount:</span> ${transaction.amount >= 0 ? '+' : ''}$${Math.abs(transaction.amount).toLocaleString()}</div>
                    <div class="detail-row"><span class="label">Type:</span> ${transaction.type}</div>
                    <div class="detail-row"><span class="label">Category:</span> ${transaction.category?.name || 'N/A'}</div>
                    <div class="detail-row"><span class="label">Account:</span> ${transaction.account.name}</div>
                    <div class="detail-row"><span class="label">Status:</span> ${transaction.status}</div>
                    ${transaction.customer ? `<div class="detail-row"><span class="label">Customer:</span> ${transaction.customer.name}</div>` : ''}
                    ${transaction.vendor ? `<div class="detail-row"><span class="label">Vendor:</span> ${transaction.vendor.name}</div>` : ''}
                    ${transaction.tags?.length > 0 ? `<div class="detail-row"><span class="label">Tags:</span> ${transaction.tags.join(', ')}</div>` : ''}
                  </body>
                </html>
              `)
              newWindow.document.close()
            } else {
              toast.info('Opening transaction details...')
            }
          }}
        >
          View
        </Button>
      </div>
      
      <BulkOperationsDialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        transaction={transaction}
        currentProfileId={currentProfileId}
        onSuccess={onRefresh}
      />
    </>
  )
}

interface ExpenseReceiptProps {
  transaction: any;
}

export function ExpenseReceiptButton({ transaction }: ExpenseReceiptProps) {
  return (
    <>
      {transaction.receiptUrl && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            // Simulate receipt download
            const receiptContent = `Expense Receipt\n\nDate: ${format(transaction.date, 'MMM d, yyyy')}\nDescription: ${transaction.description}\nAmount: $${Math.abs(transaction.amount).toLocaleString()}\nCategory: ${transaction.category?.name || 'N/A'}\nVendor: ${transaction.vendor?.name || 'N/A'}\nAccount: ${transaction.account.name}\nReference: ${transaction.reference || 'N/A'}\n\nThis is a simulated receipt download.`
            
            const blob = new Blob([receiptContent], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `expense-receipt-${transaction.reference || transaction.id}.txt`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            
            toast.success('Expense receipt downloaded!')
          }}
        >
          <Download className="h-3 w-3 mr-1" />
          Receipt
        </Button>
      )}
    </>
  )
}
