
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadFile } from '@/lib/s3'
import { getBucketConfig } from '@/lib/aws-config'
import { processReceiptWithAzureOCR } from '@/lib/azure-ocr'

// Upload receipts with OCR processing
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const results = []
    const { folderPrefix } = getBucketConfig()

    for (const file of files) {
      try {
        // Upload file to S3
        const buffer = Buffer.from(await file.arrayBuffer())
        const fileName = `${folderPrefix}receipts/${Date.now()}-${file.name}`
        const cloudStoragePath = await uploadFile(buffer, fileName)

        // Process with Azure OCR
        const ocrResult = await processReceiptWithAzureOCR(buffer, file.name)
        
        // Analyze for tax deductibility
        const taxDeductible = determineTaxDeductibility(ocrResult.structuredData)
        
        // Create receipt record
        const receipt = await prisma.receipt.create({
          data: {
            userId: session.user.id,
            vendor: ocrResult.structuredData.vendor || 'Unknown Vendor',
            amount: ocrResult.structuredData.amount || 0,
            date: ocrResult.structuredData.date ? new Date(ocrResult.structuredData.date) : new Date(),
            category: ocrResult.structuredData.category || 'Other',
            description: ocrResult.structuredData.items?.join(', ') || '',
            cloudStoragePath,
            ocrText: ocrResult.text,
            ocrData: ocrResult.structuredData as any,
            aiAnalysis: {
              confidence: ocrResult.confidence,
              processedAt: new Date().toISOString(),
              taxAnalysis: {
                deductible: taxDeductible,
                category: ocrResult.structuredData.category
              }
            } as any,
            processed: true,
            confidence: ocrResult.confidence,
            taxDeductible,
            businessExpense: taxDeductible
          }
        })

        results.push({
          success: true,
          receiptId: receipt.id,
          vendor: receipt.vendor,
          amount: receipt.amount,
          category: receipt.category,
          taxDeductible,
          confidence: ocrResult.confidence
        })

      } catch (error) {
        console.error('Error processing receipt:', error)
        results.push({
          success: false,
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Processing failed'
        })
      }
    }

    const summary = {
      totalProcessed: files.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalAmount: results.reduce((sum, r) => sum + (r.amount || 0), 0),
      taxDeductibleAmount: results.filter(r => r.taxDeductible).reduce((sum, r) => sum + (r.amount || 0), 0)
    }

    return NextResponse.json({ 
      success: true, 
      results, 
      summary 
    }, { status: 201 })

  } catch (error) {
    console.error('Error uploading receipts with OCR:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function determineTaxDeductibility(structuredData: any): boolean {
  const deductibleCategories = [
    'Office Supplies', 
    'Gas Stations', 
    'Restaurants',
    'Electronics',
    'Professional',
    'Marketing',
    'Utilities',
    'Travel'
  ]
  
  return deductibleCategories.includes(structuredData.category)
}
