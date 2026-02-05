/**
 * HubSpot API Client
 *
 * Wrapper around the official HubSpot API client with:
 * - Automatic retry logic with exponential backoff
 * - Error handling and logging
 * - Rate limiting awareness
 */

import { Client } from '@hubspot/api-client';
import { AssociationSpecAssociationCategoryEnum } from '@hubspot/api-client/lib/codegen/crm/associations/v4/models/AssociationSpec';
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/contacts/models/Filter';
import type {
  HubSpotContact,
  HubSpotContactProperties,
  HubSpotCompany,
  HubSpotCompanyProperties,
  HubSpotDeal,
  HubSpotDealProperties,
  HubSpotPaginatedResults,
} from './types';

// Default retry configuration
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_DELAY_MS = 1000;
const RATE_LIMIT_DELAY_MS = 10000; // 10 seconds on rate limit

/**
 * HubSpot API Client wrapper
 */
class HubSpotClient {
  private client: Client | null = null;
  private maxRetries: number;
  private initialDelayMs: number;

  constructor(
    maxRetries = DEFAULT_MAX_RETRIES,
    initialDelayMs = DEFAULT_INITIAL_DELAY_MS
  ) {
    this.maxRetries = maxRetries;
    this.initialDelayMs = initialDelayMs;
  }

  /**
   * Get or initialize the HubSpot client
   */
  private getClient(): Client {
    if (this.client) {
      return this.client;
    }

    const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error(
        'HUBSPOT_ACCESS_TOKEN environment variable is not set. ' +
          'Please configure your HubSpot access token to use CRM features.'
      );
    }

    this.client = new Client({ accessToken });
    return this.client;
  }

  /**
   * Check if HubSpot is configured
   */
  isConfigured(): boolean {
    return !!process.env.HUBSPOT_ACCESS_TOKEN;
  }

  /**
   * Execute an operation with retry logic
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        const statusCode = (error as { code?: number })?.code;

        // Don't retry on client errors (except rate limiting)
        if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
          throw error;
        }

        // Handle rate limiting
        if (statusCode === 429) {
          console.warn(
            `[HubSpot] Rate limited during ${context}. Waiting ${RATE_LIMIT_DELAY_MS}ms...`
          );
          await this.delay(RATE_LIMIT_DELAY_MS);
          continue;
        }

        // Exponential backoff for other errors
        if (attempt < this.maxRetries - 1) {
          const delayMs = this.initialDelayMs * Math.pow(2, attempt);
          console.warn(
            `[HubSpot] ${context} failed (attempt ${attempt + 1}/${this.maxRetries}). ` +
              `Retrying in ${delayMs}ms...`,
            error
          );
          await this.delay(delayMs);
        }
      }
    }

    console.error(`[HubSpot] ${context} failed after ${this.maxRetries} attempts`);
    throw lastError;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============================================================================
  // CONTACTS
  // ============================================================================

  /**
   * Create a new contact
   */
  async createContact(
    properties: HubSpotContactProperties
  ): Promise<HubSpotContact> {
    return this.withRetry(async () => {
      const client = this.getClient();
      const response = await client.crm.contacts.basicApi.create({
        properties: properties as unknown as Record<string, string>,
        associations: [],
      });
      return response as unknown as HubSpotContact;
    }, 'createContact');
  }

  /**
   * Get a contact by ID
   */
  async getContact(
    contactId: string,
    properties?: string[]
  ): Promise<HubSpotContact | null> {
    try {
      return await this.withRetry(async () => {
        const client = this.getClient();
        const response = await client.crm.contacts.basicApi.getById(
          contactId,
          properties
        );
        return response as unknown as HubSpotContact;
      }, `getContact(${contactId})`);
    } catch (error) {
      const statusCode = (error as { code?: number })?.code;
      if (statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get a contact by email
   */
  async getContactByEmail(
    email: string,
    properties?: string[]
  ): Promise<HubSpotContact | null> {
    try {
      return await this.withRetry(async () => {
        const client = this.getClient();
        const response = await client.crm.contacts.searchApi.doSearch({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: FilterOperatorEnum.Eq,
                  value: email,
                },
              ],
            },
          ],
          properties: properties || ['email', 'firstname', 'lastname'],
          limit: 1,
        });

        if (response.results.length === 0) {
          return null;
        }

        return response.results[0] as unknown as HubSpotContact;
      }, `getContactByEmail(${email})`);
    } catch (error) {
      console.error('[HubSpot] Error searching contact by email:', error);
      return null;
    }
  }

  /**
   * Update a contact
   */
  async updateContact(
    contactId: string,
    properties: Partial<HubSpotContactProperties>
  ): Promise<HubSpotContact> {
    return this.withRetry(async () => {
      const client = this.getClient();
      const response = await client.crm.contacts.basicApi.update(contactId, {
        properties: properties as unknown as Record<string, string>,
      });
      return response as unknown as HubSpotContact;
    }, `updateContact(${contactId})`);
  }

  /**
   * Delete a contact
   */
  async deleteContact(contactId: string): Promise<void> {
    return this.withRetry(async () => {
      const client = this.getClient();
      await client.crm.contacts.basicApi.archive(contactId);
    }, `deleteContact(${contactId})`);
  }

  /**
   * List contacts with pagination
   */
  async listContacts(
    limit = 100,
    after?: string,
    properties?: string[]
  ): Promise<HubSpotPaginatedResults<HubSpotContact>> {
    return this.withRetry(async () => {
      const client = this.getClient();
      const response = await client.crm.contacts.basicApi.getPage(
        limit,
        after,
        properties
      );
      return response as unknown as HubSpotPaginatedResults<HubSpotContact>;
    }, 'listContacts');
  }

  // ============================================================================
  // COMPANIES
  // ============================================================================

  /**
   * Create a new company
   */
  async createCompany(
    properties: HubSpotCompanyProperties
  ): Promise<HubSpotCompany> {
    return this.withRetry(async () => {
      const client = this.getClient();
      const response = await client.crm.companies.basicApi.create({
        properties: properties as unknown as Record<string, string>,
        associations: [],
      });
      return response as unknown as HubSpotCompany;
    }, 'createCompany');
  }

  /**
   * Get a company by ID
   */
  async getCompany(
    companyId: string,
    properties?: string[]
  ): Promise<HubSpotCompany | null> {
    try {
      return await this.withRetry(async () => {
        const client = this.getClient();
        const response = await client.crm.companies.basicApi.getById(
          companyId,
          properties
        );
        return response as unknown as HubSpotCompany;
      }, `getCompany(${companyId})`);
    } catch (error) {
      const statusCode = (error as { code?: number })?.code;
      if (statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update a company
   */
  async updateCompany(
    companyId: string,
    properties: Partial<HubSpotCompanyProperties>
  ): Promise<HubSpotCompany> {
    return this.withRetry(async () => {
      const client = this.getClient();
      const response = await client.crm.companies.basicApi.update(companyId, {
        properties: properties as unknown as Record<string, string>,
      });
      return response as unknown as HubSpotCompany;
    }, `updateCompany(${companyId})`);
  }

  // ============================================================================
  // DEALS
  // ============================================================================

  /**
   * Create a new deal
   */
  async createDeal(properties: HubSpotDealProperties): Promise<HubSpotDeal> {
    return this.withRetry(async () => {
      const client = this.getClient();
      const response = await client.crm.deals.basicApi.create({
        properties: properties as unknown as Record<string, string>,
        associations: [],
      });
      return response as unknown as HubSpotDeal;
    }, 'createDeal');
  }

  /**
   * Get a deal by ID
   */
  async getDeal(
    dealId: string,
    properties?: string[]
  ): Promise<HubSpotDeal | null> {
    try {
      return await this.withRetry(async () => {
        const client = this.getClient();
        const response = await client.crm.deals.basicApi.getById(
          dealId,
          properties
        );
        return response as unknown as HubSpotDeal;
      }, `getDeal(${dealId})`);
    } catch (error) {
      const statusCode = (error as { code?: number })?.code;
      if (statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update a deal
   */
  async updateDeal(
    dealId: string,
    properties: Partial<HubSpotDealProperties>
  ): Promise<HubSpotDeal> {
    return this.withRetry(async () => {
      const client = this.getClient();
      const response = await client.crm.deals.basicApi.update(dealId, {
        properties: properties as unknown as Record<string, string>,
      });
      return response as unknown as HubSpotDeal;
    }, `updateDeal(${dealId})`);
  }

  // ============================================================================
  // ASSOCIATIONS
  // ============================================================================

  /**
   * Associate a contact with a company
   */
  async associateContactWithCompany(
    contactId: string,
    companyId: string
  ): Promise<void> {
    return this.withRetry(async () => {
      const client = this.getClient();
      await client.crm.associations.v4.basicApi.create(
        'contacts',
        contactId,
        'companies',
        companyId,
        [{ associationCategory: AssociationSpecAssociationCategoryEnum.HubspotDefined, associationTypeId: 1 }]
      );
    }, `associateContactWithCompany(${contactId}, ${companyId})`);
  }

  /**
   * Associate a deal with a contact
   */
  async associateDealWithContact(
    dealId: string,
    contactId: string
  ): Promise<void> {
    return this.withRetry(async () => {
      const client = this.getClient();
      await client.crm.associations.v4.basicApi.create(
        'deals',
        dealId,
        'contacts',
        contactId,
        [{ associationCategory: AssociationSpecAssociationCategoryEnum.HubspotDefined, associationTypeId: 3 }]
      );
    }, `associateDealWithContact(${dealId}, ${contactId})`);
  }

  // ============================================================================
  // NOTES / ENGAGEMENTS
  // ============================================================================

  /**
   * Create a note (engagement) and associate it with a contact
   */
  async createNote(
    contactId: string,
    body: string
  ): Promise<{ id: string }> {
    return this.withRetry(async () => {
      const client = this.getClient();

      // Create note using the notes API
      const response = await client.crm.objects.notes.basicApi.create({
        properties: {
          hs_note_body: body,
          hs_timestamp: new Date().toISOString(),
        },
        associations: [
          {
            to: { id: contactId },
            types: [
              {
                associationCategory: AssociationSpecAssociationCategoryEnum.HubspotDefined,
                associationTypeId: 202, // Note to Contact association type
              },
            ],
          },
        ],
      });

      return { id: response.id };
    }, `createNote(contact: ${contactId})`);
  }
}

// Export singleton instance
export const hubspotClient = new HubSpotClient();

/**
 * Create a HubSpot client with a user-provided access token.
 * This is used when users have stored their own HubSpot token in their profile.
 */
export function createHubSpotClientWithToken(accessToken: string): HubSpotClientWithToken {
  return new HubSpotClientWithToken(accessToken);
}

/**
 * HubSpot client variant that uses a user-provided access token
 */
class HubSpotClientWithToken {
  private client: Client;
  private maxRetries: number = DEFAULT_MAX_RETRIES;
  private initialDelayMs: number = DEFAULT_INITIAL_DELAY_MS;

  constructor(accessToken: string) {
    this.client = new Client({ accessToken });
  }

  isConfigured(): boolean {
    return true;
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        const statusCode = (error as { code?: number })?.code;

        if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
          throw error;
        }

        if (statusCode === 429) {
          console.warn(`[HubSpot] Rate limited during ${context}. Waiting ${RATE_LIMIT_DELAY_MS}ms...`);
          await this.delay(RATE_LIMIT_DELAY_MS);
          continue;
        }

        if (attempt < this.maxRetries - 1) {
          const delayMs = this.initialDelayMs * Math.pow(2, attempt);
          console.warn(
            `[HubSpot] ${context} failed (attempt ${attempt + 1}/${this.maxRetries}). Retrying in ${delayMs}ms...`,
            error
          );
          await this.delay(delayMs);
        }
      }
    }

    console.error(`[HubSpot] ${context} failed after ${this.maxRetries} attempts`);
    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getContact(
    contactId: string,
    properties?: string[]
  ): Promise<HubSpotContact | null> {
    try {
      return await this.withRetry(async () => {
        const response = await this.client.crm.contacts.basicApi.getById(
          contactId,
          properties
        );
        return response as unknown as HubSpotContact;
      }, `getContact(${contactId})`);
    } catch (error) {
      const statusCode = (error as { code?: number })?.code;
      if (statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async listContacts(
    limit = 100,
    after?: string,
    properties?: string[]
  ): Promise<HubSpotPaginatedResults<HubSpotContact>> {
    return this.withRetry(async () => {
      const response = await this.client.crm.contacts.basicApi.getPage(
        limit,
        after,
        properties
      );
      return response as unknown as HubSpotPaginatedResults<HubSpotContact>;
    }, 'listContacts');
  }

  async createNote(
    contactId: string,
    body: string
  ): Promise<{ id: string }> {
    return this.withRetry(async () => {
      const response = await this.client.crm.objects.notes.basicApi.create({
        properties: {
          hs_note_body: body,
          hs_timestamp: new Date().toISOString(),
        },
        associations: [
          {
            to: { id: contactId },
            types: [
              {
                associationCategory: AssociationSpecAssociationCategoryEnum.HubspotDefined,
                associationTypeId: 202,
              },
            ],
          },
        ],
      });

      return { id: response.id };
    }, `createNote(contact: ${contactId})`);
  }
}
