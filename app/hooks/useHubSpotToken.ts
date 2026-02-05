'use client';

import { ApiResponse } from '@/lib/types/api.types';
import { useCallback, useEffect, useState } from 'react';

interface HubSpotTokenConfig {
  hasToken: boolean;
  maskedToken: string | null;
}

export function useHubSpotToken() {
  const [config, setConfig] = useState<HubSpotTokenConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/users/me/hubspot-token');
      const data: ApiResponse<HubSpotTokenConfig> = await res.json();

      if (!data.success) {
        // If forbidden (role check failed), just set as not available
        if (res.status === 403) {
          setConfig(null);
          setError(null);
          return;
        }
        throw new Error(data.error?.message || 'Failed to fetch HubSpot token config');
      }

      setConfig(data.data || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch HubSpot token config');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateToken = useCallback(
    async (accessToken: string | null) => {
      setIsSaving(true);
      setError(null);

      try {
        const res = await fetch('/api/v1/users/me/hubspot-token', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken }),
        });

        const data: ApiResponse<HubSpotTokenConfig & { message: string }> = await res.json();

        if (!data.success) {
          throw new Error(data.error?.message || 'Failed to update HubSpot token');
        }

        setConfig({
          hasToken: data.data?.hasToken || false,
          maskedToken: data.data?.maskedToken || null,
        });

        return data.data?.message || 'HubSpot token updated';
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update HubSpot token';
        setError(message);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const removeToken = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/users/me/hubspot-token', {
        method: 'DELETE',
      });

      const data: ApiResponse<{ message: string }> = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to remove HubSpot token');
      }

      setConfig({
        hasToken: false,
        maskedToken: null,
      });

      return data.data?.message || 'HubSpot token removed';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove HubSpot token';
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    config,
    isLoading,
    isSaving,
    error,
    updateToken,
    removeToken,
    refetch: fetchConfig,
  };
}
