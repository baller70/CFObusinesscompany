import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Enhanced category mapping rules
const CATEGORY_RULES = {
  BUSINESS: {
    // Revenue
    'stripe': 'Business Revenue',
    'paypal': 'Business Revenue',
    'square': 'Business Revenue',
    'venmo business': 'Business Revenue',
    'mobile deposit': 'Business Revenue',
    'deposit': 'Business Revenue',
    'ach credit': 'Business Revenue',
    
    // Software & SaaS
    'aws': 'Software & SaaS',
    'google cloud': 'Software & SaaS',
    'microsoft 365': 'Software & SaaS',
    'dropbox': 'Software & SaaS',
    'slack': 'Software & SaaS',
    'zoom': 'Software & SaaS',
    'adobe': 'Software & SaaS',
    'github': 'Software & SaaS',
    'paddle.com': 'Software & SaaS',
    
    // Web & Hosting
    'namecheap': 'Website & Hosting',
    'godaddy': 'Website & Hosting',
    'bluehost': 'Website & Hosting',
    
    // Contractors & Freelancers
    'upwork': 'Contractor Payments',
    'freelancer': 'Contractor Payments',
    'fiverr': 'Contractor Payments',
    'payroll': 'Salaries & Wages',
    'superior plus': 'Contractor Payments',
    
    // Marketing
    'facebook ads': 'Marketing & Advertising',
    'google ads': 'Marketing & Advertising',
    'linkedin ads': 'Marketing & Advertising',
    
    // Shipping
    'fedex': 'Shipping & Logistics',
    'ups': 'Shipping & Logistics',
    'usps': 'Shipping & Logistics',
    'dhl': 'Shipping & Logistics',
    
    // Office
    'office depot': 'Office Supplies',
    'staples': 'Office Supplies',
    
    // Telecom
    'verizon business': 'Telecommunications',
    'at&t business': 'Telecommunications',
    'comcast business': 'Telecommunications',
    
    // Property
    'rent': 'Rent & Lease',
    'lease': 'Rent & Lease',
    'landlord': 'Rent & Lease',
    
    // Utilities
    'electric': 'Business Utilities',
    'gas company': 'Business Utilities',
    'water': 'Business Utilities',
    
    // Professional Services
    'accountant': 'Accounting Fees',
    'cpa': 'Accounting Fees',
    'lawyer': 'Legal Fees',
    'attorney': 'Legal Fees',
    'legal': 'Legal Fees',
    
    // Insurance & Loans
    'insurance': 'Business Insurance',
    'travelers insurance': 'Business Insurance',
    'state farm business': 'Business Insurance',
    'sba loan': 'Loan Payments',
    'loan payment': 'Loan Payments',
    
    // Bank Fees & Transfers
    'service charge': 'Bank Fees',
    'wire': 'Transfers',
    'transfer': 'Transfers',
  },
  
  PERSONAL: {
    // Groceries
    'walmart': 'Groceries',
    'shoprite': 'Groceries',
    'whole foods': 'Groceries',
    'costco': 'Groceries',
    'trader joe': 'Groceries',
    'acme': 'Groceries',
    'stop & shop': 'Groceries',
    'wegmans': 'Groceries',
    
    // Shopping
    'target': 'Shopping',
    'amazon': 'Shopping',
    'ebay': 'Shopping',
    'dicks sporting': 'Shopping',
    'big lots': 'Shopping',
    'marshalls': 'Shopping',
    'five below': 'Shopping',
    'michaels': 'Shopping',
    'petsmart': 'Shopping',
    'boutique': 'Shopping',
    'total wine': 'Shopping',
    'liquor': 'Shopping',
    'wine': 'Shopping',
    
    // Healthcare
    'cvs': 'Healthcare',
    'walgreens': 'Healthcare',
    'pharmacy': 'Healthcare',
    'doctor': 'Healthcare',
    'medical': 'Healthcare',
    'hospital': 'Healthcare',
    'dentist': 'Healthcare',
    
    // Dining & Restaurants
    'wendy': 'Dining & Restaurants',
    'mcdonald': 'Dining & Restaurants',
    'starbucks': 'Dining & Restaurants',
    'dunkin': 'Dining & Restaurants',
    'chipotle': 'Dining & Restaurants',
    'restaurant': 'Dining & Restaurants',
    'pizza': 'Dining & Restaurants',
    'cafe': 'Dining & Restaurants',
    'diner': 'Dining & Restaurants',
    'grill': 'Dining & Restaurants',
    'bar': 'Dining & Restaurants',
    'bistro': 'Dining & Restaurants',
    'joey tomatoes': 'Dining & Restaurants',
    'beach tacos': 'Dining & Restaurants',
    'johnny napkins': 'Dining & Restaurants',
    'froyo': 'Dining & Restaurants',
    'rita': 'Dining & Restaurants',
    
    // Entertainment
    'netflix': 'Entertainment',
    'hulu': 'Entertainment',
    'disney plus': 'Entertainment',
    'spotify': 'Entertainment',
    'apple music': 'Entertainment',
    'hbo': 'Entertainment',
    'paramount': 'Entertainment',
    'amazon prime': 'Entertainment',
    'amusement': 'Entertainment',
    'jenkinson': 'Entertainment',
    'fun center': 'Entertainment',
    
    // Gas & Fuel
    'shell': 'Gas & Fuel',
    'exxon': 'Gas & Fuel',
    'bp gas': 'Gas & Fuel',
    'chevron': 'Gas & Fuel',
    'sunoco': 'Gas & Fuel',
    'wawa': 'Gas & Fuel',
    'us gas': 'Gas & Fuel',
    
    // Personal Care
    'salon': 'Personal Care',
    'barber': 'Personal Care',
    'spa': 'Personal Care',
    'massage': 'Personal Care',
    'hair': 'Personal Care',
    'nail': 'Personal Care',
    'pose cuts': 'Personal Care',
    
    // Fitness
    'planet fitness': 'Fitness & Wellness',
    'la fitness': 'Fitness & Wellness',
    'gym': 'Fitness & Wellness',
    'yoga': 'Fitness & Wellness',
    'golf': 'Fitness & Wellness',
    
    // Bills & Utilities
    't-mobile': 'Bills & Utilities',
    'verizon': 'Bills & Utilities',
    'at&t': 'Bills & Utilities',
    'comcast': 'Bills & Utilities',
    'optimum': 'Bills & Utilities',
    'pseg': 'Bills & Utilities',
    'firstenergy': 'Bills & Utilities',
    'electric': 'Bills & Utilities',
    'water': 'Bills & Utilities',
    'gas company': 'Bills & Utilities',
    'internet': 'Bills & Utilities',
    'phone': 'Bills & Utilities',
    
    // Transportation
    'lyft': 'Transportation',
    'uber': 'Transportation',
    
    // Vehicle
    'mavis': 'Vehicle Maintenance',
    'jiffy lube': 'Vehicle Maintenance',
    'auto': 'Vehicle Maintenance',
    
    // Subscriptions
    'apple.com': 'Subscriptions',
    'google': 'Subscriptions',
    
    // Housing
    'mortgage': 'Rent/Mortgage',
    'rent': 'Rent/Mortgage',
    
    // Mall/Shopping centers (broader context)
    'short hills': 'Shopping',
  }
};

function categorizeTransaction(description, profileType) {
  const desc = description.toLowerCase();
  
  // Check rules based on profile type
  const rules = profileType === 'BUSINESS' ? CATEGORY_RULES.BUSINESS : CATEGORY_RULES.PERSONAL;
  
  for (const [keyword, category] of Object.entries(rules)) {
    if (desc.includes(keyword)) {
      return category;
    }
  }
  
  // Default fallback
  return profileType === 'BUSINESS' ? 'Other Expenses' : 'Other Expenses';
}

async function categorizeAllTransactions() {
  try {
    console.log('='.repeat(80));
    console.log('ENHANCED AI-POWERED TRANSACTION CATEGORIZATION');
    console.log('='.repeat(80));

    const user = await prisma.user.findFirst({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: {
        businessProfiles: true
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    let totalCategorized = 0;

    for (const profile of user.businessProfiles) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📊 CATEGORIZING: ${profile.name} (${profile.type})`);
      console.log('='.repeat(80));

      const transactions = await prisma.transaction.findMany({
        where: { businessProfileId: profile.id },
        orderBy: { date: 'asc' }
      });

      console.log(`\n📈 Total Transactions: ${transactions.length}`);

      const categoryCount = {};
      let updated = 0;

      for (const transaction of transactions) {
        const newCategory = categorizeTransaction(transaction.description, profile.type);
        
        // Update if different from current
        if (transaction.category !== newCategory) {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { category: newCategory }
          });
          updated++;
        }
        
        categoryCount[newCategory] = (categoryCount[newCategory] || 0) + 1;
      }

      console.log(`\n✅ Updated: ${updated} transactions`);
      console.log(`\n📂 Category Breakdown (Top 20):`);
      Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .forEach(([cat, count]) => {
          console.log(`   ${cat}: ${count} transactions`);
        });

      totalCategorized += updated;
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ CATEGORIZATION COMPLETE`);
    console.log(`📊 Total Transactions Updated: ${totalCategorized}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

categorizeAllTransactions();
