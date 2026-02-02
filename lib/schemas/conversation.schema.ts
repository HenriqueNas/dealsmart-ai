import { z } from 'zod';

/**
 * Conversation status enum values
 */
export const conversationStatusValues = ['NEW', 'IN_PROGRESS', 'RESOLVED'] as const;
export type ConversationStatusType = (typeof conversationStatusValues)[number];

/**
 * Sender type enum values
 */
export const senderTypeValues = ['CUSTOMER', 'AGENT', 'AI'] as const;
export type SenderTypeValue = (typeof senderTypeValues)[number];

/**
 * Schema for creating a new conversation
 */
export const createConversationSchema = z.object({
  hubspotContactId: z.string().min(1, 'HubSpot contact ID is required'),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  assignedToId: z.string().optional(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;

/**
 * Schema for updating a conversation
 */
export const updateConversationSchema = z.object({
  status: z.enum(conversationStatusValues).optional(),
  assignedToId: z.string().nullable().optional(),
});

export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;

/**
 * Schema for sending a message
 */
export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  senderType: z.enum(senderTypeValues).default('AGENT'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

/**
 * Schema for conversation list query parameters
 */
export const conversationListQuerySchema = z.object({
  status: z.enum(conversationStatusValues).optional(),
  assignedToId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type ConversationListQuery = z.infer<typeof conversationListQuerySchema>;

/**
 * Schema for message polling query parameters
 */
export const messagePollingQuerySchema = z.object({
  since: z.coerce.date().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type MessagePollingQuery = z.infer<typeof messagePollingQuerySchema>;

/**
 * Schema for AI suggestion feedback
 */
export const suggestionFeedbackSchema = z.object({
  accepted: z.boolean(),
  editedContent: z.string().optional(),
  reason: z.string().optional(),
});

export type SuggestionFeedbackInput = z.infer<typeof suggestionFeedbackSchema>;
