
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface BusinessProfile {
  id: string;
  name: string;
  type: 'PERSONAL' | 'BUSINESS';
  description?: string;
  industry?: string;
  icon?: string;
  color?: string;
  isDefault: boolean;
  isActive: boolean;
}

interface BusinessProfileContextType {
  profiles: BusinessProfile[];
  currentProfile: BusinessProfile | null;
  currentBusinessProfileId: string | null;
  isLoading: boolean;
  switchProfile: (profileId: string) => Promise<void>;
  refreshProfiles: () => Promise<void>;
  createProfile: (data: Partial<BusinessProfile>) => Promise<BusinessProfile>;
}

const BusinessProfileContext = createContext<BusinessProfileContextType | undefined>(undefined);

export function BusinessProfileProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession() || {};
  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [currentBusinessProfileId, setCurrentBusinessProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfiles = async () => {
    if (status !== 'authenticated') {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/business-profiles');
      if (response.ok) {
        const data = await response.json();
        setProfiles(data.profiles || []);
        setCurrentBusinessProfileId(data.currentBusinessProfileId);
        
        // If no profiles exist, initialize with default Personal profile
        if (!data.profiles || data.profiles.length === 0) {
          await initializeDefaultProfile();
        }
      }
    } catch (error) {
      console.error('Error fetching business profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDefaultProfile = async () => {
    try {
      const response = await fetch('/api/business-profiles/initialize', {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setProfiles([data.profile]);
          setCurrentBusinessProfileId(data.profile.id);
        }
      }
    } catch (error) {
      console.error('Error initializing default profile:', error);
    }
  };

  const switchProfile = async (profileId: string) => {
    try {
      const response = await fetch('/api/business-profiles/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessProfileId: profileId })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentBusinessProfileId(data.currentBusinessProfileId);
        // Trigger a page reload to refresh all data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error switching profile:', error);
    }
  };

  const createProfile = async (data: Partial<BusinessProfile>): Promise<BusinessProfile> => {
    const response = await fetch('/api/business-profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create profile');
    }

    const profile = await response.json();
    await fetchProfiles();
    return profile;
  };

  useEffect(() => {
    fetchProfiles();
  }, [status]);

  const currentProfile = profiles.find(p => p.id === currentBusinessProfileId) || null;

  return (
    <BusinessProfileContext.Provider
      value={{
        profiles,
        currentProfile,
        currentBusinessProfileId,
        isLoading,
        switchProfile,
        refreshProfiles: fetchProfiles,
        createProfile
      }}
    >
      {children}
    </BusinessProfileContext.Provider>
  );
}

export function useBusinessProfile() {
  const context = useContext(BusinessProfileContext);
  if (context === undefined) {
    throw new Error('useBusinessProfile must be used within a BusinessProfileProvider');
  }
  return context;
}
