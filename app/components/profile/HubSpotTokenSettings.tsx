'use client';

import { useHubSpotToken } from '@/app/hooks/useHubSpotToken';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/Card';
import { useState } from 'react';

export function HubSpotTokenSettings() {
  const { config, isLoading, isSaving, error, updateToken, removeToken } =
    useHubSpotToken();

  const [newToken, setNewToken] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    try {
      const message = await updateToken(newToken || null);
      setSuccessMessage(message);
      setNewToken('');
      setIsEditing(false);
    } catch {
      // Error is handled by the hook
    }
  };

  const handleRemove = async () => {
    setSuccessMessage(null);
    try {
      const message = await removeToken();
      setSuccessMessage(message);
    } catch {
      // Error is handled by the hook
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>HubSpot Integration</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-20 animate-pulse rounded bg-foreground/10" />
        </CardContent>
      </Card>
    );
  }

  // If config is null, user doesn't have access (not CREATOR/ADMIN)
  if (config === null && !error) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>HubSpot Integration</CardTitle>
        <CardDescription>
          Configure your HubSpot access token to import contacts from your CRM
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          {/* Success message */}
          {successMessage && (
            <div className="rounded border border-green-500/20 bg-green-500/10 px-3 py-2 text-sm text-green-400">
              {successMessage}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Current token status */}
          {config?.hasToken && !isEditing && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Current Access Token
              </label>
              <div className="flex items-center gap-3">
                <code className="flex-1 rounded border border-foreground/10 bg-foreground/5 px-3 py-2 font-mono text-sm text-foreground/70">
                  {config.maskedToken}
                </code>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  disabled={isSaving}
                >
                  Change
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleRemove}
                  disabled={isSaving}
                  isLoading={isSaving}
                >
                  Remove
                </Button>
              </div>
            </div>
          )}

          {/* New token input */}
          {(!config?.hasToken || isEditing) && (
            <div className="space-y-2">
              <label
                htmlFor="hubspotToken"
                className="block text-sm font-medium text-foreground"
              >
                {config?.hasToken ? 'New Access Token' : 'Access Token'}
              </label>
              <Input
                id="hubspotToken"
                type="password"
                value={newToken}
                onChange={(e) => setNewToken(e.target.value)}
                placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                disabled={isSaving}
              />
              <p className="text-xs text-foreground/50">
                Get your access token from{' '}
                <a
                  href="https://app.hubspot.com/private-apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  HubSpot Private Apps
                </a>
                . Your token is encrypted and stored securely.
              </p>
            </div>
          )}

          {/* Action buttons */}
          {(!config?.hasToken || isEditing) && (
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={!newToken.trim() || isSaving}
                isLoading={isSaving}
              >
                {config?.hasToken ? 'Update Token' : 'Save Token'}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setNewToken('');
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              )}
            </div>
          )}

          {/* No token message */}
          {!config?.hasToken && !newToken && (
            <p className="text-sm text-foreground/60">
              No HubSpot token configured. Add your access token to import contacts from HubSpot CRM.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
