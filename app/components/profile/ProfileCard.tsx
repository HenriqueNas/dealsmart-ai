'use client';

import { useAuth } from '@/app/hooks/useAuth';
import { RoleBadge, StatusBadge } from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

export function ProfileCard() {
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

  if (!user) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 text-2xl font-bold text-accent">
            {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex flex-1 flex-col gap-2">
            <div>
              <p className="text-lg font-medium text-foreground">
                {user.name || 'No name set'}
              </p>
              <p className="text-sm text-foreground/60">{user.email}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <RoleBadge role={user.role} />
              <StatusBadge
                verified={user.verified}
                label={user.verified ? 'Email Verified' : 'Email Unverified'}
              />
              <StatusBadge
                verified={user.ageVerified}
                label={user.ageVerified ? 'Age Verified' : 'Age Unverified'}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
