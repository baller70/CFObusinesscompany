'use client';

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Plus, FileText, Eye, Send, DollarSign, Calendar, Search, Filter, Download, Mail, Phone, AlertCircle } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { InvoiceActions } from '@/components/invoices/invoice-actions'
import { ExportFilterButtons, EstimateActions, DraftInvoiceActions, OverdueInvoiceActions } from '@/components/invoices/invoice-page-client'
import Link from 'next/link'

import { BackButton } from '@/components/ui/back-button';
export default function InvoicesPage() {
  const { data: session } = useSession() || {}
  const router = useRouter()
  
  useEffect(() => {
    if (!session?.user?.id) {
      router.push('/auth/signin')
    }
  }, [session, router])

  // Real data from database
  const invoices: any[] = []
  const estimates: any[] = []

  const draftInvoices = 0
  const sentInvoices = 0
  const overdueInvoices = 0
  const paidInvoices = 0

  const outstandingAmount = 0
  const paidThisMonth = 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'secondary'
      case 'SENT': return 'outline'
      case 'PAID': return 'default'
      case 'OVERDUE': return 'destructive'
      case 'PENDING': return 'secondary'
      case 'ACCEPTED': return 'default'
      case 'REJECTED': return 'destructive'
      default: return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <FileText className="h-4 w-4" />
      case 'SENT': return <Send className="h-4 w-4" />
      case 'PAID': return <DollarSign className="h-4 w-4" />
      case 'OVERDUE': return <AlertCircle className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
        <BackButton href="/dashboard" />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices & Estimates</h1>
          <p className="text-gray-600 mt-1">Professional billing and project estimates</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/dashboard/invoices/estimates/new">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              New Estimate
            </Button>
          </Link>
          <Link href="/dashboard/invoices/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Draft Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{draftInvoices}</div>
            <p className="text-xs text-gray-500 mt-1">Ready to send</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Sent/Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{sentInvoices}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueInvoices}</div>
            <p className="text-xs text-gray-500 mt-1">Past due date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${outstandingAmount.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total owed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Paid This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${paidThisMonth.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Revenue received</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList>
          <TabsTrigger 
            value="invoices" 
            className="cursor-pointer"
            onClick={() => console.log('Invoices tab clicked')}
          >
            Invoices
          </TabsTrigger>
          <TabsTrigger 
            value="estimates" 
            className="cursor-pointer"
            onClick={() => console.log('Estimates tab clicked')}
          >
            Estimates
          </TabsTrigger>
          <TabsTrigger 
            value="drafts" 
            className="cursor-pointer"
            onClick={() => console.log('Drafts tab clicked')}
          >
            Drafts
          </TabsTrigger>
          <TabsTrigger 
            value="overdue" 
            className="cursor-pointer"
            onClick={() => console.log('Overdue tab clicked')}
          >
            Overdue
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search invoices by number, customer, or project..."
                    className="pl-10"
                  />
                </div>
                <ExportFilterButtons invoices={invoices} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {invoices.map((invoice) => (
              <Card key={invoice.id} className={`hover:shadow-md transition-shadow ${
                invoice.status === 'OVERDUE' ? 'border-red-200 bg-red-50' : ''
              }`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(invoice.status)}
                        <h3 className="text-lg font-semibold text-gray-900">
                          {invoice.invoiceNumber}
                        </h3>
                        <Badge variant={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                        {invoice.status === 'OVERDUE' && (
                          <Badge variant="destructive">
                            {Math.abs(differenceInDays(invoice.dueDate, new Date()))} days overdue
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-600">Customer</div>
                          <div className="font-semibold text-gray-900">{invoice.customer.name}</div>
                          <div className="text-sm text-gray-600 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {invoice.customer.email}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-600">Project</div>
                          <div className="font-semibold text-gray-900">
                            {invoice.project?.name || 'General Services'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {invoice.items.length} line items
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-600">Dates</div>
                          <div className="font-semibold text-gray-900">
                            Issued: {format(invoice.issueDate, 'MMM d, yyyy')}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Due: {format(invoice.dueDate, 'MMM d, yyyy')}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-600">Amount</div>
                          <div className="text-2xl font-bold text-gray-900">
                            ${invoice.total.toLocaleString()}
                          </div>
                          {invoice.paidDate && (
                            <div className="text-sm text-green-600 font-medium">
                              Paid: {format(invoice.paidDate, 'MMM d, yyyy')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Invoice Items Summary */}
                      <div className="mb-4">
                        <div className="text-sm text-gray-600 mb-2">Services</div>
                        <div className="space-y-1">
      // @ts-ignore
                          {invoice.items.slice(0, 2).map((item: any, index: any) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="text-gray-700">{item.description}</span>
                              <span className="font-medium">
                                {item.quantity} × ${item.rate} = ${item.amount.toLocaleString()}
                              </span>
                            </div>
                          ))}
                          {invoice.items.length > 2 && (
                            <div className="text-sm text-gray-500">
                              + {invoice.items.length - 2} more items
                            </div>
                          )}
                        </div>
                      </div>

                      {invoice.notes && (
                        <div className="mb-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
                          <strong>Notes:</strong> {invoice.notes}
                        </div>
                      )}
                    </div>

                    <InvoiceActions 
                      invoice={{ 
                        id: invoice.id, 
                        invoiceNumber: invoice.invoiceNumber, 
                        status: invoice.status,
                        customer: invoice.customer,
                        total: invoice.total
                      }} 
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="estimates">
          <div className="space-y-4">
            {estimates.map((estimate) => (
              <Card key={estimate.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {estimate.estimateNumber}
                        </h3>
                        <Badge variant={getStatusColor(estimate.status)}>
                          {estimate.status}
                        </Badge>
                        {estimate.convertedToInvoice && (
                          <Badge className="bg-green-100 text-green-800">
                            Converted to Invoice
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-600">Customer</div>
                          <div className="font-semibold text-gray-900">{estimate.customer.name}</div>
                          <div className="text-sm text-gray-600">{estimate.customer.email}</div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-600">Valid Until</div>
                          <div className="font-semibold text-gray-900">
                            {format(estimate.validUntil, 'MMM d, yyyy')}
                          </div>
                          <div className="text-sm text-gray-600">
                            {differenceInDays(estimate.validUntil, new Date())} days remaining
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-600">Estimate Amount</div>
                          <div className="text-2xl font-bold text-blue-600">
                            ${estimate.total.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="text-sm text-gray-600 mb-2">Services</div>
                        <div className="space-y-1">
      // @ts-ignore
                          {estimate.items.map((item: any, index: any) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="text-gray-700">{item.description}</span>
                              <span className="font-medium">
                                {item.quantity} × ${item.rate} = ${item.amount.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {estimate.notes && (
                        <div className="p-3 bg-blue-50 rounded text-sm text-gray-700">
                          <strong>Notes:</strong> {estimate.notes}
                        </div>
                      )}
                    </div>

                    <EstimateActions estimate={estimate} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="drafts">
          <div className="space-y-4">
            {invoices.filter(invoice => invoice.status === 'DRAFT').map((invoice) => (
              <Card key={invoice.id} className="bg-gray-50 border-gray-200">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {invoice.invoiceNumber}
                        </h3>
                        <Badge variant="secondary">Draft</Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Customer</div>
                          <div className="font-semibold">{invoice.customer.name}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Amount</div>
                          <div className="font-semibold">${invoice.total.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Due Date</div>
                          <div className="font-semibold">{format(invoice.dueDate, 'MMM d, yyyy')}</div>
                        </div>
                      </div>
                    </div>

                    <DraftInvoiceActions invoice={invoice} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="overdue">
          <div className="space-y-4">
            {invoices.filter(invoice => invoice.status === 'OVERDUE').map((invoice) => (
              <Card key={invoice.id} className="bg-red-50 border-red-200">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {invoice.invoiceNumber}
                        </h3>
                        <Badge variant="destructive">
                          {Math.abs(differenceInDays(invoice.dueDate, new Date()))} days overdue
                        </Badge>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Customer</div>
                          <div className="font-semibold">{invoice.customer.name}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Amount</div>
                          <div className="font-semibold text-red-600">${invoice.total.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Due Date</div>
                          <div className="font-semibold">{format(invoice.dueDate, 'MMM d, yyyy')}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Days Overdue</div>
                          <div className="font-bold text-red-600">
                            {Math.abs(differenceInDays(invoice.dueDate, new Date()))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <OverdueInvoiceActions invoice={invoice} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
