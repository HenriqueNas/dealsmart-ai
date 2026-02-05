/**
 * LLM Integration
 *
 * Provides AI-powered response suggestions using Claude or OpenAI.
 */

export { llmService, createLlmServiceWithKey } from './llm.service';
export { anthropicProvider } from './anthropic.provider';
export { openaiProvider } from './openai.provider';
export type {
  LLMProvider,
  LLMMessage,
  LLMConfig,
  CustomerContext,
  GenerateSuggestionInput,
  GenerateSuggestionResult,
} from './types';
export { DEFAULT_LLM_CONFIG, DEALERSHIP_SYSTEM_PROMPT } from './types';
