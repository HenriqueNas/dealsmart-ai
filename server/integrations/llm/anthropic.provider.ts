/**
 * Anthropic (Claude) LLM Provider
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  LLMProvider,
  GenerateSuggestionInput,
  GenerateSuggestionResult,
  LLMConfig,
} from './types';
import { DEFAULT_LLM_CONFIG, DEALERSHIP_SYSTEM_PROMPT } from './types';

class AnthropicProvider implements LLMProvider {
  name = 'anthropic' as const;
  private client: Anthropic | null = null;
  private config: LLMConfig;

  constructor(config: Partial<LLMConfig> = {}) {
    this.config = { ...DEFAULT_LLM_CONFIG, ...config };
  }

  /**
   * Get or initialize the Anthropic client
   */
  private getClient(): Anthropic {
    if (this.client) {
      return this.client;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }

    this.client = new Anthropic({ apiKey });
    return this.client;
  }

  /**
   * Check if Anthropic is configured
   */
  isAvailable(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  /**
   * Build the system prompt with customer context
   */
  private buildSystemPrompt(input: GenerateSuggestionInput): string {
    let systemPrompt = input.systemPrompt || DEALERSHIP_SYSTEM_PROMPT;

    if (input.customerContext) {
      const { name, email, phone, notes } = input.customerContext;
      systemPrompt += '\n\n--- Customer Information ---';
      systemPrompt += `\nName: ${name}`;
      if (email) systemPrompt += `\nEmail: ${email}`;
      if (phone) systemPrompt += `\nPhone: ${phone}`;
      if (notes) systemPrompt += `\nNotes: ${notes}`;
    }

    return systemPrompt;
  }

  /**
   * Convert conversation history to Anthropic message format
   */
  private convertMessages(
    history: GenerateSuggestionInput['conversationHistory']
  ): Anthropic.MessageParam[] {
    return history
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));
  }

  /**
   * Generate a response suggestion using Claude
   */
  async generateSuggestion(
    input: GenerateSuggestionInput
  ): Promise<GenerateSuggestionResult> {
    const startTime = Date.now();
    const client = this.getClient();

    const systemPrompt = this.buildSystemPrompt(input);
    const messages = this.convertMessages(input.conversationHistory);

    // Ensure conversation ends with a user message (customer)
    // If not, add a prompt asking for a response
    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
      messages.push({
        role: 'user',
        content: 'Please suggest a response to continue this conversation.',
      });
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: this.config.maxTokens,
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
}

export const anthropicProvider = new AnthropicProvider();
