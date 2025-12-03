
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { createS3Client } from '@/lib/aws-config'

export const dynamic = 'force-dynamic';

// Generate shareable link for receipts
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { receiptIds } = body

    if (!receiptIds || !Array.isArray(receiptIds) || receiptIds.length === 0) {
      return NextResponse.json({ error: 'Invalid receipt IDs' }, { status: 400 })
    }

    // Fetch receipts and verify ownership
    const receipts = await prisma.receipt.findMany({
      where: {
        id: { in: receiptIds },
        userId: session.user.id
      }
    })

    if (receipts.length === 0) {
      return NextResponse.json({ error: 'No receipts found' }, { status: 404 })
    }

    // Generate signed URLs for receipts with cloud storage paths
    const s3Client = createS3Client()
    const shareableReceipts = await Promise.all(
      receipts.map(async (receipt) => {
        let signedUrl = null
        
        if (receipt.cloudStoragePath) {
          try {
            const command = new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: receipt.cloudStoragePath
            })
            
            // URL expires in 7 days
            signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 604800 })
          } catch (error) {
            console.error('Error generating signed URL:', error)
          }
        }

        return {
          id: receipt.id,
          vendor: receipt.vendor,
          amount: receipt.amount,
          date: receipt.date,
          category: receipt.category,
          description: receipt.description,
          imageUrl: signedUrl,
          ocrText: receipt.ocrText
        }
      })
    )

    return NextResponse.json({ 
      receipts: shareableReceipts,
      expiresIn: 604800, // 7 days
      message: 'Share links generated successfully'
    })

  } catch (error) {
    console.error('Error generating share links:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
