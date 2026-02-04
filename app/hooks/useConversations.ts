'use client';

import { ApiResponse } from '@/lib/types/api.types';
import { useCallback, useEffect, useState } from 'react';

export type ConversationStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED';

export interface ConversationListItem {
  id: string;
  hubspotContactId: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  status: ConversationStatus;
  assignedToId: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: { id: string; name: string | null; email: string } | null;
  messages: { id: string; content: string; senderType: string; createdAt: string }[];
}

interface UseConversationsOptions {
  status?: ConversationStatus;
  search?: string;
  page?: number;
  pageSize?: number;
  pollInterval?: number;
}

export function useConversations(options: UseConversationsOptions = {}) {
  const { status, search, page = 1, pageSize = 20, pollInterval = 10000 } = options;

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));

      const res = await fetch(`/api/v1/conversations?${params.toString()}`);
      const data: ApiResponse<{
        conversations: ConversationListItem[];
        pagination: { page: number; pageSize: number; total: number; totalPages: number };
      }> = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch conversations');
      }

      setConversations(data.data?.conversations || []);
      if (data.data?.pagination) {
        setPagination(data.data.pagination);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
    } finally {
      setIsLoading(false);
    }
  }, [status, search, page, pageSize]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Polling for real-time updates
  useEffect(() => {
    if (pollInterval <= 0) return;

    const interval = setInterval(fetchConversations, pollInterval);
    return () => clearInterval(interval);
  }, [fetchConversations, pollInterval]);

  return {
    conversations,
    pagination,
    isLoading,
    error,
    refetch: fetchConversations,
  };
}
