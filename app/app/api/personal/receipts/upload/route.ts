
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadFile } from '@/lib/s3'
import { getBucketConfig } from '@/lib/aws-config'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const vendor = formData.get('vendor') as string
    const amount = formData.get('amount') as string
    const date = formData.get('date') as string
    const category = formData.get('category') as string
    const description = formData.get('description') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Upload file to S3
    const buffer = Buffer.from(await file.arrayBuffer())
    const { folderPrefix } = getBucketConfig()
    const fileName = `${folderPrefix}receipts/${Date.now()}-${file.name}`
    const cloudStoragePath = await uploadFile(buffer, fileName)

    // Create receipt record
    const receipt = await prisma.receipt.create({
      data: {
        userId: session.user.id,
        vendor: vendor || null,
        amount: amount ? parseFloat(amount) : 0,
        date: date ? new Date(date) : new Date(),
        category: category || null,
        description: description || null,
        cloudStoragePath,
        processed: false
      }
    })

    return NextResponse.json({ receipt }, { status: 201 })
  } catch (error) {
    console.error('Error uploading receipt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
