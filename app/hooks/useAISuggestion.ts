'use client';

import { ApiResponse } from '@/lib/types/api.types';
import { useCallback, useState } from 'react';

interface AISuggestion {
  suggestion: string;
  model: string;
  provider: string;
  tokensUsed?: { input: number; output: number };
  latencyMs: number;
  warnings: string[];
  conversationId: string;
}

interface SuggestionFeedback {
  accepted: boolean;
  editedContent?: string;
  reason?: string;
}

export function useAISuggestion(conversationId: string) {
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSuggestion = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const res = await fetch(`/api/v1/conversations/${conversationId}/suggest`, {
        method: 'POST',
      });

      const data: ApiResponse<AISuggestion> = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to generate suggestion');
      }

      setSuggestion(data.data || null);
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate suggestion';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  const submitFeedback = useCallback(
    async (messageId: string, feedback: SuggestionFeedback) => {
      const res = await fetch(
        `/api/v1/conversations/${conversationId}/messages/${messageId}/feedback`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(feedback),
        }
      );

      const data: ApiResponse = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to submit feedback');
      }

      return data.data;
    },
    [conversationId]
  );

  const clear = useCallback(() => {
    setSuggestion(null);
    setError(null);
  }, []);

  return {
    suggestion,
    isLoading,
    error,
    generateSuggestion,
    submitFeedback,
    clear,
  };
}
