'use client';

import { useApiKey, LLMProvider } from '@/app/hooks/useApiKey';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/Card';
import { useState } from 'react';

const providerLabels: Record<LLMProvider, string> = {
  ANTHROPIC: 'Anthropic (Claude)',
  OPENAI: 'OpenAI (GPT)',
  GOOGLE: 'Google (Gemini)',
};

const providerPlaceholders: Record<LLMProvider, string> = {
  ANTHROPIC: 'sk-ant-api03-...',
  OPENAI: 'sk-proj-...',
  GOOGLE: 'AIzaSy...',
};

export function ApiKeySettings() {
  const { config, isLoading, isSaving, error, updateApiKey, removeApiKey } =
    useApiKey();

  const [newApiKey, setNewApiKey] = useState('');
  const [provider, setProvider] = useState<LLMProvider>('ANTHROPIC');
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync provider when config loads
  if (config && provider !== config.provider && !isEditing) {
    setProvider(config.provider);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    try {
      const message = await updateApiKey(newApiKey || null, provider);
      setSuccessMessage(message);
      setNewApiKey('');
      setIsEditing(false);
    } catch {
      // Error is handled by the hook
    }
  };

  const handleRemove = async () => {
    setSuccessMessage(null);
    try {
      const message = await removeApiKey();
      setSuccessMessage(message);
    } catch {
      // Error is handled by the hook
    }
  };

  const handleProviderChange = async (newProvider: LLMProvider) => {
    setProvider(newProvider);
    // If not editing and has an API key, update just the provider
    if (!isEditing && config?.hasApiKey) {
      setSuccessMessage(null);
      try {
        const message = await updateApiKey(null, newProvider);
        setSuccessMessage(message);
      } catch {
        // Error is handled by the hook
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI API Key</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-20 animate-pulse rounded bg-foreground/10" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI API Key</CardTitle>
        <CardDescription>
          Configure your LLM provider API key for AI features across the app
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

          {/* Provider selector */}
          <div className="space-y-2">
            <label
              htmlFor="provider"
              className="block text-sm font-medium text-foreground"
            >
              LLM Provider
            </label>
            <Select
              id="provider"
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as LLMProvider)}
              disabled={isSaving}
            >
              <option value="ANTHROPIC">{providerLabels.ANTHROPIC}</option>
              <option value="OPENAI">{providerLabels.OPENAI}</option>
              <option value="GOOGLE">{providerLabels.GOOGLE}</option>
            </Select>
          </div>

          {/* Current API key status */}
          {config?.hasApiKey && !isEditing && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Current API Key
              </label>
              <div className="flex items-center gap-3">
                <code className="flex-1 rounded border border-foreground/10 bg-foreground/5 px-3 py-2 font-mono text-sm text-foreground/70">
                  {config.maskedApiKey}
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

          {/* New API key input */}
          {(!config?.hasApiKey || isEditing) && (
            <div className="space-y-2">
              <label
                htmlFor="apiKey"
                className="block text-sm font-medium text-foreground"
              >
                {config?.hasApiKey ? 'New API Key' : 'API Key'}
              </label>
              <Input
                id="apiKey"
                type="password"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder={providerPlaceholders[provider]}
                disabled={isSaving}
              />
              <p className="text-xs text-foreground/50">
                Your API key is encrypted and stored securely. It will be used for
                AI Chat, AI suggestions, and other AI-powered features.
              </p>
            </div>
          )}

          {/* Action buttons */}
          {(!config?.hasApiKey || isEditing) && (
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={!newApiKey.trim() || isSaving}
                isLoading={isSaving}
              >
                {config?.hasApiKey ? 'Update API Key' : 'Save API Key'}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setNewApiKey('');
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              )}
            </div>
          )}

          {/* No API key message */}
          {!config?.hasApiKey && !newApiKey && (
            <p className="text-sm text-foreground/60">
              No API key configured. Add your API key to enable AI features.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
