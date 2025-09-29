
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { uploadFile } from '@/lib/s3'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const columnMapping = formData.get('columnMapping') as string

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are supported' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload to S3
    const cloudStoragePath = await uploadFile(buffer, file.name)

    // Count records
    const text = buffer.toString('utf-8')
    const lines = text.split('\n').filter(line => line.trim())
    const recordCount = Math.max(0, lines.length - 1) // Subtract header

    // Create upload record
    const csvUpload = await prisma.csvUpload.create({
      data: {
        userId,
        fileName: file.name,
        originalName: file.name,
        cloudStoragePath,
        recordCount,
        status: 'PENDING',
        mappingConfig: columnMapping ? JSON.parse(columnMapping) : null
      }
    })

    return NextResponse.json({
      success: true,
      uploadId: csvUpload.id,
      recordCount: csvUpload.recordCount
    })
  } catch (error) {
    console.error('CSV upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
