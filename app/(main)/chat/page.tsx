'use client';

import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';

type LLMProvider = 'anthropic' | 'openai' | 'google';

export default function ChatPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<LLMProvider>('anthropic');
  const [isConfigured, setIsConfigured] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Use refs so the transport body function always reads the latest values
  // without needing to recreate the transport instance
  const apiKeyRef = useRef(apiKey);
  const providerRef = useRef(provider);
  apiKeyRef.current = apiKey;
  providerRef.current = provider;

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

  useEffect(
    function checkAuthentication() {
      if (!isAuthLoading && !isAuthenticated) {
        router.push('/login?callbackUrl=/chat');
      }
    },
    [isAuthenticated, isAuthLoading, router]
  );

  const handleConfigure = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      setIsConfigured(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage({ text: inputValue });
      setInputValue('');
    }
  };

  const handlePasteAPIKey = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Pasted API Key:', e.target.value);
    setApiKey(e.target.value);
  };

  if (isAuthLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
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
              Enter your API key and select a provider to start chatting
            </p>
          </div>

          <form onSubmit={handleConfigure} className="space-y-4">
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
                onChange={e => setProvider(e.target.value as LLMProvider)}
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
                value={apiKey}
                onChange={handlePasteAPIKey}
                placeholder={
                  provider === 'anthropic'
                    ? 'sk-ant-api03-...'
                    : provider === 'google'
                    ? 'AIzaSy...'
                    : 'sk-proj-...'
                }
              />
              <p className="text-xs text-foreground/50">
                Your API key is sent directly to the provider and is not stored.
              </p>
            </div>

            <Button type="submit" disabled={!apiKey.trim()}>
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
            {provider === 'anthropic'
              ? 'Claude'
              : provider === 'google'
              ? 'Gemini'
              : 'GPT'}
          </span>
        </div>
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
                    ? 'bg-[#0aff64] text-black'
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
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading || !inputValue.trim()}>
                Send
              </Button>

              <Button
                variant="secondary"
                onClick={() => setIsConfigured(false)}
              >
                Change Provider
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
