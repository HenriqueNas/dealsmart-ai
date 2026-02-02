import type {
  Conversation,
  ConversationStatus,
  Message,
  SenderType,
} from '@/infra/prisma/generated/client';
import { hubspotService } from '@/server/integrations/hubspot';
import {
  conversationRepository,
  type ConversationListFilters,
  type ConversationWithMessages,
  type PaginationOptions,
} from '@/server/repositories/conversation.repository';
import { NotFoundError } from '@/server/utils/errors';

export interface CreateConversationInput {
  hubspotContactId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  assignedToId?: string;
}

export interface SendMessageInput {
  conversationId: string;
  content: string;
  senderType: SenderType;
  metadata?: Record<string, unknown>;
}

export interface ConversationListResult {
  conversations: (Conversation & { lastMessage?: Message })[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

class ConversationService {
  /**
   * Get a conversation by ID
   */
  async getConversation(id: string): Promise<Conversation> {
    const conversation = await conversationRepository.findById(id);
    if (!conversation) {
      throw new NotFoundError('Conversation', id);
    }
    return conversation;
  }

  /**
   * Get a conversation with all messages
   */
  async getConversationWithMessages(id: string): Promise<ConversationWithMessages> {
    const conversation = await conversationRepository.findByIdWithMessages(id);
    if (!conversation) {
      throw new NotFoundError('Conversation', id);
    }
    return conversation;
  }

  /**
   * List conversations with filters and pagination
   */
  async listConversations(
    filters: ConversationListFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<ConversationListResult> {
    const { page = 1, pageSize = 20 } = pagination;
    const { conversations, total } = await conversationRepository.findMany(filters, {
      page,
      pageSize,
    });

    // Transform to include lastMessage
    const conversationsWithLastMessage = conversations.map((conv) => {
      const { messages, ...rest } = conv as Conversation & { messages?: Message[] };
      return {
        ...rest,
        lastMessage: messages?.[0],
      };
    });

    return {
      conversations: conversationsWithLastMessage,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Create a new conversation
   * Optionally fetches customer data from HubSpot if not provided
   */
  async createConversation(input: CreateConversationInput): Promise<Conversation> {
    let customerData = {
      customerName: input.customerName || 'Unknown Customer',
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
    };

    // If customer details not provided, try to fetch from HubSpot
    if (!input.customerName) {
      try {
        const contact = await hubspotService.getContactById(input.hubspotContactId);
        if (contact) {
          customerData = {
            customerName:
              `${contact.firstname || ''} ${contact.lastname || ''}`.trim() ||
              'Unknown Customer',
            customerEmail: contact.email,
            customerPhone: contact.phone,
          };
        }
      } catch (error) {
        console.warn(
          '[ConversationService] Failed to fetch HubSpot contact:',
          error
        );
        // Continue with default/provided data
      }
    }

    return conversationRepository.create({
      hubspotContactId: input.hubspotContactId,
      customerName: customerData.customerName,
      customerEmail: customerData.customerEmail,
      customerPhone: customerData.customerPhone,
      assignedToId: input.assignedToId,
    });
  }

  /**
   * Update conversation status
   */
  async updateStatus(id: string, status: ConversationStatus): Promise<Conversation> {
    const conversation = await this.getConversation(id);

    return conversationRepository.update(conversation.id, { status });
  }

  /**
   * Assign conversation to an agent
   */
  async assignToAgent(id: string, agentId: string | null): Promise<Conversation> {
    const conversation = await this.getConversation(id);

    // If assigning to an agent and status is NEW, change to IN_PROGRESS
    const updates: { assignedToId: string | null; status?: ConversationStatus } = {
      assignedToId: agentId,
    };

    if (agentId && conversation.status === 'NEW') {
      updates.status = 'IN_PROGRESS';
    }

    return conversationRepository.update(conversation.id, updates);
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(input: SendMessageInput): Promise<Message> {
    // Verify conversation exists
    const conversation = await this.getConversation(input.conversationId);

    // Create the message
    const message = await conversationRepository.addMessage({
      conversationId: input.conversationId,
      senderType: input.senderType,
      content: input.content,
      metadata: input.metadata,
    });

    // If conversation is NEW and agent sends a message, move to IN_PROGRESS
    if (conversation.status === 'NEW' && input.senderType === 'AGENT') {
      await conversationRepository.update(conversation.id, { status: 'IN_PROGRESS' });
    }

    // Log message to HubSpot as activity (async, don't block)
    if (input.senderType === 'AGENT') {
      this.logMessageToHubSpot(conversation.hubspotContactId, input.content).catch(
        (err) => {
          console.error('[ConversationService] Failed to log message to HubSpot:', err);
        }
      );
    }

    return message;
  }

  /**
   * Get messages for a conversation (for polling)
   */
  async getMessages(
    conversationId: string,
    options: { since?: Date; limit?: number } = {}
  ): Promise<Message[]> {
    // Verify conversation exists
    await this.getConversation(conversationId);

    return conversationRepository.getMessages(conversationId, options);
  }

  /**
   * Log a message to HubSpot as a note/activity
   */
  private async logMessageToHubSpot(
    hubspotContactId: string,
    content: string
  ): Promise<void> {
    try {
      await hubspotService.createNote(hubspotContactId, {
        body: `[DealSmart AI] Agent message:\n\n${content}`,
      });
    } catch (error) {
      // Log but don't fail - this is a non-critical operation
      console.error('[ConversationService] HubSpot note creation failed:', error);
    }
  }

  /**
   * Refresh customer data from HubSpot
   */
  async refreshCustomerData(conversationId: string): Promise<Conversation> {
    const conversation = await this.getConversation(conversationId);

    try {
      const contact = await hubspotService.getContactById(conversation.hubspotContactId);
      if (contact) {
        return conversationRepository.update(conversation.id, {
          customerName:
            `${contact.firstname || ''} ${contact.lastname || ''}`.trim() ||
            conversation.customerName,
          customerEmail: contact.email || conversation.customerEmail,
          customerPhone: contact.phone || conversation.customerPhone,
        });
      }
    } catch (error) {
      console.error('[ConversationService] Failed to refresh from HubSpot:', error);
    }

    return conversation;
  }
}

export const conversationService = new ConversationService();
