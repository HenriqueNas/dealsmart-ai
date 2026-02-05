/**
 * HubSpot Service
 *
 * Business logic for syncing DealSmart AI data with HubSpot CRM.
 */

import { prisma } from '@/infra/prisma/prisma';
import type { User } from '@/infra/prisma/generated/client';
import { hubspotCache, cacheKeys, CACHE_TTL } from './hubspot.cache';
import { hubspotClient } from './hubspot.client';
import type {
  CreateContactInput,
  UpdateContactInput,
  SyncResult,
  BatchSyncResult,
  HubSpotContactProperties,
} from './types';

class HubSpotService {
  /**
   * Check if HubSpot integration is available
   */
  isAvailable(): boolean {
    return hubspotClient.isConfigured();
  }

  /**
   * Parse user name into first and last name
   */
  private parseUserName(name?: string | null): {
    firstname?: string;
    lastname?: string;
  } {
    if (!name) return {};

    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return { firstname: parts[0] };
    }

    return {
      firstname: parts[0],
      lastname: parts.slice(1).join(' '),
    };
  }

  /**
   * Build HubSpot contact properties from user data
   */
  private buildContactProperties(
    input: CreateContactInput | (UpdateContactInput & { email?: string })
  ): HubSpotContactProperties {
    const nameProps = 'name' in input ? this.parseUserName(input.name) : {};

    const props: HubSpotContactProperties = {
      email: 'email' in input && input.email ? input.email : '',
      ...nameProps,
    };

    // Add custom properties
    if ('userId' in input) {
      props.dealsmart_user_id = input.userId;
    }
    if ('role' in input && input.role) {
      props.dealsmart_role = input.role;
    }
    if ('verified' in input && input.verified !== undefined) {
      props.dealsmart_verified = String(input.verified);
    }
    if ('ageVerified' in input && input.ageVerified !== undefined) {
      props.dealsmart_age_verified = String(input.ageVerified);
    }

    // Set lifecycle stage for new contacts
    if ('userId' in input) {
      props.lifecyclestage = 'lead';
    }

    return props;
  }

  /**
   * Sync a user to HubSpot as a contact
   * Creates or updates based on existing contact
   */
  async syncUserToContact(input: CreateContactInput): Promise<SyncResult> {
    if (!this.isAvailable()) {
      return {
        success: false,
        action: 'skipped',
        message: 'HubSpot integration is not configured',
      };
    }

    try {
      // Check if user already has a HubSpot contact ID
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { hubspotContactId: true },
      });

      if (user?.hubspotContactId) {
        // Update existing contact
        const properties = this.buildContactProperties(input);
        await hubspotClient.updateContact(user.hubspotContactId, properties);

        return {
          success: true,
          hubspotContactId: user.hubspotContactId,
          action: 'updated',
        };
      }

      // Check if contact exists by email
      const existingContact = await hubspotClient.getContactByEmail(input.email);

      if (existingContact) {
        // Update existing contact and save ID to user
        const properties = this.buildContactProperties(input);
        await hubspotClient.updateContact(existingContact.id, properties);

        await prisma.user.update({
          where: { id: input.userId },
          data: { hubspotContactId: existingContact.id },
        });

        return {
          success: true,
          hubspotContactId: existingContact.id,
          action: 'updated',
        };
      }

      // Create new contact
      const properties = this.buildContactProperties(input);
      const contact = await hubspotClient.createContact(properties);

      // Save HubSpot contact ID to user
      await prisma.user.update({
        where: { id: input.userId },
        data: { hubspotContactId: contact.id },
      });

      return {
        success: true,
        hubspotContactId: contact.id,
        action: 'created',
      };
    } catch (error) {
      console.error('[HubSpot] Error syncing user to contact:', error);
      return {
        success: false,
        action: 'skipped',
        message: (error as Error).message,
      };
    }
  }

  /**
   * Update a contact for an existing user
   */
  async updateContact(
    userId: string,
    input: UpdateContactInput
  ): Promise<SyncResult> {
    if (!this.isAvailable()) {
      return {
        success: false,
        action: 'skipped',
        message: 'HubSpot integration is not configured',
      };
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { hubspotContactId: true, email: true },
      });

      if (!user?.hubspotContactId) {
        return {
          success: false,
          action: 'skipped',
          message: 'User does not have a HubSpot contact',
        };
      }

      const properties = this.buildContactProperties({
        ...input,
        email: user.email,
      });
      await hubspotClient.updateContact(user.hubspotContactId, properties);

      return {
        success: true,
        hubspotContactId: user.hubspotContactId,
        action: 'updated',
      };
    } catch (error) {
      console.error('[HubSpot] Error updating contact:', error);
      return {
        success: false,
        action: 'skipped',
        message: (error as Error).message,
      };
    }
  }

  /**
   * Sync all users to HubSpot
   */
  async syncAllUsers(): Promise<BatchSyncResult> {
    if (!this.isAvailable()) {
      return {
        total: 0,
        created: 0,
        updated: 0,
        failed: 0,
        errors: [],
      };
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        verified: true,
        ageVerified: true,
        hubspotContactId: true,
      },
    });

    const result: BatchSyncResult = {
      total: users.length,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    for (const user of users) {
      const syncResult = await this.syncUserToContact({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        verified: user.verified,
        ageVerified: user.ageVerified,
      });

      if (syncResult.success) {
        if (syncResult.action === 'created') {
          result.created++;
        } else if (syncResult.action === 'updated') {
          result.updated++;
        }
      } else {
        result.failed++;
        result.errors.push({
          userId: user.id,
          error: syncResult.message || 'Unknown error',
        });
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return result;
  }

  /**
   * Get contact details from HubSpot for a user
   */
  async getContactForUser(userId: string) {
    if (!this.isAvailable()) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hubspotContactId: true },
    });

    if (!user?.hubspotContactId) {
      return null;
    }

    return hubspotClient.getContact(user.hubspotContactId, [
      'email',
      'firstname',
      'lastname',
      'lifecyclestage',
      'dealsmart_user_id',
      'dealsmart_role',
      'dealsmart_verified',
      'createdate',
      'lastmodifieddate',
    ]);
  }

  /**
   * Delete a contact from HubSpot when user is deleted
   */
  async deleteContactForUser(userId: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { hubspotContactId: true },
      });

      if (!user?.hubspotContactId) {
        return false;
      }

      await hubspotClient.deleteContact(user.hubspotContactId);
      return true;
    } catch (error) {
      console.error('[HubSpot] Error deleting contact:', error);
      return false;
    }
  }

  /**
   * Handle user registration - sync to HubSpot
   */
  async onUserRegistered(user: User): Promise<SyncResult> {
    return this.syncUserToContact({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      verified: user.verified,
      ageVerified: user.ageVerified,
    });
  }

  /**
   * Handle user update - sync changes to HubSpot
   */
  async onUserUpdated(
    userId: string,
    changes: UpdateContactInput
  ): Promise<SyncResult> {
    return this.updateContact(userId, changes);
  }

  /**
   * Handle user deletion - remove from HubSpot
   */
  async onUserDeleted(userId: string): Promise<boolean> {
    return this.deleteContactForUser(userId);
  }

  // ============================================================================
  // CONTACT LOOKUP (for Conversations)
  // ============================================================================

  /**
   * Get a contact by HubSpot contact ID
   * Used by ConversationService to fetch customer data
   */
  async getContactById(hubspotContactId: string): Promise<{
    id: string;
    email?: string;
    firstname?: string;
    lastname?: string;
    phone?: string;
  } | null> {
    if (!this.isAvailable()) {
      return null;
    }

    // Check cache first
    const cacheKey = cacheKeys.contact(hubspotContactId);
    const cached = hubspotCache.get<{
      id: string;
      email?: string;
      firstname?: string;
      lastname?: string;
      phone?: string;
    }>(cacheKey);
    if (cached) return cached;

    try {
      const contact = await hubspotClient.getContact(hubspotContactId, [
        'email',
        'firstname',
        'lastname',
        'phone',
      ]);

      if (!contact) {
        return null;
      }

      const result = {
        id: contact.id,
        email: contact.properties?.email,
        firstname: contact.properties?.firstname,
        lastname: contact.properties?.lastname,
        phone: contact.properties?.phone,
      };

      hubspotCache.set(cacheKey, result, CACHE_TTL.CONTACT);
      return result;
    } catch (error) {
      console.error('[HubSpot] Error fetching contact by ID:', error);
      return null;
    }
  }

  /**
   * Create a note on a contact
   * Used to log agent messages as activities
   */
  async createNote(
    hubspotContactId: string,
    input: { body: string }
  ): Promise<{ id: string } | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      return await hubspotClient.createNote(hubspotContactId, input.body);
    } catch (error) {
      console.error('[HubSpot] Error creating note:', error);
      return null;
    }
  }

  /**
   * List contacts from HubSpot (for populating conversations)
   */
  async listContacts(
    limit = 100,
    after?: string
  ): Promise<{
    contacts: Array<{
      id: string;
      email?: string;
      firstname?: string;
      lastname?: string;
      phone?: string;
    }>;
    hasMore: boolean;
    nextAfter?: string;
  }> {
    if (!this.isAvailable()) {
      return { contacts: [], hasMore: false };
    }

    // Check cache first
    const cacheKey = cacheKeys.contactList(limit, after);
    const cached = hubspotCache.get<{
      contacts: Array<{
        id: string;
        email?: string;
        firstname?: string;
        lastname?: string;
        phone?: string;
      }>;
      hasMore: boolean;
      nextAfter?: string;
    }>(cacheKey);
    if (cached) return cached;

    try {
      const result = await hubspotClient.listContacts(limit, after, [
        'email',
        'firstname',
        'lastname',
        'phone',
      ]);

      const data = {
        contacts: result.results.map((contact) => ({
          id: contact.id,
          email: contact.properties?.email,
          firstname: contact.properties?.firstname,
          lastname: contact.properties?.lastname,
          phone: contact.properties?.phone,
        })),
        hasMore: !!result.paging?.next?.after,
        nextAfter: result.paging?.next?.after,
      };

      hubspotCache.set(cacheKey, data, CACHE_TTL.CONTACT_LIST);
      return data;
    } catch (error) {
      console.error('[HubSpot] Error listing contacts:', error);
      return { contacts: [], hasMore: false };
    }
  }
}

export const hubspotService = new HubSpotService();
