
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, ArrowLeft, Loader2, FileText, Image, FileVideo, Music } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface DocumentFormData {
  name: string;
  description: string;
  category: string;
  tags: string;
  confidential: boolean;
}

export default function DocumentUploadPage() {
  const router = useRouter()
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [formData, setFormData] = useState<DocumentFormData>({
    name: '',
    description: '',
    category: '',
    tags: '',
    confidential: false
  })

  const categories = [
    'Financial Reports',
    'Contracts',
    'Invoices',
    'Tax Documents',
    'Employee Records',
    'Marketing Materials',
    'Legal Documents',
    'Insurance',
    'Other'
  ]

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      setSelectedFiles(files)
      if (!formData.name && files.length === 1) {
        // Auto-populate document name from filename
        const fileName = files[0].name.replace(/\.[^/.]+$/, '')
        setFormData(prev => ({ ...prev, name: fileName }))
      }
      toast.success(`${files.length} file(s) selected`)
    }
  }, [formData.name])

  const handleInputChange = (field: keyof DocumentFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error('Please select at least one file')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i)
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      toast.success(`Successfully uploaded ${selectedFiles.length} document(s)!`)
      router.push('/dashboard/documents')
    } catch (error) {
      toast.error('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
        return <FileText className="h-8 w-8 text-blue-600" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="h-8 w-8 text-green-600" />
      case 'mp4':
      case 'avi':
      case 'mov':
        return <FileVideo className="h-8 w-8 text-purple-600" />
      case 'mp3':
      case 'wav':
        return <Music className="h-8 w-8 text-orange-600" />
      default:
        return <FileText className="h-8 w-8 text-gray-600" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upload Documents</h1>
          <p className="text-gray-600 mt-1">Upload and organize your business documents</p>
        </div>
        <Link href="/dashboard/documents">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Select Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-lg font-medium text-gray-900">
                      Click to upload or drag and drop
                    </span>
                    <p className="text-gray-600 mt-2">
                      Support for PDF, DOC, DOCX, XLS, XLSX, JPG, PNG and more
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Maximum file size: 25MB per file
                    </p>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      multiple
                      className="sr-only"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
              </div>

              {selectedFiles && selectedFiles.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Selected Files ({selectedFiles.length})</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {Array.from(selectedFiles).map((file, index) => (
                      <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        {getFileIcon(file.name)}
                        <div className="ml-3 flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Upload Progress</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Document Details Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Document Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Document Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter document name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category.toLowerCase().replace(' ', '_')}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the document..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="e.g. important, 2024, tax"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="confidential"
                  checked={formData.confidential}
                  onChange={(e) => handleInputChange('confidential', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="confidential" className="text-sm">
                  Mark as confidential
                </Label>
              </div>

              <Button 
                onClick={handleUpload} 
                disabled={!selectedFiles || selectedFiles.length === 0 || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Documents
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Upload Guidelines */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">Upload Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-gray-600">
              <p>• Maximum file size: 25MB per file</p>
              <p>• Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, and more</p>
              <p>• Files are automatically scanned for security</p>
              <p>• Confidential documents are encrypted at rest</p>
              <p>• Version history is maintained for all uploads</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
