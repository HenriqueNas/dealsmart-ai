import type {
  Conversation,
  ConversationStatus,
  Message,
  Prisma,
  SenderType,
} from '@/infra/prisma/generated/client';
import { prisma } from '@/infra/prisma/prisma';

export interface CreateConversationData {
  hubspotContactId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  assignedToId?: string;
}

export interface UpdateConversationData {
  status?: ConversationStatus;
  assignedToId?: string | null;
  customerName?: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
}

export interface CreateMessageData {
  conversationId: string;
  senderType: SenderType;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface ConversationListFilters {
  status?: ConversationStatus;
  assignedToId?: string;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

class ConversationRepository {
  /**
   * Find a conversation by ID
   */
  async findById(id: string): Promise<Conversation | null> {
    return prisma.conversation.findUnique({
      where: { id },
    });
  }

  /**
   * Find a conversation by ID with all messages
   */
  async findByIdWithMessages(id: string): Promise<ConversationWithMessages | null> {
    return prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  /**
   * Find conversations by HubSpot contact ID
   */
  async findByHubspotContactId(hubspotContactId: string): Promise<Conversation[]> {
    return prisma.conversation.findMany({
      where: { hubspotContactId },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  /**
   * List conversations with filters and pagination
   */
  async findMany(
    filters: ConversationListFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<{ conversations: Conversation[]; total: number }> {
    const { status, assignedToId, search } = filters;
    const { page = 1, pageSize = 20 } = pagination;

    const where = {
      ...(status && { status }),
      ...(assignedToId && { assignedToId }),
      ...(search && {
        OR: [
          { customerName: { contains: search, mode: 'insensitive' as const } },
          { customerEmail: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1, // Include only the last message for preview
          },
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    return { conversations, total };
  }

  /**
   * Create a new conversation
   */
  async create(data: CreateConversationData): Promise<Conversation> {
    return prisma.conversation.create({
      data: {
        hubspotContactId: data.hubspotContactId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        assignedToId: data.assignedToId,
        status: 'NEW',
      },
    });
  }

  /**
   * Update a conversation
   */
  async update(id: string, data: UpdateConversationData): Promise<Conversation> {
    return prisma.conversation.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a conversation
   */
  async delete(id: string): Promise<Conversation> {
    return prisma.conversation.delete({
      where: { id },
    });
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(data: CreateMessageData): Promise<Message> {
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: data.conversationId,
          senderType: data.senderType,
          content: data.content,
          metadata: data.metadata as Prisma.InputJsonValue,
        },
      }),
      prisma.conversation.update({
        where: { id: data.conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    return message;
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string,
    options: { since?: Date; limit?: number } = {}
  ): Promise<Message[]> {
    const { since, limit = 100 } = options;

    return prisma.message.findMany({
      where: {
        conversationId,
        ...(since && { createdAt: { gt: since } }),
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  /**
   * Get message by ID
   */
  async getMessageById(messageId: string): Promise<Message | null> {
    return prisma.message.findUnique({
      where: { id: messageId },
    });
  }

  /**
   * Update message metadata (e.g., for AI suggestion acceptance)
   */
  async updateMessageMetadata(
    messageId: string,
    metadata: Record<string, unknown>
  ): Promise<Message> {
    return prisma.message.update({
      where: { id: messageId },
      data: { metadata: metadata as Prisma.InputJsonValue },
    });
  }
}

export const conversationRepository = new ConversationRepository();
