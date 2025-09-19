
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Target,
  CreditCard
} from 'lucide-react';

interface FinancialOverviewProps {
  data: any;
  loading: boolean;
}

export function FinancialOverview({ data, loading }: FinancialOverviewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      title: 'Net Worth',
      value: data?.netWorth || 0,
      icon: DollarSign,
      color: data?.netWorth >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: data?.netWorth >= 0 ? 'bg-green-100' : 'bg-red-100',
      change: null,
    },
    {
      title: 'Monthly Income',
      value: data?.monthlyIncome || 0,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: null,
    },
    {
      title: 'Monthly Expenses',
      value: data?.monthlyExpenses || 0,
      icon: TrendingDown,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: null,
    },
    {
      title: 'Total Debt',
      value: data?.totalDebt || 0,
      icon: CreditCard,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      change: null,
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title} className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metric.color}`}>
                {formatCurrency(metric.value)}
              </div>
              {metric.change && (
                <p className="text-xs text-gray-600">
                  {metric.change}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Burn Rate Alert */}
      {data?.monthlyBurnRate > 0 && (
        <Card className="border-orange-200 bg-orange-50 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              Burn Rate Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-orange-700 mb-2">
                  At your current spending rate of <strong>{formatCurrency(data.monthlyBurnRate)}/month</strong>, 
                  you need to take action to improve your financial position.
                </p>
                <p className="text-sm text-orange-600">
                  Consider uploading your transactions to get personalized recommendations.
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-700">
                  {formatCurrency(data.monthlyBurnRate)}
                </div>
                <div className="text-sm text-orange-600">per month</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
