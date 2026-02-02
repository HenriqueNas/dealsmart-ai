/**
 * HubSpot Integration Types
 *
 * Type definitions for HubSpot CRM objects and API responses.
 */

// ============================================================================
// CONTACT TYPES
// ============================================================================

/**
 * Properties for creating or updating a HubSpot contact
 */
export interface HubSpotContactProperties {
  email: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  company?: string;
  website?: string;
  lifecyclestage?: 'subscriber' | 'lead' | 'marketingqualifiedlead' | 'salesqualifiedlead' | 'opportunity' | 'customer' | 'evangelist' | 'other';
  hs_lead_status?: string;
  // Custom properties for DealSmart AI
  dealsmart_user_id?: string;
  dealsmart_role?: string;
  dealsmart_verified?: string;
  dealsmart_age_verified?: string;
}

/**
 * HubSpot contact object
 */
export interface HubSpotContact {
  id: string;
  properties: HubSpotContactProperties & {
    createdate?: string;
    lastmodifieddate?: string;
    hs_object_id?: string;
  };
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

/**
 * Input for creating a contact from our user
 */
export interface CreateContactInput {
  userId: string;
  email: string;
  name?: string | null;
  role: string;
  verified: boolean;
  ageVerified: boolean;
}

/**
 * Input for updating a contact
 */
export interface UpdateContactInput {
  name?: string | null;
  role?: string;
  verified?: boolean;
  ageVerified?: boolean;
}

// ============================================================================
// COMPANY TYPES
// ============================================================================

/**
 * Properties for creating or updating a HubSpot company
 */
export interface HubSpotCompanyProperties {
  name: string;
  domain?: string;
  industry?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  // Custom properties for dealerships
  dealership_type?: string;
  dealership_size?: string;
}

/**
 * HubSpot company object
 */
export interface HubSpotCompany {
  id: string;
  properties: HubSpotCompanyProperties & {
    createdate?: string;
    lastmodifieddate?: string;
    hs_object_id?: string;
  };
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

// ============================================================================
// DEAL TYPES
// ============================================================================

/**
 * Properties for creating or updating a HubSpot deal
 */
export interface HubSpotDealProperties {
  dealname: string;
  amount?: number;
  dealstage?: string;
  pipeline?: string;
  closedate?: string;
  description?: string;
  // Custom properties for automotive deals
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: string;
  vehicle_vin?: string;
}

/**
 * HubSpot deal object
 */
export interface HubSpotDeal {
  id: string;
  properties: HubSpotDealProperties & {
    createdate?: string;
    lastmodifieddate?: string;
    hs_object_id?: string;
  };
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

/**
 * HubSpot webhook event
 */
export interface HubSpotWebhookEvent {
  eventId: number;
  subscriptionId: number;
  portalId: number;
  appId: number;
  occurredAt: number;
  subscriptionType: HubSpotWebhookSubscriptionType;
  attemptNumber: number;
  objectId: number;
  propertyName?: string;
  propertyValue?: string;
  changeSource?: string;
  sourceId?: string;
}

export type HubSpotWebhookSubscriptionType =
  | 'contact.creation'
  | 'contact.deletion'
  | 'contact.propertyChange'
  | 'company.creation'
  | 'company.deletion'
  | 'company.propertyChange'
  | 'deal.creation'
  | 'deal.deletion'
  | 'deal.propertyChange';

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Paginated results from HubSpot API
 */
export interface HubSpotPaginatedResults<T> {
  results: T[];
  paging?: {
    next?: {
      after: string;
      link: string;
    };
  };
}

/**
 * Batch operation result
 */
export interface HubSpotBatchResult<T> {
  status: 'COMPLETE' | 'PENDING' | 'PROCESSING' | 'CANCELED';
  results: T[];
  requestedAt?: string;
  startedAt?: string;
  completedAt?: string;
  links?: {
    self?: string;
  };
}

/**
 * Error from HubSpot API
 */
export interface HubSpotApiError {
  status: string;
  message: string;
  correlationId: string;
  category: string;
  subCategory?: string;
  errors?: Array<{
    message: string;
    context?: Record<string, string[]>;
  }>;
}

// ============================================================================
// SERVICE RESULT TYPES
// ============================================================================

/**
 * Result from sync operations
 */
export interface SyncResult {
  success: boolean;
  hubspotContactId?: string;
  action: 'created' | 'updated' | 'skipped';
  message?: string;
}

/**
 * Batch sync result
 */
export interface BatchSyncResult {
  total: number;
  created: number;
  updated: number;
  failed: number;
  errors: Array<{
    userId: string;
    error: string;
  }>;
}
