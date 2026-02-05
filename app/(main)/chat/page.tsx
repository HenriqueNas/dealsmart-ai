'use client';

import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { ApiResponse } from '@/lib/types/api.types';

type LLMProvider = 'anthropic' | 'openai' | 'google';

interface StoredApiKeyConfig {
  hasApiKey: boolean;
  apiKey: string | null;
  provider: 'ANTHROPIC' | 'OPENAI' | 'GOOGLE';
}

export default function ChatPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  // Stored API key from profile
  const [storedConfig, setStoredConfig] = useState<StoredApiKeyConfig | null>(
    null
  );
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // Manual API key entry (fallback)
  const [manualApiKey, setManualApiKey] = useState('');
  const [manualProvider, setManualProvider] =
    useState<LLMProvider>('anthropic');
  const [useManualKey, setUseManualKey] = useState(false);

  // Chat state
  const [isConfigured, setIsConfigured] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Determine effective API key and provider
  const effectiveApiKey = useManualKey
    ? manualApiKey
    : storedConfig?.apiKey || '';
  const effectiveProvider: LLMProvider = useManualKey
    ? manualProvider
    : (storedConfig?.provider?.toLowerCase() as LLMProvider) || 'anthropic';

  // Use refs so the transport body function always reads the latest values
  const apiKeyRef = useRef(effectiveApiKey);
  const providerRef = useRef(effectiveProvider);
  apiKeyRef.current = effectiveApiKey;
  providerRef.current = effectiveProvider;

  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        body: () => ({
          apiKey: apiKeyRef.current,
          provider: providerRef.current,
        }),
      })
  );

  const { messages, status, error, sendMessage, stop } = useChat({
    transport,
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  // Fetch stored API key config
  const fetchStoredConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/users/me/api-key/decrypt');
      const data: ApiResponse<StoredApiKeyConfig> = await res.json();

      if (data.success && data.data) {
        setStoredConfig(data.data);
        // Auto-configure if we have a stored key
        if (data.data.hasApiKey && data.data.apiKey) {
          setIsConfigured(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch stored API key:', err);
    } finally {
      setIsLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStoredConfig();
    }
  }, [isAuthenticated, fetchStoredConfig]);

  useEffect(
    function checkAuthentication() {
      if (!isAuthLoading && !isAuthenticated) {
        router.push('/login?callbackUrl=/chat');
      }
    },
    [isAuthenticated, isAuthLoading, router]
  );

  const handleManualConfigure = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualApiKey.trim()) {
      setUseManualKey(true);
      setIsConfigured(true);
    }
  };

  const handleUseStoredKey = () => {
    setUseManualKey(false);
    setIsConfigured(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage({ text: inputValue });
      setInputValue('');
    }
  };

  if (isAuthLoading || isLoadingConfig) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 pt-24 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="h-8 w-48 animate-pulse rounded bg-foreground/10" />
          <div className="h-48 animate-pulse rounded-none bg-foreground/10" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!isConfigured) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground">
              Configure AI Chat
            </h1>
            <p className="mt-2 text-sm text-foreground/70">
              {storedConfig?.hasApiKey
                ? 'Use your saved API key or enter a different one'
                : 'Enter your API key to start chatting'}
            </p>
          </div>

          {/* Use stored key option */}
          {storedConfig?.hasApiKey && (
            <div className="rounded border border-foreground/10 bg-foreground/2 p-4">
              <p className="mb-3 text-sm text-foreground/70">
                You have a saved {storedConfig.provider} API key in your profile
              </p>
              <Button onClick={handleUseStoredKey} className="w-full">
                Use Saved API Key
              </Button>
            </div>
          )}

          {/* Divider */}
          {storedConfig?.hasApiKey && (
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-foreground/10" />
              <span className="text-xs text-foreground/40">or</span>
              <div className="h-px flex-1 bg-foreground/10" />
            </div>
          )}

          {/* Manual entry form */}
          <form onSubmit={handleManualConfigure} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="provider"
                className="block text-sm font-medium text-foreground"
              >
                LLM Provider
              </label>
              <Select
                id="provider"
                value={manualProvider}
                onChange={e => setManualProvider(e.target.value as LLMProvider)}
              >
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="openai">OpenAI (GPT)</option>
                <option value="google">Google (Gemini)</option>
              </Select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="apiKey"
                className="block text-sm font-medium text-foreground"
              >
                API Key
              </label>
              <Input
                id="apiKey"
                type="password"
                value={manualApiKey}
                onChange={e => setManualApiKey(e.target.value)}
                placeholder={
                  manualProvider === 'anthropic'
                    ? 'sk-ant-api03-...'
                    : manualProvider === 'google'
                    ? 'AIzaSy...'
                    : 'sk-proj-...'
                }
              />
              <p className="text-xs text-foreground/50">
                This key will only be used for this session.{' '}
                <Link href="/profile" className="text-accent hover:underline">
                  Save a key in your profile
                </Link>{' '}
                to use it across all AI features.
              </p>
            </div>

            <Button type="submit" disabled={!manualApiKey.trim()}>
              Start Chatting
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] pt-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">AI Chat</h1>
          <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs text-foreground/70">
            {effectiveProvider === 'anthropic'
              ? 'Claude'
              : effectiveProvider === 'google'
              ? 'Gemini'
              : 'GPT'}
          </span>
          {!useManualKey && storedConfig?.hasApiKey && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
              Using saved key
            </span>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsConfigured(false)}
        >
          Change Provider
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-foreground/50">
              <p>Send a message to start the conversation</p>
            </div>
          )}

          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-accent text-black'
                    : 'bg-foreground/10 text-foreground'
                }`}
              >
                <div className="whitespace-pre-wrap">
                  {message.parts?.map((part, i) => {
                    if (part.type === 'text') {
                      return (
                        <span key={`${message.id}-${i}`}>{part.text}</span>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-lg bg-foreground/10 px-4 py-2 text-foreground">
                <span className="animate-pulse">Thinking...</span>
                <button
                  onClick={stop}
                  className="text-xs text-foreground/50 hover:text-foreground"
                >
                  Stop
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-500/10 px-4 py-2 text-red-500">
              Error: {error.message}
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-foreground/10 px-4 py-4">
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
          <div className="flex justify-between gap-2">
            <Input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Type a message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !inputValue.trim()}>
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
