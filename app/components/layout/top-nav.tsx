
'use client'

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
import { Bell, Settings, LogOut, Search, Menu } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface TopNavProps {
  user: any
  onMenuToggle?: () => void
}

export function TopNav({ user, onMenuToggle }: TopNavProps) {
  const { data: session } = useSession() || {}

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left side - Menu toggle for mobile */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" className="lg:hidden" onClick={onMenuToggle}>
          <Menu className="h-5 w-5" />
        </Button>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search transactions, invoices, customers..."
            className="pl-10 w-80 hidden sm:block"
          />
        </div>
      </div>

      {/* Right side - Notifications and User menu */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative"
              onClick={(e) => {
                // Ensure dropdown opens
                e.preventDefault();
              }}
            >
              <Bell className="h-5 w-5" />
              <span 
                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle notification click
                }}
              >
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="space-y-2 p-2">
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm font-medium text-red-800">Invoice Overdue</p>
                <p className="text-xs text-red-600">Invoice #INV-001 is 5 days overdue</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm font-medium text-blue-800">Payment Received</p>
                <p className="text-xs text-blue-600">$2,500 received from Acme Corp</p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm font-medium text-green-800">Project Update</p>
                <p className="text-xs text-green-600">Website redesign project 75% complete</p>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="relative h-8 w-8 rounded-full"
              onClick={(e) => {
                // Ensure dropdown opens
                e.preventDefault();
              }}
            >
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
                <AvatarFallback className="cursor-pointer">
                  {user?.firstName?.[0]?.toUpperCase() || 'J'}
                  {user?.lastName?.[0]?.toUpperCase() || 'D'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                {user?.companyName && (
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.companyName}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.location.href = '/dashboard/settings'}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
