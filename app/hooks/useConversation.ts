'use client';

import { ApiResponse } from '@/lib/types/api.types';
import { useCallback, useEffect, useRef, useState } from 'react';

export type SenderType = 'CUSTOMER' | 'AGENT' | 'AI';

export interface Message {
  id: string;
  conversationId: string;
  senderType: SenderType;
  content: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ConversationDetail {
  id: string;
  hubspotContactId: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED';
  assignedToId: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: { id: string; name: string | null; email: string } | null;
  messages: Message[];
}

interface UseConversationOptions {
  pollInterval?: number;
}

export function useConversation(id: string, options: UseConversationOptions = {}) {
  const { pollInterval = 5000 } = options;

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastMessageTime = useRef<string | null>(null);

  // Initial fetch of full conversation
  const fetchConversation = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/conversations/${id}`);
      const data: ApiResponse<ConversationDetail> = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch conversation');
      }

      setConversation(data.data || null);
      if (data.data?.messages.length) {
        const lastMsg = data.data.messages[data.data.messages.length - 1];
        lastMessageTime.current = lastMsg.createdAt;
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch conversation');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Poll for new messages only
  const pollMessages = useCallback(async () => {
    if (!lastMessageTime.current) return;

    try {
      const params = new URLSearchParams();
      params.set('since', lastMessageTime.current);

      const res = await fetch(`/api/v1/conversations/${id}/messages?${params.toString()}`);
      const data: ApiResponse<{ messages: Message[]; pollingTimestamp: string }> = await res.json();

      if (data.success && data.data?.messages.length) {
        setConversation(prev => {
          if (!prev) return prev;
          const existingIds = new Set(prev.messages.map(m => m.id));
          const newMessages = data.data!.messages.filter(m => !existingIds.has(m.id));
          if (newMessages.length === 0) return prev;
          return {
            ...prev,
            messages: [...prev.messages, ...newMessages],
          };
        });
        const lastMsg = data.data.messages[data.data.messages.length - 1];
        lastMessageTime.current = lastMsg.createdAt;
      }
    } catch {
      // Silent fail for polling — don't disrupt the UI
    }
  }, [id]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  // Polling for new messages
  useEffect(() => {
    if (pollInterval <= 0) return;

    const interval = setInterval(pollMessages, pollInterval);
    return () => clearInterval(interval);
  }, [pollMessages, pollInterval]);

  // Send a message
  const sendMessage = useCallback(
    async (content: string, senderType: SenderType = 'AGENT') => {
      const res = await fetch(`/api/v1/conversations/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, senderType }),
      });

      const data: ApiResponse<Message> = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to send message');
      }

      // Append the new message to the conversation
      if (data.data) {
        setConversation(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, data.data!],
          };
        });
        lastMessageTime.current = data.data.createdAt;
      }

      return data.data;
    },
    [id]
  );

  // Update conversation status
  const updateStatus = useCallback(
    async (status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED') => {
      const res = await fetch(`/api/v1/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data: ApiResponse<ConversationDetail> = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to update status');
      }

      if (data.data) {
        setConversation(prev => (prev ? { ...prev, status: data.data!.status } : prev));
      }
    },
    [id]
  );

  return {
    conversation,
    isLoading,
    error,
    sendMessage,
    updateStatus,
    refetch: fetchConversation,
  };
}
