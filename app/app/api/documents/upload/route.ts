
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadFileWithKey } from '@/lib/s3'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, currentBusinessProfileId: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const description = formData.get('description') as string | null
    const category = formData.get('category') as string || 'OTHER'
    const businessProfileId = formData.get('businessProfileId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Generate S3 key (cloud_storage_path)
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const s3Key = `users/${user.id}/documents/${timestamp}-${sanitizedFileName}`

    // Upload to S3
    const cloudStoragePath = await uploadFileWithKey(buffer, s3Key, file.type)

    // Save document metadata to database
    const document = await prisma.document.create({
      data: {
        userId: user.id,
        name: name || file.name,
        description,
        fileName: file.name,
        cloudStoragePath,
        fileSize: file.size,
        mimeType: file.type,
        category: category as any,
        isPublic: false, // Always private by default
      }
    })

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        name: document.name,
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        category: document.category,
        createdAt: document.createdAt
      }
    })
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
