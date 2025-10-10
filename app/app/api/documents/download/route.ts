
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { downloadFile } from '@/lib/s3'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentId, verificationToken } = await request.json()

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
    }

    if (!verificationToken) {
      return NextResponse.json({ error: 'Verification token is required. Please verify your password first.' }, { status: 403 })
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
      select: {
        id: true,
        userId: true,
        name: true,
        fileName: true,
        cloudStoragePath: true,
        mimeType: true,
        isPublic: true
      }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Check if user owns the document or if document is public
    if (document.userId !== user.id && !document.isPublic) {
      return NextResponse.json({ error: 'Access denied. You do not have permission to access this document.' }, { status: 403 })
    }

    // Get signed URL for download
    const downloadUrl = await downloadFile(document.cloudStoragePath)

    return NextResponse.json({
      success: true,
      downloadUrl,
      fileName: document.fileName,
      mimeType: document.mimeType
    })
  } catch (error) {
    console.error('Document download error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
