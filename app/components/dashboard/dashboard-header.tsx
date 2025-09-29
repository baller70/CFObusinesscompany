
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  DollarSign, 
  Home, 
  Upload, 
  PieChart, 
  Target, 
  CreditCard, 
  Settings, 
  LogOut,
  Bell,
  Menu,
  X,
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
  ChevronRight,
  Building2,
  ShoppingCart,
  Calculator,
  Clock,
  File,
  Briefcase,
  BookOpen,
  TrendingUp,
  Repeat
} from 'lucide-react'
import { toast } from 'sonner'

interface DashboardHeaderProps {
  user: any
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const { data: session } = useSession() || {}
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Import Data', href: '/dashboard/import', icon: Upload },
    { name: 'Transactions', href: '/dashboard/transactions', icon: PieChart },
    { name: 'Debts', href: '/dashboard/debts', icon: CreditCard },
    { name: 'Goals', href: '/dashboard/goals', icon: Target },
  ]

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <div className="bg-blue-600 rounded-lg p-2 mr-3">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">CFO Budgeting</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="relative" 
                  onClick={() => {
                    console.log('Notifications clicked')
                    toast.info('3 new notifications')
                  }}
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    3
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="space-y-2 p-2">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm font-medium text-yellow-800">Upcoming Bill</p>
                    <p className="text-xs text-yellow-600">Credit Card payment due in 3 days</p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm font-medium text-blue-800">Budget Alert</p>
                    <p className="text-xs text-blue-600">You've spent 80% of your entertainment budget</p>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm font-medium text-green-800">Goal Progress</p>
                    <p className="text-xs text-green-600">You're 25% closer to your emergency fund goal</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Link href="/dashboard/notifications">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Notifications
                    </Button>
                  </Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-8 w-8 rounded-full" 
                  onClick={() => {
                    console.log('User menu clicked')
                    toast.info('User menu opened')
                  }}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.image || session?.user?.image || ''} alt={user?.name || session?.user?.name || ''} />
                    <AvatarFallback>
                      {user?.firstName?.[0]?.toUpperCase() || session?.user?.name?.[0]?.toUpperCase() || 'U'}
                      {user?.lastName?.[0]?.toUpperCase() || session?.user?.name?.split(' ')?.[1]?.[0]?.toUpperCase() || ''}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/dashboard/settings">
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 border-t">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium flex items-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="h-4 w-4 mr-3" />
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
