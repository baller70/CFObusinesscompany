
'use client';

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { DashboardLayout } from "./dashboard-layout";
import { FinancialOverview } from "./financial-overview";
import { RecentTransactions } from "./recent-transactions";
import { QuickActions } from "./quick-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Upload, Target, TrendingUp, PieChart } from "lucide-react";

export function DashboardClient() {
  const { data: session } = useSession();
  const [financialData, setFinancialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const response = await fetch('/api/dashboard/financial-overview');
        if (response?.ok) {
          const data = await response.json();
          setFinancialData(data);
        }
      } catch (error) {
        console.error('Error fetching financial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, []);

  const firstName = session?.user?.firstName || session?.user?.name?.split(' ')?.[0] || 'there';

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-blue-100 text-lg">
            Here's your financial overview and next steps to achieve your goals.
          </p>
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Financial Overview */}
        <FinancialOverview data={financialData} loading={loading} />

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RecentTransactions />
          </div>
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <Upload className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Upload Your First CSV</p>
                      <p className="text-xs text-gray-600">Import bank statements to get started</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <PieChart className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Review Categories</p>
                      <p className="text-xs text-gray-600">Organize your spending patterns</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Set Your Goals</p>
                      <p className="text-xs text-gray-600">Define your financial targets</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
