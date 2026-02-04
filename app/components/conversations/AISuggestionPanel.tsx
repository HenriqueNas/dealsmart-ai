'use client';

import { useAISuggestion } from '@/app/hooks/useAISuggestion';
import { Button } from '@/app/components/ui/Button';
import { useCallback, useEffect, useState } from 'react';

interface AISuggestionPanelProps {
  conversationId: string;
  onSendMessage: (content: string) => Promise<void>;
  hasMessages: boolean;
}

export function AISuggestionPanel({
  conversationId,
  onSendMessage,
  hasMessages,
}: AISuggestionPanelProps) {
  const { suggestion, isLoading, error, generateSuggestion, clear } =
    useAISuggestion(conversationId);

  const [editedContent, setEditedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Sync edited content when suggestion arrives
  useEffect(() => {
    if (suggestion?.suggestion) {
      setEditedContent(suggestion.suggestion);
      setIsEditing(false);
    }
  }, [suggestion]);

  const handleSendAsIs = useCallback(async () => {
    if (!suggestion) return;
    setIsSending(true);
    try {
      await onSendMessage(suggestion.suggestion);
      clear();
    } catch {
      // Error handled by parent
    } finally {
      setIsSending(false);
    }
  }, [suggestion, onSendMessage, clear]);

  const handleSendEdited = useCallback(async () => {
    if (!editedContent.trim()) return;
    setIsSending(true);
    try {
      await onSendMessage(editedContent);
      clear();
    } catch {
      // Error handled by parent
    } finally {
      setIsSending(false);
    }
  }, [editedContent, onSendMessage, clear]);

  if (!hasMessages) return null;

  return (
    <div className="border border-foreground/10 bg-foreground/2">
      <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4 text-accent"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <span className="text-sm font-medium text-foreground">
            AI Suggestion
          </span>
          {suggestion && (
            <span className="text-xs text-foreground/40">
              {suggestion.provider} / {suggestion.model} ({suggestion.latencyMs}
              ms)
            </span>
          )}
        </div>

        {!suggestion && !isLoading && (
          <Button
            variant="secondary"
            size="sm"
            onClick={generateSuggestion}
            disabled={isLoading}
          >
            Generate Response
          </Button>
        )}

        {suggestion && (
          <Button variant="ghost" size="sm" onClick={clear}>
            Dismiss
          </Button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center gap-2 px-4 py-6">
          <svg
            className="h-4 w-4 animate-spin text-accent"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm text-foreground/60">
            Generating AI response...
          </span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={generateSuggestion}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Suggestion content */}
      {suggestion && (
        <div className="px-4 py-3">
          {/* Warnings */}
          {suggestion.warnings.length > 0 && (
            <div className="mb-3 rounded border border-yellow-500/20 bg-yellow-500/10 px-3 py-2">
              {suggestion.warnings.map((w, i) => (
                <p key={i} className="text-xs text-yellow-400">
                  {w}
                </p>
              ))}
            </div>
          )}

          {/* Suggestion text */}
          {isEditing ? (
            <textarea
              value={editedContent}
              onChange={e => setEditedContent(e.target.value)}
              className="w-full resize-none rounded border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
              rows={4}
              autoFocus
            />
          ) : (
            <div className="rounded bg-foreground/5 px-3 py-2 text-sm text-foreground/80 whitespace-pre-wrap">
              {suggestion.suggestion}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              onClick={isEditing ? handleSendEdited : handleSendAsIs}
              isLoading={isSending}
              disabled={isSending}
            >
              {isEditing ? 'Send Edited' : 'Send as-is'}
            </Button>

            {!isEditing ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={isSending}
              >
                Edit & Send
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(suggestion.suggestion);
                }}
                disabled={isSending}
              >
                Cancel Edit
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
              disabled={isSending}
            >
              b Ignore
            </Button>
          </div>
        </div>
      )}

      {/* Empty state — no suggestion yet */}
      {!suggestion && !isLoading && !error && (
        <div className="px-4 py-4 text-center">
          <p className="text-sm text-foreground/40">
            Click "Generate Response" to get an AI-suggested reply
          </p>
        </div>
      )}
    </div>
  );
}
