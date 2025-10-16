
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'react-hot-toast'
import { 
  Eye, Download, Share2, FileText, Image as ImageIcon, 
  CheckCircle2, XCircle, Loader2, Copy
} from 'lucide-react'
import Image from 'next/image'
import { format } from 'date-fns'

interface ReceiptViewDialogProps {
  open: boolean
  onClose: () => void
  receipt: any
}

export function ReceiptViewDialog({ open, onClose, receipt }: ReceiptViewDialogProps) {
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    if (open && receipt?.cloudStoragePath) {
      fetchImageUrl()
    }
  }, [open, receipt])

  const fetchImageUrl = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/personal/receipts/download?id=${receipt.id}`)
      if (response.ok) {
        const data = await response.json()
        setImageUrl(data.url)
      }
    } catch (error) {
      console.error('Error fetching image:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!imageUrl) return
    
    try {
      const link = document.createElement('a')
      link.href = imageUrl
      link.target = '_blank'
      link.click()
      toast.success('Receipt download started')
    } catch (error) {
      console.error('Error downloading receipt:', error)
      toast.error('Failed to download receipt')
    }
  }

  const handleShare = async () => {
    try {
      const response = await fetch('/api/personal/receipts/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptIds: [receipt.id] })
      })

      if (response.ok) {
        const data = await response.json()
        const shareableReceipt = data.receipts[0]
        
        // Copy shareable link to clipboard
        const shareText = `Receipt from ${shareableReceipt.vendor}\nDate: ${format(new Date(shareableReceipt.date), 'MMM d, yyyy')}\nAmount: $${shareableReceipt.amount}\n${shareableReceipt.imageUrl || ''}`
        
        await navigator.clipboard.writeText(shareText)
        toast.success('Receipt info copied to clipboard')
      } else {
        toast.error('Failed to generate share link')
      }
    } catch (error) {
      console.error('Error sharing receipt:', error)
      toast.error('Failed to share receipt')
    }
  }

  const copyOCRText = async () => {
    if (!receipt?.ocrText) return
    
    try {
      await navigator.clipboard.writeText(receipt.ocrText)
      toast.success('OCR text copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy text')
    }
  }

  if (!receipt) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receipt Details</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">
              <FileText className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="image">
              <ImageIcon className="h-4 w-4 mr-2" />
              Image
            </TabsTrigger>
            <TabsTrigger value="ocr" disabled={!receipt.ocrText}>
              <Eye className="h-4 w-4 mr-2" />
              OCR Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <div className="space-y-4">
              {/* Receipt Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{receipt.vendor}</h3>
                    <p className="text-sm text-gray-600">
                      {format(new Date(receipt.date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">
                      ${receipt.amount.toFixed(2)}
                    </p>
                    {receipt.confidence && (
                      <p className="text-xs text-gray-500">
                        {(receipt.confidence * 100).toFixed(0)}% confidence
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {receipt.category && (
                    <Badge variant="outline">{receipt.category}</Badge>
                  )}
                  {receipt.taxDeductible && (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Tax Deductible
                    </Badge>
                  )}
                  {receipt.businessExpense && (
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                      Business Expense
                    </Badge>
                  )}
                  {receipt.processed && (
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                      OCR Processed
                    </Badge>
                  )}
                </div>
              </div>

              {/* Description */}
              {receipt.description && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700">{receipt.description}</p>
                </div>
              )}

              {/* Extracted Items (from OCR data) */}
              {receipt.ocrData && typeof receipt.ocrData === 'object' && 'items' in receipt.ocrData && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Items</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    {(receipt.ocrData.items as string[]).map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tax Information */}
              {receipt.ocrData && typeof receipt.ocrData === 'object' && 'tax' in receipt.ocrData && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Subtotal</p>
                    <p className="font-medium">
                      ${((receipt.amount - (receipt.ocrData.tax as number || 0))).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tax</p>
                    <p className="font-medium">${(receipt.ocrData.tax as number).toFixed(2)}</p>
                  </div>
                </div>
              )}

              {/* AI Analysis */}
              {receipt.aiAnalysis && typeof receipt.aiAnalysis === 'object' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">AI Analysis</h4>
                  <div className="space-y-2 text-sm">
                    {'confidence' in receipt.aiAnalysis && (
                      <p className="text-blue-700">
                        Confidence Score: {((receipt.aiAnalysis.confidence as number) * 100).toFixed(0)}%
                      </p>
                    )}
                    {'taxAnalysis' in receipt.aiAnalysis && 
                     typeof receipt.aiAnalysis.taxAnalysis === 'object' && 
                     'deductible' in receipt.aiAnalysis.taxAnalysis && (
                      <p className="text-blue-700">
                        Tax Deductibility: {(receipt.aiAnalysis.taxAnalysis.deductible as boolean) ? '✓ Deductible' : '✗ Not Deductible'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="text-xs text-gray-500 space-y-1">
                <p>Created: {format(new Date(receipt.createdAt), 'MMM d, yyyy h:mm a')}</p>
                <p>Updated: {format(new Date(receipt.updatedAt), 'MMM d, yyyy h:mm a')}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="image" className="mt-4">
            <div className="space-y-4">
              {receipt.cloudStoragePath ? (
                <>
                  {loading ? (
                    <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : imageUrl ? (
                    <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={`Receipt from ${receipt.vendor}`}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                      <XCircle className="h-8 w-8 text-gray-400 mr-2" />
                      <p className="text-gray-600">Failed to load image</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 bg-gray-100 rounded-lg">
                  <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-gray-600">No receipt image available</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ocr" className="mt-4">
            <div className="space-y-4">
              {receipt.ocrText ? (
                <>
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Extracted Text</h4>
                    <Button size="sm" variant="outline" onClick={copyOCRText}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Text
                    </Button>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {receipt.ocrText}
                  </div>
                  
                  {receipt.ocrData && typeof receipt.ocrData === 'object' && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Structured Data</h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                        {Object.entries(receipt.ocrData).map(([key, value]) => (
                          <div key={key} className="flex justify-between py-1 border-b border-gray-200 last:border-0">
                            <span className="font-medium text-gray-600 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span className="text-gray-900">
                              {Array.isArray(value) ? value.join(', ') : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg">
                  <FileText className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-gray-600">No OCR data available</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {receipt.cloudStoragePath && imageUrl && (
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
          <Button onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
