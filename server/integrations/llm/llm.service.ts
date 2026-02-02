/**
 * LLM Service
 *
 * Manages LLM providers and generates AI suggestions for conversations.
 */

import type { Message } from '@/infra/prisma/generated/client';
import { anthropicProvider } from './anthropic.provider';
import { openaiProvider } from './openai.provider';
import type {
  CustomerContext,
  GenerateSuggestionResult,
  LLMMessage,
  LLMProvider,
} from './types';

class LLMService {
  private providers: LLMProvider[] = [anthropicProvider, openaiProvider];

  /**
   * Get the first available provider
   */
  private getAvailableProvider(): LLMProvider | null {
    for (const provider of this.providers) {
      if (provider.isAvailable()) {
        return provider;
      }
    }
    return null;
  }

  /**
   * Check if any LLM provider is available
   */
  isAvailable(): boolean {
    return this.getAvailableProvider() !== null;
  }

  /**
   * Get status of all providers
   */
  getProviderStatus(): { name: string; available: boolean }[] {
    return this.providers.map((p) => ({
      name: p.name,
      available: p.isAvailable(),
    }));
  }

  /**
   * Convert database messages to LLM message format
   */
  private convertMessagesToLLMFormat(messages: Message[]): LLMMessage[] {
    return messages.map((msg) => ({
      role: msg.senderType === 'CUSTOMER' ? 'user' : 'assistant',
      content: msg.content,
    }));
  }

  /**
   * Generate a response suggestion for a conversation
   */
  async generateSuggestion(
    messages: Message[],
    customerContext?: CustomerContext
  ): Promise<GenerateSuggestionResult> {
    const provider = this.getAvailableProvider();

    if (!provider) {
      throw new Error(
        'No LLM provider available. Please configure ANTHROPIC_API_KEY or OPENAI_API_KEY.'
      );
    }

    console.log(`[LLM] Generating suggestion using ${provider.name}`);

    const conversationHistory = this.convertMessagesToLLMFormat(messages);

    try {
      const result = await provider.generateSuggestion({
        conversationHistory,
        customerContext,
      });

      console.log(
        `[LLM] Generated suggestion in ${result.latencyMs}ms using ${result.model}`
      );

      return result;
    } catch (error) {
      console.error(`[LLM] Error generating suggestion:`, error);

      // Try fallback provider if available
      const fallbackProvider = this.providers.find(
        (p) => p.name !== provider.name && p.isAvailable()
      );

      if (fallbackProvider) {
        console.log(`[LLM] Trying fallback provider: ${fallbackProvider.name}`);
        return fallbackProvider.generateSuggestion({
          conversationHistory,
          customerContext,
        });
      }

      throw error;
    }
  }

  /**
   * Validate an AI suggestion before use
   * Checks for forbidden content like invented prices
   */
  validateSuggestion(suggestion: string): {
    valid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    // Check for price patterns that might be made up
    const pricePattern = /\$[\d,]+(\.\d{2})?/g;
    const prices = suggestion.match(pricePattern);
    if (prices && prices.length > 0) {
      warnings.push(
        `Contains price references (${prices.join(', ')}). Please verify these are accurate.`
      );
    }

    // Check for specific inventory claims
    const inventoryPatterns = [
      /we have \d+ (in stock|available)/i,
      /only \d+ left/i,
      /limited to \d+/i,
    ];
    for (const pattern of inventoryPatterns) {
      if (pattern.test(suggestion)) {
        warnings.push(
          'Contains inventory claims. Please verify current availability.'
        );
        break;
      }
    }

    // Check for financing terms
    const financingPatterns = [
      /\d+(\.\d+)?% apr/i,
      /\$\d+ (per|a) month/i,
      /\d+ months? (financing|payment)/i,
    ];
    for (const pattern of financingPatterns) {
      if (pattern.test(suggestion)) {
        warnings.push(
          'Contains financing terms. Please verify current rates and terms.'
        );
        break;
      }
    }

    return {
      valid: true, // We don't block, just warn
      warnings,
    };
  }
}

export const llmService = new LLMService();
