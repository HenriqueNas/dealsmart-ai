/**
 * OpenAI LLM Provider (Fallback)
 */

import OpenAI from 'openai';
import type {
  LLMProvider,
  GenerateSuggestionInput,
  GenerateSuggestionResult,
  LLMConfig,
} from './types';
import { DEFAULT_LLM_CONFIG, DEALERSHIP_SYSTEM_PROMPT } from './types';

class OpenAIProvider implements LLMProvider {
  name = 'openai' as const;
  private client: OpenAI | null = null;
  private config: LLMConfig;

  constructor(config: Partial<LLMConfig> = {}) {
    this.config = { ...DEFAULT_LLM_CONFIG, ...config };
  }

  /**
   * Get or initialize the OpenAI client
   */
  private getClient(): OpenAI {
    if (this.client) {
      return this.client;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    this.client = new OpenAI({ apiKey });
    return this.client;
  }

  /**
   * Check if OpenAI is configured
   */
  isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
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
   * Convert conversation history to OpenAI message format
   */
  private convertMessages(
    history: GenerateSuggestionInput['conversationHistory'],
    systemPrompt: string
  ): OpenAI.ChatCompletionMessageParam[] {
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    for (const msg of history) {
      if (msg.role === 'system') continue;
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    // Ensure conversation ends with a user message
    if (
      messages.length === 1 ||
      messages[messages.length - 1].role !== 'user'
    ) {
      messages.push({
        role: 'user',
        content: 'Please suggest a response to continue this conversation.',
      });
    }

    return messages;
  }

  /**
   * Generate a response suggestion using GPT-4
   */
  async generateSuggestion(
    input: GenerateSuggestionInput
  ): Promise<GenerateSuggestionResult> {
    const startTime = Date.now();
    const client = this.getClient();

    const systemPrompt = this.buildSystemPrompt(input);
    const messages = this.convertMessages(input.conversationHistory, systemPrompt);

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      messages,
    });

    const suggestion = response.choices[0]?.message?.content || '';
    const tokensUsed =
      (response.usage?.prompt_tokens || 0) +
      (response.usage?.completion_tokens || 0);

    return {
      suggestion,
      model: response.model,
      provider: 'openai',
      tokensUsed,
      latencyMs: Date.now() - startTime,
    };
  }
}

export const openaiProvider = new OpenAIProvider();
