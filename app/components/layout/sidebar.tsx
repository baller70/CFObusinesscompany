
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  Home, 
  CheckSquare,
  ArrowUpDown,
  FileText,
  Receipt,
  Users,
  FolderOpen,
  FileBarChart,
  DollarSign as AccountingIcon,
  UserCheck,
  Zap,
  BarChart3,
  Settings,
  ChevronRight,
  ChevronDown,
  Building2,
  ShoppingCart,
  Calculator,
  Clock,
  File,
  Briefcase,
  BookOpen,
  TrendingUp,
  Repeat,
  CreditCard,
  Upload,
  Brain,
  Target,
  PieChart,
  Banknote,
  Coins,
  Globe,
  Shield,
  Calendar,
  FileSpreadsheet,
  Search,
  Landmark,
  Activity,
  Workflow
} from 'lucide-react'

const menuItems = [
  {
    title: 'Dashboards',
    href: '/dashboard',
    icon: Home
  },
  {
    title: 'Tasks',
    href: '/dashboard/tasks',
    icon: CheckSquare
  },
  {
    title: 'Transactions',
    href: '/dashboard/transactions',
    icon: ArrowUpDown
  },
  {
    title: 'Financial Statements',
    href: '/dashboard/statements',
    icon: Upload
  },
  {
    title: 'Personal Finance',
    icon: Brain,
    submenu: [
      { title: 'Budget Planner', href: '/dashboard/budget', icon: PieChart },
      { title: 'Financial Goals', href: '/dashboard/goals', icon: Target },
      { title: 'Debt Management', href: '/dashboard/debts', icon: CreditCard },
      { title: 'Categories', href: '/dashboard/categories', icon: FolderOpen }
    ]
  },
  {
    title: 'Investment Management',
    icon: TrendingUp,
    submenu: [
      { title: 'Investment Portfolio', href: '/dashboard/investments/portfolio', icon: PieChart },
      { title: 'Asset Allocation', href: '/dashboard/investments/allocation', icon: Target },
      { title: 'Performance Analytics', href: '/dashboard/investments/analytics', icon: BarChart3 },
      { title: 'Investment Transactions', href: '/dashboard/investments/transactions', icon: ArrowUpDown },
      { title: 'Rebalancing', href: '/dashboard/investments/rebalancing', icon: Workflow }
    ]
  },
  {
    title: 'Treasury & Cash',
    icon: Landmark,
    submenu: [
      { title: 'Cash Positions', href: '/dashboard/treasury/positions', icon: Banknote },
      { title: 'Cash Flow Management', href: '/dashboard/treasury/cash-flow', icon: Activity },
      { title: 'Cash Forecasting', href: '/dashboard/treasury/forecasting', icon: TrendingUp },
      { title: 'Multi-Currency', href: '/dashboard/treasury/currency', icon: Globe }
    ]
  },
  {
    title: 'Risk Management',
    icon: Shield,
    submenu: [
      { title: 'Risk Assessment', href: '/dashboard/risk/assessment', icon: Shield },
      { title: 'Risk Incidents', href: '/dashboard/risk/incidents', icon: Activity },
      { title: 'Insurance Policies', href: '/dashboard/risk/insurance', icon: FileText },
      { title: 'Risk Dashboard', href: '/dashboard/risk/dashboard', icon: BarChart3 }
    ]
  },
  {
    title: 'Board & Investors',
    icon: Users,
    submenu: [
      { title: 'Board Members', href: '/dashboard/board/members', icon: Users },
      { title: 'Board Meetings', href: '/dashboard/board/meetings', icon: Calendar },
      { title: 'Investor Updates', href: '/dashboard/board/investor-updates', icon: FileText },
      { title: 'Shareholders', href: '/dashboard/board/shareholders', icon: UserCheck }
    ]
  },
  {
    title: 'Advanced Reports',
    icon: FileSpreadsheet,
    submenu: [
      { title: 'Custom Reports', href: '/dashboard/reports/custom', icon: FileSpreadsheet },
      { title: 'Executive Dashboard', href: '/dashboard/reports/executive', icon: BarChart3 },
      { title: 'Investor Reports', href: '/dashboard/reports/investor', icon: FileText },
      { title: 'Compliance Reports', href: '/dashboard/reports/compliance', icon: Shield }
    ]
  },
  {
    title: 'Market Intelligence',
    icon: Search,
    submenu: [
      { title: 'Market Data', href: '/dashboard/market/data', icon: TrendingUp },
      { title: 'Competitive Analysis', href: '/dashboard/market/competitive', icon: Search },
      { title: 'Industry Benchmarks', href: '/dashboard/market/benchmarks', icon: BarChart3 }
    ]
  },
  {
    title: 'Invoices & Estimates',
    href: '/dashboard/invoices',
    icon: FileText
  },
  {
    title: 'Expenses',
    icon: Receipt,
    submenu: [
      { title: 'Recurring Charges', href: '/recurring-charges', icon: Repeat },
      { title: 'Bills to Pay', href: '/dashboard/expenses/bills', icon: CreditCard },
      { title: 'Expense Claims', href: '/dashboard/expenses/claims', icon: Receipt },
      { title: 'Receipts', href: '/dashboard/expenses/receipts', icon: FileBarChart },
      { title: 'Print Checks', href: '/dashboard/expenses/checks', icon: FileText }
    ]
  },
  {
    title: 'Contacts & Products',
    icon: Building2,
    submenu: [
      { title: 'People & Contractors', href: '/dashboard/contacts/contractors', icon: UserCheck },
      { title: 'Vendors', href: '/dashboard/contacts/vendors', icon: Building2 },
      { title: 'Customers', href: '/dashboard/contacts/customers', icon: Users },
      { title: 'Products & Services', href: '/dashboard/contacts/products', icon: ShoppingCart }
    ]
  },
  {
    title: 'Projects',
    href: '/dashboard/projects',
    icon: FolderOpen
  },
  {
    title: 'Documents',
    href: '/dashboard/documents',
    icon: File
  },
  {
    title: 'Data Import',
    href: '/dashboard/import',
    icon: Upload
  },
  {
    title: 'Accounting',
    icon: AccountingIcon,
    submenu: [
      { title: 'Chart of Accounts', href: '/dashboard/accounting/chart-of-accounts', icon: BookOpen },
      { title: 'Reconciliation', href: '/dashboard/accounting/reconciliation', icon: Calculator },
      { title: 'Journal Entries', href: '/dashboard/accounting/journal-entries', icon: FileText }
    ]
  },
  {
    title: 'Payroll',
    href: '/dashboard/payroll',
    icon: UserCheck
  },
  {
    title: 'Automations',
    href: '/dashboard/automations',
    icon: Zap
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings
  }
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const isExpanded = (title: string) => expandedItems.includes(title)
  const isActiveSubmenu = (submenu: any[]) => submenu.some(item => pathname === item.href)

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="p-6 border-b">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <AccountingIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">CFO Business</span>
        </Link>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-4">
          {menuItems.map((item) => {
            if (item.submenu) {
              const isSubmenuActive = isActiveSubmenu(item.submenu)
              const expanded = isExpanded(item.title)
              
              return (
                <Collapsible key={item.title} open={expanded} onOpenChange={() => toggleExpanded(item.title)}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant={isSubmenuActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start h-10 px-3",
                        isSubmenuActive && "bg-blue-50 text-blue-700 border-blue-200"
                      )}
                    >
                      <item.icon className="w-4 h-4 mr-3" />
                      <span className="flex-1 text-left">{item.title}</span>
                      {expanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1">
                    {item.submenu.map((subitem) => (
                      <Link key={subitem.href} href={subitem.href}>
                        <Button
                          variant={pathname === subitem.href ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start h-9 px-6 ml-4 text-sm",
                            pathname === subitem.href && "bg-blue-100 text-blue-700"
                          )}
                        >
                          <subitem.icon className="w-3 h-3 mr-3" />
                          {subitem.title}
                        </Button>
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )
            }
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-10 px-3",
                    pathname === item.href && "bg-blue-50 text-blue-700 border-blue-200"
                  )}
                >
                  <item.icon className="w-4 h-4 mr-3" />
                  {item.title}
                </Button>
              </Link>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
