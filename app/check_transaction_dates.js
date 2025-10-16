const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDates() {
  const transactions = await prisma.transaction.findMany({
    select: {
      date: true,
      amount: true,
      category: true
    },
    orderBy: { date: 'desc' },
    take: 20
  });
  
  console.log('Recent 20 transactions:');
  transactions.forEach(t => {
    console.log(`${t.date.toISOString().split('T')[0]} - ${t.category}: $${t.amount}`);
  });
  
  const dateGroups = await prisma.$queryRaw`
    SELECT 
      TO_CHAR(date, 'YYYY-MM') as month,
      COUNT(*) as count,
      SUM(amount) as total
    FROM "Transaction"
    GROUP BY TO_CHAR(date, 'YYYY-MM')
    ORDER BY month DESC
    LIMIT 12
  `;
  
  console.log('\nTransactions by month:');
  dateGroups.forEach(g => {
    console.log(`${g.month}: ${g.count} transactions, Total: $${parseFloat(g.total).toFixed(2)}`);
  });
  
  await prisma.$disconnect();
}

checkDates();
