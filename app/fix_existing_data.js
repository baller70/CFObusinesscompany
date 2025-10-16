require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixExistingData() {
  try {
    console.log('\n=== FIXING EXISTING DATA ===\n');
    
    // Get all transactions
    const transactions = await prisma.transaction.findMany({
      include: {
        categoryRelation: true
      }
    });
    
    console.log(`Found ${transactions.length} transactions to analyze`);
    
    let fixedCount = 0;
    
    for (const txn of transactions) {
      let shouldBeType = txn.type;
      
      // Determine correct type based on category
      const categoryLower = txn.category.toLowerCase();
      
      if (categoryLower.includes('income') || 
          categoryLower.includes('salary') || 
          categoryLower.includes('freelance') || 
          categoryLower.includes('dividend') ||
          categoryLower.includes('interest')) {
        shouldBeType = 'INCOME';
      } else if (categoryLower.includes('transfer')) {
        shouldBeType = 'TRANSFER';
      } else {
        // Most categories are expenses
        shouldBeType = 'EXPENSE';
      }
      
      // Update if wrong
      if (txn.type !== shouldBeType) {
        await prisma.transaction.update({
          where: { id: txn.id },
          data: { type: shouldBeType }
        });
        
        // Also update the category type
        if (txn.categoryRelation) {
          await prisma.category.update({
            where: { id: txn.categoryRelation.id },
            data: { type: shouldBeType === 'INCOME' ? 'INCOME' : 'EXPENSE' }
          });
        }
        
        fixedCount++;
        console.log(`Fixed: ${txn.description} - ${txn.category} - Changed from ${txn.type} to ${shouldBeType}`);
      }
    }
    
    console.log(`\nFixed ${fixedCount} transactions`);
    
    // Recalculate budgets with correct spent amounts
    console.log('\n=== RECALCULATING BUDGETS ===\n');
    
    const budgets = await prisma.budget.findMany();
    console.log(`Found ${budgets.length} budgets to recalculate`);
    
    for (const budget of budgets) {
      // Get all transactions for this category, month, and year
      const monthTransactions = await prisma.transaction.findMany({
        where: {
          userId: budget.userId,
          businessProfileId: budget.businessProfileId,
          category: budget.category,
          date: {
            gte: new Date(budget.year, budget.month - 1, 1),
            lt: new Date(budget.year, budget.month, 1)
          }
        }
      });
      
      const totalSpent = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
      const suggestedAllocated = Math.max(totalSpent * 1.2, 100);
      
      await prisma.budget.update({
        where: { id: budget.id },
        data: {
          spent: totalSpent,
          amount: budget.amount || suggestedAllocated
        }
      });
      
      console.log(`Updated budget: ${budget.category} (${budget.month}/${budget.year}) - Allocated: $${suggestedAllocated.toFixed(2)}, Spent: $${totalSpent.toFixed(2)}`);
    }
    
    // Create recurring charges from existing transactions
    console.log('\n=== CREATING RECURRING CHARGES ===\n');
    
    const recurringTransactions = transactions.filter(t => t.isRecurring && t.type === 'EXPENSE');
    console.log(`Found ${recurringTransactions.length} recurring expense transactions`);
    
    const createdCharges = [];
    
    for (const txn of recurringTransactions) {
      // Check if charge already exists
      const existing = await prisma.recurringCharge.findFirst({
        where: {
          userId: txn.userId,
          name: {
            contains: txn.merchant || txn.description.substring(0, 30),
            mode: 'insensitive'
          }
        }
      });
      
      if (!existing) {
        const desc = txn.description.toLowerCase();
        let frequency = 'MONTHLY';
        
        if (desc.includes('weekly')) frequency = 'WEEKLY';
        else if (desc.includes('quarterly')) frequency = 'QUARTERLY';
        else if (desc.includes('annual') || desc.includes('yearly')) frequency = 'YEARLY';
        
        const nextDue = new Date(txn.date);
        if (frequency === 'WEEKLY') nextDue.setDate(nextDue.getDate() + 7);
        else if (frequency === 'MONTHLY') nextDue.setMonth(nextDue.getMonth() + 1);
        else if (frequency === 'QUARTERLY') nextDue.setMonth(nextDue.getMonth() + 3);
        else if (frequency === 'YEARLY') nextDue.setFullYear(nextDue.getFullYear() + 1);
        
        await prisma.recurringCharge.create({
          data: {
            userId: txn.userId,
            businessProfileId: txn.businessProfileId,
            name: txn.merchant || txn.description,
            amount: txn.amount,
            frequency,
            category: txn.category,
            nextDueDate: nextDue,
            annualAmount: frequency === 'YEARLY' ? txn.amount : 
                         frequency === 'MONTHLY' ? txn.amount * 12 :
                         frequency === 'QUARTERLY' ? txn.amount * 4 :
                         txn.amount * 52,
            isActive: true
          }
        });
        
        createdCharges.push(txn.description);
        console.log(`Created: ${txn.merchant || txn.description} - $${txn.amount} ${frequency}`);
      }
    }
    
    console.log(`\nCreated ${createdCharges.length} recurring charges`);
    
    // Show summary
    console.log('\n=== SUMMARY ===\n');
    
    const allTransactions = await prisma.transaction.findMany();
    const totalIncome = allTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = allTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
    
    console.log(`Total Transactions: ${allTransactions.length}`);
    console.log(`Income Transactions: ${allTransactions.filter(t => t.type === 'INCOME').length} ($${totalIncome.toFixed(2)})`);
    console.log(`Expense Transactions: ${allTransactions.filter(t => t.type === 'EXPENSE').length} ($${totalExpense.toFixed(2)})`);
    console.log(`Transfer Transactions: ${allTransactions.filter(t => t.type === 'TRANSFER').length}`);
    
    const allBudgets = await prisma.budget.findMany();
    console.log(`\nTotal Budgets: ${allBudgets.length}`);
    console.log(`Total Allocated: $${allBudgets.reduce((sum, b) => sum + (b.amount || 0), 0).toFixed(2)}`);
    console.log(`Total Spent: $${allBudgets.reduce((sum, b) => sum + (b.spent || 0), 0).toFixed(2)}`);
    
    const allRecurring = await prisma.recurringCharge.findMany();
    console.log(`\nTotal Recurring Charges: ${allRecurring.length}`);
    console.log(`Total Recurring Amount: $${allRecurring.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixExistingData();
