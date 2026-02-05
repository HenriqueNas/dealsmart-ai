'use client';

import { ApiResponse } from '@/lib/types/api.types';
import { useCallback, useEffect, useState } from 'react';

export type LLMProvider = 'ANTHROPIC' | 'OPENAI' | 'GOOGLE';

interface ApiKeyConfig {
  hasApiKey: boolean;
  maskedApiKey: string | null;
  provider: LLMProvider;
}

export function useApiKey() {
  const [config, setConfig] = useState<ApiKeyConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/users/me/api-key');
      const data: ApiResponse<ApiKeyConfig> = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch API key config');
      }

      setConfig(data.data || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch API key config');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateApiKey = useCallback(
    async (apiKey: string | null, provider?: LLMProvider) => {
      setIsSaving(true);
      setError(null);

      try {
        const res = await fetch('/api/v1/users/me/api-key', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, provider }),
        });

        const data: ApiResponse<ApiKeyConfig & { message: string }> = await res.json();

        if (!data.success) {
          throw new Error(data.error?.message || 'Failed to update API key');
        }

        setConfig({
          hasApiKey: data.data?.hasApiKey || false,
          maskedApiKey: data.data?.maskedApiKey || null,
          provider: data.data?.provider || 'ANTHROPIC',
        });

        return data.data?.message || 'API key updated';
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update API key';
        setError(message);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const removeApiKey = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/users/me/api-key', {
        method: 'DELETE',
      });

      const data: ApiResponse<{ message: string }> = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to remove API key');
      }

      setConfig({
        hasApiKey: false,
        maskedApiKey: null,
        provider: config?.provider || 'ANTHROPIC',
      });

      return data.data?.message || 'API key removed';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove API key';
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [config?.provider]);

  return {
    config,
    isLoading,
    isSaving,
    error,
    updateApiKey,
    removeApiKey,
    refetch: fetchConfig,
  };
}
