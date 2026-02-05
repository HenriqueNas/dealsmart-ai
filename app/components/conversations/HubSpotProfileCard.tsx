'use client';

import { ApiResponse } from '@/lib/types/api.types';
import { Button } from '@/app/components/ui/Button';
import { useCallback, useEffect, useState } from 'react';

interface HubSpotContact {
  id: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  fullName?: string;
}

interface HubSpotProfileData {
  available: boolean;
  found?: boolean;
  contact?: HubSpotContact;
  hubspotContactId?: string;
  message?: string;
}

interface HubSpotProfileCardProps {
  conversationId: string;
}

export function HubSpotProfileCard({ conversationId }: HubSpotProfileCardProps) {
  const [profile, setProfile] = useState<HubSpotProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/conversations/${conversationId}/hubspot`);
      const data: ApiResponse<HubSpotProfileData> = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch HubSpot data');
      }

      setProfile(data.data || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load HubSpot data');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/v1/conversations/${conversationId}/hubspot`, {
        method: 'POST',
      });
      const data: ApiResponse<unknown> = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to refresh');
      }
      // Refetch profile data after refresh
      await fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setIsRefreshing(false);
    }
  }, [conversationId, fetchProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (isLoading) {
    return (
      <div className="border border-foreground/10 bg-foreground/2">
        <div className="border-b border-foreground/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <HubSpotIcon />
            <span className="text-sm font-medium text-foreground">HubSpot CRM</span>
          </div>
        </div>
        <div className="space-y-2 px-4 py-3">
          <div className="h-4 w-32 animate-pulse rounded bg-foreground/10" />
          <div className="h-4 w-48 animate-pulse rounded bg-foreground/10" />
          <div className="h-4 w-40 animate-pulse rounded bg-foreground/10" />
        </div>
      </div>
    );
  }

  if (!profile?.available) {
    return (
      <div className="border border-foreground/10 bg-foreground/2">
        <div className="border-b border-foreground/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <HubSpotIcon />
            <span className="text-sm font-medium text-foreground">HubSpot CRM</span>
          </div>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs text-foreground/40">
            HubSpot integration is not configured
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-foreground/10 bg-foreground/2">
        <div className="border-b border-foreground/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <HubSpotIcon />
            <span className="text-sm font-medium text-foreground">HubSpot CRM</span>
          </div>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs text-red-400">{error}</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={fetchProfile}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!profile?.found || !profile.contact) {
    return (
      <div className="border border-foreground/10 bg-foreground/2">
        <div className="border-b border-foreground/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <HubSpotIcon />
            <span className="text-sm font-medium text-foreground">HubSpot CRM</span>
          </div>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs text-foreground/40">
            Contact not found in HubSpot
          </p>
          {profile?.hubspotContactId && (
            <p className="mt-1 text-xs text-foreground/30">
              ID: {profile.hubspotContactId}
            </p>
          )}
        </div>
      </div>
    );
  }

  const { contact } = profile;

  return (
    <div className="border border-foreground/10 bg-foreground/2">
      <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <HubSpotIcon />
          <span className="text-sm font-medium text-foreground">HubSpot CRM</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          isLoading={isRefreshing}
        >
          Refresh
        </Button>
      </div>
      <div className="space-y-3 px-4 py-3">
        {/* Contact name */}
        {contact.fullName && (
          <ProfileField label="Name" value={contact.fullName} />
        )}

        {/* Email */}
        {contact.email && (
          <ProfileField label="Email" value={contact.email} />
        )}

        {/* Phone */}
        {contact.phone && (
          <ProfileField label="Phone" value={contact.phone} />
        )}

        {/* HubSpot Contact ID */}
        <ProfileField
          label="HubSpot ID"
          value={contact.id}
          muted
        />
      </div>
    </div>
  );
}

function ProfileField({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-foreground/40">{label}</dt>
      <dd className={`text-sm ${muted ? 'text-foreground/50' : 'text-foreground'}`}>
        {value}
      </dd>
    </div>
  );
}

function HubSpotIcon() {
  return (
    <svg
      className="h-4 w-4 text-[#ff7a59]"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M17.47 9.526V6.968a2.327 2.327 0 0 0 1.347-2.103 2.34 2.34 0 0 0-2.342-2.342 2.34 2.34 0 0 0-2.342 2.342c0 .929.548 1.727 1.337 2.103v2.558a5.07 5.07 0 0 0-2.343 1.128L7.21 6.244a2.526 2.526 0 0 0 .074-.592A2.528 2.528 0 0 0 4.756 3.13a2.528 2.528 0 0 0-2.528 2.522 2.528 2.528 0 0 0 2.528 2.522c.434 0 .844-.116 1.202-.31l5.84 4.36a5.088 5.088 0 0 0-.642 2.468 5.1 5.1 0 0 0 .733 2.63l-1.788 1.788a2.09 2.09 0 0 0-.642-.107 2.093 2.093 0 0 0-2.092 2.092 2.093 2.093 0 0 0 2.092 2.092 2.093 2.093 0 0 0 2.092-2.092c0-.232-.04-.454-.107-.664l1.763-1.763a5.103 5.103 0 0 0 3.265 1.183 5.114 5.114 0 0 0 5.108-5.108 5.114 5.114 0 0 0-4.635-5.085zM16.475 17.3a2.81 2.81 0 0 1-2.808-2.808 2.81 2.81 0 0 1 2.808-2.808 2.81 2.81 0 0 1 2.808 2.808 2.81 2.81 0 0 1-2.808 2.808z" />
    </svg>
  );
}
