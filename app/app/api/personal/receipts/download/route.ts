
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { createS3Client } from '@/lib/aws-config'

export const dynamic = 'force-dynamic';

// Download receipt image
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const receiptId = searchParams.get('id')

    if (!receiptId) {
      return NextResponse.json({ error: 'Receipt ID required' }, { status: 400 })
    }

    // Fetch receipt and verify ownership
    const receipt = await prisma.receipt.findFirst({
      where: {
        id: receiptId,
        userId: session.user.id
      }
    })

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    if (!receipt.cloudStoragePath) {
      return NextResponse.json({ error: 'No image available' }, { status: 404 })
    }

    // Generate signed URL
    const s3Client = createS3Client()
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: receipt.cloudStoragePath
    })
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }) // 1 hour

    return NextResponse.json({ 
      url: signedUrl,
      fileName: receipt.cloudStoragePath.split('/').pop()
    })

  } catch (error) {
    console.error('Error downloading receipt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
