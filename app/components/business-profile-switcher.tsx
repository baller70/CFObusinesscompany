
'use client';

import React, { useState } from 'react';
import { useBusinessProfile } from '@/lib/business-profile-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown, Building2, Home, Plus, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function BusinessProfileSwitcher() {
  const { profiles, currentProfile, switchProfile, createProfile, isLoading } = useBusinessProfile();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'BUSINESS' as 'PERSONAL' | 'BUSINESS',
    description: '',
    industry: ''
  });

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      await createProfile(formData);
      toast.success('Business profile created successfully!');
      setIsDialogOpen(false);
      setFormData({
        name: '',
        type: 'BUSINESS',
        description: '',
        industry: ''
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create profile');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading || !currentProfile) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Building2 className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    );
  }

  const getIcon = (type: string) => {
    return type === 'PERSONAL' ? <Home className="mr-2 h-4 w-4" /> : <Building2 className="mr-2 h-4 w-4" />;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="min-w-[180px] justify-between">
            {getIcon(currentProfile.type)}
            <span className="truncate">{currentProfile.name}</span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[240px]">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Business Profiles
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {profiles.map((profile) => (
            <DropdownMenuItem
              key={profile.id}
              onClick={() => {
                if (profile.id !== currentProfile.id) {
                  switchProfile(profile.id);
                }
              }}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  {getIcon(profile.type)}
                  <div className="flex flex-col">
                    <span className="font-medium">{profile.name}</span>
                    {profile.description && (
                      <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                        {profile.description}
                      </span>
                    )}
                  </div>
                </div>
                {profile.id === currentProfile.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsDialogOpen(true)}
            className="cursor-pointer text-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Add New Business</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateProfile}>
            <DialogHeader>
              <DialogTitle>Create New Business Profile</DialogTitle>
              <DialogDescription>
                Add a new business or entity to track separately from your personal finances.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Business Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., My E-commerce Store"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'PERSONAL' | 'BUSINESS') =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERSONAL">Personal/Household</SelectItem>
                    <SelectItem value="BUSINESS">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  placeholder="e.g., E-commerce, Consulting"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this business..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || !formData.name}>
                {isCreating ? 'Creating...' : 'Create Profile'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
