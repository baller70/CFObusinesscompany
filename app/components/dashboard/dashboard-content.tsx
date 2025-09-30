
'use client'

import { useState } from 'react'
import { BusinessOverview } from '@/components/dashboard/business-overview'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { QuickActions } from '@/components/dashboard/business-quick-actions'
import { UpcomingTasks } from '@/components/dashboard/upcoming-tasks'
import { FinancialSummary } from '@/components/dashboard/financial-summary'
import { CFOInsightsWidget, CFOChatDialog, DebtReductionPlanner } from '@/components/cfo-ai'
import { RecurringChargesWidget } from '@/components/dashboard/recurring-charges-widget'

interface DashboardContentProps {
  businessMetrics: any
  recentInvoices: any[]
  recentTransactions: any[]
  upcomingTasks: any[]
  bills: any[]
}

export default function DashboardContent({
  businessMetrics,
  recentInvoices,
  recentTransactions,
  upcomingTasks,
  bills
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
          <BusinessOverview metrics={businessMetrics} />
          <RecentActivity 
            invoices={recentInvoices}
            transactions={recentTransactions}
          />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          {/* Recurring Charges Widget */}
          <RecurringChargesWidget />
          
          {/* Debt Reduction Planner */}
          <DebtReductionPlanner />
          
          <UpcomingTasks tasks={upcomingTasks} />
          <FinancialSummary 
            bills={bills}
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
