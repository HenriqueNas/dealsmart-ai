'use client';

import { ApiKeySettings } from '@/app/components/profile/ApiKeySettings';
import { CreatorUpgradeSection } from '@/app/components/profile/CreatorUpgradeSection';
import { EditProfileForm } from '@/app/components/profile/EditProfileForm';
import { HubSpotTokenSettings } from '@/app/components/profile/HubSpotTokenSettings';
import { InviteCreator } from '@/app/components/profile/InviteCreator';
import { ProfileCard } from '@/app/components/profile/ProfileCard';
import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?callbackUrl=/profile');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="h-8 w-48 animate-pulse rounded bg-foreground/10" />
          <div className="h-48 animate-pulse rounded-none bg-foreground/10" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="pt-30 mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-foreground">Your Profile</h1>

      <div className="space-y-6">
        <ProfileCard />
        <EditProfileForm />
        <ApiKeySettings />
        <HubSpotTokenSettings />
        <CreatorUpgradeSection />
        <InviteCreator />
      </div>
    </div>
  );
}
