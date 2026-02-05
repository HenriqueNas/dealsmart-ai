'use client';

import { useAuth } from '@/app/hooks/useAuth';
import { useConversation, SenderType } from '@/app/hooks/useConversation';
import { AISuggestionPanel } from '@/app/components/conversations/AISuggestionPanel';
import { HubSpotProfileCard } from '@/app/components/conversations/HubSpotProfileCard';
import { Badge } from '@/app/components/ui/Badge';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const statusVariant: Record<string, 'success' | 'warning' | 'info'> = {
  NEW: 'info',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
};

const statusLabel: Record<string, string> = {
  NEW: 'New',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
};

const senderLabel: Record<SenderType, string> = {
  CUSTOMER: 'Customer',
  AGENT: 'Agent',
  AI: 'Max (AI)',
};

function formatMessageTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatMessageDate(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function getSenderStyles(senderType: SenderType) {
  switch (senderType) {
    case 'CUSTOMER':
      return {
        align: 'justify-start',
        bubble: 'bg-foreground/10 text-foreground',
        label: 'text-foreground/50',
      };
    case 'AGENT':
      return {
        align: 'justify-end',
        bubble: 'bg-[#0aff64] text-black',
        label: 'text-[#0aff64]/70',
      };
    case 'AI':
      return {
        align: 'justify-start',
        bubble: 'bg-purple-500/15 text-foreground border border-purple-500/20',
        label: 'text-purple-400/70',
      };
  }
}

export default function ConversationDetailPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { conversation, isLoading, error, sendMessage, updateStatus } =
    useConversation(id, { pollInterval: 5000 });

  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auth guard
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login?callbackUrl=/conversations/' + id);
    }
  }, [isAuthenticated, isAuthLoading, router, id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const handleSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!messageInput.trim() || isSending) return;

      setIsSending(true);
      setSendError(null);
      const content = messageInput;
      setMessageInput('');

      try {
        await sendMessage(content, 'AGENT');
      } catch (err) {
        setSendError(
          err instanceof Error ? err.message : 'Failed to send message'
        );
        setMessageInput(content);
      } finally {
        setIsSending(false);
      }
    },
    [messageInput, isSending, sendMessage]
  );

  const handleSendFromSuggestion = useCallback(
    async (content: string) => {
      await sendMessage(content, 'AGENT');
    },
    [sendMessage]
  );

  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      try {
        await updateStatus(newStatus as 'NEW' | 'IN_PROGRESS' | 'RESOLVED');
      } catch {
        // Silent fail — status will revert on next poll
      }
    },
    [updateStatus]
  );

  if (isAuthLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 pt-24">
        <div className="h-8 w-48 animate-pulse rounded bg-foreground/10" />
        <div className="mt-4 h-96 animate-pulse rounded bg-foreground/10" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col pt-20">
        <div className="border-b border-foreground/10 px-4 py-3">
          <div className="h-6 w-48 animate-pulse rounded bg-foreground/10" />
        </div>
        <div className="flex-1 space-y-4 px-4 py-6">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className={`flex ${
                i % 2 === 0 ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className="h-16 w-64 animate-pulse rounded-lg bg-foreground/10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 pt-24">
        <div className="rounded border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
        <Link href="/conversations" className="mt-4 inline-block">
          <Button variant="secondary" size="sm">
            Back to Conversations
          </Button>
        </Link>
      </div>
    );
  }

  if (!conversation) return null;

  // Group messages by date
  const messagesByDate: {
    date: string;
    messages: typeof conversation.messages;
  }[] = [];
  let currentDate = '';
  for (const msg of conversation.messages) {
    const dateStr = new Date(msg.createdAt).toDateString();
    if (dateStr !== currentDate) {
      currentDate = dateStr;
      messagesByDate.push({ date: msg.createdAt, messages: [] });
    }
    messagesByDate[messagesByDate.length - 1].messages.push(msg);
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col pt-16">
      {/* Header */}
      <div className="border-b border-foreground/10 px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/conversations"
              className="text-foreground/50 transition-colors hover:text-foreground"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-foreground">
                  {conversation.customerName}
                </h1>
                <Badge variant={statusVariant[conversation.status]}>
                  {statusLabel[conversation.status]}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-foreground/40">
                {conversation.customerEmail && (
                  <span>{conversation.customerEmail}</span>
                )}
                {conversation.customerPhone && (
                  <span>{conversation.customerPhone}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={showProfile ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setShowProfile(p => !p)}
            >
              CRM
            </Button>
            <Select
              value={conversation.status}
              onChange={e => handleStatusChange(e.target.value)}
            >
              <option value="NEW">New</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Messages area + sidebar */}
      <div className="flex min-h-0 flex-1">
        {/* Main content */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="mx-auto max-w-3xl space-y-6">
              {messagesByDate.map((group, gi) => (
                <div key={gi}>
                  {/* Date separator */}
                  <div className="mb-4 flex items-center gap-4">
                    <div className="h-px flex-1 bg-foreground/10" />
                    <span className="text-xs text-foreground/30">
                      {formatMessageDate(group.date)}
                    </span>
                    <div className="h-px flex-1 bg-foreground/10" />
                  </div>

                  {/* Messages */}
                  <div className="space-y-3">
                    {group.messages.map(message => {
                      const styles = getSenderStyles(message.senderType);
                      return (
                        <div
                          key={message.id}
                          className={`flex ${styles.align}`}
                        >
                          <div className="max-w-[75%]">
                            <div className={`mb-1 text-xs ${styles.label}`}>
                              {senderLabel[message.senderType]}
                              <span className="ml-2 text-foreground/30">
                                {formatMessageTime(message.createdAt)}
                              </span>
                            </div>
                            <div
                              className={`rounded-lg px-4 py-2 ${styles.bubble}`}
                            >
                              <p className="whitespace-pre-wrap text-sm">
                                {message.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* AI Suggestion Panel */}
          <div className="mx-auto w-full max-w-3xl px-4">
            <AISuggestionPanel
              conversationId={id}
              onSendMessage={handleSendFromSuggestion}
              hasMessages={conversation.messages.length > 0}
            />
          </div>

          {/* Message input */}
          <div className="border-t border-foreground/10 px-4 py-3">
            <form
              onSubmit={handleSend}
              className="mx-auto flex max-w-3xl items-center gap-2"
            >
              <Input
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                placeholder="Type your response..."
                disabled={isSending}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isSending || !messageInput.trim()}
                isLoading={isSending}
              >
                Send
              </Button>
            </form>
            {sendError && (
              <p className="mx-auto mt-1 max-w-3xl text-xs text-red-400">
                {sendError}
              </p>
            )}
          </div>
        </div>

        {/* HubSpot Profile Sidebar */}
        {showProfile && (
          <div className="w-72 shrink-0 overflow-y-auto border-l border-foreground/10">
            <HubSpotProfileCard conversationId={id} />
          </div>
        )}
      </div>
    </div>
  );
}
