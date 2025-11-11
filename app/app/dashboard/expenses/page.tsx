
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BackButton } from '@/components/ui/back-button';
import { 
  Plus, 
  CreditCard, 
  Receipt, 
  FileBarChart,
  FileText,
  TrendingDown,
  Calendar,
  DollarSign
} from 'lucide-react';

export default async function ExpensesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const expenseCategories = [
    {
      title: 'Bills to Pay',
      description: 'Manage vendor bills and payments',
      href: '/dashboard/expenses/bills',
      icon: CreditCard,
      color: 'text-red-500',
      bgColor: 'bg-red-50 border-red-200'
    },
    {
      title: 'Expense Claims',
      description: 'Employee expense reimbursements',
      href: '/dashboard/expenses/claims',
      icon: Receipt,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 border-blue-200'
    },
    {
      title: 'Receipts',
      description: 'Digital receipt management',
      href: '/dashboard/expenses/receipts',
      icon: FileBarChart,
      color: 'text-green-500',
      bgColor: 'bg-green-50 border-green-200'
    },
    {
      title: 'Print Checks',
      description: 'Generate and print payment checks',
      href: '/dashboard/expenses/checks',
      icon: FileText,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 border-purple-200'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-background p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <BackButton href="/dashboard" label="Back to Dashboard" />
        
        {/* Header */}
        <div className="mb-10 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-heading text-foreground mb-3">
                EXPENSE MANAGEMENT
              </h1>
              <p className="text-body text-muted-foreground max-w-3xl">
                Comprehensive expense management system for bills, receipts, claims, and payments. 
                Keep track of all your business expenses in one centralized location.
              </p>
            </div>
            <Link href="/dashboard/expenses/new">
              <Button className="btn-primary shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                New Expense
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="card-premium-elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-small text-muted-foreground mb-1">Monthly Expenses</p>
                  <p className="text-financial-large text-financial-negative">-$0.00</p>
                </div>
                <div className="bg-red-50 p-3 rounded-xl">
                  <TrendingDown className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium-elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-small text-muted-foreground mb-1">Pending Bills</p>
                  <p className="text-financial-large text-warning">$0.00</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <Calendar className="h-6 w-6 text-gray-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium-elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-small text-muted-foreground mb-1">Outstanding Claims</p>
                  <p className="text-financial-large text-blue-600">$0.00</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-xl">
                  <Receipt className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium-elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-small text-muted-foreground mb-1">This Week</p>
                  <p className="text-financial-large text-foreground">$0.00</p>
                </div>
                <div className="bg-green-50 p-3 rounded-xl">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expense Categories */}
        <div className="mb-12">
          <h2 className="text-subheading text-foreground mb-8">
            EXPENSE CATEGORIES
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {expenseCategories.map((category, index) => (
              <Link key={category.href} href={category.href}>
                <Card className="card-premium-elevated hover:scale-105 transition-all duration-300 group cursor-pointer animate-slide-in-up"
                      style={{ animationDelay: `${index * 100}ms` }}>
                  <CardHeader className="pb-4">
                    <div className={`w-16 h-16 rounded-xl ${category.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <category.icon className={`h-8 w-8 ${category.color}`} />
                    </div>
                    <CardTitle className="text-subheading text-foreground group-hover:text-primary transition-colors">
                      {category.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-body text-muted-foreground">
                      {category.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div>
          <h2 className="text-subheading text-foreground mb-6">
            RECENT EXPENSE ACTIVITY
          </h2>
          
          <Card className="card-premium-elevated">
            <CardContent className="p-12 text-center">
              <div className="bg-muted/20 rounded-xl p-6 mb-6 inline-block">
                <Receipt className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-subheading text-foreground mb-3">
                NO RECENT EXPENSES
              </h3>
              <p className="text-body text-muted-foreground mb-6">
                Start by adding your first expense or uploading receipts to see activity here.
              </p>
              <Link href="/dashboard/expenses/new">
                <Button className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Expense
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
