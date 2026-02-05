'use client';

import { ApiResponse } from '@/lib/types/api.types';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface HubSpotContact {
  id: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
}

interface NewConversationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewConversationDialog({ isOpen, onClose }: NewConversationDialogProps) {
  const router = useRouter();
  const [contacts, setContacts] = useState<HubSpotContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [hubspotConfigured, setHubspotConfigured] = useState(true);
  const [hubspotMessage, setHubspotMessage] = useState<string | null>(null);

  // Manual hubspot contact ID entry (fallback when HubSpot is not configured)
  const [manualContactId, setManualContactId] = useState('');
  const [manualName, setManualName] = useState('');

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/integrations/hubspot/contacts/list?limit=50');
      const data: ApiResponse<{
        contacts: HubSpotContact[];
        hasMore: boolean;
        configured: boolean;
        message?: string;
      }> = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch contacts');
      }

      setContacts(data.data?.contacts || []);
      setHubspotConfigured(data.data?.configured ?? false);
      setHubspotMessage(data.data?.message || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
    }
  }, [isOpen, fetchContacts]);

  const createConversation = useCallback(
    async (hubspotContactId: string, customerName?: string, customerEmail?: string, customerPhone?: string) => {
      setIsCreating(true);
      setError(null);
      try {
        const res = await fetch('/api/v1/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hubspotContactId,
            ...(customerName && { customerName }),
            ...(customerEmail && { customerEmail }),
            ...(customerPhone && { customerPhone }),
          }),
        });

        const data: ApiResponse<{ id: string }> = await res.json();

        if (!data.success) {
          throw new Error(data.error?.message || 'Failed to create conversation');
        }

        onClose();
        router.push(`/conversations/${data.data?.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create conversation');
      } finally {
        setIsCreating(false);
      }
    },
    [onClose, router]
  );

  const handleContactSelect = useCallback(
    (contact: HubSpotContact) => {
      const name = [contact.firstname, contact.lastname].filter(Boolean).join(' ');
      createConversation(contact.id, name, contact.email, contact.phone);
    },
    [createConversation]
  );

  const handleManualCreate = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!manualContactId.trim()) return;
      createConversation(manualContactId.trim(), manualName.trim() || undefined);
    },
    [manualContactId, manualName, createConversation]
  );

  // Filter contacts by search
  const filteredContacts = contacts.filter(c => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    const name = `${c.firstname || ''} ${c.lastname || ''}`.toLowerCase();
    return (
      name.includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg border border-foreground/10 bg-background p-0 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-foreground/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            New Conversation
          </h2>
          <button
            onClick={onClose}
            className="text-foreground/40 transition-colors hover:text-foreground"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {hubspotConfigured && contacts.length > 0 && (
            <div className="px-6 pt-4">
              <p className="mb-3 text-sm text-foreground/60">
                Select a HubSpot contact to start a conversation
              </p>
              <Input
                placeholder="Filter contacts..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
              />
            </div>
          )}

          {error && (
            <div className="mx-6 mt-3 rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="space-y-2 px-6 py-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 animate-pulse rounded bg-foreground/10" />
              ))}
            </div>
          )}

          {/* Contact list */}
          {!isLoading && hubspotConfigured && filteredContacts.length > 0 && (
            <div className="space-y-1 px-6 py-4">
              {filteredContacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => handleContactSelect(contact)}
                  disabled={isCreating}
                  className="flex w-full items-center gap-3 rounded px-3 py-3 text-left transition-colors hover:bg-foreground/5 disabled:opacity-50"
                >
                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-sm font-medium text-foreground">
                    {(contact.firstname?.[0] || contact.email?.[0] || '?').toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {[contact.firstname, contact.lastname].filter(Boolean).join(' ') ||
                        contact.email ||
                        `Contact ${contact.id}`}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-foreground/40">
                      {contact.email && <span className="truncate">{contact.email}</span>}
                      {contact.phone && <span>{contact.phone}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Empty state for search */}
          {!isLoading && hubspotConfigured && contacts.length > 0 && filteredContacts.length === 0 && (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-foreground/40">No contacts match your search</p>
            </div>
          )}

          {/* HubSpot configuration message */}
          {!isLoading && !hubspotConfigured && hubspotMessage && (
            <div className="mx-6 mt-3 rounded border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-400">
              {hubspotMessage}
            </div>
          )}

          {/* Manual entry fallback (when HubSpot not configured or no contacts) */}
          {!isLoading && (
            <div className={hubspotConfigured && contacts.length > 0 ? 'border-t border-foreground/10' : ''}>
              <div className="px-6 py-4">
                <p className="mb-3 text-sm text-foreground/60">
                  {hubspotConfigured && contacts.length > 0
                    ? 'Or enter a HubSpot contact ID manually'
                    : 'Enter a HubSpot contact ID to start a conversation'}
                </p>
                <form onSubmit={handleManualCreate} className="space-y-3">
                  <Input
                    placeholder="HubSpot Contact ID"
                    value={manualContactId}
                    onChange={e => setManualContactId(e.target.value)}
                  />
                  <Input
                    placeholder="Customer name (optional)"
                    value={manualName}
                    onChange={e => setManualName(e.target.value)}
                  />
                  <Button
                    type="submit"
                    disabled={!manualContactId.trim() || isCreating}
                    isLoading={isCreating}
                  >
                    Create Conversation
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
