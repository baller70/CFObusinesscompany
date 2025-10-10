
/**
 * Default categories for different profile types
 */

export type CategoryDefinition = {
  name: string;
  type: 'EXPENSE' | 'INCOME';
  color: string;
  icon: string;
  budget?: number;
};

/**
 * Household/Personal finance categories
 * Focus: Family expenses, personal obligations, household management
 */
export const HOUSEHOLD_CATEGORIES: CategoryDefinition[] = [
  // Housing & Utilities
  { name: 'Mortgage/Rent', type: 'EXPENSE', color: '#3B82F6', icon: 'home' },
  { name: 'Property Tax', type: 'EXPENSE', color: '#2563EB', icon: 'file-text' },
  { name: 'Home Insurance', type: 'EXPENSE', color: '#1E40AF', icon: 'shield' },
  { name: 'Home Maintenance', type: 'EXPENSE', color: '#1E3A8A', icon: 'wrench' },
  { name: 'Electricity', type: 'EXPENSE', color: '#F59E0B', icon: 'zap' },
  { name: 'Water & Sewer', type: 'EXPENSE', color: '#0EA5E9', icon: 'droplet' },
  { name: 'Gas/Heating', type: 'EXPENSE', color: '#EF4444', icon: 'flame' },
  { name: 'Internet & Cable', type: 'EXPENSE', color: '#8B5CF6', icon: 'wifi' },
  { name: 'Phone', type: 'EXPENSE', color: '#6366F1', icon: 'phone' },
  { name: 'Trash/Recycling', type: 'EXPENSE', color: '#78716C', icon: 'trash-2' },
  
  // Transportation
  { name: 'Car Payment', type: 'EXPENSE', color: '#10B981', icon: 'car' },
  { name: 'Car Insurance', type: 'EXPENSE', color: '#059669', icon: 'shield-check' },
  { name: 'Gas & Fuel', type: 'EXPENSE', color: '#F97316', icon: 'fuel' },
  { name: 'Car Maintenance', type: 'EXPENSE', color: '#EA580C', icon: 'tool' },
  { name: 'Public Transit', type: 'EXPENSE', color: '#0891B2', icon: 'bus' },
  { name: 'Parking & Tolls', type: 'EXPENSE', color: '#0E7490', icon: 'parking-circle' },
  
  // Food & Dining
  { name: 'Groceries', type: 'EXPENSE', color: '#84CC16', icon: 'shopping-cart' },
  { name: 'Restaurants', type: 'EXPENSE', color: '#F59E0B', icon: 'utensils' },
  { name: 'Coffee & Snacks', type: 'EXPENSE', color: '#D97706', icon: 'coffee' },
  { name: 'School Lunches', type: 'EXPENSE', color: '#CA8A04', icon: 'apple' },
  
  // Healthcare
  { name: 'Health Insurance', type: 'EXPENSE', color: '#EC4899', icon: 'heart-pulse' },
  { name: 'Medical Bills', type: 'EXPENSE', color: '#DB2777', icon: 'stethoscope' },
  { name: 'Prescriptions', type: 'EXPENSE', color: '#BE185D', icon: 'pill' },
  { name: 'Dental Care', type: 'EXPENSE', color: '#9F1239', icon: 'smile' },
  { name: 'Vision Care', type: 'EXPENSE', color: '#881337', icon: 'eye' },
  { name: 'Fitness & Wellness', type: 'EXPENSE', color: '#A855F7', icon: 'activity' },
  
  // Children & Education
  { name: 'Childcare', type: 'EXPENSE', color: '#FDE047', icon: 'baby' },
  { name: 'School Tuition', type: 'EXPENSE', color: '#FACC15', icon: 'graduation-cap' },
  { name: 'School Supplies', type: 'EXPENSE', color: '#EAB308', icon: 'book-open' },
  { name: 'Kids Activities', type: 'EXPENSE', color: '#CA8A04', icon: 'users' },
  { name: 'College Savings', type: 'EXPENSE', color: '#A16207', icon: 'piggy-bank' },
  
  // Personal & Shopping
  { name: 'Clothing & Shoes', type: 'EXPENSE', color: '#F472B6', icon: 'shirt' },
  { name: 'Personal Care', type: 'EXPENSE', color: '#EC4899', icon: 'scissors' },
  { name: 'Haircuts & Salon', type: 'EXPENSE', color: '#DB2777', icon: 'sparkles' },
  { name: 'Household Supplies', type: 'EXPENSE', color: '#64748B', icon: 'package' },
  { name: 'Pet Care', type: 'EXPENSE', color: '#F97316', icon: 'paw-print' },
  
  // Entertainment & Lifestyle
  { name: 'Streaming Services', type: 'EXPENSE', color: '#EF4444', icon: 'tv' },
  { name: 'Movies & Events', type: 'EXPENSE', color: '#DC2626', icon: 'film' },
  { name: 'Hobbies', type: 'EXPENSE', color: '#B91C1C', icon: 'palette' },
  { name: 'Vacation & Travel', type: 'EXPENSE', color: '#14B8A6', icon: 'plane' },
  { name: 'Gifts & Donations', type: 'EXPENSE', color: '#0D9488', icon: 'gift' },
  { name: 'Subscriptions', type: 'EXPENSE', color: '#0F766E', icon: 'repeat' },
  
  // Savings & Investments
  { name: 'Emergency Fund', type: 'EXPENSE', color: '#059669', icon: 'shield' },
  { name: 'Retirement Savings', type: 'EXPENSE', color: '#047857', icon: 'trending-up' },
  { name: 'Investment Contributions', type: 'EXPENSE', color: '#065F46', icon: 'bar-chart-2' },
  
  // Debt Payments
  { name: 'Credit Card Payments', type: 'EXPENSE', color: '#DC2626', icon: 'credit-card' },
  { name: 'Student Loans', type: 'EXPENSE', color: '#B91C1C', icon: 'book' },
  { name: 'Personal Loans', type: 'EXPENSE', color: '#991B1B', icon: 'banknote' },
  
  // Income
  { name: 'Salary/Wages', type: 'INCOME', color: '#059669', icon: 'dollar-sign' },
  { name: 'Bonus', type: 'INCOME', color: '#047857', icon: 'award' },
  { name: 'Investment Income', type: 'INCOME', color: '#065F46', icon: 'trending-up' },
  { name: 'Rental Income', type: 'INCOME', color: '#064E3B', icon: 'home' },
  { name: 'Side Hustle', type: 'INCOME', color: '#10B981', icon: 'briefcase' },
  { name: 'Tax Refund', type: 'INCOME', color: '#14B8A6', icon: 'receipt' },
  { name: 'Other Income', type: 'INCOME', color: '#0D9488', icon: 'plus-circle' },
  
  // Miscellaneous
  { name: 'Bank Fees', type: 'EXPENSE', color: '#64748B', icon: 'landmark' },
  { name: 'Legal Fees', type: 'EXPENSE', color: '#475569', icon: 'scale' },
  { name: 'Other Expenses', type: 'EXPENSE', color: '#334155', icon: 'more-horizontal' }
];

/**
 * Business/Company finance categories
 * Focus: Business operations, revenue, professional expenses
 */
export const BUSINESS_CATEGORIES: CategoryDefinition[] = [
  // Revenue
  { name: 'Product Sales', type: 'INCOME', color: '#059669', icon: 'shopping-bag' },
  { name: 'Service Revenue', type: 'INCOME', color: '#047857', icon: 'briefcase' },
  { name: 'Consulting Fees', type: 'INCOME', color: '#065F46', icon: 'users' },
  { name: 'Subscription Revenue', type: 'INCOME', color: '#064E3B', icon: 'repeat' },
  { name: 'Interest Income', type: 'INCOME', color: '#10B981', icon: 'percent' },
  { name: 'Investment Income', type: 'INCOME', color: '#14B8A6', icon: 'trending-up' },
  { name: 'Other Revenue', type: 'INCOME', color: '#0D9488', icon: 'plus-circle' },
  
  // Operating Expenses
  { name: 'Rent/Lease', type: 'EXPENSE', color: '#3B82F6', icon: 'building' },
  { name: 'Utilities', type: 'EXPENSE', color: '#F59E0B', icon: 'zap' },
  { name: 'Office Supplies', type: 'EXPENSE', color: '#64748B', icon: 'package' },
  { name: 'Equipment', type: 'EXPENSE', color: '#475569', icon: 'monitor' },
  { name: 'Software & Tools', type: 'EXPENSE', color: '#6366F1', icon: 'code' },
  { name: 'Internet & Phone', type: 'EXPENSE', color: '#8B5CF6', icon: 'wifi' },
  
  // Payroll & Benefits
  { name: 'Salaries & Wages', type: 'EXPENSE', color: '#10B981', icon: 'users' },
  { name: 'Contractor Payments', type: 'EXPENSE', color: '#14B8A6', icon: 'user-check' },
  { name: 'Payroll Taxes', type: 'EXPENSE', color: '#0D9488', icon: 'file-text' },
  { name: 'Employee Benefits', type: 'EXPENSE', color: '#0891B2', icon: 'heart' },
  { name: 'Training & Development', type: 'EXPENSE', color: '#0E7490', icon: 'book-open' },
  
  // Marketing & Sales
  { name: 'Advertising', type: 'EXPENSE', color: '#EF4444', icon: 'megaphone' },
  { name: 'Marketing Campaigns', type: 'EXPENSE', color: '#DC2626', icon: 'target' },
  { name: 'SEO & SEM', type: 'EXPENSE', color: '#B91C1C', icon: 'search' },
  { name: 'Social Media', type: 'EXPENSE', color: '#991B1B', icon: 'share-2' },
  { name: 'PR & Communications', type: 'EXPENSE', color: '#F97316', icon: 'radio' },
  { name: 'Trade Shows', type: 'EXPENSE', color: '#EA580C', icon: 'calendar' },
  
  // Professional Services
  { name: 'Legal Fees', type: 'EXPENSE', color: '#475569', icon: 'scale' },
  { name: 'Accounting Fees', type: 'EXPENSE', color: '#334155', icon: 'calculator' },
  { name: 'Consulting Services', type: 'EXPENSE', color: '#1E293B', icon: 'lightbulb' },
  { name: 'Professional Memberships', type: 'EXPENSE', color: '#0F172A', icon: 'award' },
  
  // Insurance
  { name: 'Business Insurance', type: 'EXPENSE', color: '#8B5CF6', icon: 'shield' },
  { name: 'Liability Insurance', type: 'EXPENSE', color: '#7C3AED', icon: 'shield-check' },
  { name: 'Workers Comp', type: 'EXPENSE', color: '#6D28D9', icon: 'users' },
  
  // Taxes
  { name: 'Income Tax', type: 'EXPENSE', color: '#DC2626', icon: 'receipt' },
  { name: 'Sales Tax', type: 'EXPENSE', color: '#B91C1C', icon: 'shopping-cart' },
  { name: 'Property Tax', type: 'EXPENSE', color: '#991B1B', icon: 'home' },
  
  // Transportation & Travel
  { name: 'Vehicle Expenses', type: 'EXPENSE', color: '#10B981', icon: 'car' },
  { name: 'Fuel', type: 'EXPENSE', color: '#F97316', icon: 'fuel' },
  { name: 'Business Travel', type: 'EXPENSE', color: '#14B8A6', icon: 'plane' },
  { name: 'Meals & Entertainment', type: 'EXPENSE', color: '#F59E0B', icon: 'utensils' },
  
  // Finance & Banking
  { name: 'Bank Fees', type: 'EXPENSE', color: '#64748B', icon: 'landmark' },
  { name: 'Interest Expense', type: 'EXPENSE', color: '#475569', icon: 'percent' },
  { name: 'Credit Card Fees', type: 'EXPENSE', color: '#334155', icon: 'credit-card' },
  { name: 'Loan Payments', type: 'EXPENSE', color: '#1E293B', icon: 'banknote' },
  
  // R&D and Innovation
  { name: 'Research & Development', type: 'EXPENSE', color: '#6366F1', icon: 'flask' },
  { name: 'Product Development', type: 'EXPENSE', color: '#4F46E5', icon: 'box' },
  
  // Miscellaneous
  { name: 'Licenses & Permits', type: 'EXPENSE', color: '#64748B', icon: 'file-text' },
  { name: 'Depreciation', type: 'EXPENSE', color: '#475569', icon: 'trending-down' },
  { name: 'Other Expenses', type: 'EXPENSE', color: '#334155', icon: 'more-horizontal' }
];

/**
 * Get default categories based on business profile type
 */
export function getDefaultCategories(profileType: 'PERSONAL' | 'BUSINESS'): CategoryDefinition[] {
  return profileType === 'PERSONAL' ? HOUSEHOLD_CATEGORIES : BUSINESS_CATEGORIES;
}

/**
 * Create default categories for a business profile
 */
export async function createDefaultCategoriesForProfile(
  prisma: any,
  userId: string,
  businessProfileId: string,
  profileType: 'PERSONAL' | 'BUSINESS'
) {
  const categories = getDefaultCategories(profileType);
  
  const createPromises = categories.map((category) =>
    prisma.category.create({
      data: {
        userId,
        businessProfileId,
        name: category.name,
        type: category.type,
        color: category.color,
        icon: category.icon,
        budget: category.budget,
        isDefault: true
      }
    })
  );

  await Promise.all(createPromises);
}

