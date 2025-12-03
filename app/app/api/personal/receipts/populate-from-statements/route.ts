
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic';

// Shopping and retail categories
const SHOPPING_CATEGORIES = [
  'Groceries',
  'Department Stores',
  'Clothing',
  'Electronics',
  'Home & Garden',
  'Pharmacy',
  'Sporting Goods',
  'Books & Music',
  'Toys & Hobbies',
  'Pet Supplies',
  'Office Supplies',
  'Convenience Stores'
]

// Keywords to identify shopping transactions
const SHOPPING_KEYWORDS = [
  'walmart', 'target', 'costco', 'safeway', 'kroger', 'whole foods', 'trader joe',
  'amazon', 'ebay', 'nordstrom', 'macys', 'kohls', 'jcpenney', 'best buy',
  'home depot', 'lowes', 'ikea', 'bed bath', 'cvs', 'walgreens', 'rite aid',
  'petco', 'petsmart', 'staples', 'office depot', 'dollar', 'grocery', 'market',
  'food', 'supermarket', 'store', 'shop', 'retail', 'mall'
]

function isShoppingTransaction(description: string, category: string): boolean {
  const lowerDesc = description?.toLowerCase() || ''
  const lowerCat = category?.toLowerCase() || ''
  
  // Check if category matches shopping categories
  if (SHOPPING_CATEGORIES.some(cat => lowerCat.includes(cat.toLowerCase()))) {
    return true
  }
  
  // Check if description contains shopping keywords
  return SHOPPING_KEYWORDS.some(keyword => lowerDesc.includes(keyword))
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all transactions from bank statements
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        amount: { lt: 0 } // Only expenses (negative amounts)
      },
      orderBy: { date: 'desc' }
    })

    // Filter for shopping transactions
    const shoppingTransactions = transactions.filter(t => 
      isShoppingTransaction(t.description || '', t.category || '')
    )

    // Create receipts for shopping transactions that don't already exist
    let created = 0
    for (const transaction of shoppingTransactions) {
      // Check if receipt already exists
      const existing = await prisma.receipt.findFirst({
        where: {
          userId: session.user.id,
          vendor: transaction.description,
          amount: Math.abs(transaction.amount),
          date: transaction.date
        }
      })

      if (!existing) {
        await prisma.receipt.create({
          data: {
            userId: session.user.id,
            vendor: transaction.description || 'Unknown Vendor',
            amount: Math.abs(transaction.amount),
            date: transaction.date,
            category: transaction.category || 'General Shopping',
            description: `Auto-imported from bank statement`,
            processed: true,
            businessExpense: false
          }
        })
        created++
      }
    }

    return NextResponse.json({ 
      success: true, 
      created,
      total: shoppingTransactions.length 
    })
  } catch (error) {
    console.error('Error populating receipts from statements:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
