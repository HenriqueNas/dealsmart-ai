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
import { DEALERSHIP_SYSTEM_PROMPT } from './types';

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

/**
 * Create an LLM service instance with a user-provided API key.
 * This is used when users have stored their own API key in their profile.
 */
export function createLlmServiceWithKey(
  apiKey: string,
  provider: 'anthropic' | 'openai' | 'google'
): LLMServiceWithKey {
  return new LLMServiceWithKey(apiKey, provider);
}

/**
 * LLM Service variant that uses a user-provided API key
 */
class LLMServiceWithKey {
  private apiKey: string;
  private providerName: 'anthropic' | 'openai' | 'google';

  constructor(apiKey: string, provider: 'anthropic' | 'openai' | 'google') {
    this.apiKey = apiKey;
    this.providerName = provider;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  getProviderStatus(): { name: string; available: boolean }[] {
    return [{ name: this.providerName, available: true }];
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

  async generateSuggestion(
    messages: Message[],
    customerContext?: CustomerContext
  ): Promise<GenerateSuggestionResult> {
    const conversationHistory = this.convertMessagesToLLMFormat(messages);

    if (this.providerName === 'anthropic') {
      return this.generateWithAnthropic(conversationHistory, customerContext);
    } else if (this.providerName === 'openai') {
      return this.generateWithOpenAI(conversationHistory, customerContext);
    } else if (this.providerName === 'google') {
      return this.generateWithGoogle(conversationHistory, customerContext);
    }

    throw new Error(`Unsupported provider: ${this.providerName}`);
  }

  private buildSystemPrompt(customerContext?: CustomerContext): string {
    let systemPrompt = DEALERSHIP_SYSTEM_PROMPT;

    if (customerContext) {
      const { name, email, phone, notes } = customerContext;
      systemPrompt += '\n\n--- Customer Information ---';
      systemPrompt += `\nName: ${name}`;
      if (email) systemPrompt += `\nEmail: ${email}`;
      if (phone) systemPrompt += `\nPhone: ${phone}`;
      if (notes) systemPrompt += `\nNotes: ${notes}`;
    }

    return systemPrompt;
  }

  private async generateWithAnthropic(
    history: LLMMessage[],
    customerContext?: CustomerContext
  ): Promise<GenerateSuggestionResult> {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const startTime = Date.now();

    const client = new Anthropic({ apiKey: this.apiKey });
    const systemPrompt = this.buildSystemPrompt(customerContext);

    const messages = history
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
      }));

    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
      messages.push({
        role: 'user' as const,
        content: 'Please suggest a response to continue this conversation.',
      });
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const suggestion =
      response.content[0].type === 'text' ? response.content[0].text : '';

    return {
      suggestion,
      model: response.model,
      provider: 'anthropic',
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      latencyMs: Date.now() - startTime,
    };
  }

  private async generateWithOpenAI(
    history: LLMMessage[],
    customerContext?: CustomerContext
  ): Promise<GenerateSuggestionResult> {
    const OpenAI = (await import('openai')).default;
    const startTime = Date.now();

    const client = new OpenAI({ apiKey: this.apiKey });
    const systemPrompt = this.buildSystemPrompt(customerContext);

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...history.map((msg) => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
      })),
    ];

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages,
    });

    const suggestion = response.choices[0]?.message?.content || '';

    return {
      suggestion,
      model: response.model,
      provider: 'openai',
      tokensUsed: response.usage?.total_tokens || 0,
      latencyMs: Date.now() - startTime,
    };
  }

  private async generateWithGoogle(
    history: LLMMessage[],
    customerContext?: CustomerContext
  ): Promise<GenerateSuggestionResult> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const startTime = Date.now();

    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const systemPrompt = this.buildSystemPrompt(customerContext);

    // Build conversation for Gemini
    const conversationText = history
      .map((msg) => `${msg.role === 'user' ? 'Customer' : 'Agent'}: ${msg.content}`)
      .join('\n\n');

    const prompt = `${systemPrompt}\n\n--- Conversation ---\n${conversationText}\n\n--- Your Response ---\nAs the dealership agent, please write a helpful response:`;

    const result = await model.generateContent(prompt);
    const suggestion = result.response.text();

    return {
      suggestion,
      model: 'gemini-2.0-flash',
      provider: 'google',
      tokensUsed: 0, // Gemini doesn't return token count in the same way
      latencyMs: Date.now() - startTime,
    };
  }

  validateSuggestion(suggestion: string): {
    valid: boolean;
    warnings: string[];
  } {
    // Reuse the validation logic from main service
    return llmService.validateSuggestion(suggestion);
  }
}
