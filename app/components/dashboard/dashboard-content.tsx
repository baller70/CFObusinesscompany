
'use client'

import { useState } from 'react'
import { BusinessOverview } from '@/components/dashboard/business-overview'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { QuickActions } from '@/components/dashboard/business-quick-actions'
import { FinancialSummary } from '@/components/dashboard/financial-summary'
import { CFOInsightsWidget, CFOChatDialog, DebtReductionPlanner } from '@/components/cfo-ai'
import { RecurringChargesWidget } from '@/components/dashboard/recurring-charges-widget'

interface DashboardContentProps {
  businessMetrics: any
  recentTransactions: any[]
  budgets: any[]
  bankStatements: any[]
}

export default function DashboardContent({
  businessMetrics,
  recentTransactions,
  budgets,
  bankStatements
}: DashboardContentProps) {
  const [isCFOChatOpen, setIsCFOChatOpen] = useState(false)

  const handleOpenCFOChat = () => {
    setIsCFOChatOpen(true)
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* CFO AI Insights - Prominent Position */}
          <CFOInsightsWidget onOpenChat={handleOpenCFOChat} />
          
          <QuickActions />
          
          {/* Recent Transactions */}
          <RecentActivity 
            invoices={[]}
            transactions={recentTransactions}
          />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          {/* Recurring Charges Widget */}
          <RecurringChargesWidget />
          
          {/* Debt Reduction Planner */}
          <DebtReductionPlanner />
          
          {/* Financial Summary */}
          <FinancialSummary 
            bills={[]}
            metrics={businessMetrics}
          />
        </div>
      </div>

      <CFOChatDialog 
        open={isCFOChatOpen} 
        onOpenChange={setIsCFOChatOpen} 
      />
    </>
  )
}
