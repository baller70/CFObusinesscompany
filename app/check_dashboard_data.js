const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkData() {
  try {
    // Get user
    const user = await prisma.user.findFirst({
      where: { email: 'demo@business.com' }
    })
    
    if (!user) {
      console.log('User not found')
      return
    }
    
    console.log('User:', user.email, '- ID:', user.id)
    
    // Get business profiles
    const profiles = await prisma.businessProfile.findMany({
      where: { userId: user.id }
    })
    
    console.log('\n=== Business Profiles ===')
    profiles.forEach(p => {
      console.log(`- ${p.name} (${p.type}) - ID: ${p.id}, Active: ${p.isActive}, Current: ${p.isCurrent}`)
    })
    
    const currentProfile = profiles.find(p => p.isCurrent)
    const businessProfileId = currentProfile?.id
    
    console.log('\nCurrent Profile:', currentProfile?.name || 'None')
    
    // Get transactions
    const allTransactions = await prisma.transaction.findMany({
      where: { 
        userId: user.id,
        businessProfileId: businessProfileId || undefined
      },
      orderBy: { date: 'desc' },
      take: 20
    })
    
    console.log('\n=== Recent Transactions (Top 20) ===')
    console.log('Total transactions:', allTransactions.length)
    allTransactions.forEach(t => {
      console.log(`${t.date.toISOString().split('T')[0]} - ${t.type}: $${t.amount} - ${t.description}`)
    })
    
    // Get monthly aggregates
    const currentDate = new Date()
    const mostRecentTransaction = allTransactions[0]
    const targetDate = mostRecentTransaction?.date || currentDate
    const targetMonth = targetDate.getMonth()
    const targetYear = targetDate.getFullYear()
    const firstDayOfMonth = new Date(targetYear, targetMonth, 1)
    const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0)
    
    console.log(`\n=== Calculations for ${targetDate.toLocaleString('default', { month: 'long' })} ${targetYear} ===`)
    console.log('Date range:', firstDayOfMonth.toISOString().split('T')[0], 'to', lastDayOfMonth.toISOString().split('T')[0])
    
    const incomeTransactions = await prisma.transaction.aggregate({
      where: {
        userId: user.id,
        businessProfileId: businessProfileId || undefined,
        type: 'INCOME',
        date: { 
          gte: firstDayOfMonth,
          lte: lastDayOfMonth
        }
      },
      _sum: { amount: true },
      _count: true
    })
    
    const expenseTransactions = await prisma.transaction.aggregate({
      where: {
        userId: user.id,
        businessProfileId: businessProfileId || undefined,
        type: 'EXPENSE',
        date: { 
          gte: firstDayOfMonth,
          lte: lastDayOfMonth
        }
      },
      _sum: { amount: true },
      _count: true
    })
    
    console.log('\nIncome:', incomeTransactions._count, 'transactions, Total:', incomeTransactions._sum.amount || 0)
    console.log('Expenses:', expenseTransactions._count, 'transactions, Total:', Math.abs(expenseTransactions._sum.amount || 0))
    
    // Get budgets
    const budgets = await prisma.budget.findMany({
      where: { 
        userId: user.id,
        businessProfileId: businessProfileId || undefined,
        month: targetMonth + 1,
        year: targetYear
      }
    })
    
    console.log('\n=== Budgets for this month ===')
    console.log('Total budgets:', budgets.length)
    const totalAllocated = budgets.reduce((sum, b) => sum + (b.amount || 0), 0)
    const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0)
    console.log('Total Allocated:', totalAllocated)
    console.log('Total Spent:', totalSpent)
    
    budgets.forEach(b => {
      console.log(`- ${b.category}: Allocated $${b.amount}, Spent $${b.spent}`)
    })
    
    // Get bank statements
    const statements = await prisma.bankStatement.findMany({
      where: { 
        userId: user.id,
        businessProfileId: businessProfileId || undefined
      }
    })
    
    const completedStatements = statements.filter(s => s.status === 'COMPLETED').length
    
    console.log('\n=== Bank Statements ===')
    console.log('Total statements:', statements.length)
    console.log('Completed statements:', completedStatements)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()
