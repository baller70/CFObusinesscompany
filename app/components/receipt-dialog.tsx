
'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'react-hot-toast'
import { Upload, FileImage, X, Scan, Loader2, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'

interface ReceiptDialogProps {
  open: boolean
  onClose: () => void
  onSave: () => void
  receipt?: any
}

const RECEIPT_CATEGORIES = [
  'Groceries',
  'Department Stores',
  'Clothing & Shoes',
  'Electronics',
  'Home & Garden',
  'Pharmacy',
  'Sporting Goods',
  'Books & Music',
  'Toys & Games',
  'Pet Supplies',
  'Office Supplies',
  'Convenience Stores',
  'Restaurants',
  'Gas Stations',
  'Other'
]

export function ReceiptDialog({ open, onClose, onSave, receipt }: ReceiptDialogProps) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [ocrProcessing, setOcrProcessing] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [activeTab, setActiveTab] = useState('manual')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    vendor: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    taxDeductible: false,
    businessExpense: false
  })

  useEffect(() => {
    if (receipt) {
      setFormData({
        vendor: receipt.vendor || '',
        amount: receipt.amount?.toString() || '',
        date: receipt.date ? new Date(receipt.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        category: receipt.category || '',
        description: receipt.description || '',
        taxDeductible: receipt.taxDeductible || false,
        businessExpense: receipt.businessExpense || false
      })
      setActiveTab('manual')
    } else {
      setFormData({
        vendor: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: '',
        description: '',
        taxDeductible: false,
        businessExpense: false
      })
      setSelectedFiles([])
      setPreviewUrls([])
      setActiveTab('manual')
    }
  }, [receipt, open])

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    )
    
    if (files.length > 0) {
      handleFiles(files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(file => 
        file.type.startsWith('image/')
      )
      handleFiles(files)
    }
  }

  const handleFiles = (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files])
    
    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file))
    setPreviewUrls(prev => [...prev, ...newPreviewUrls])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    URL.revokeObjectURL(previewUrls[index])
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  const handleOCRUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one receipt image')
      return
    }

    setOcrProcessing(true)
    setUploading(true)

    try {
      const formData = new FormData()
      selectedFiles.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/personal/receipts/upload-ocr', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Successfully processed ${data.summary.successful} receipt(s)`)
        onSave()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to process receipts')
      }
    } catch (error) {
      console.error('Error uploading receipts:', error)
      toast.error('An error occurred while processing receipts')
    } finally {
      setOcrProcessing(false)
      setUploading(false)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = '/api/personal/receipts'
      const method = receipt ? 'PUT' : 'POST'
      const body = receipt ? { ...formData, id: receipt.id } : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        toast.success(receipt ? 'Receipt updated successfully' : 'Receipt added successfully')
        onSave()
        onClose()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to save receipt')
      }
    } catch (error) {
      console.error('Error saving receipt:', error)
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{receipt ? 'Edit Receipt' : 'Add Receipt'}</DialogTitle>
        </DialogHeader>

        {!receipt && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="ocr">
                <Scan className="h-4 w-4 mr-2" />
                OCR Scan
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="mt-4">
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="vendor">Vendor/Store *</Label>
                    <Input
                      id="vendor"
                      value={formData.vendor}
                      onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                      placeholder="e.g., Walmart, Target, Amazon"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="amount">Amount ($) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {RECEIPT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="What did you purchase?"
                      rows={3}
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="taxDeductible"
                        checked={formData.taxDeductible}
                        onChange={(e) => setFormData({ ...formData, taxDeductible: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="taxDeductible">Tax Deductible</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="businessExpense"
                        checked={formData.businessExpense}
                        onChange={(e) => setFormData({ ...formData, businessExpense: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="businessExpense">Business Expense</Label>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : receipt ? 'Update' : 'Add'}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            <TabsContent value="ocr" className="mt-4">
              <div className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Drop receipt images here
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    or click to browse (supports JPG, PNG, PDF)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileImage className="h-4 w-4 mr-2" />
                    Select Files
                  </Button>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-3">
                    <Label>Selected Receipts ({selectedFiles.length})</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="relative group border rounded-lg overflow-hidden">
                          <div className="aspect-video relative bg-gray-100">
                            <Image
                              src={previewUrls[index]}
                              alt={file.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="p-2 bg-white">
                            <p className="text-xs font-medium truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Scan className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">OCR Processing</h4>
                      <p className="text-sm text-blue-700">
                        Our AI will automatically extract vendor, amount, date, and items from your receipts. 
                        You can review and edit the extracted data afterwards.
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    type="button"
                    onClick={handleOCRUpload}
                    disabled={selectedFiles.length === 0 || uploading}
                  >
                    {ocrProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Process {selectedFiles.length} Receipt{selectedFiles.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {receipt && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="vendor">Vendor/Store *</Label>
                <Input
                  id="vendor"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="e.g., Walmart, Target, Amazon"
                  required
                />
              </div>

              <div>
                <Label htmlFor="amount">Amount ($) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECEIPT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What did you purchase?"
                  rows={3}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="taxDeductible"
                    checked={formData.taxDeductible}
                    onChange={(e) => setFormData({ ...formData, taxDeductible: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="taxDeductible">Tax Deductible</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="businessExpense"
                    checked={formData.businessExpense}
                    onChange={(e) => setFormData({ ...formData, businessExpense: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="businessExpense">Business Expense</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
