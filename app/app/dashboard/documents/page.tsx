

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  File, 
  Search, 
  Filter, 
  Upload, 
  FileText, 
  FileImage, 
  FileSpreadsheet,
  Presentation,
  Shield,
  Clock,
  Eye,
  Download,
  Share2
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

async function getDocumentsData(userId: string) {
  const [documents, documentStats] = await Promise.all([
    prisma.document.findMany({
      where: { userId },
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    }).catch(() => []),
    prisma.document.groupBy({
      by: ['category'],
      where: { userId },
      _count: { _all: true }
    }).catch(() => [])
  ])

  return { documents, documentStats }
}

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const { documents, documentStats } = await getDocumentsData(session.user.id)

  // Mock data for demonstration
  const mockDocuments = [
    {
      id: '1',
      name: 'Q3 Financial Report.pdf',
      description: 'Quarterly financial statements and analysis',
      fileName: 'q3-financial-report.pdf',
      fileSize: 2485760, // 2.4 MB
      mimeType: 'application/pdf',
      category: 'REPORT',
      isPublic: false,
      createdAt: new Date('2024-11-01'),
      updatedAt: new Date('2024-11-01'),
      project: { name: 'Q3 Review' }
    },
    {
      id: '2',
      name: 'Vendor Contract - Acme Corp.docx',
      description: 'Service agreement with Acme Corporation',
      fileName: 'acme-contract.docx',
      fileSize: 1024000, // 1 MB
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      category: 'CONTRACT',
      isPublic: false,
      createdAt: new Date('2024-10-15'),
      updatedAt: new Date('2024-10-20'),
      project: null
    },
    {
      id: '3',
      name: 'October Receipts.zip',
      description: 'Batch upload of October expense receipts',
      fileName: 'october-receipts.zip',
      fileSize: 15360000, // 15 MB
      mimeType: 'application/zip',
      category: 'RECEIPT',
      isPublic: false,
      createdAt: new Date('2024-10-31'),
      updatedAt: new Date('2024-10-31'),
      project: null
    },
    {
      id: '4',
      name: 'Budget Presentation.pptx',
      description: '2025 budget planning presentation',
      fileName: 'budget-presentation.pptx',
      fileSize: 8192000, // 8 MB
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      category: 'PRESENTATION',
      isPublic: false,
      createdAt: new Date('2024-10-25'),
      updatedAt: new Date('2024-10-28'),
      project: { name: '2025 Planning' }
    },
    {
      id: '5',
      name: 'Invoice Template.xlsx',
      description: 'Standard invoice template for customer billing',
      fileName: 'invoice-template.xlsx',
      fileSize: 512000, // 512 KB
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      category: 'INVOICE',
      isPublic: true,
      createdAt: new Date('2024-09-15'),
      updatedAt: new Date('2024-10-01'),
      project: null
    }
  ]

  const categoryStats = mockDocuments.reduce((acc, doc) => {
    acc[doc.category] = (acc[doc.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalSize = mockDocuments.reduce((sum, doc) => sum + doc.fileSize, 0)
  const publicDocuments = mockDocuments.filter(doc => doc.isPublic).length

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />
    if (mimeType.includes('image')) return <FileImage className="h-5 w-5 text-blue-500" />
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="h-5 w-5 text-green-500" />
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return <Presentation className="h-5 w-5 text-orange-500" />
    return <File className="h-5 w-5 text-gray-500" />
  }

  const getCategoryBadge = (category: string) => {
    const categoryStyles = {
      CONTRACT: 'bg-blue-100 text-blue-800',
      INVOICE: 'bg-green-100 text-green-800',
      RECEIPT: 'bg-yellow-100 text-yellow-800',
      REPORT: 'bg-purple-100 text-purple-800',
      IMAGE: 'bg-pink-100 text-pink-800',
      SPREADSHEET: 'bg-emerald-100 text-emerald-800',
      PRESENTATION: 'bg-orange-100 text-orange-800',
      OTHER: 'bg-gray-100 text-gray-800'
    }
    
    return (
      <Badge className={categoryStyles[category as keyof typeof categoryStyles] || categoryStyles.OTHER}>
        {category.toLowerCase().replace('_', ' ')}
      </Badge>
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600 mt-1">Secure document management with version control</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Bulk Share
          </Button>
          <Link href="/dashboard/documents/upload">
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Documents
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search documents by name, description, or project..."
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{mockDocuments.length}</div>
            <p className="text-xs text-gray-500 mt-1">All files</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatFileSize(totalSize)}</div>
            <p className="text-xs text-gray-500 mt-1">Of 1 GB limit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Public Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{publicDocuments}</div>
            <p className="text-xs text-gray-500 mt-1">Shared access</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {mockDocuments.filter(doc => 
                doc.createdAt.getMonth() === new Date().getMonth()
              ).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">New uploads</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Document Library</CardTitle>
            </CardHeader>
            <CardContent>
              {mockDocuments.length > 0 ? (
                <div className="space-y-4">
                  {mockDocuments.map((document) => (
                    <div key={document.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          {getFileIcon(document.mimeType)}
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                                {document.name}
                              </h3>
                              {getCategoryBadge(document.category)}
                              {document.isPublic && (
                                <Badge variant="outline" className="text-xs">
                                  <Share2 className="h-3 w-3 mr-1" />
                                  Public
                                </Badge>
                              )}
                            </div>

                            {document.description && (
                              <p className="text-gray-600 text-sm mb-2">{document.description}</p>
                            )}

                            <div className="flex items-center space-x-6 text-sm text-gray-500">
                              <span>Size: <span className="font-medium">{formatFileSize(document.fileSize)}</span></span>
                              <span>Created: {format(document.createdAt, 'MMM d, yyyy')}</span>
                              {document.updatedAt > document.createdAt && (
                                <span>Modified: {format(document.updatedAt, 'MMM d, yyyy')}</span>
                              )}
                              {document.project && (
                                <span>Project: <span className="font-medium">{document.project.name}</span></span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                          <Button variant="outline" size="sm">
                            <Share2 className="h-3 w-3 mr-1" />
                            Share
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
                  <p className="text-gray-600 mb-4">Upload your first document to get started</p>
                  <Link href="/dashboard/documents/upload">
                    <Button>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Documents
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockDocuments.slice(0, 3).map((document) => (
                  <div key={document.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    {getFileIcon(document.mimeType)}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{document.name}</div>
                      <div className="text-sm text-gray-500">
                        {format(document.createdAt, 'MMM d, yyyy')} • {formatFileSize(document.fileSize)}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shared">
          <Card>
            <CardHeader>
              <CardTitle>Shared Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockDocuments.filter(doc => doc.isPublic).map((document) => (
                  <div key={document.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    {getFileIcon(document.mimeType)}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{document.name}</div>
                      <div className="text-sm text-gray-500">
                        Shared • {format(document.createdAt, 'MMM d, yyyy')}
                      </div>
                    </div>
                    <Badge variant="outline">
                      <Shield className="h-3 w-3 mr-1" />
                      Public
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(categoryStats).map(([category, count]) => (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    {getCategoryBadge(category)}
                    <span className="text-2xl font-bold text-gray-600">{count}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mockDocuments
                      .filter(doc => doc.category === category)
                      .slice(0, 3)
                      .map((document) => (
                        <div key={document.id} className="flex items-center space-x-2 text-sm">
                          {getFileIcon(document.mimeType)}
                          <span className="truncate">{document.name}</span>
                        </div>
                      ))}
                  </div>
                  {count > 3 && (
                    <div className="text-xs text-gray-500 mt-2">
                      +{count - 3} more documents
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Features Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-8 w-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Secure Sharing</h3>
              <p className="text-sm text-gray-600 mb-4">Encrypted document sharing with expiration dates</p>
              <Button variant="outline" size="sm">Configure Security</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-8 w-8 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Version Control</h3>
              <p className="text-sm text-gray-600 mb-4">Document versioning with change tracking</p>
              <Button variant="outline" size="sm">View Versions</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <File className="h-8 w-8 text-purple-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Compliance Vault</h3>
              <p className="text-sm text-gray-600 mb-4">Regulatory document storage with retention policies</p>
              <Button variant="outline" size="sm">Setup Retention</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
