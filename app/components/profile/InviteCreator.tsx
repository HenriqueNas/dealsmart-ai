'use client';

import { useAuth } from '@/app/hooks/useAuth';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Copy, CopyCheck } from 'lucide-react';
import { useState } from 'react';

export function InviteCreator() {
  const { user, isLoading } = useAuth();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-32 animate-pulse rounded bg-foreground/10" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 w-48 animate-pulse rounded bg-foreground/10" />
            <div className="h-4 w-32 animate-pulse rounded bg-foreground/10" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  const handleGenerateInviteCode = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole: 'CREATOR' }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(
          data.error?.message || 'Failed to generate invite code'
        );
      }

      setInviteCode(data.data.invite.code);
    } catch (err) {
      const error = err as Error;
      console.log(error);
      setError(error.message || 'Failed to generate invite code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <Card>
      <CardHeader className="border-none flex items-center justify-between">
        <CardTitle>Invite User to be a Creator</CardTitle>
        {inviteCode && (
          <Button variant="secondary" size="sm" onClick={handleCopyInviteCode}>
            {isCopied ? 'Copied!' : 'Copy invitation code'}
            {isCopied ? (
              <CopyCheck className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-foreground/50" />
            )}
          </Button>
        )}
        {!inviteCode && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleGenerateInviteCode}
            isLoading={isGenerating}
            disabled={isGenerating}
          >
            Generate Invitation Code
          </Button>
        )}
      </CardHeader>
      {inviteCode && (
        <CardContent>
          <div className="flex items-center gap-3">
            <code className="flex-1 rounded bg-foreground/5 px-4 py-2 font-mono text-sm font-medium text-foreground">
              {inviteCode}
            </code>
          </div>
        </CardContent>
      )}
      {error && (
        <CardContent>
          <div className="rounded-none bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
