
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const businessProfileId = searchParams.get('businessProfileId')

    // Build query
    const where: any = {
      userId: user.id
    }

    if (category && category !== 'ALL') {
      where.category = category
    }

    // Get documents
    const documents = await prisma.document.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        description: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        category: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Get stats
    const totalSize = documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0)
    const categoryCounts = documents.reduce((acc, doc) => {
      acc[doc.category] = (acc[doc.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      documents,
      stats: {
        totalDocuments: documents.length,
        totalSize,
        categoryCounts
      }
    })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get document and verify ownership
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { userId: true, cloudStoragePath: true }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (document.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete from database
    await prisma.document.delete({
      where: { id: documentId }
    })

    // TODO: Delete from S3 storage
    // await deleteFile(document.cloudStoragePath)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
