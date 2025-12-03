
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadFile } from '@/lib/s3'
import { getBucketConfig } from '@/lib/aws-config'

export const dynamic = 'force-dynamic';

// Process receipts with OCR and AI analysis
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    const userId = session.user.id

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const results = []
    const bucketConfig = getBucketConfig()

    for (const file of files) {
      try {
        // Upload file to S3
        const buffer = Buffer.from(await file.arrayBuffer())
        const fileName = `${bucketConfig.folderPrefix}receipts/${Date.now()}-${file.name}`
        const cloudStoragePath = await uploadFile(buffer, fileName)

        // Process with OCR (simulated - would integrate with actual OCR service)
        const ocrResult = await processReceiptOCR(buffer, file.name)
        
        // Analyze with AI
        const aiAnalysis = await analyzeReceiptWithAI(ocrResult)
        
        // Determine tax deductibility
        const taxDeductible = determineTaxDeductibility(aiAnalysis)
        
        // Create receipt record
        const receipt = await prisma.receipt.create({
          data: {
            userId,
            vendor: aiAnalysis.vendor,
            amount: aiAnalysis.amount,
            date: aiAnalysis.date || new Date(),
            category: aiAnalysis.category,
            description: aiAnalysis.description,
            cloudStoragePath,
            ocrText: ocrResult.text,
            ocrData: ocrResult.structuredData,
            aiAnalysis: aiAnalysis,
            processed: true,
            confidence: ocrResult.confidence,
            taxDeductible,
            businessExpense: aiAnalysis.businessExpense || true
          }
        })

        // Create transaction if amount is significant
        if (aiAnalysis.amount > 10) {
          await createTransactionFromReceipt(userId, receipt, aiAnalysis)
        }

        results.push({
          success: true,
          receiptId: receipt.id,
          vendor: aiAnalysis.vendor,
          amount: aiAnalysis.amount,
          category: aiAnalysis.category,
          taxDeductible,
          confidence: ocrResult.confidence
        })

      } catch (error) {
        console.error('Receipt processing error:', error)
        results.push({
          success: false,
          fileName: file.name,
          error: 'Processing failed'
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        totalProcessed: files.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        totalAmount: results.reduce((sum, r) => sum + (r.amount || 0), 0),
        taxDeductibleAmount: results.filter(r => r.taxDeductible).reduce((sum, r) => sum + (r.amount || 0), 0)
      }
    })

  } catch (error) {
    console.error('Receipt OCR processing error:', error)
    return NextResponse.json({ error: 'Failed to process receipts' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const processed = searchParams.get('processed') === 'true'
    const taxDeductible = searchParams.get('taxDeductible') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const receipts = await prisma.receipt.findMany({
      where: {
        userId: session.user.id,
        ...(processed !== undefined && { processed }),
        ...(taxDeductible !== undefined && { taxDeductible }),
        ...(startDate && endDate && {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
      },
      orderBy: { date: 'desc' },
      take: limit
    })

    const summary = {
      totalReceipts: receipts.length,
      processedReceipts: receipts.filter(r => r.processed).length,
      taxDeductibleReceipts: receipts.filter(r => r.taxDeductible).length,
      totalAmount: receipts.reduce((sum, r) => sum + r.amount, 0),
      taxDeductibleAmount: receipts.filter(r => r.taxDeductible).reduce((sum, r) => sum + r.amount, 0),
      avgConfidence: receipts.length > 0 ? receipts.reduce((sum, r) => sum + (r.confidence || 0), 0) / receipts.length : 0
    }

    return NextResponse.json({ receipts, summary })

  } catch (error) {
    console.error('Get receipts error:', error)
    return NextResponse.json({ error: 'Failed to get receipts' }, { status: 500 })
  }
}

// Simulated OCR processing (would integrate with actual service like AWS Textract)
async function processReceiptOCR(buffer: Buffer, fileName: string): Promise<any> {
  // Simulate OCR processing delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Simulated OCR results - in production, this would call actual OCR service
  const mockResults = [
    {
      vendor: "Office Depot",
      amount: 45.67,
      date: "2024-01-15",
      items: ["Paper", "Pens", "Folders"],
      tax: 3.65,
      category: "Office Supplies"
    },
    {
      vendor: "Starbucks",
      amount: 12.50,
      date: "2024-01-15",
      items: ["Coffee", "Pastry"],
      tax: 1.25,
      category: "Meals"
    },
    {
      vendor: "Shell Gas Station",
      amount: 89.32,
      date: "2024-01-15",
      items: ["Gasoline"],
      tax: 7.15,
      category: "Vehicle"
    }
  ]

  const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)]
  
  return {
    text: `Receipt from ${randomResult.vendor}\nDate: ${randomResult.date}\nAmount: $${randomResult.amount}\nItems: ${randomResult.items.join(', ')}\nTax: $${randomResult.tax}`,
    structuredData: randomResult,
    confidence: 0.85 + Math.random() * 0.1 // 85-95% confidence
  }
}

// AI analysis of receipt data
async function analyzeReceiptWithAI(ocrResult: any): Promise<any> {
  const data = ocrResult.structuredData
  
  // Business expense categorization logic
  const businessCategories: { [key: string]: { deductible: boolean, description: string } } = {
    "Office Supplies": { deductible: true, description: "Fully deductible office supplies" },
    "Meals": { deductible: true, description: "50% deductible business meals" },
    "Vehicle": { deductible: true, description: "Business vehicle expenses" },
    "Travel": { deductible: true, description: "Business travel expenses" },
    "Equipment": { deductible: true, description: "Business equipment and tools" },
    "Software": { deductible: true, description: "Business software subscriptions" },
    "Professional": { deductible: true, description: "Professional services" },
    "Marketing": { deductible: true, description: "Marketing and advertising" },
    "Utilities": { deductible: true, description: "Business utilities" }
  }

  const category = data.category || "General"
  const categoryInfo = businessCategories[category] || { deductible: false, description: "Personal expense" }

  return {
    vendor: data.vendor,
    amount: data.amount,
    date: new Date(data.date),
    category: category,
    description: `${data.vendor} - ${data.items.join(', ')}`,
    businessExpense: categoryInfo.deductible,
    deductibilityReason: categoryInfo.description,
    aiSuggestions: [
      "Review for business purpose documentation",
      "Keep receipt for tax records",
      categoryInfo.deductible ? "Ensure business use percentage is accurate" : "Verify if any portion is business-related"
    ],
    extractedItems: data.items,
    taxAmount: data.tax,
    confidence: 0.9
  }
}

function determineTaxDeductibility(aiAnalysis: any): boolean {
  // Business expense categories that are typically tax deductible
  const deductibleCategories = [
    'Office Supplies', 'Equipment', 'Software', 'Professional', 
    'Marketing', 'Utilities', 'Travel', 'Vehicle', 'Insurance'
  ]
  
  const isBusinessCategory = deductibleCategories.includes(aiAnalysis.category)
  const isBusinessExpense = aiAnalysis.businessExpense
  const hasBusinessKeywords = aiAnalysis.description.toLowerCase().includes('business') || 
                               aiAnalysis.description.toLowerCase().includes('work') ||
                               aiAnalysis.description.toLowerCase().includes('office')

  return isBusinessCategory || isBusinessExpense || hasBusinessKeywords
}

async function createTransactionFromReceipt(userId: string, receipt: any, aiAnalysis: any): Promise<void> {
  try {
    await prisma.transaction.create({
      data: {
        userId,
        date: receipt.date,
        amount: -Math.abs(receipt.amount), // Negative for expense
        description: aiAnalysis.description,
        merchant: aiAnalysis.vendor,
        category: aiAnalysis.category,
        type: 'EXPENSE',
        aiCategorized: true,
        confidence: aiAnalysis.confidence
      }
    })
  } catch (error) {
    console.error('Error creating transaction from receipt:', error)
  }
}
