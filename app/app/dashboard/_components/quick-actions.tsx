
'use client';

import Link from 'next/link';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { 
  Upload, 
  Plus, 
  Target, 
  CreditCard, 
  PieChart,
  BarChart3
} from 'lucide-react';

export function QuickActions() {
  const actions = [
    {
      title: 'Import CSV',
      description: 'Upload bank statements',
      icon: Upload,
      href: '/dashboard/import',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'Add Transaction',
      description: 'Manual entry',
      icon: Plus,
      href: '/dashboard/transactions',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'Set Goals',
      description: 'Financial targets',
      icon: Target,
      href: '/dashboard/goals',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: 'Manage Debts',
      description: 'Track payments',
      icon: CreditCard,
      href: '/dashboard/debts',
      color: 'bg-red-500 hover:bg-red-600',
    },
    {
      title: 'Categories',
      description: 'Organize spending',
      icon: PieChart,
      href: '/dashboard/categories',
      color: 'bg-orange-500 hover:bg-orange-600',
    },
    {
      title: 'View Reports',
      description: 'Financial insights',
      icon: BarChart3,
      href: '/dashboard/reports',
      color: 'bg-indigo-500 hover:bg-indigo-600',
    },
  ];

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {actions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all group"
              >
                <div className={`p-3 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-gray-500">{action.description}</div>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
