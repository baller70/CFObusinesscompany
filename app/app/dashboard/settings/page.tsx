'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Building, CreditCard, Bell, Shield, Download, Upload, Trash2, Key, Globe, Moon, Sun, Database, Calendar, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { BackButton } from '@/components/ui/back-button';
interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phone: string
  jobTitle: string
}

interface BusinessData {
  companyName: string
  businessType: string
  industry: string
  address: string
  city: string
  state: string
  country: string
  zipCode: string
}

interface NotificationSettings {
  emailNotifications: boolean
  invoicePayments: boolean
  budgetAlerts: boolean
  cashFlowWarnings: boolean
  monthlyReports: boolean
  systemUpdates: boolean
  securityAlerts: boolean
  marketingUpdates: boolean
}

interface PreferenceSettings {
  theme: string
  currency: string
  dateFormat: string
  fiscalYearStart: string
  showBudgetAlerts: boolean
  autoRefreshData: boolean
  showDecimalPlaces: boolean
}

export default function SettingsPage() {
  const { data: session, status } = useSession() || {}
  
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
  })
  
  const [businessData, setBusinessData] = useState<BusinessData>({
    companyName: '',
    businessType: '',
    industry: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    invoicePayments: true,
    budgetAlerts: true,
    cashFlowWarnings: true,
    monthlyReports: true,
    systemUpdates: false,
    securityAlerts: true,
    marketingUpdates: false,
  })

  const [preferences, setPreferences] = useState<PreferenceSettings>({
    theme: 'light',
    currency: 'usd',
    dateFormat: 'mdy',
    fiscalYearStart: 'january',
    showBudgetAlerts: true,
    autoRefreshData: true,
    showDecimalPlaces: true,
  })

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [loading, setLoading] = useState({
    profile: false,
    business: false,
    notifications: false,
    security: false,
    preferences: false,
  })

  useEffect(() => {
    if (session?.user?.id) {
      loadProfileData()
      loadBusinessData()
      loadNotificationSettings()
      loadPreferences()
    }
  }, [session?.user?.id])

  const loadProfileData = async () => {
    try {
      const res = await fetch('/api/settings/profile')
      if (res.ok) {
        const data = await res.json()
        setProfileData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          jobTitle: data.jobTitle || '',
        })
      }
    } catch (error) {
      console.error('Failed to load profile data:', error)
    }
  }

  const loadBusinessData = async () => {
    try {
      const res = await fetch('/api/settings/business')
      if (res.ok) {
        const data = await res.json()
        setBusinessData({
          companyName: data.companyName || '',
          businessType: data.businessType || '',
          industry: data.industry || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          country: data.country || '',
          zipCode: data.zipCode || '',
        })
      }
    } catch (error) {
      console.error('Failed to load business data:', error)
    }
  }

  const loadNotificationSettings = async () => {
    try {
      const res = await fetch('/api/settings/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotificationSettings(data)
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error)
    }
  }

  const loadPreferences = async () => {
    try {
      const res = await fetch('/api/settings/preferences')
      if (res.ok) {
        const data = await res.json()
        setPreferences(data)
      }
    } catch (error) {
      console.error('Failed to load preferences:', error)
    }
  }

  const saveProfile = async () => {
    setLoading({ ...loading, profile: true })
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      })

      if (res.ok) {
        toast.success('Profile updated successfully!')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setLoading({ ...loading, profile: false })
    }
  }

  const saveBusiness = async () => {
    setLoading({ ...loading, business: true })
    try {
      const res = await fetch('/api/settings/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessData),
      })

      if (res.ok) {
        toast.success('Business information saved successfully!')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to save business information')
      }
    } catch (error) {
      toast.error('Failed to save business information')
    } finally {
      setLoading({ ...loading, business: false })
    }
  }

  const saveNotifications = async () => {
    setLoading({ ...loading, notifications: true })
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationSettings),
      })

      if (res.ok) {
        toast.success('Notification settings saved successfully!')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to save notification settings')
      }
    } catch (error) {
      toast.error('Failed to save notification settings')
    } finally {
      setLoading({ ...loading, notifications: false })
    }
  }

  const savePreferences = async () => {
    setLoading({ ...loading, preferences: true })
    try {
      const res = await fetch('/api/settings/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      if (res.ok) {
        toast.success('Preferences saved successfully!')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to save preferences')
      }
    } catch (error) {
      toast.error('Failed to save preferences')
    } finally {
      setLoading({ ...loading, preferences: false })
    }
  }

  const updatePassword = async () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (!securityData.currentPassword || !securityData.newPassword) {
      toast.error('Please fill in all password fields')
      return
    }

    setLoading({ ...loading, security: true })
    try {
      const res = await fetch('/api/settings/security/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: securityData.currentPassword,
          newPassword: securityData.newPassword,
        }),
      })

      if (res.ok) {
        toast.success('Password updated successfully!')
        setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to update password')
      }
    } catch (error) {
      toast.error('Failed to update password')
    } finally {
      setLoading({ ...loading, security: false })
    }
  }

  const exportData = async () => {
    try {
      toast.info('Preparing your data export...')
      const res = await fetch('/api/settings/data-export', {
        method: 'POST',
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `data-export-${new Date().toISOString()}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Data exported successfully!')
      } else {
        toast.error('Failed to export data')
      }
    } catch (error) {
      toast.error('Failed to export data')
    }
  }
  
  if (status === 'loading') return <div className="p-6">
        <BackButton href="/dashboard" />Loading...</div>
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
    return null
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account, preferences, and business settings</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                    <AvatarFallback className="text-lg">
                      {session.user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        toast.info('Photo upload functionality would open here')
                        // In a real app, this would open file picker
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600"
                      onClick={() => {
                        toast.success('Profile photo removed')
                        // In a real app, this would remove the photo
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Photo
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder="+1 (555) 123-4567"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title</Label>
                    <Input 
                      id="title" 
                      placeholder="Chief Financial Officer"
                      value={profileData.jobTitle}
                      onChange={(e) => setProfileData({ ...profileData, jobTitle: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={saveProfile}
                    disabled={loading.profile}
                  >
                    {loading.profile && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Profile Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="business">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input 
                      id="companyName" 
                      placeholder="Your Company LLC"
                      value={businessData.companyName}
                      onChange={(e) => setBusinessData({ ...businessData, companyName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type</Label>
                    <Select 
                      value={businessData.businessType}
                      onValueChange={(value) => setBusinessData({ ...businessData, businessType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SMALL_BUSINESS">Small Business</SelectItem>
                        <SelectItem value="STARTUP">Startup</SelectItem>
                        <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                        <SelectItem value="FREELANCER">Freelancer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input 
                      id="industry" 
                      placeholder="e.g., Technology, Healthcare"
                      value={businessData.industry}
                      onChange={(e) => setBusinessData({ ...businessData, industry: e.target.value })}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4">Business Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="street">Street Address</Label>
                      <Input 
                        id="street" 
                        placeholder="123 Business St"
                        value={businessData.address}
                        onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input 
                        id="city" 
                        placeholder="San Francisco"
                        value={businessData.city}
                        onChange={(e) => setBusinessData({ ...businessData, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input 
                        id="state" 
                        placeholder="California"
                        value={businessData.state}
                        onChange={(e) => setBusinessData({ ...businessData, state: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input 
                        id="zip" 
                        placeholder="94105"
                        value={businessData.zipCode}
                        onChange={(e) => setBusinessData({ ...businessData, zipCode: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input 
                        id="country" 
                        placeholder="United States"
                        value={businessData.country}
                        onChange={(e) => setBusinessData({ ...businessData, country: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={saveBusiness}
                    disabled={loading.business}
                  >
                    {loading.business && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Business Information
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-gray-600">Receive email alerts for important updates</p>
                    </div>
                    <Switch 
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Financial Alerts</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Invoice Payments</p>
                          <p className="text-sm text-gray-600">When invoices are paid or overdue</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.invoicePayments}
                          onCheckedChange={(checked) => 
                            setNotificationSettings({ ...notificationSettings, invoicePayments: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Budget Alerts</p>
                          <p className="text-sm text-gray-600">When spending approaches budget limits</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.budgetAlerts}
                          onCheckedChange={(checked) => 
                            setNotificationSettings({ ...notificationSettings, budgetAlerts: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Cash Flow Warnings</p>
                          <p className="text-sm text-gray-600">When cash flow drops below threshold</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.cashFlowWarnings}
                          onCheckedChange={(checked) => 
                            setNotificationSettings({ ...notificationSettings, cashFlowWarnings: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Monthly Reports</p>
                          <p className="text-sm text-gray-600">Automated monthly financial summary</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.monthlyReports}
                          onCheckedChange={(checked) => 
                            setNotificationSettings({ ...notificationSettings, monthlyReports: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">System Notifications</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">System Updates</p>
                          <p className="text-sm text-gray-600">New features and system changes</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.systemUpdates}
                          onCheckedChange={(checked) => 
                            setNotificationSettings({ ...notificationSettings, systemUpdates: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Security Alerts</p>
                          <p className="text-sm text-gray-600">Login attempts and security events</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.securityAlerts}
                          onCheckedChange={(checked) => 
                            setNotificationSettings({ ...notificationSettings, securityAlerts: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Marketing Updates</p>
                          <p className="text-sm text-gray-600">Tips, best practices, and product news</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.marketingUpdates}
                          onCheckedChange={(checked) => 
                            setNotificationSettings({ ...notificationSettings, marketingUpdates: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={saveNotifications}
                    disabled={loading.notifications}
                  >
                    {loading.notifications && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Notification Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Password</h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input 
                          id="currentPassword" 
                          type="password"
                          value={securityData.currentPassword}
                          onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input 
                          id="newPassword" 
                          type="password"
                          value={securityData.newPassword}
                          onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input 
                          id="confirmPassword" 
                          type="password"
                          value={securityData.confirmPassword}
                          onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                        />
                      </div>
                      <Button 
                        variant="outline"
                        onClick={updatePassword}
                        disabled={loading.security}
                      >
                        {loading.security && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {!loading.security && <Key className="h-4 w-4 mr-2" />}
                        Update Password
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3">Two-Factor Authentication</h4>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Enable 2FA</p>
                        <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary">Not Enabled</Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast.info('2FA setup would start here')
                            // In a real app, this would start 2FA setup process
                          }}
                        >
                          Enable 2FA
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3">Active Sessions</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Current Session</p>
                          <p className="text-sm text-gray-600">Chrome on macOS • San Francisco, CA</p>
                          <p className="text-xs text-gray-500">Active now</p>
                        </div>
                        <Badge variant="default">Current</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Mobile App</p>
                          <p className="text-sm text-gray-600">iOS App • Last seen 2 hours ago</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600"
                          onClick={() => {
                            toast.success('Mobile session revoked')
                            // In a real app, this would revoke the session
                          }}
                        >
                          Revoke
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3">Data & Privacy</h4>
                    <div className="space-y-3">
                      <Button 
                        variant="outline"
                        onClick={exportData}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export My Data
                      </Button>
                      <Button 
                        variant="outline" 
                        className="text-red-600"
                        onClick={() => {
                          toast.error('Account deletion requires additional verification. Contact support for assistance.')
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Billing & Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-blue-900">Professional Plan</h4>
                      <p className="text-sm text-blue-700">Advanced features for growing businesses</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-900">$49/month</div>
                      <p className="text-sm text-blue-700">Billed monthly</p>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-3">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        toast.info('Plan change options would be displayed here')
                        // In a real app, this would show plan options
                      }}
                    >
                      Change Plan
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="text-red-600"
                      onClick={() => {
                        toast.warning('Subscription cancellation requires confirmation. Contact support for assistance.')
                        // In a real app, this would start cancellation process
                      }}
                    >
                      Cancel Subscription
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Payment Method</h4>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-6 w-6 text-gray-600" />
                        <div>
                          <p className="font-medium">•••• •••• •••• 4242</p>
                          <p className="text-sm text-gray-600">Expires 12/2025</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          toast.info('Payment method update form would open here')
                          // In a real app, this would open payment method form
                        }}
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Billing History</h4>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        toast.success('Downloading all billing statements...')
                        // In a real app, this would download all statements
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download All
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Nov 2024</p>
                        <p className="text-sm text-gray-600">Professional Plan</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$49.00</p>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            toast.success('Downloading November 2024 statement...')
                          }}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Oct 2024</p>
                        <p className="text-sm text-gray-600">Professional Plan</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$49.00</p>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            toast.success('Downloading October 2024 statement...')
                          }}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Sep 2024</p>
                        <p className="text-sm text-gray-600">Professional Plan</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$49.00</p>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            toast.success('Downloading September 2024 statement...')
                          }}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preferences">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  App Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Theme</h4>
                      <p className="text-sm text-gray-600">Choose your app appearance</p>
                    </div>
                    <Select 
                      value={preferences.theme}
                      onValueChange={(value) => setPreferences({ ...preferences, theme: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Currency</h4>
                      <p className="text-sm text-gray-600">Default currency for transactions</p>
                    </div>
                    <Select 
                      value={preferences.currency}
                      onValueChange={(value) => setPreferences({ ...preferences, currency: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usd">USD ($)</SelectItem>
                        <SelectItem value="eur">EUR (€)</SelectItem>
                        <SelectItem value="gbp">GBP (£)</SelectItem>
                        <SelectItem value="cad">CAD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Date Format</h4>
                      <p className="text-sm text-gray-600">How dates are displayed</p>
                    </div>
                    <Select 
                      value={preferences.dateFormat}
                      onValueChange={(value) => setPreferences({ ...preferences, dateFormat: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Fiscal Year Start</h4>
                      <p className="text-sm text-gray-600">When your fiscal year begins</p>
                    </div>
                    <Select 
                      value={preferences.fiscalYearStart}
                      onValueChange={(value) => setPreferences({ ...preferences, fiscalYearStart: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="january">January</SelectItem>
                        <SelectItem value="april">April</SelectItem>
                        <SelectItem value="july">July</SelectItem>
                        <SelectItem value="october">October</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Dashboard Preferences</h4>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Show Budget Alerts</p>
                        <p className="text-sm text-gray-600">Display budget warnings on dashboard</p>
                      </div>
                      <Switch 
                        checked={preferences.showBudgetAlerts}
                        onCheckedChange={(checked) => 
                          setPreferences({ ...preferences, showBudgetAlerts: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Auto-refresh Data</p>
                        <p className="text-sm text-gray-600">Automatically update financial data</p>
                      </div>
                      <Switch 
                        checked={preferences.autoRefreshData}
                        onCheckedChange={(checked) => 
                          setPreferences({ ...preferences, autoRefreshData: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Show Decimal Places</p>
                        <p className="text-sm text-gray-600">Display cents in currency amounts</p>
                      </div>
                      <Switch 
                        checked={preferences.showDecimalPlaces}
                        onCheckedChange={(checked) => 
                          setPreferences({ ...preferences, showDecimalPlaces: checked })
                        }
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3">Data Management</h4>
                    <div className="space-y-3">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          toast.success('Data backup initiated. You will receive confirmation when complete.')
                        }}
                      >
                        <Database className="h-4 w-4 mr-2" />
                        Backup Data
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          toast.info('Data import dialog would open here. Select files to import.')
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import Data
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={savePreferences}
                    disabled={loading.preferences}
                  >
                    {loading.preferences && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
