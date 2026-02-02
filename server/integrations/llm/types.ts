/**
 * LLM Integration Types
 */

/**
 * Message role for conversation context
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Message in the conversation context
 */
export interface LLMMessage {
  role: MessageRole;
  content: string;
}

/**
 * Customer context from HubSpot
 */
export interface CustomerContext {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

/**
 * Input for generating a response suggestion
 */
export interface GenerateSuggestionInput {
  conversationHistory: LLMMessage[];
  customerContext?: CustomerContext;
  systemPrompt?: string;
}

/**
 * Result from generating a response suggestion
 */
export interface GenerateSuggestionResult {
  suggestion: string;
  model: string;
  provider: 'anthropic' | 'openai';
  tokensUsed?: number;
  latencyMs: number;
}

/**
 * LLM Provider interface
 */
export interface LLMProvider {
  /**
   * Provider name
   */
  name: 'anthropic' | 'openai';

  /**
   * Check if the provider is configured and available
   */
  isAvailable(): boolean;

  /**
   * Generate a response suggestion
   */
  generateSuggestion(input: GenerateSuggestionInput): Promise<GenerateSuggestionResult>;
}

/**
 * LLM configuration
 */
export interface LLMConfig {
  maxTokens: number;
  temperature: number;
  timeout: number;
}

/**
 * Default LLM configuration
 */
export const DEFAULT_LLM_CONFIG: LLMConfig = {
  maxTokens: 500,
  temperature: 0.7,
  timeout: 30000, // 30 seconds
};

/**
 * System prompt for dealership AI assistant
 */
export const DEALERSHIP_SYSTEM_PROMPT = `You are Max, a helpful and professional AI sales advisor for a BMW dealership. Your role is to assist dealership staff by suggesting responses to customer inquiries.

Guidelines:
- Be helpful, friendly, and professional in tone
- Reference specific details from the conversation when relevant
- NEVER invent or make up information about:
  - Vehicle prices or availability
  - Inventory details
  - Financing terms
  - Specific promotions or discounts
- If you don't have information, suggest the agent verify with the dealership's systems
- Ask clarifying questions when the customer's needs are unclear
- Keep responses concise but complete (2-4 sentences typically)
- Focus on helping the customer and moving the conversation forward

Remember: You are suggesting responses for a human agent to review before sending. The agent may edit or completely rewrite your suggestion.`;
