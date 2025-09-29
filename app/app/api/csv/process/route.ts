
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { downloadFile } from '@/lib/s3'

// Simple expense categorization logic
function categorizeTransaction(description: string, amount: number): string {
  const desc = description.toLowerCase()
  
  // Income patterns
  if (amount >= 0) {
    if (desc.includes('salary') || desc.includes('payroll') || desc.includes('wage')) return 'Salary'
    if (desc.includes('dividend') || desc.includes('interest') || desc.includes('investment')) return 'Investment Income'
    return 'Other Income'
  }
  
  // Expense patterns
  if (desc.includes('grocery') || desc.includes('food') || desc.includes('restaurant') || desc.includes('dining')) {
    return 'Food & Dining'
  }
  if (desc.includes('gas') || desc.includes('fuel') || desc.includes('uber') || desc.includes('lyft') || desc.includes('taxi')) {
    return 'Transportation'
  }
  if (desc.includes('rent') || desc.includes('mortgage') || desc.includes('utilities') || desc.includes('electric') || desc.includes('water')) {
    return 'Housing'
  }
  if (desc.includes('amazon') || desc.includes('walmart') || desc.includes('target') || desc.includes('shopping')) {
    return 'Shopping'
  }
  if (desc.includes('doctor') || desc.includes('medical') || desc.includes('pharmacy') || desc.includes('health')) {
    return 'Healthcare'
  }
  if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('movie') || desc.includes('entertainment')) {
    return 'Entertainment'
  }
  if (desc.includes('insurance') || desc.includes('phone') || desc.includes('internet') || desc.includes('cable')) {
    return 'Bills & Utilities'
  }
  
  return 'Other Expenses'
}

function parseAmount(amountStr: string): number {
  // Remove currency symbols, commas, and spaces
  const cleanAmount = amountStr.toString().replace(/[^-\d.]/g, '')
  return parseFloat(cleanAmount) || 0
}

function parseDate(dateStr: string): Date {
  // Try different date formats
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    // Try MM/DD/YYYY format
    const parts = dateStr.split('/')
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]))
    }
  }
  return date
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { uploadId, userId, columnMapping } = body

    if (!uploadId || !userId || !columnMapping) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get upload record
    const upload = await prisma.csvUpload.findUnique({
      where: { id: uploadId }
    })

    if (!upload || upload.userId !== userId) {
      return NextResponse.json(
        { error: 'Upload not found' },
        { status: 404 }
      )
    }

    // Update status to processing
    await prisma.csvUpload.update({
      where: { id: uploadId },
      data: { status: 'PROCESSING' }
    })

    try {
      // Download file from S3
      const signedUrl = await downloadFile(upload.cloudStoragePath)
      const response = await fetch(signedUrl)
      const csvText = await response.text()

      // Parse CSV
      const lines = csvText.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      
      const transactions = []
      const errors = []

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
          const row: any = {}
          headers.forEach((header, index) => {
            row[header] = values[index] || ''
          })

          // Extract mapped values
          const dateValue = row[columnMapping.date]
          const amountValue = row[columnMapping.amount]
          const descriptionValue = row[columnMapping.description] || row[columnMapping.merchant] || 'Unknown'
          const categoryValue = row[columnMapping.category]
          const merchantValue = row[columnMapping.merchant]
          const accountValue = row[columnMapping.account]

          // Validate required fields
          if (!dateValue || !amountValue) {
            errors.push(`Row ${i}: Missing date or amount`)
            continue
          }

          // Parse values
          const parsedDate = parseDate(dateValue)
          const parsedAmount = parseAmount(amountValue)

          if (isNaN(parsedDate.getTime())) {
            errors.push(`Row ${i}: Invalid date format: ${dateValue}`)
            continue
          }

          if (isNaN(parsedAmount)) {
            errors.push(`Row ${i}: Invalid amount format: ${amountValue}`)
            continue
          }

          // Auto-categorize if no category provided
          const finalCategory = categoryValue || categorizeTransaction(descriptionValue, parsedAmount)

          // Determine transaction type
          const transactionType = parsedAmount >= 0 ? 'INCOME' : 'EXPENSE'

          transactions.push({
            userId,
            date: parsedDate,
            amount: Math.abs(parsedAmount),
            description: descriptionValue,
            merchant: merchantValue || null,
            category: finalCategory,
            type: transactionType,
            account: accountValue || null,
            csvUploadId: uploadId
          })
        } catch (error) {
          errors.push(`Row ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Get user categories to map to existing ones
      const userCategories = await prisma.category.findMany({
        where: { userId }
      })

      // Process transactions and link to categories
      let processedCount = 0
      for (const transaction of transactions) {
        try {
          // Find matching category
          const matchingCategory = userCategories.find(cat => 
            cat.name.toLowerCase() === transaction.category.toLowerCase()
          )

          await prisma.transaction.create({
            data: {
              ...transaction,
              categoryId: matchingCategory?.id || null,
              type: transaction.type as 'INCOME' | 'EXPENSE' | 'TRANSFER'
            }
          })
          processedCount++
        } catch (error) {
          errors.push(`Failed to save transaction: ${transaction.description}`)
        }
      }

      // Update upload status
      await prisma.csvUpload.update({
        where: { id: uploadId },
        data: {
          status: processedCount > 0 ? 'COMPLETED' : 'FAILED',
          processedCount,
          errorLog: errors.length > 0 ? errors.join('\n') : null
        }
      })

      return NextResponse.json({
        success: true,
        processedCount,
        totalRows: lines.length - 1,
        errors: errors.slice(0, 10) // Return first 10 errors
      })

    } catch (error) {
      console.error('Processing error:', error)
      
      // Update upload status to failed
      await prisma.csvUpload.update({
        where: { id: uploadId },
        data: {
          status: 'FAILED',
          errorLog: error instanceof Error ? error.message : 'Unknown processing error'
        }
      })

      return NextResponse.json(
        { error: 'Processing failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('CSV processing error:', error)
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    )
  }
}
