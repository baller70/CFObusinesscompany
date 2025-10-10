
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * Get the current user's business profile ID
 * This should be called in API routes to get the active business profile
 */
export async function getCurrentBusinessProfileId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { 
      currentBusinessProfileId: true,
      businessProfiles: {
        where: { isActive: true },
        take: 1
      }
    }
  });

  if (!user) {
    return null;
  }

  // Return the current profile ID, or the first active profile if not set
  return user.currentBusinessProfileId || user.businessProfiles[0]?.id || null;
}

/**
 * Filter query options to include businessProfileId
 * Usage: const where = { ...baseWhere, ...await getBusinessProfileFilter() };
 */
export async function getBusinessProfileFilter() {
  const businessProfileId = await getCurrentBusinessProfileId();
  
  // If no business profile is set, return empty filter to show all data
  // This maintains backward compatibility with existing data
  if (!businessProfileId) {
    return {};
  }

  return { businessProfileId };
}

/**
 * Check if a user has access to a specific business profile
 */
export async function hasAccessToBusinessProfile(profileId: string): Promise<boolean> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    return false;
  }

  const profile = await prisma.businessProfile.findFirst({
    where: {
      id: profileId,
      userId: user.id,
      isActive: true
    }
  });

  return !!profile;
}
