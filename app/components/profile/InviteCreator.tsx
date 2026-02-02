'use client';

import { useAuth } from '@/app/hooks/useAuth';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Copy, CopyCheck } from 'lucide-react';
import { useState } from 'react';

export function InviteCreator() {
  const { user, isLoading } = useAuth();

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

  const [isCopied, setIsCopied] = useState(false);

  const handleCopyInviteCode = () => {
    const tempInviteCode = 'TEMP-CREATOR-INVITE-1234'; // TODO: This should be generated securely
    navigator.clipboard.writeText(tempInviteCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="border-none flex items-center justify-between">
        <CardTitle>Invite User to be an Creator</CardTitle>
        <Button variant="secondary" size="sm" onClick={handleCopyInviteCode}>
          {isCopied ? 'Copied!' : 'Copy temporary invitation code'}
          {isCopied ? (
            <CopyCheck className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4 text-foreground/50" />
          )}
        </Button>
      </CardHeader>
    </Card>
  );
}
