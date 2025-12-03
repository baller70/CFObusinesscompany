
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadFileWithKey } from '@/lib/s3'

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const taxYear = formData.get('taxYear') as string
    const documentType = formData.get('documentType') as string
    const description = formData.get('description') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Upload to S3
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name
    const cloudStoragePath = await uploadFileWithKey(
      buffer,
      `tax-documents/${Date.now()}-${fileName}`,
      file.type
    )

    // Map form document type to TaxDocumentType enum
    const mapDocumentType = (type: string): string => {
      const typeMap: Record<string, string> = {
        'W2': 'W2',
        '1099-INT': 'FORM_1099',
        '1099-DIV': 'FORM_1099',
        '1099-B': 'FORM_1099',
        '1099-MISC': 'FORM_1099',
        '1099-NEC': 'FORM_1099',
        'K1': 'SCHEDULE_E',
        'MORTGAGE_INTEREST': 'RECEIPT',
        'PROPERTY_TAX': 'PROPERTY_TAX',
        'CHARITABLE_RECEIPT': 'CHARITABLE_RECEIPT',
        'MEDICAL_EXPENSE': 'RECEIPT',
        'EDUCATION_EXPENSE': 'RECEIPT',
        'OTHER': 'OTHER'
      }
      return typeMap[type] || 'OTHER'
    }

    // Determine category based on document type
    const determineCategory = (type: string): string => {
      if (type.includes('1099') || type === 'W2') return 'INCOME'
      if (type.includes('CHARITABLE') || type.includes('MEDICAL') || type.includes('MORTGAGE')) return 'DEDUCTION'
      return 'OTHER'
    }

    // Save to database
    const taxDocument = await prisma.taxDocument.create({
      data: {
        userId: user.id,
        businessProfileId: null, // Personal tax document
        name: fileName,
        fileName: fileName,
        description: description || undefined,
        documentType: mapDocumentType(documentType) as any,
        category: determineCategory(documentType) as any,
        taxYear: parseInt(taxYear),
        cloudStoragePath,
        fileSize: file.size,
      }
    })

    return NextResponse.json({ 
      success: true, 
      document: taxDocument 
    })
  } catch (error) {
    console.error('Error uploading tax document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
