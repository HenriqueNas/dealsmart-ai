'use client';

import { useAuth } from '@/app/hooks/useAuth';
import {
  ConversationStatus,
  useConversations,
} from '@/app/hooks/useConversations';
import { Badge } from '@/app/components/ui/Badge';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const statusVariant: Record<
  ConversationStatus,
  'success' | 'warning' | 'info'
> = {
  NEW: 'info',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
};

const statusLabel: Record<ConversationStatus, string> = {
  NEW: 'New',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
};

function formatTime(dateString: string | null) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function truncate(str: string, maxLen: number) {
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
}

export default function ConversationsPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<
    ConversationStatus | ''
  >('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { conversations, pagination, isLoading, error } = useConversations({
    status: statusFilter || undefined,
    search: debouncedSearch || undefined,
    page,
    pageSize: 20,
    pollInterval: 10000,
  });

  // Auth guard
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login?callbackUrl=/conversations');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  if (isAuthLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 pt-24 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="h-8 w-64 animate-pulse rounded bg-foreground/10" />
          <div className="h-12 animate-pulse rounded bg-foreground/10" />
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-20 animate-pulse rounded bg-foreground/10"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pt-24 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Conversations
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          Manage customer conversations and AI-assisted responses
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            placeholder="Search by customer name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onChange={e =>
              setStatusFilter(e.target.value as ConversationStatus | '')
            }
          >
            <option value="">All statuses</option>
            <option value="NEW">New</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </Select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && conversations.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="h-20 animate-pulse rounded border border-foreground/10 bg-foreground/5"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && conversations.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-foreground/50">No conversations found</p>
          {(statusFilter || debouncedSearch) && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => {
                setStatusFilter('');
                setSearchQuery('');
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Conversation list */}
      <div className="space-y-2">
        {conversations.map(conv => {
          const lastMessage = conv.messages?.[0];
          return (
            <Link
              key={conv.id}
              href={`/conversations/${conv.id}`}
              className="block border border-foreground/10 bg-foreground/[0.02] p-4 transition-colors hover:bg-foreground/5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {conv.customerName}
                    </span>
                    <Badge variant={statusVariant[conv.status]}>
                      {statusLabel[conv.status]}
                    </Badge>
                  </div>

                  {/* Last message preview */}
                  {lastMessage && (
                    <p className="mt-1 text-sm text-foreground/50">
                      <span className="text-foreground/40">
                        {lastMessage.senderType === 'CUSTOMER'
                          ? conv.customerName.split(' ')[0]
                          : lastMessage.senderType === 'AI'
                            ? 'Max (AI)'
                            : 'Agent'}
                        :{' '}
                      </span>
                      {truncate(lastMessage.content, 100)}
                    </p>
                  )}

                  {/* Contact info */}
                  <div className="mt-2 flex items-center gap-4 text-xs text-foreground/40">
                    {conv.customerEmail && <span>{conv.customerEmail}</span>}
                    {conv.customerPhone && <span>{conv.customerPhone}</span>}
                    {conv.assignedTo && (
                      <span>
                        Assigned to{' '}
                        {conv.assignedTo.name || conv.assignedTo.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* Timestamp */}
                <div className="shrink-0 text-xs text-foreground/40">
                  {formatTime(conv.lastMessageAt)}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-foreground/50">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total}{' '}
            total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
